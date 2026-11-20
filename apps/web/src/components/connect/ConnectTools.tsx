import type { ToolInfo } from "../../lib/tools";

export type ConnectToolsProps = {
  /** The live tool list: null while it loads, empty when the load failed. */
  tools: ToolInfo[] | null;
};

/** "Tools": every tool the server lists, with its description. */
export function ConnectTools({ tools }: ConnectToolsProps) {
  return (
    <>
      <h2 className="text-base font-semibold mt-8 mb-3" style={{ color: "var(--tan)" }}>
        Tools
      </h2>
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
    </>
  );
}
