export type DurationMode = "days" | "hours";
export type CalendarKind = "calendar" | "workdays";
export type Placement = "sequential" | "parallel";

export interface LinkItem {
  id: string;
  url: string;
  label?: string;
}

export interface Subtask {
  id: string;
  goalId: string;
  title: string;
  weight: number; // integer >= 1
  placement: Placement;
  /** Optional manual start override (yyyy-mm-dd). Only used for sequential subtasks. */
  startOverride?: string | null;
  /** Optional manual end override (yyyy-mm-dd). Only used for sequential subtasks. */
  endOverride?: string | null;
  done: boolean;
  links: LinkItem[];
  notes: string;
  orderIndex: number;
}

export interface Goal {
  id: string;
  title: string;
  /** yyyy-mm-dd */
  startDate: string;
  durationMode: DurationMode;
  /** In days, or total hours when durationMode === "hours". */
  duration: number;
  /** Working hours per day; used when durationMode === "hours". */
  hoursPerDay: number;
  calendarKind: CalendarKind;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  goals: Goal[];
  subtasks: Subtask[];
}