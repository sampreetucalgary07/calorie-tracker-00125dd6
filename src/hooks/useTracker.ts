import { useState, useCallback, useMemo, useEffect } from "react";
import { FoodItem, DailyLogEntry, DailyTask } from "@/types/tracker";
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
  getTasks,
  addTask as saveTask,
  toggleTask as updateTaskStatus,
  deleteTask as dropTask,
} from "@/lib/storage";

export function useTracker(selectedDate: Date = new Date()) {
  const [loading, setLoading] = useState(true);
  const [foodLibrary, setFoodLibrary] = useState<FoodItem[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>([]);
  const [gymCalories, setGymCaloriesState] = useState<number>(0);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [targets, setTargetsState] = useState<CalorieTargets>({ calorieTarget: 2050, deficitTarget: 500 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [library, logs, gym, userTargets, dailyTasks] = await Promise.all([
          getFoodLibrary(),
          getDailyLogs(selectedDate),
          getGymCalories(selectedDate),
          getTargets(),
          getTasks(selectedDate),
        ]);
        setFoodLibrary(library);
        setDailyLogs(logs);
        setGymCaloriesState(gym);
        setTargetsState(userTargets);
        setTasks(dailyTasks);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate.getTime()]);

  const addFood = useCallback(async (food: Omit<FoodItem, "id">) => {
    const newFood = await addFoodToLibrary(food);
    setFoodLibrary((prev) => [...prev, newFood]);
    return newFood;
  }, []);

  const logFood = useCallback(async (food: FoodItem) => {
    const updated = await addOrIncrementLog(food, selectedDate);
    setDailyLogs([...updated]);
  }, [selectedDate.getTime()]);

  const decrement = useCallback(async (logId: string) => {
    const updated = await decrementLog(logId, selectedDate);
    setDailyLogs([...updated]);
  }, [selectedDate.getTime()]);

  const removeFood = useCallback(async (id: string) => {
    await deleteFoodFromLibrary(id);
    setFoodLibrary((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const remove = useCallback(async (logId: string) => {
    const updated = await removeLog(logId, selectedDate);
    setDailyLogs([...updated]);
  }, [selectedDate.getTime()]);

  const updateGymCalories = useCallback(async (cal: number) => {
    await saveGymCalories(cal, selectedDate);
    setGymCaloriesState(cal);
  }, [selectedDate.getTime()]);

  const updateTargets = useCallback(async (t: CalorieTargets) => {
    await saveTargets(t);
    setTargetsState(t);
  }, []);

  const addTask = useCallback(async (
    content: string, 
    frequency: "daily" | "weekly" | "biweekly" | "specific_days" = "daily",
    frequencyConfig?: string[]
  ) => {
    const updated = await saveTask(content, frequency, frequencyConfig, selectedDate);
    setTasks(updated);
  }, [selectedDate.getTime()]);

  const toggleTask = useCallback(async (id: string, isCompleted: boolean) => {
    const updated = await updateTaskStatus(id, isCompleted, selectedDate);
    setTasks(updated);
  }, [selectedDate.getTime()]);

  const removeTask = useCallback(async (id: string) => {
    const updated = await dropTask(id, selectedDate);
    setTasks(updated);
  }, [selectedDate.getTime()]);

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
    tasks,
    addFood,
    removeFood,
    logFood,
    decrement,
    remove,
    updateGymCalories,
    updateTargets,
    addTask,
    toggleTask,
    removeTask,
  };
}
