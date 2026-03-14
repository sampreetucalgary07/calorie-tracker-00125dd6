import { useState, useEffect } from "react";
import { getNetCaloriesForDate, CalorieTargets, getDailyLogs, getTasks } from "@/lib/storage";
import { ChevronLeft, ChevronRight, CheckSquare } from "lucide-react";

interface WeeklyCalendarProps {
  targets: CalorieTargets;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

interface DayData {
  date: Date;
  day: number;
  status: "green" | "orange" | "red" | "none" | "future";
  macros?: { p: number; c: number; f: number };
  tasksProgress?: { completed: number; total: number };
}

function getStartOfWeek(d: Date) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

export function WeeklyCalendar({ targets, selectedDate, onSelectDate }: WeeklyCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewedWeekStart, setViewedWeekStart] = useState(() => getStartOfWeek(selectedDate));
  
  useEffect(() => {
    setViewedWeekStart(getStartOfWeek(selectedDate));
  }, [selectedDate]);

  const handlePrevWeek = () => {
    const newDate = new Date(viewedWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setViewedWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const currentWeekStart = getStartOfWeek(today);
    if (viewedWeekStart >= currentWeekStart) return;
    const newDate = new Date(viewedWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setViewedWeekStart(newDate);
  };

  const midWeek = new Date(viewedWeekStart);
  midWeek.setDate(midWeek.getDate() + 3);
  const monthName = midWeek.toLocaleDateString("en-US", { month: "long" });

  const firstDayOfYear = new Date(midWeek.getFullYear(), 0, 1);
  const firstSundayOfYear = getStartOfWeek(firstDayOfYear);
  const weekDiff = Math.round((viewedWeekStart.getTime() - firstSundayOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const weekNumber = weekDiff + 1;
  const year = midWeek.getFullYear();

  const title = `${monthName} - Week ${weekNumber}`;

  const [days, setDays] = useState<DayData[]>([]);

  useEffect(() => {
    const generateCalendar = async () => {
      setDays([]);
      const goalCal = targets.calorieTarget - targets.deficitTarget;
      
      const dayPromises = Array.from({ length: 7 }, async (_, i) => {
        const date = new Date(viewedWeekStart);
        date.setDate(date.getDate() + i);
        
        if (date > today) {
          return { date, day: date.getDate(), status: "future" as const };
        }
        
        const [logs, dayTasks] = await Promise.all([
          getDailyLogs(date),
          getTasks(date)
        ]);

        const totalTasks = dayTasks.length;
        const completedTasks = dayTasks.filter(t => t.isCompleted).length;
        const tasksProgress = totalTasks > 0 ? { completed: completedTasks, total: totalTasks } : undefined;

        if (logs.length === 0) {
          return {
            date,
            day: date.getDate(),
            status: (date.getTime() === today.getTime() ? "future" : "none") as "none" | "future",
            tasksProgress,
          };
        }

        const net = await getNetCaloriesForDate(date);
        const diff = net - goalCal;
        
        const macros = logs.reduce(
          (acc, l) => ({
            p: acc.p + l.proteinPerUnit * l.quantity,
            c: acc.c + l.carbsPerUnit * l.quantity,
            f: acc.f + l.fatPerUnit * l.quantity,
          }),
          { p: 0, c: 0, f: 0 }
        );

        let status: "green" | "orange" | "red" = "green";
        if (diff > 0) status = "red";
        else if (diff >= -200) status = "orange";

        return { date, day: date.getDate(), status, macros, tasksProgress };
      });
      
      const weekDays = await Promise.all(dayPromises);
      setDays(weekDays);
    };
    generateCalendar();
  }, [viewedWeekStart.getTime(), targets.calorieTarget, targets.deficitTarget, today.getTime()]);

  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  const isCurrentWeek = viewedWeekStart.getTime() === getStartOfWeek(today).getTime();

  return (
    <div className="px-4 mt-5">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevWeek}
              className="p-1 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center min-w-[120px]">
              <h3 className="text-sm font-body text-primary uppercase tracking-widest leading-none">{title}</h3>
              <span className="text-[10px] text-muted-foreground font-body mt-1">{year}</span>
            </div>
            <button
              onClick={handleNextWeek}
              disabled={isCurrentWeek}
              className="p-1 hover:bg-secondary rounded-md text-muted-foreground transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground font-body text-right">
            Goal:<br/><span className="text-primary font-semibold">{targets.calorieTarget - targets.deficitTarget} cal/day</span>
          </p>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekdays.map((w, i) => (
            <div key={i} className="text-center text-[10px] text-muted-foreground font-body py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.length === 0 ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-secondary/50 rounded-md animate-pulse" />
            ))
          ) : (
            days.map((d, i) => {
              const dateKey = d.date.toDateString();
              const isSelected = dateKey === selectedDate.toDateString();
              const isToday = dateKey === today.toDateString();

              const statusClasses = {
                green: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                orange: "bg-amber-500/20 text-amber-400 border-amber-500/30",
                red: "bg-red-500/20 text-red-400 border-red-500/30",
                future: "text-muted-foreground/40",
                none: "bg-blue-500/20 text-blue-400 border-blue-500/30",
              };

              let cursorClass = d.status === "future" && !isToday ? "cursor-default" : "cursor-pointer active:scale-95";

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (d.status !== "future" || isToday) {
                       onSelectDate(d.date);
                    }
                  }}
                  className={`aspect-[4/5] flex flex-col items-center justify-center rounded-md border transition-all ${statusClasses[d.status]} ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background font-bold shadow-lg opacity-100" : "border-transparent opacity-70 hover:opacity-100"} ${cursorClass}`}
                >
                  <span className={`text-xs font-body leading-none text-center ${d.macros ? 'mt-1 mb-1' : ''}`}>
                    {d.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                  {d.macros && (Math.round(d.macros.p) > 0 || Math.round(d.macros.c) > 0 || Math.round(d.macros.f) > 0) && (
                    <div className="flex flex-col gap-[2px] items-center opacity-90 mt-0.5 pb-1">
                      <span className="text-[8px] leading-[9px] font-display text-emerald-300">P: {Math.round(d.macros.p)}g</span>
                      <span className="text-[8px] leading-[9px] font-display text-blue-300">C: {Math.round(d.macros.c)}g</span>
                      <span className="text-[8px] leading-[9px] font-display text-amber-300">F: {Math.round(d.macros.f)}g</span>
                    </div>
                  )}
                  {d.tasksProgress && (
                    <div className="mt-1 pb-1 flex items-center justify-center gap-0.5 text-[8px] font-body text-muted-foreground">
                      <CheckSquare className="w-2.5 h-2.5" />
                      <span>{d.tasksProgress.completed}/{d.tasksProgress.total}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 mt-4 text-[10px] font-body text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Unlogged
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> On track
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Close
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Missed
          </span>
        </div>
      </div>
    </div>
  );
}
