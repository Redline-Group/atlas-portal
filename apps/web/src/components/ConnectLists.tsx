import { USAGE_EXAMPLES } from "./connectData";
import type { ToolInfo } from "../lib/tools";

export function UsageExamples() {
  return (
    <ul className="space-y-2 mb-8">
      {USAGE_EXAMPLES.map((e) => (
        <li key={e.ask} className="text-xs" style={{ color: "var(--tan-2)" }}>
          <span style={{ color: "var(--tan)" }}>“{e.ask}”</span>{" "}
          <span className="text-tan-3">
            <span className="enlargen">→</span> {e.tools.map((t) => (
              <span key={t} className="mono mcp-tool-name">
                {t}{" "}
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ToolList({ tools }: { tools: ToolInfo[] | null }) {
  return (
    <ul className="space-y-2 mb-8">
      {tools === null && (
        <li className="text-xs" style={{ color: "var(--tan-3)" }}>
          Loading tools…
        </li>
      )}
      {tools?.length === 0 && (
        <li className="text-xs" style={{ color: "var(--tan-3)" }}>
          Couldn't load the tool list.
        </li>
      )}
      {tools?.map((t) => (
        <li key={t.name} className="text-xs" style={{ color: "var(--tan-2)" }}>
          <span className="mono mcp-tool-name">
            {t.name}
          </span>{" "}
          — {t.desc}
        </li>
      ))}
    </ul>
  );
}
