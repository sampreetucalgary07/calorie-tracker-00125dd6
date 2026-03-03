import { FoodItem, DailyLogEntry } from "@/types/tracker";
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

function getDateKey(date?: Date): string {
  const d = date || new Date();
  return d.toISOString().split("T")[0];
}

export async function getDailyLogs(date?: Date): Promise<DailyLogEntry[]> {
  const key = getDateKey(date);
  const userId = await getUserId();
  const { data, error } = await supabase.from("daily_logs").select("*").eq("user_id", userId).eq("date", key);
  if (error) throw error;
  return data || [];
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
      foodId: food.id,
      foodName: food.name,
      caloriesPerUnit: food.calories,
      carbsPerUnit: food.carbs,
      proteinPerUnit: food.protein,
      fatPerUnit: food.fat,
      sugarPerUnit: food.sugar,
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
  });
  if (error) throw error;
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
  const { error } = await supabase.from("profiles").update({ calorie_target: targets.calorieTarget, deficit_target: targets.deficitTarget }).eq("id", userId);
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
