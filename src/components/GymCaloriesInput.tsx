import { useState } from "react";
import { Dumbbell } from "lucide-react";

interface GymCaloriesInputProps {
  gymCalories: number;
  onUpdate: (cal: number) => void;
}

export function GymCaloriesInput({ gymCalories, onUpdate }: GymCaloriesInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(String(gymCalories || ""));

  const handleSave = () => {
    const num = parseInt(value) || 0;
    onUpdate(num);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="px-4 mt-3">
        <button
          onClick={() => {
            setValue(String(gymCalories || ""));
            setIsEditing(true);
          }}
          className="w-full flex items-center justify-between bg-card border border-border rounded-lg p-4 active:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-blue-400" />
            <span className="font-body text-sm text-muted-foreground">Went to gym? Enter Calories burnt 💪🏼</span>
          </div>
          <span className="font-display font-semibold text-foreground">
            {gymCalories > 0 ? `${gymCalories} cal` : "Tap to set"}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 mt-3">
      <div className="bg-card border border-primary/50 neon-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Dumbbell className="w-4 h-4 text-blue-400" />
          <span className="font-body text-sm text-muted-foreground">Gym Calories Burned</span>
        </div>
        <div className="flex gap-2">
          <input
            autoFocus
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground font-body outline-none focus:ring-1 focus:ring-primary"
            placeholder="0"
          />
          <button
            onClick={handleSave}
            className="px-4 py-2.5 bg-primary text-primary-foreground font-display font-semibold rounded-lg active:bg-primary/80 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
