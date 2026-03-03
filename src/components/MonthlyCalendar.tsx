import { useState, useEffect } from "react";
import { getNetCaloriesForDate, CalorieTargets, getDailyLogs } from "@/lib/storage";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthlyCalendarProps {
  targets: CalorieTargets;
}

interface DayData {
  day: number;
  status: "green" | "orange" | "red" | "none" | "future";
  macros?: { p: number; c: number; f: number };
}

export function MonthlyCalendar({ targets }: MonthlyCalendarProps) {
  const today = new Date();

  // State to track the currently viewed month
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthName = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

  const [days, setDays] = useState<DayData[]>([]);

  const handlePrevMonth = () => {
    if (year === 2026 && month === 1) return; // Limit to Feb 2026
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    if (year === today.getFullYear() && month === today.getMonth()) return;
    setViewDate(new Date(year, month + 1, 1));
  };

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  useEffect(() => {
    const generateCalendar = async () => {
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const goalCal = targets.calorieTarget - targets.deficitTarget;

      const result: DayData[] = [];

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

        const logs = await getDailyLogs(date);
        if (logs.length === 0) {
          result.push({ day: d, status: date.toDateString() === today.toDateString() ? "future" : "none" });
          continue;
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
        if (diff > 200) status = "red";
        else if (diff > 0) status = "orange";

        result.push({ day: d, status, macros });
      }
      setDays(result);
    };

    generateCalendar();
  }, [year, month, today.toDateString(), targets.calorieTarget, targets.deficitTarget]);

  const goalCal = targets.calorieTarget - targets.deficitTarget;

  return (
    <div className="px-4 mt-5">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              disabled={year === 2026 && month === 1}
              className="p-1 hover:bg-secondary rounded-md text-muted-foreground transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-body text-primary uppercase tracking-widest min-w-[110px] text-center">{monthName}</h3>
            <button
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className="p-1 hover:bg-secondary rounded-md text-muted-foreground transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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

            const isToday = d.day === today.getDate() && isCurrentMonth;
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
                className={`aspect-[4/5] flex flex-col items-center justify-center rounded-md border border-transparent ${statusClasses[d.status]} ${isToday ? "ring-1 ring-primary font-semibold" : ""}`}
              >
                <span className={`text-xs font-body leading-none ${d.macros ? 'mt-1 mb-1' : ''}`}>{d.day}</span>
                {d.macros && (
                  <div className="flex flex-col gap-[2px] items-center opacity-90 mt-0.5 pb-1">
                    <span className="text-[8px] leading-[9px] font-display text-emerald-300">P: {Math.round(d.macros.p)}g</span>
                    <span className="text-[8px] leading-[9px] font-display text-blue-300">C: {Math.round(d.macros.c)}g</span>
                    <span className="text-[8px] leading-[9px] font-display text-amber-300">F: {Math.round(d.macros.f)}g</span>
                  </div>
                )}
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
