import { useState } from "react";
import { DailyTask } from "@/types/tracker";
import { CheckCircle2, Circle, Trash2, Plus, ListTodo } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DailyTasksProps {
  tasks: DailyTask[];
  date: Date;
  onAddTask: (
    content: string,
    frequency: "daily" | "weekly" | "biweekly" | "specific_days",
    frequencyConfig?: string[]
  ) => void;
  onToggleTask: (id: string, isCompleted: boolean) => void;
  onDeleteTask: (id: string) => void;
}

export function DailyTasks({ tasks, date, onAddTask, onToggleTask, onDeleteTask }: DailyTasksProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "biweekly" | "specific_days">("daily");
  const [frequencyConfig, setFrequencyConfig] = useState<string[]>([]);
  
  const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  
  const days = [
    { id: "mon", label: "M" },
    { id: "tue", label: "T" },
    { id: "wed", label: "W" },
    { id: "thu", label: "T" },
    { id: "fri", label: "F" },
    { id: "sat", label: "S" },
    { id: "sun", label: "S" },
  ];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;
    
    // Require at least one day selected if specific_days
    if (frequency === "specific_days" && frequencyConfig.length === 0) return;

    onAddTask(newTaskContent.trim(), frequency, frequency === "specific_days" ? frequencyConfig : undefined);
    
    setNewTaskContent("");
    setFrequency("daily");
    setFrequencyConfig([]);
    setIsAdding(false);
  };

  const toggleDay = (dayId: string) => {
    setFrequencyConfig(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const progressPercent = tasks.length === 0 ? 0 : (completedCount / tasks.length) * 100;

  return (
    <div className="px-4 mt-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-body text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Daily Checklist</span>
            <span className="sm:hidden">Tasks</span>
            <span className="text-xs text-muted-foreground/50 lowercase normal-case">— {dateStr}</span>
          </h2>
          {tasks.length > 0 && (
            <span className="text-xs font-display font-medium text-muted-foreground">
              {completedCount} / {tasks.length}
            </span>
          )}
        </div>

        {tasks.length > 0 && (
             <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
               <div 
                 className="h-full bg-primary transition-all duration-500 ease-out" 
                 style={{ width: `${progressPercent}%` }} 
               />
             </div>
        )}

        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center justify-between p-3 border-b border-border/50 last:border-0"
              >
                <button
                  onClick={() => onToggleTask(task.id, !task.isCompleted)}
                  className="flex flex-1 items-center gap-3 text-left focus:outline-none"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`flex-shrink-0 ${task.isCompleted ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 fill-primary/20" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </motion.div>
                  <div className="flex flex-col">
                    <span
                      className={`font-body text-sm transition-all ${
                        task.isCompleted
                          ? "text-muted-foreground line-through decoration-muted-foreground/50"
                          : "text-foreground"
                      }`}
                    >
                      {task.content}
                    </span>
                    {task.frequency !== "daily" && (
                      <span className="text-[10px] font-medium uppercase tracking-wider text-primary/60 mt-0.5">
                        {task.frequency === "weekly" && "Weekly"}
                        {task.frequency === "biweekly" && "Bi-Weekly"}
                        {task.frequency === "specific_days" && task.frequencyConfig?.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-2 ml-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {tasks.length === 0 && !isAdding && (
            <div className="p-6 text-center text-sm font-body text-muted-foreground/60 italic border-b border-border/50">
              No daily habits added yet.
            </div>
          )}

          {isAdding ? (
            <div className="p-4 bg-secondary/20">
              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={newTaskContent}
                  onChange={(e) => setNewTaskContent(e.target.value)}
                  placeholder="Task name (e.g., Read 10 pages)"
                  autoFocus
                  className="w-full bg-background border border-border focus:ring-1 focus:ring-primary rounded-md text-sm font-body py-2.5 px-3 text-foreground"
                />
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest whitespace-nowrap">Repeat</span>
                    <select 
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as any)}
                      className="bg-background border border-border text-sm rounded-md px-2 py-1.5 focus:ring-primary w-full max-w-[200px]"
                    >
                      <option value="daily">Every Day</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-Weekly</option>
                      <option value="specific_days">Specific Days</option>
                    </select>
                  </div>
                  
                  {frequency === "specific_days" && (
                     <div className="flex items-center justify-between gap-1 mt-1">
                       {days.map(d => {
                         const isSelected = frequencyConfig.includes(d.id);
                         return (
                           <button
                             key={d.id}
                             type="button"
                             onClick={() => toggleDay(d.id)}
                             className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                               isSelected 
                                 ? "bg-primary text-primary-foreground shadow-sm" 
                                 : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                             }`}
                           >
                             {d.label}
                           </button>
                         )
                       })}
                     </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTaskContent.trim() || (frequency === "specific_days" && frequencyConfig.length === 0)}
                    className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center justify-center gap-2 p-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add a new task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
