import { formatByn } from "@/domain/economy/money";

export type EconomyBarRow = {
  key: string;
  label: string;
  valueKop: number;
  highlight?: boolean;
  hint?: string;
};

export function EconomyBars({ rows }: { rows: EconomyBarRow[] }) {
  const max = Math.max(...rows.map((row) => Math.abs(row.valueKop)), 1);

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const width = Math.min(100, Math.round((Math.abs(row.valueKop) / max) * 100));
        return (
          <li key={row.key} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-ink">{row.label}</span>
              <span className="tabular-nums text-leaf">{formatByn(row.valueKop)}</span>
            </div>
            {row.hint ? <p className="text-xs text-leaf">{row.hint}</p> : null}
            <div className="h-2.5 overflow-hidden rounded-full bg-placeholder">
              <div
                className={
                  row.highlight ? "h-full rounded-full bg-mint" : "h-full rounded-full bg-gold"
                }
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
