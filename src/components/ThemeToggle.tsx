export type Theme = "light" | "dark" | null;

interface Props {
  value: Theme;
  onChange: (v: Theme) => void;
}

const OPTIONS: { v: Theme; label: string }[] = [
  { v: null, label: "System" },
  { v: "light", label: "Light" },
  { v: "dark", label: "Dark" },
];

export function ThemeToggle({ value, onChange }: Props) {
  return (
    <div className="flex overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 print:hidden">
      {OPTIONS.map((o) => (
        <button
          key={o.label}
          type="button"
          onClick={() => onChange(o.v)}
          className={`px-2.5 py-1 text-xs font-medium ${
            value === o.v
              ? "bg-indigo-500 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}