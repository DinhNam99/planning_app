import type { AppState, Goal, Subtask } from "../types";
import { uid } from "./utils";

function nextMonday(): string {
  const d = new Date();
  const diff = (8 - d.getDay()) % 7; // 1..7 days until the next Monday
  d.setDate(d.getDate() + diff);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function createSampleState(): AppState {
  const now = new Date().toISOString();
  const portfolioId = uid();
  const readingId = uid();

  const portfolio: Goal = {
    id: portfolioId,
    title: "Build a portfolio website",
    startDate: nextMonday(),
    durationMode: "days",
    duration: 12,
    hoursPerDay: 8,
    calendarKind: "workdays",
    createdAt: now,
    updatedAt: now,
  };

  const reading: Goal = {
    id: readingId,
    title: "Read 4 non-fiction books",
    startDate: nextMonday(),
    durationMode: "days",
    duration: 30,
    hoursPerDay: 8,
    calendarKind: "calendar",
    createdAt: now,
    updatedAt: now,
  };

  const portfolioSubtasks: Subtask[] = [
    {
      id: uid(), goalId: portfolioId, title: "Gather content & plan sections", weight: 1,
      placement: "sequential", done: true, links: [], notes: "Collect project screenshots and copy.", orderIndex: 0,
    },
    {
      id: uid(), goalId: portfolioId, title: "Design mockups", weight: 2,
      placement: "sequential", done: false,
      links: [{ id: uid(), url: "https://www.figma.com", label: "Figma" }],
      notes: "", orderIndex: 1,
    },
    {
      id: uid(), goalId: portfolioId, title: "Develop homepage", weight: 3,
      placement: "sequential", done: false, links: [], notes: "", orderIndex: 2,
    },
    {
      id: uid(), goalId: portfolioId, title: "Develop project pages", weight: 3,
      placement: "sequential", done: false, links: [], notes: "", orderIndex: 3,
    },
    {
      id: uid(), goalId: portfolioId, title: "Write copy & publish", weight: 2,
      placement: "sequential", done: false, links: [], notes: "", orderIndex: 4,
    },
    {
      id: uid(), goalId: portfolioId, title: "Collect feedback & iterate", weight: 1,
      placement: "parallel", done: false,
      links: [{ id: uid(), url: "https://forms.gle/feedback", label: "Feedback form" }],
      notes: "Ask 3 friends to review.", orderIndex: 5,
    },
  ];

  const readingSubtasks: Subtask[] = [
    { id: uid(), goalId: readingId, title: "Atomic Habits", weight: 1, placement: "sequential", done: false, links: [], notes: "", orderIndex: 0 },
    { id: uid(), goalId: readingId, title: "Deep Work", weight: 1, placement: "sequential", done: false, links: [], notes: "", orderIndex: 1 },
    { id: uid(), goalId: readingId, title: "The Psychology of Money", weight: 1, placement: "sequential", done: false, links: [], notes: "", orderIndex: 2 },
    { id: uid(), goalId: readingId, title: "Thinking, Fast and Slow", weight: 2, placement: "sequential", done: false, links: [], notes: "", orderIndex: 3 },
  ];

  return {
    goals: [portfolio, reading],
    subtasks: [...portfolioSubtasks, ...readingSubtasks],
  };
}