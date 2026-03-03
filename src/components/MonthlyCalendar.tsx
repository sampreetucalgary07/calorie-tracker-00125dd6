import { useState, useEffect } from "react";
import { getNetCaloriesForDate, hasLogsForDate, CalorieTargets } from "@/lib/storage";

interface MonthlyCalendarProps {
  targets: CalorieTargets;
}

export function MonthlyCalendar({ targets }: MonthlyCalendarProps) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const monthName = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

  const [days, setDays] = useState<{ day: number; status: "green" | "orange" | "red" | "none" | "future" }[]>([]);

  useEffect(() => {
    const generateCalendar = async () => {
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const goalCal = targets.calorieTarget - targets.deficitTarget;

      const result: { day: number; status: "green" | "orange" | "red" | "none" | "future" }[] = [];

      // Padding for first week
      for (let i = 0; i < firstDay; i++) {
        result.push({ day: 0, status: "none" });
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        if (date > today) {
          result.push({ day: d, status: "future" });
          continue;
        }

        const hasLogs = await hasLogsForDate(date);
        if (!hasLogs) {
          result.push({ day: d, status: d === today.getDate() ? "future" : "none" });
          continue;
        }

        const net = await getNetCaloriesForDate(date);
        const diff = net - goalCal;

        if (diff <= 0) {
          result.push({ day: d, status: "green" });
        } else if (diff <= 200) {
          result.push({ day: d, status: "orange" });
        } else {
          result.push({ day: d, status: "red" });
        }
      }
      setDays(result);
    };

    generateCalendar();
  }, [year, month, today.getDate(), targets.calorieTarget, targets.deficitTarget]);

  const goalCal = targets.calorieTarget - targets.deficitTarget;

  return (
    <div className="px-4 mt-5">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-body text-muted-foreground uppercase tracking-widest">{monthName}</h3>
          <p className="text-[10px] text-muted-foreground font-body">
            Goal: <span className="text-primary font-semibold">{goalCal} cal/day</span>
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
          {days.map((d, i) => {
            if (d.day === 0) return <div key={i} />;

            const isToday = d.day === today.getDate();
            const statusClasses = {
              green: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
              orange: "bg-amber-500/20 text-amber-400 border-amber-500/30",
              red: "bg-red-500/20 text-red-400 border-red-500/30",
              future: "text-muted-foreground/40",
              none: "text-muted-foreground/60",
            };

            return (
              <div
                key={i}
                className={`aspect-square flex items-center justify-center text-xs font-body rounded-md border border-transparent ${statusClasses[d.status]} ${isToday ? "ring-1 ring-primary font-semibold" : ""}`}
              >
                {d.day}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-body text-muted-foreground">
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
