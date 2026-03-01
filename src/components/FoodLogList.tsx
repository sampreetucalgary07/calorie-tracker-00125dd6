import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import { DailyLogEntry } from "@/types/tracker";

interface FoodLogListProps {
  logs: DailyLogEntry[];
  onIncrement: (log: DailyLogEntry) => void;
  onDecrement: (logId: string) => void;
  onRemove: (logId: string) => void;
}

export function FoodLogList({ logs, onIncrement, onDecrement, onRemove }: FoodLogListProps) {
  if (logs.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-muted-foreground font-body text-sm">
          No foods logged today. Search to add something!
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-2">
      <h2 className="text-sm font-body text-muted-foreground uppercase tracking-widest mb-3">
        Today's Log
      </h2>
      <AnimatePresence mode="popLayout">
        {logs.map((log) => (
          <FoodLogItem
            key={log.id}
            log={log}
            onIncrement={() => onIncrement(log)}
            onDecrement={() => onDecrement(log.id)}
            onRemove={() => onRemove(log.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface FoodLogItemProps {
  log: DailyLogEntry;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

function FoodLogItem({ log, onIncrement, onDecrement, onRemove }: FoodLogItemProps) {
  const [showActions, setShowActions] = useState(false);
  const lastTapRef = useRef<number>(0);
  const tapTimerRef = useRef<NodeJS.Timeout>();

  const handleTap = useCallback(() => {
    const now = Date.now();
    const diff = now - lastTapRef.current;

    if (diff < 300) {
      // Double tap
      clearTimeout(tapTimerRef.current);
      onIncrement();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      tapTimerRef.current = setTimeout(() => {
        setShowActions((prev) => !prev);
      }, 300);
    }
  }, [onIncrement]);

  const totalCal = log.caloriesPerUnit * log.quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-card border border-border rounded-lg overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer select-none active:bg-secondary/50 transition-colors"
        onClick={handleTap}
      >
        <div className="flex-1 min-w-0">
          <p className="font-display font-medium text-foreground truncate">{log.foodName}</p>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            {log.caloriesPerUnit} cal × {log.quantity}
          </p>
        </div>
        <div className="text-right ml-3">
          <motion.p
            key={totalCal}
            className="font-display font-semibold text-primary text-lg"
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {totalCal}
          </motion.p>
          <p className="text-[10px] text-muted-foreground">cal</p>
        </div>
      </div>

      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                <span>P:{log.proteinPerUnit * log.quantity}g</span>
                <span>·</span>
                <span>C:{log.carbsPerUnit * log.quantity}g</span>
                <span>·</span>
                <span>F:{log.fatPerUnit * log.quantity}g</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onDecrement(); }}
                  className="w-9 h-9 flex items-center justify-center rounded-md bg-secondary text-secondary-foreground active:bg-muted transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-display font-semibold w-6 text-center text-foreground">
                  {log.quantity}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onIncrement(); }}
                  className="w-9 h-9 flex items-center justify-center rounded-md bg-primary text-primary-foreground active:bg-primary/80 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                  className="w-9 h-9 flex items-center justify-center rounded-md bg-destructive/20 text-destructive active:bg-destructive/30 transition-colors ml-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
