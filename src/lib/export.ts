import type { Goal, Subtask } from "../types";
import { slugify } from "./utils";

export function downloadGoalJson(goal: Goal, subtasks: Subtask[]): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    goal,
    subtasks: [...subtasks].sort((a, b) => a.orderIndex - b.orderIndex),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `goal-${slugify(goal.title)}-${goal.startDate}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}