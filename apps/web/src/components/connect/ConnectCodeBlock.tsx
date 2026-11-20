import { useCopyState } from "../../hooks/useCopyState";

export type ConnectCodeBlockProps = {
  /** The snippet shown, and what the copy button puts on the clipboard. */
  code: string;
};

export function ConnectCodeBlock({ code }: ConnectCodeBlockProps) {
  const { copied, copy } = useCopyState(1500);
  return (
    <div className="relative group mb-4">
      <pre
        className="mono text-xs overflow-x-auto rounded-md p-3 pr-16"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--tan-2)" }}
      >
        {code}
      </pre>
      <button
        type="button"
        onClick={() => void copy(code)}
        className="mono text-xs absolute top-2 right-2 px-2 py-1 rounded"
        style={{ background: "var(--hover)", color: "var(--tan-3)" }}
      >
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}
