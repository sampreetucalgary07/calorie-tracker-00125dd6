import { useState } from "react";
import { Plus } from "lucide-react";
import { CalorieSummary } from "@/components/CalorieSummary";
import { FoodLogList } from "@/components/FoodLogList";
import { FoodSearch } from "@/components/FoodSearch";
import { GymCaloriesInput } from "@/components/GymCaloriesInput";
import { useTracker } from "@/hooks/useTracker";
import { FoodItem } from "@/types/tracker";

const Index = () => {
  const {
    foodLibrary,
    dailyLogs,
    gymCalories,
    totalConsumed,
    netCalories,
    addFood,
    logFood,
    decrement,
    remove,
    updateGymCalories,
  } = useTracker();

  const [searchOpen, setSearchOpen] = useState(false);

  const handleSelectFood = (food: FoodItem) => {
    logFood(food);
  };

  const handleLogIncrement = (log: { foodId: string }) => {
    const food = foodLibrary.find((f) => f.id === log.foodId);
    if (food) logFood(food);
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-2">
        <p className="text-xs text-muted-foreground font-body uppercase tracking-widest">{dateStr}</p>
        <h1 className="text-2xl font-display font-bold text-foreground mt-1">CalTrack</h1>
      </header>

      {/* Calorie Summary */}
      <CalorieSummary
        totalConsumed={totalConsumed}
        gymCalories={gymCalories}
        netCalories={netCalories}
      />

      {/* Gym Calories */}
      <GymCaloriesInput gymCalories={gymCalories} onUpdate={updateGymCalories} />

      {/* Macros bar */}
      <div className="px-4 mt-4">
        <MacroBar logs={dailyLogs} />
      </div>

      {/* Food Log */}
      <div className="mt-6">
        <FoodLogList
          logs={dailyLogs}
          onIncrement={handleLogIncrement}
          onDecrement={decrement}
          onRemove={remove}
        />
      </div>

      {/* FAB */}
      <button
        onClick={() => setSearchOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg neon-border active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Search Modal */}
      <FoodSearch
        foodLibrary={foodLibrary}
        onSelectFood={handleSelectFood}
        onAddFood={addFood}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Double-tap hint */}
      {dailyLogs.length > 0 && dailyLogs.length <= 2 && (
        <p className="text-center text-[10px] text-muted-foreground font-body mt-4 px-4">
          💡 Double-tap a food to quickly add +1
        </p>
      )}
    </div>
  );
};

function MacroBar({ logs }: { logs: { proteinPerUnit: number; carbsPerUnit: number; fatPerUnit: number; quantity: number }[] }) {
  const protein = logs.reduce((s, l) => s + l.proteinPerUnit * l.quantity, 0);
  const carbs = logs.reduce((s, l) => s + l.carbsPerUnit * l.quantity, 0);
  const fat = logs.reduce((s, l) => s + l.fatPerUnit * l.quantity, 0);
  const total = protein + carbs + fat;

  if (total === 0) return null;

  const pPct = (protein / total) * 100;
  const cPct = (carbs / total) * 100;
  const fPct = (fat / total) * 100;

  return (
    <div>
      <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-secondary">
        <div className="bg-blue-400 rounded-l-full transition-all" style={{ width: `${pPct}%` }} />
        <div className="bg-amber-400 transition-all" style={{ width: `${cPct}%` }} />
        <div className="bg-rose-400 rounded-r-full transition-all" style={{ width: `${fPct}%` }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] font-body text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
          Protein {protein}g
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          Carbs {carbs}g
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
          Fat {fat}g
        </span>
      </div>
    </div>
  );
}

export default Index;
