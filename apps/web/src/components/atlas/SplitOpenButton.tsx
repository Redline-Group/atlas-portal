/** Opens the comparison pane on the reader's current doc. Shift-clicking any
 *  row or doc link opens one too; the title says so. */
export function SplitOpenButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      title="Open comparison pane (or shift-click any node)"
      onClick={onOpen}
      aria-label="Open comparison pane"
      className="absolute top-2 right-[38px] z-10 mono text-[10px] px-1.5 py-0.5 rounded text-tan-3 hover:text-tan"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
        <rect x="0.5" y="0.5" width="11" height="3.5" rx="0.5" />
        <rect x="0.5" y="6" width="11" height="3.5" rx="0.5" />
      </svg>
    </button>
  );
}
