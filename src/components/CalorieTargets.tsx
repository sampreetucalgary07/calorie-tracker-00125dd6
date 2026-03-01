import { useState } from "react";
import { Target, TrendingDown, Pencil, Check } from "lucide-react";
import { CalorieTargets as Targets } from "@/lib/storage";

interface CalorieTargetsProps {
  targets: Targets;
  onUpdate: (targets: Targets) => void;
}

export function CalorieTargets({ targets, onUpdate }: CalorieTargetsProps) {
  const [editing, setEditing] = useState(false);
  const [calTarget, setCalTarget] = useState(String(targets.calorieTarget));
  const [defTarget, setDefTarget] = useState(String(targets.deficitTarget));

  const handleSave = () => {
    onUpdate({
      calorieTarget: parseInt(calTarget) || 2050,
      deficitTarget: parseInt(defTarget) || 500,
    });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="px-4 mt-4">
        <div
          className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 cursor-pointer active:bg-secondary/50 transition-colors"
          onClick={() => {
            setCalTarget(String(targets.calorieTarget));
            setDefTarget(String(targets.deficitTarget));
            setEditing(true);
          }}
        >
          <div className="flex-1 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Daily Target</p>
              <p className="font-display font-semibold text-foreground text-lg leading-tight">
                {targets.calorieTarget} <span className="text-xs text-muted-foreground font-body">cal</span>
              </p>
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex-1 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-orange-400" />
            <div>
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Deficit Goal</p>
              <p className="font-display font-semibold text-foreground text-lg leading-tight">
                {targets.deficitTarget} <span className="text-xs text-muted-foreground font-body">cal</span>
              </p>
            </div>
          </div>
          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mt-4">
      <div className="bg-card border border-primary/50 neon-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground font-body uppercase tracking-wider flex items-center gap-1 mb-1">
              <Target className="w-3 h-3 text-primary" /> Daily Target
            </label>
            <input
              autoFocus
              type="number"
              inputMode="numeric"
              value={calTarget}
              onChange={(e) => setCalTarget(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground font-body outline-none focus:ring-1 focus:ring-primary"
              placeholder="2050"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground font-body uppercase tracking-wider flex items-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-orange-400" /> Deficit Goal
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={defTarget}
              onChange={(e) => setDefTarget(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground font-body outline-none focus:ring-1 focus:ring-primary"
              placeholder="500"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-primary text-primary-foreground font-display font-semibold rounded-lg active:bg-primary/80 transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" /> Save Targets
        </button>
      </div>
    </div>
  );
}
