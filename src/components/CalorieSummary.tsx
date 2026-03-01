import { motion } from "framer-motion";
import { Flame, Dumbbell, TrendingDown } from "lucide-react";

interface CalorieSummaryProps {
  totalConsumed: number;
  gymCalories: number;
  netCalories: number;
}

export function CalorieSummary({ totalConsumed, gymCalories, netCalories }: CalorieSummaryProps) {
  return (
    <div className="px-4 pt-6 pb-2">
      {/* Net Calories Hero */}
      <motion.div
        className="text-center mb-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <p className="text-sm font-body text-muted-foreground uppercase tracking-widest mb-1">
          Net Calories
        </p>
        <motion.p
          key={netCalories}
          className="text-6xl font-display font-bold text-primary neon-text-strong"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {netCalories.toLocaleString()}
        </motion.p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-muted-foreground font-body">Consumed</span>
          </div>
          <p className="text-xl font-display font-semibold text-foreground">
            {totalConsumed.toLocaleString()}
          </p>
        </div>

        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground font-body">Burned</span>
          </div>
          <p className="text-xl font-display font-semibold text-foreground">
            {gymCalories > 0 ? `-${gymCalories.toLocaleString()}` : "0"}
          </p>
        </div>
      </div>
    </div>
  );
}
