import { FoodItem, DailyLogEntry } from "@/types/tracker";

const FOOD_LIBRARY_KEY = "caltrack_food_library";
const DAILY_LOGS_KEY = "caltrack_daily_logs";

const DEFAULT_FOODS: FoodItem[] = [
  { id: "1", name: "Chicken Breast", calories: 165, carbs: 0, protein: 31, fat: 4, sugar: 0 },
  { id: "2", name: "Brown Rice (1 cup)", calories: 216, carbs: 45, protein: 5, fat: 2, sugar: 0 },
  { id: "3", name: "Banana", calories: 105, carbs: 27, protein: 1, fat: 0, sugar: 14 },
  { id: "4", name: "Egg", calories: 78, carbs: 1, protein: 6, fat: 5, sugar: 0 },
  { id: "5", name: "Greek Yogurt", calories: 100, carbs: 6, protein: 17, fat: 1, sugar: 4 },
  { id: "6", name: "Oatmeal (1 cup)", calories: 154, carbs: 27, protein: 6, fat: 3, sugar: 1 },
  { id: "7", name: "Salmon Fillet", calories: 208, carbs: 0, protein: 20, fat: 13, sugar: 0 },
  { id: "8", name: "Apple", calories: 95, carbs: 25, protein: 0, fat: 0, sugar: 19 },
  { id: "9", name: "Almonds (1oz)", calories: 164, carbs: 6, protein: 6, fat: 14, sugar: 1 },
  { id: "10", name: "Sweet Potato", calories: 103, carbs: 24, protein: 2, fat: 0, sugar: 7 },
  { id: "11", name: "Avocado (half)", calories: 120, carbs: 6, protein: 2, fat: 11, sugar: 0 },
  { id: "12", name: "Protein Shake", calories: 130, carbs: 3, protein: 25, fat: 2, sugar: 1 },
];

export function getFoodLibrary(): FoodItem[] {
  const stored = localStorage.getItem(FOOD_LIBRARY_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(FOOD_LIBRARY_KEY, JSON.stringify(DEFAULT_FOODS));
  return DEFAULT_FOODS;
}

export function addFoodToLibrary(food: Omit<FoodItem, "id">): FoodItem {
  const library = getFoodLibrary();
  const newFood: FoodItem = { ...food, id: crypto.randomUUID() };
  library.push(newFood);
  localStorage.setItem(FOOD_LIBRARY_KEY, JSON.stringify(library));
  return newFood;
}

function getDateKey(date?: Date): string {
  const d = date || new Date();
  return d.toISOString().split("T")[0];
}

export function getDailyLogs(date?: Date): DailyLogEntry[] {
  const key = getDateKey(date);
  const stored = localStorage.getItem(DAILY_LOGS_KEY);
  const all: Record<string, DailyLogEntry[]> = stored ? JSON.parse(stored) : {};
  return all[key] || [];
}

function saveDailyLogs(logs: DailyLogEntry[], date?: Date) {
  const key = getDateKey(date);
  const stored = localStorage.getItem(DAILY_LOGS_KEY);
  const all: Record<string, DailyLogEntry[]> = stored ? JSON.parse(stored) : {};
  all[key] = logs;
  localStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(all));
}

export function addOrIncrementLog(food: FoodItem, date?: Date): DailyLogEntry[] {
  const logs = getDailyLogs(date);
  const existing = logs.find((l) => l.foodId === food.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    logs.push({
      id: crypto.randomUUID(),
      foodId: food.id,
      foodName: food.name,
      caloriesPerUnit: food.calories,
      carbsPerUnit: food.carbs,
      proteinPerUnit: food.protein,
      fatPerUnit: food.fat,
      sugarPerUnit: food.sugar,
      quantity: 1,
      date: getDateKey(date),
    });
  }
  saveDailyLogs(logs, date);
  return logs;
}

export function decrementLog(logId: string, date?: Date): DailyLogEntry[] {
  let logs = getDailyLogs(date);
  const entry = logs.find((l) => l.id === logId);
  if (entry) {
    entry.quantity -= 1;
    if (entry.quantity <= 0) {
      logs = logs.filter((l) => l.id !== logId);
    }
  }
  saveDailyLogs(logs, date);
  return logs;
}

export function removeLog(logId: string, date?: Date): DailyLogEntry[] {
  let logs = getDailyLogs(date);
  logs = logs.filter((l) => l.id !== logId);
  saveDailyLogs(logs, date);
  return logs;
}

const GYM_CALORIES_KEY = "caltrack_gym_calories";

export function getGymCalories(date?: Date): number {
  const key = getDateKey(date);
  const stored = localStorage.getItem(GYM_CALORIES_KEY);
  const all: Record<string, number> = stored ? JSON.parse(stored) : {};
  return all[key] || 0;
}

export function setGymCalories(calories: number, date?: Date) {
  const key = getDateKey(date);
  const stored = localStorage.getItem(GYM_CALORIES_KEY);
  const all: Record<string, number> = stored ? JSON.parse(stored) : {};
  all[key] = calories;
  localStorage.setItem(GYM_CALORIES_KEY, JSON.stringify(all));
}
