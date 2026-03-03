import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, X } from "lucide-react";
import { FoodItem } from "@/types/tracker";
import { toast } from "sonner";

interface FoodSearchProps {
  foodLibrary: FoodItem[];
  onSelectFood: (food: FoodItem) => void;
  onAddFood: (food: Omit<FoodItem, "id">) => Promise<FoodItem> | FoodItem;
  isOpen: boolean;
  onClose: () => void;
}

export function FoodSearch({ foodLibrary, onSelectFood, onAddFood, isOpen, onClose }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return foodLibrary.slice(0, 20);
    const q = query.toLowerCase();
    return foodLibrary.filter((f) => f.name.toLowerCase().includes(q));
  }, [query, foodLibrary]);

  const handleSelect = (food: FoodItem) => {
    onSelectFood(food);
    toast.success(`Logged 1x ${food.name}`);
    setQuery("");
  };

  const handleQuickAdd = async (food: Omit<FoodItem, "id">) => {
    const newFood = await onAddFood(food);
    onSelectFood(newFood);
    toast.success(`Added & Logged ${newFood.name}`);
    setShowQuickAdd(false);
    setQuery("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-3">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search foods..."
                className="bg-transparent border-none outline-none text-foreground font-body text-base flex-1 placeholder:text-muted-foreground"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-sm text-muted-foreground font-body px-2 py-3"
            >
              Cancel
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {filtered.length === 0 && query.trim() ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground font-body text-sm mb-4">
                  No food found for "{query}"
                </p>
                <button
                  onClick={() => setShowQuickAdd(true)}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-display font-semibold px-5 py-3 rounded-lg active:bg-primary/80 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Quick Add
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {!showQuickAdd && (
                  <button
                    onClick={() => setShowQuickAdd(true)}
                    className="w-full flex items-center gap-2 p-3 rounded-lg text-primary font-body text-sm active:bg-secondary/50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create new food
                  </button>
                )}
                {filtered.map((food) => (
                  <motion.button
                    key={food.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(food)}
                    className="w-full flex items-center justify-between p-3 rounded-lg active:bg-secondary/50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-display font-medium text-foreground">{food.name}</p>
                      <p className="text-xs text-muted-foreground font-body mt-0.5">
                        P:{food.protein}g · C:{food.carbs}g · F:{food.fat}g
                      </p>
                    </div>
                    <span className="text-primary font-display font-semibold">{food.calories}</span>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Add Form */}
          <AnimatePresence>
            {showQuickAdd && (
              <QuickAddForm
                initialName={query}
                onSubmit={handleQuickAdd}
                onCancel={() => setShowQuickAdd(false)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface QuickAddFormProps {
  initialName: string;
  onSubmit: (food: Omit<FoodItem, "id">) => void;
  onCancel: () => void;
}

function QuickAddForm({ initialName, onSubmit, onCancel }: QuickAddFormProps) {
  const [name, setName] = useState(initialName);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [sugar, setSugar] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !calories) return;
    onSubmit({
      name: name.trim(),
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      sugar: parseInt(sugar) || 0,
    });
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-x-0 bottom-0 bg-card border-t border-border rounded-t-2xl p-4 safe-bottom z-50"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">Quick Add</h3>
        <button onClick={onCancel} className="text-muted-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Food name"
          className="w-full bg-secondary border border-border rounded-lg px-3 py-3 text-foreground font-body placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
        />

        <div className="grid grid-cols-2 gap-2">
          <NumInput label="Calories*" value={calories} onChange={setCalories} />
          <NumInput label="Protein (g)" value={protein} onChange={setProtein} />
          <NumInput label="Carbs (g)" value={carbs} onChange={setCarbs} />
          <NumInput label="Fat (g)" value={fat} onChange={setFat} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !calories}
          className="w-full bg-primary text-primary-foreground font-display font-semibold py-3 rounded-lg active:bg-primary/80 transition-colors disabled:opacity-40"
        >
          Add & Log
        </button>
      </div>
    </motion.div>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">{label}</label>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground font-body outline-none focus:ring-1 focus:ring-primary mt-1"
      />
    </div>
  );
}
