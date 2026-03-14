import { FoodItem, DailyLogEntry, DailyTask } from "@/types/tracker";
import { supabase } from "./supabase";

const FOOD_LIBRARY_KEY = "caltrack_food_library";
const DAILY_LOGS_KEY = "caltrack_daily_logs";

const DEFAULT_FOODS: FoodItem[] = [
  // Banana is now just a default if the library is empty.
  // It will be added with a proper UUID by the DB.
];

const getUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
};

export async function getFoodLibrary(): Promise<FoodItem[]> {
  const userId = await getUserId();
  const { data, error } = await supabase.from("food_library").select("*").eq("user_id", userId);
  if (error) throw error;
  return data;
}

export async function addFoodToLibrary(food: Omit<FoodItem, "id">): Promise<FoodItem> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("food_library")
    .insert({ ...food, user_id: userId })
    .select();
  if (error) throw error;
  const newFood = data[0];
  return newFood;
}

export async function deleteFoodFromLibrary(id: string): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("food_library")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

function getDateKey(date?: Date): string {
  const d = date || new Date();
  // Fix timezone shift by formatting local date carefully instead of UTC toISOString()
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getDailyLogs(date?: Date): Promise<DailyLogEntry[]> {
  const key = getDateKey(date);
  const userId = await getUserId();
  const { data, error } = await supabase.from("daily_logs").select("*").eq("user_id", userId).eq("date", key);
  if (error) throw error;

  if (!data) return [];

  // Map snake_case from DB back to camelCase for the app
  return data.map((d: any) => ({
    id: d.id,
    user_id: d.user_id,
    date: d.date,
    foodId: d.food_id,
    foodName: d.food_name,
    caloriesPerUnit: d.calories_per_unit,
    proteinPerUnit: d.protein_per_unit,
    carbsPerUnit: d.carbs_per_unit,
    fatPerUnit: d.fat_per_unit,
    sugarPerUnit: d.sugar_per_unit,
    quantity: d.quantity,
  }));
}

export async function addOrIncrementLog(food: FoodItem, date?: Date): Promise<DailyLogEntry[]> {
  const userId = await getUserId();
  const logs = await getDailyLogs(date);
  const existing = logs.find((l) => l.foodId === food.id);


  if (existing) {
    const { error } = await supabase
      .from("daily_logs")
      .update({ quantity: existing.quantity + 1 })
      .match({ id: existing.id });
    if (error) throw error;
  } else {
    const newLog = {
      user_id: userId,
      food_id: food.id,
      food_name: food.name,
      calories_per_unit: food.calories,
      carbs_per_unit: food.carbs,
      protein_per_unit: food.protein,
      fat_per_unit: food.fat,
      sugar_per_unit: food.sugar,
      quantity: 1,
      date: getDateKey(date),
    };
    const { error } = await supabase.from("daily_logs").insert(newLog);
    if (error) throw error;
  }

  return getDailyLogs(date);
}

export async function decrementLog(logId: string, date?: Date): Promise<DailyLogEntry[]> {
  let logs = await getDailyLogs(date);
  const entry = logs.find((l) => l.id === logId);
  if (entry) {
    if (entry.quantity <= 1) {
      await removeLog(logId, date);
    } else {
      await supabase.from("daily_logs").update({ quantity: entry.quantity - 1 }).match({ id: logId });
    }
  }
  return getDailyLogs(date);
}

export async function removeLog(logId: string, date?: Date): Promise<DailyLogEntry[]> {
  await supabase.from("daily_logs").delete().match({ id: logId });
  return getDailyLogs(date);
}

export async function getGymCalories(date?: Date): Promise<number> {
  const key = getDateKey(date);
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("daily_gym_calories")
    .select("calories")
    .eq("user_id", userId)
    .eq("date", key)
    .single();

  if (error && error.code !== "PGRST116") throw error; // Ignore "range not found"
  return data?.calories || 0;
}

export async function setGymCalories(calories: number, date?: Date) {
  const key = getDateKey(date);
  const userId = await getUserId();
  const { error } = await supabase.from("daily_gym_calories").upsert({
    user_id: userId,
    date: key,
    calories,
  }, { onConflict: "user_id,date" });
  if (error) throw error;
}

// --- Daily Tasks (Habits) ---
export async function getTasks(date?: Date): Promise<DailyTask[]> {
  const key = getDateKey(date);
  const userId = await getUserId();
  
  // 1. Fetch all global habits for the user
  const { data: globalTasks, error: tasksError } = await supabase
    .from("user_tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (tasksError && tasksError.code === "42P01") return []; // Table doesn't exist yet
  if (tasksError) throw tasksError;
  if (!globalTasks) return [];

  // 2. Fetch completions for the specific date
  const { data: completions, error: compError } = await supabase
    .from("task_completions")
    .select("task_id")
    .eq("user_id", userId)
    .eq("date", key);

  if (compError && compError.code !== "42P01") throw compError;
  const completedTaskIds = new Set(completions?.map(c => c.task_id) || []);

  return globalTasks
    .map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      content: t.content,
      isCompleted: completedTaskIds.has(t.id),
      frequency: t.frequency,
      frequencyConfig: t.frequency_config,
      createdAt: t.created_at,
    }))
    .filter((task: DailyTask) => {
      const targetDate = date || new Date();
      targetDate.setHours(0, 0, 0, 0);

      const createdDate = new Date(task.createdAt);
      createdDate.setHours(0, 0, 0, 0);

      // If viewing a date *before* the task was created, hide it
      if (targetDate < createdDate) return false;

      if (task.frequency === "daily") return true;

      if (task.frequency === "weekly") {
        return targetDate.getDay() === createdDate.getDay();
      }

      if (task.frequency === "biweekly") {
        if (targetDate.getDay() !== createdDate.getDay()) return false;
        const diffTime = Math.abs(targetDate.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Only show if the difference in weeks is an even number (0, 2, 4...)
        return (diffDays / 7) % 2 === 0;
      }

      if (task.frequency === "specific_days" && task.frequencyConfig) {
        const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const todayStr = days[targetDate.getDay()];
        return task.frequencyConfig.includes(todayStr);
      }

      return true;
    });
}

