import { ENDPOINT } from "../connectData";
import type { ToolInfo } from "../../lib/tools";
import { ConnectCodeBlock } from "./ConnectCodeBlock";

export type ConnectVerifyProps = {
  /** The live tool list; null while it loads. Its length is the count quoted. */
  tools: ToolInfo[] | null;
};

/** "Verify the connection": a raw tools/list call to paste into a shell. */
export function ConnectVerify({ tools }: ConnectVerifyProps) {
  return (
    <>
      <h2 className="text-base font-semibold mt-8 mb-3" style={{ color: "var(--tan)" }}>
        Verify the connection
      </h2>
      <p className="text-xs mb-2" style={{ color: "var(--tan-3)" }}>
        A raw <span className="mono">tools/list</span> call should return{" "}
        {tools ? `the ${tools.length} tools` : "the tools"}:
      </p>
      <ConnectCodeBlock
        code={`curl -s ${ENDPOINT} \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`}
      />
    </>
  );
}
