import { CLIENTS } from "../connectData";
import { ConnectCodeBlock } from "./ConnectCodeBlock";

/** "Add it to your client": one config snippet per MCP client. */
export function ConnectClients() {
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
          <ConnectCodeBlock code={c.code} />
        </section>
      ))}
    </>
  );
}
