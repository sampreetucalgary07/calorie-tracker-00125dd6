import { useState, useMemo, useEffect } from "react";
import { Plus, Flame, Loader2 } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { CalorieSummary } from "@/components/CalorieSummary";
import { CalorieTargets } from "@/components/CalorieTargets";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { FoodLogList } from "@/components/FoodLogList";
import { FoodSearch } from "@/components/FoodSearch";
import { GymCaloriesInput } from "@/components/GymCaloriesInput";
import { DailyTasks } from "@/components/DailyTasks";
import { useTracker } from "@/hooks/useTracker";
import { FoodItem } from "@/types/tracker";
import { getNetCaloriesForDate, hasLogsForDate, addOrIncrementLog } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { toast } from "sonner";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Temporary force cleanup of dummy data on hot reload
    (async () => {
      console.log("Attempting to force delete test data...");
      const { data, error } = await supabase.from("daily_logs").delete().eq("foodId", "test").select();
      if (error) console.error("Force delete failed:", error);
      else console.log("Force deleted rows:", data?.length);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-display font-bold text-center mb-2 text-foreground">CalTrack</h1>
          <p className="text-sm text-center text-muted-foreground mb-6">
            Sign in below. To keep this app private, create your account, then go to your Supabase Project Settings &rarr; Authentication &rarr; Disable &quot;Enable Signup&quot;.
          </p>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa, variables: { default: { colors: { brand: "hsl(264, 84%, 51%)", brandAccent: "hsl(264, 84%, 61%)" } } } }}
            theme="dark"
            providers={[]}
            onlyThirdPartyProviders={false}
          />
        </div>
      </div>
    );
  }

  return <CalorieTrackerApp key={session.user.id} />;
};

const CalorieTrackerApp = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const {
    loading,
    foodLibrary,
    dailyLogs,
    gymCalories,
    totalConsumed,
    netCalories,
    targets,
    addFood,
    removeFood,
    logFood,
    decrement,
    remove,
    updateGymCalories,
    updateTargets,
    tasks,
    addTask,
    toggleTask,
    removeTask,
  } = useTracker(selectedDate);

  const [searchOpen, setSearchOpen] = useState(false);

  const handleSelectFood = (food: FoodItem) => {
    logFood(food);
  };

  const handleLogIncrement = (log: { foodId: string }) => {
    const food = foodLibrary.find((f) => f.id === log.foodId);
    if (food) logFood(food);
  };

  // Calculate Streak
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastStreak, setLastStreak] = useState(0);

  useEffect(() => {
    const calculateStreak = async () => {
      let streak = 0;
      let last = 0;
      let countingCurrent = true;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const goal = targets.calorieTarget - targets.deficitTarget;

      // Check up to 365 days back
      for (let i = 1; i <= 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);

        const hasLogs = await hasLogsForDate(d);
        let isMet = false;
        if (hasLogs) {
          const net = await getNetCaloriesForDate(d);
          if (net - goal <= 200) isMet = true;
        }

        if (isMet) {
          if (countingCurrent) {
            streak++;
          } else {
            last++;
          }
        } else {
          // Missing a day breaks the current counting sequence
          if (countingCurrent) {
            countingCurrent = false;
          } else if (last > 0) {
            break; // Stop once we find the end of the previous sequence
          }
        }
      }

      // Check today (if met, add to streak)
      const hasTodayLogs = await hasLogsForDate(today);
      if (hasTodayLogs) {
        const netToday = await getNetCaloriesForDate(today);
        if (netToday - goal <= 200) streak++;
      }

      setCurrentStreak(streak);
      setLastStreak(last);
    };
    if (!loading) calculateStreak();
  }, [targets, loading]); // Remove dailyLogs directly since we check all days strictly

  const todayStr = new Date().toDateString();
  const isSelectedToday = selectedDate.toDateString() === todayStr;
  
  const dateStr = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground font-body">Loading your data...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Motivational Banner */}
      <div className="bg-primary/10 text-primary text-center p-2 text-xs font-body border-b border-primary/20 safe-top">
        {currentStreak > 0 ? (
          <p>
            <strong>🎉 {currentStreak} day streak!</strong> "It's going great! Keep up the momentum."
          </p>
        ) : (
          <p>
            <strong>💪 Let's get back on track!</strong> "Success is the sum of small efforts, repeated day in and day out."
          </p>
        )}
      </div>

      {/* Header */}
      <header className="px-4 pt-6 pb-2">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-muted-foreground font-body uppercase tracking-widest">
              {isSelectedToday ? "Today" : "Viewing Past"}
            </p>
            <h1 className="text-2xl font-display font-bold text-foreground mt-1">{dateStr}</h1>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mb-0.5">Last Streak</p>
              <div className="flex items-center justify-end gap-1 text-foreground font-display font-bold text-xl">
                <Flame className={`w-4 h-4 ${lastStreak > 0 ? "text-muted-foreground" : "text-muted-foreground/30"}`} />
                {lastStreak}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mb-0.5">Streak</p>
              <div className="flex items-center justify-end gap-1.5 text-foreground font-display font-bold text-xl">
                <Flame className={`w-5 h-5 ${currentStreak > 0 ? "fill-orange-500 text-orange-500" : "text-muted-foreground"}`} />
                {currentStreak}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Calorie & Deficit Targets */}
      <CalorieTargets targets={targets} onUpdate={updateTargets} />

      {/* Calorie Summary */}
      <CalorieSummary
        totalConsumed={totalConsumed}
        gymCalories={gymCalories}
        netCalories={netCalories}
        goal={targets.calorieTarget - targets.deficitTarget}
        isUnlogged={dailyLogs.length === 0}
      />

      {/* Gym Calories */}
      <GymCaloriesInput gymCalories={gymCalories} onUpdate={updateGymCalories} />

      {/* Macros bar */}
      <div className="px-4 mt-4">
        <MacroBar logs={dailyLogs} />
        <MacroTargetsBar />
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

      {/* Weekly Calendar */}
      <WeeklyCalendar targets={targets} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Daily Tasks */}
      <DailyTasks
        tasks={tasks}
        date={selectedDate}
        onAddTask={addTask}
        onToggleTask={toggleTask}
        onDeleteTask={removeTask}
      />


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
        onRemoveFoodLibrary={removeFood}
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
      <div className="flex gap-0.5 h-3 rounded-full overflow-hidden bg-secondary">
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

function MacroTargetsBar() {
  // Target percentages: Protein: 30-35%, Carbs: 35-40%, Fats: 25-30%
  // Using midpoints for visualization
  const pPct = 32.5;
  const cPct = 37.5;
  const fPct = 27.5;

  return (
    <div className="mt-4">
      <div className="flex gap-0.5 h-3 rounded-full overflow-hidden bg-secondary/50 border border-border">
        <div
          className="bg-blue-400/70"
          style={{ width: `${pPct}%` }}
          title="Protein Target: 30-35%"
        />
        <div
          className="bg-amber-400/70"
          style={{ width: `${cPct}%` }}
          title="Carbs Target: 35-40%"
        />
        <div
          className="bg-rose-400/70"
          style={{ width: `${fPct}%` }}
          title="Fat Target: 25-30%"
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] font-body text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
          P: 155-185g
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          C: 180-205g
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
          F: 55-70g
        </span>
      </div>
    </div>
  );
}

export default Index;
