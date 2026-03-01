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
