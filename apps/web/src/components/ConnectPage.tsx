import { useEffect, useState } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { ToolList, UsageExamples } from "./ConnectLists";
import { ClientList, ConnectIntro, VerifyConnection } from "./ConnectSections";
import { loadTools, type ToolInfo } from "../lib/tools";

export function ConnectPage() {
  useDocumentTitle("Connect (MCP) — Redline Portal");
  const [tools, setTools] = useState<ToolInfo[] | null>(null);
  useEffect(() => {
    loadTools().then(setTools).catch(() => setTools([]));
  }, []);
  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <ConnectIntro />
        <ClientList />

        <h2 className="text-base font-semibold mt-8 mb-3" style={{ color: "var(--tan)" }}>
          Using it
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--tan-2)" }}>
          You don't call the tools by hand. Ask your assistant governance questions in plain language and it
          picks the right atlas tools on its own — starting broad (search) and drilling down (get, neighbors,
          traverse). Every result carries UUIDs, doc numbers, and ancestor chains, so you can always ask it to{" "}
          <em>cite the exact sections</em> and get verifiable references instead of a paraphrase.
        </p>
        <UsageExamples />

        <VerifyConnection tools={tools} />

        <h2 className="text-base font-semibold mt-8 mb-3" style={{ color: "var(--tan)" }}>
          Tools
        </h2>
        <ToolList tools={tools} />
      </div>
    </div>
  );
}
