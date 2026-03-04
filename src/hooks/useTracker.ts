import { useState, useCallback, useMemo, useEffect } from "react";
import { FoodItem, DailyLogEntry } from "@/types/tracker";
import {
  getFoodLibrary,
  addFoodToLibrary,
  deleteFoodFromLibrary,
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
  const [loading, setLoading] = useState(true);
  const [foodLibrary, setFoodLibrary] = useState<FoodItem[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>([]);
  const [gymCalories, setGymCaloriesState] = useState<number>(0);
  const [targets, setTargetsState] = useState<CalorieTargets>({ calorieTarget: 2050, deficitTarget: 500 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [library, logs, gym, userTargets] = await Promise.all([
          getFoodLibrary(),
          getDailyLogs(),
          getGymCalories(),
          getTargets(),
        ]);
        setFoodLibrary(library);
        setDailyLogs(logs);
        setGymCaloriesState(gym);
        setTargetsState(userTargets);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addFood = useCallback(async (food: Omit<FoodItem, "id">) => {
    const newFood = await addFoodToLibrary(food);
    setFoodLibrary((prev) => [...prev, newFood]);
    return newFood;
  }, []);

  const logFood = useCallback(async (food: FoodItem) => {
    const updated = await addOrIncrementLog(food);
    setDailyLogs([...updated]);
  }, []);

  const decrement = useCallback(async (logId: string) => {
    const updated = await decrementLog(logId);
    setDailyLogs([...updated]);
  }, []);

  const removeFood = useCallback(async (id: string) => {
    await deleteFoodFromLibrary(id);
    setFoodLibrary((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const remove = useCallback(async (logId: string) => {
    const updated = await removeLog(logId);
    setDailyLogs([...updated]);
  }, []);

  const updateGymCalories = useCallback(async (cal: number) => {
    await saveGymCalories(cal);
    setGymCaloriesState(cal);
  }, []);

  const updateTargets = useCallback(async (t: CalorieTargets) => {
    await saveTargets(t);
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
    loading,
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
    removeFood,
    logFood,
    decrement,
    remove,
    updateGymCalories,
    updateTargets,
  };
}