export async function addTask(
  content: string,
  frequency: "daily" | "weekly" | "biweekly" | "specific_days" = "daily",
  frequencyConfig?: string[],
  date?: Date
): Promise<DailyTask[]> {
  const userId = await getUserId();
  
  const { error } = await supabase.from("user_tasks").insert({
    user_id: userId,
    content,
    frequency,
    frequency_config: frequencyConfig,
  });
  if (error) throw error;
  
  return getTasks(date);
}

export async function toggleTask(taskId: string, isCompleted: boolean, date?: Date): Promise<DailyTask[]> {
  const key = getDateKey(date);
  const userId = await getUserId();
  
  if (isCompleted) {
    const { error } = await supabase.from("task_completions").insert({
      user_id: userId,
      task_id: taskId,
      date: key
    });
    // Ignore unique constraint violation if they somehow rapidly double-clicked
    if (error && error.code !== '23505') throw error;
  } else {
    const { error } = await supabase
      .from("task_completions")
      .delete()
      .match({ user_id: userId, task_id: taskId, date: key });
    if (error) throw error;
  }
  
  return getTasks(date);
}

export async function deleteTask(taskId: string, date?: Date): Promise<DailyTask[]> {
  const { error } = await supabase.from("user_tasks").delete().match({ id: taskId });
  if (error) throw error;
  
  return getTasks(date);
}

// --- Targets ---
export interface CalorieTargets {
  calorieTarget: number;
  deficitTarget: number;
}

export async function getTargets(): Promise<CalorieTargets> {
  const userId = await getUserId();
  const { data, error } = await supabase.from("profiles").select("calorie_target, deficit_target").eq("id", userId).single();
  if (error && error.code !== "PGRST116") { // Also ignore if profile doesn't exist yet
    // This can happen for a new user. Return default targets.
    return { calorieTarget: 2050, deficitTarget: 500 };
  }
  return { calorieTarget: data?.calorie_target || 2050, deficitTarget: data?.deficit_target || 500 };
}

export async function saveTargets(targets: CalorieTargets) {
  const userId = await getUserId();
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    calorie_target: targets.calorieTarget,
    deficit_target: targets.deficitTarget
  }, { onConflict: 'id' });
  if (error) throw error;
}

// --- History helpers ---
export async function getNetCaloriesForDate(date: Date): Promise<number> {
  const logs = await getDailyLogs(date);
  const consumed = logs.reduce((s, l) => s + l.caloriesPerUnit * l.quantity, 0);
  const gym = await getGymCalories(date);
  return consumed - gym;
}

export async function hasLogsForDate(date: Date): Promise<boolean> {
  const logs = await getDailyLogs(date);
  return logs.length > 0;
}
