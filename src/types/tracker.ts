export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
}

export interface DailyLogEntry {
  id: string;
  foodId: string;
  foodName: string;
  caloriesPerUnit: number;
  carbsPerUnit: number;
  proteinPerUnit: number;
  fatPerUnit: number;
  sugarPerUnit: number;
  quantity: number;
  date: string;
}

export interface DailyTask {
  id: string;
  userId: string;
  content: string;
  isCompleted: boolean;
  frequency: "daily" | "weekly" | "biweekly" | "specific_days";
  frequencyConfig?: string[]; // e.g., ["mon", "wed", "fri"] if specific_days
  createdAt: string;
}
