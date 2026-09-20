import type { LinkItem } from "../types";
import { uid } from "../lib/utils";
import { Icons } from "./icons";

interface Props {
  links: LinkItem[];
  onChange: (links: LinkItem[]) => void;
}

const inputClass =
  "rounded border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export function LinksEditor({ links, onChange }: Props) {
  const update = (id: string, patch: Partial<LinkItem>) =>
    onChange(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <div className="space-y-1.5 print:hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Links
        </span>
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          onClick={() => onChange([...links, { id: uid(), url: "", label: "" }])}
        >
          <Icons.Plus className="h-3 w-3" /> Add link
        </button>
      </div>
      {links.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">No links yet.</p>
      ) : (
        <div className="space-y-1.5">
          {links.map((l) => (
            <div key={l.id} className="flex items-center gap-2">
              <input
                value={l.label ?? ""}
                onChange={(e) => update(l.id, { label: e.target.value })}
                placeholder="Label"
                className={`${inputClass} w-28`}
              />
              <input
                value={l.url}
                onChange={(e) => update(l.id, { url: e.target.value })}
                placeholder="https://…"
                className={`${inputClass} min-w-0 flex-1`}
              />
              <button
                type="button"
                onClick={() => onChange(links.filter((x) => x.id !== l.id))}
                className="p-1 text-slate-400 hover:text-red-500"
                aria-label="Remove link"
              >
                <Icons.Trash />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}