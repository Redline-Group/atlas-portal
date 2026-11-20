import { USAGE_EXAMPLES } from "../connectData";

/** "Using it": how to ask, with example questions and the tools they reach. */
export function ConnectUsage() {
  return (
    <>
      <h2 className="text-base font-semibold mt-8 mb-3" style={{ color: "var(--tan)" }}>
        Using it
      </h2>
      <p className="text-sm mb-4" style={{ color: "var(--tan-2)" }}>
        You don't call the tools by hand. Ask your assistant governance questions in plain language and it
        picks the right atlas tools on its own — starting broad (search) and drilling down (get, neighbors,
        traverse). Every result carries UUIDs, doc numbers, and ancestor chains, so you can always ask it to{" "}
        <em>cite the exact sections</em> and get verifiable references instead of a paraphrase.
      </p>
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
    </>
  );
}
