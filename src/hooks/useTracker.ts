import { useState, useCallback, useMemo } from "react";
import { FoodItem, DailyLogEntry } from "@/types/tracker";
import {
  getFoodLibrary,
  addFoodToLibrary,
  getDailyLogs,
  addOrIncrementLog,
  decrementLog,
  removeLog,
  getGymCalories,
  setGymCalories as saveGymCalories,
  getTargets,
  saveTargets,
  CalorieTargets,
} from "@/lib/storage";

export function useTracker() {
  const [foodLibrary, setFoodLibrary] = useState<FoodItem[]>(getFoodLibrary);
  const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>(getDailyLogs);
  const [gymCalories, setGymCaloriesState] = useState<number>(getGymCalories);
  const [targets, setTargetsState] = useState<CalorieTargets>(getTargets);

  const addFood = useCallback((food: Omit<FoodItem, "id">) => {
    const newFood = addFoodToLibrary(food);
    setFoodLibrary(getFoodLibrary());
    return newFood;
  }, []);

  const logFood = useCallback((food: FoodItem) => {
    const updated = addOrIncrementLog(food);
    setDailyLogs([...updated]);
  }, []);

  const decrement = useCallback((logId: string) => {
    const updated = decrementLog(logId);
    setDailyLogs([...updated]);
  }, []);

  const remove = useCallback((logId: string) => {
    const updated = removeLog(logId);
    setDailyLogs([...updated]);
  }, []);

  const updateGymCalories = useCallback((cal: number) => {
    saveGymCalories(cal);
    setGymCaloriesState(cal);
  }, []);

  const updateTargets = useCallback((t: CalorieTargets) => {
    saveTargets(t);
    setTargetsState(t);
  }, []);

  const totalConsumed = useMemo(
    () => dailyLogs.reduce((sum, l) => sum + l.caloriesPerUnit * l.quantity, 0),
    [dailyLogs]
  );

  const totalProtein = useMemo(
    () => dailyLogs.reduce((sum, l) => sum + l.proteinPerUnit * l.quantity, 0),
    [dailyLogs]
  );

  const totalCarbs = useMemo(
    () => dailyLogs.reduce((sum, l) => sum + l.carbsPerUnit * l.quantity, 0),
    [dailyLogs]
  );

  const totalFat = useMemo(
    () => dailyLogs.reduce((sum, l) => sum + l.fatPerUnit * l.quantity, 0),
    [dailyLogs]
  );

  const netCalories = totalConsumed - gymCalories;

  return {
    foodLibrary,
    dailyLogs,
    gymCalories,
    totalConsumed,
    totalProtein,
    totalCarbs,
    totalFat,
    netCalories,
    targets,
    addFood,
    logFood,
    decrement,
    remove,
    updateGymCalories,
    updateTargets,
  };
}
