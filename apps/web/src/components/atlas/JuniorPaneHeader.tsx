import type { AtlasNode } from "@/types";
import { depthColor, realDepth } from "@/lib/depth";

export interface JuniorPaneHeaderProps {
  /** The pane doc's ancestors, root first. */
  ancestors: AtlasNode[];
  /** The doc the pane is rooted at. */
  node: AtlasNode | undefined;
  /** Re-roots the pane on an ancestor. */
  onShiftNavigate: (id: string) => void;
  onClose: () => void;
}

type CrumbsProps = Omit<JuniorPaneHeaderProps, "onClose">;

// A breadcrumb click re-roots the pane; shift-click shows that ancestor in the
// main reader (useShiftClickDocLinks catches it before this onClick runs).
function Crumbs({ ancestors, node, onShiftNavigate }: CrumbsProps) {
  return (
    <span className="truncate flex-1 text-tan-3">
      {ancestors.map((a, i) => (
        <span key={a.id}>
          {i > 0 && <span> / </span>}
          <a
            href={`${import.meta.env.BASE_URL}atlas?id=${a.id}`}
            onClick={(e) => {
              e.preventDefault();
              onShiftNavigate(a.id);
            }}
            className="hover:text-tan"
            style={{ color: "var(--tan-3)" }}
          >
            {a.title}
          </a>
        </span>
      ))}
      {node && (
        <span>
          {ancestors.length > 0 && <span> / </span>}
          {/* Brighten-toward-white is a dark-theme idiom; mixing toward --tan
              instead brightens on dark and darkens on light (--tan flips
              role between the two themes), keeping contrast either way.
              --node-title overrides the whole mix for a theme that opts out
              of depth-coloured titles (giedi) — see the token in index.css. */}
          <span style={{ color: `var(--node-title, color-mix(in srgb,${depthColor(realDepth(node.doc_no))} 75%, var(--tan)))` }}>{node.title}</span>
        </span>
      )}
    </span>
  );
}

const BAR_STYLE = {
  borderTop: "2px solid var(--border)",
  borderBottom: "1px solid var(--border)",
  background: "var(--bg)",
};

/** The comparison pane's breadcrumb bar and close button. */
export function JuniorPaneHeader({ onClose, ...crumbs }: JuniorPaneHeaderProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-1 shrink-0 mono text-xs overflow-hidden" style={BAR_STYLE}>
      <Crumbs {...crumbs} />
      <button type="button" onClick={onClose} className="shrink-0 px-1 text-tan-3 hover:text-tan">
        ✕
      </button>
    </div>
  );
}
