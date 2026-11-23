// A param stated as a table of several columns (src/lib/paramGrid.ts): the
// param as one line whose value says how many rows it states, with the
// sentence before the table on hover, then the table itself, then any note.
import type { ComponentProps } from "react";
import type { ParamGrid } from "@/lib/paramGrid";
import { ParamLine } from "./ParamLine";

type ParamGridLineProps = ComponentProps<typeof ParamLine> & { grid: ParamGrid };

const cell = "mono text-[10px] px-2 py-0.5 text-right first:text-left";

export function ParamGridLine({ grid, p, ...line }: ParamGridLineProps) {
  const first = grid.header[0]?.toLowerCase() ?? "row";
  return (
    <div data-slot="param-grid">
      <ParamLine {...line} p={{ ...p, value: `${grid.rows.length} ${first}${grid.rows.length === 1 ? "" : "s"}` }} keyTitle={grid.lead || undefined} valueTitle={grid.lead || undefined} />
      <table className="ml-4 mb-1 border-collapse" style={{ color: "var(--tan-2)" }}>
        <thead>
          <tr style={{ color: "var(--tan-3)" }}>
            {grid.header.map((h) => <th key={h} scope="col" className={`${cell} font-normal`}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((r, i) => (
            <tr key={i} style={{ borderTop: "1px dotted color-mix(in srgb, var(--tan-3) 25%, transparent)" }}>
              {r.map((c, j) => <td key={j} className={cell}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {grid.note && <p className="mono text-[10px] pl-4 leading-relaxed" style={{ color: "var(--tan-3)" }}>{grid.note}</p>}
    </div>
  );
}
