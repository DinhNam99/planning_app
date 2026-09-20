interface Props {
  value: number; // 0..1
  className?: string;
}

export function ProgressBar({ value, className = "" }: Props) {
  const pct = Math.min(100, Math.max(0, Math.round(value * 100)));
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-indigo-500 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}