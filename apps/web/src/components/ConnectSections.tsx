import { ENDPOINT, CLIENTS } from "./connectData";
import { CodeBlock } from "./ConnectCodeBlock";
import type { ToolInfo } from "../lib/tools";

export function ConnectIntro() {
  return (
    <>
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
      <CodeBlock code={ENDPOINT} />
    </>
  );
}

export function ClientList() {
  return (
    <>
      <h2 className="text-base font-semibold mt-8 mb-3" style={{ color: "var(--tan)" }}>
        Add it to your client
      </h2>
      {CLIENTS.map((c) => (
        <section key={c.name} className="mb-6">
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--tan-2)" }}>
            {c.name}
          </p>
          <p className="text-xs mb-2" style={{ color: "var(--tan-3)" }}>
            {c.note}
          </p>
          <CodeBlock code={c.code} />
        </section>
      ))}
    </>
  );
}

export function VerifyConnection({ tools }: { tools: ToolInfo[] | null }) {
  return (
    <>
      <h2 className="text-base font-semibold mt-8 mb-3" style={{ color: "var(--tan)" }}>
        Verify the connection
      </h2>
      <p className="text-xs mb-2" style={{ color: "var(--tan-3)" }}>
        A raw <span className="mono">tools/list</span> call should return{" "}
        {tools ? `the ${tools.length} tools` : "the tools"}:
      </p>
      <CodeBlock
        code={`curl -s ${ENDPOINT} \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`}
      />
    </>
  );
}
