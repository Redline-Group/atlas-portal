import { useEffect, useState } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { ENDPOINT } from "./connectData";
import { loadTools, type ToolInfo } from "../lib/tools";
import { ConnectClients } from "./connect/ConnectClients";
import { ConnectCodeBlock } from "./connect/ConnectCodeBlock";
import { ConnectTools } from "./connect/ConnectTools";
import { ConnectUsage } from "./connect/ConnectUsage";
import { ConnectVerify } from "./connect/ConnectVerify";

export function ConnectPage() {
  useDocumentTitle("Connect (MCP) — Redline Portal");
  const [tools, setTools] = useState<ToolInfo[] | null>(null);
  useEffect(() => {
    loadTools().then(setTools).catch(() => setTools([]));
  }, []);
  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <p className="mono text-xs text-tan-3 mb-1">connect</p>
        <h1 className="text-xl font-semibold mb-4" style={{ color: "var(--tan)" }}>
          Connect to the Atlas MCP server
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--tan-2)" }}>
          Redline hosts a public{" "}
          <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="link-accent">
            Model Context Protocol
          </a>{" "}
          server that exposes the entire Sky Atlas — every document, the typed relationship graph, named
          entities, on-chain addresses, and change history — as structured tools any MCP client can call.
          Point an AI assistant at it and it can search, traverse, and cite the atlas directly. The transport
          is streamable HTTP; the server is read-only and needs <strong>no API key or auth</strong>.
        </p>

        <p className="mono text-xs text-tan-3 uppercase tracking-wider mb-2">endpoint</p>
        <ConnectCodeBlock code={ENDPOINT} />

        <ConnectClients />
        <ConnectUsage />
        <ConnectVerify tools={tools} />
        <ConnectTools tools={tools} />
      </div>
    </div>
  );
}
