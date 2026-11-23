import { annotatedId, ANNOTATION_TAIL_SEGMENTS } from "@/lib/annotation";
import { atlasHref } from "@/lib/routes";
import type { AtlasNode } from "@/types";
import { DocNoChiclets } from "../DocNoChiclets";
import { AtlasLink } from "../AtlasLink";
import { useAtlasActions } from "./AtlasActionsContext";
import type { RowColumns } from "./nodeRowLayout";

// Names the doc an annotation annotates. Fits inside the chiclet column for
// every annotation in the atlas (widest is 27 chars against a 165px column),
// so it names the target without pushing the title back out. A link because
// the target can be a long way up the reader — the atlas orders the supporting
// `0` directory after every real sibling (compose.py's sort key), so A.2.8's
// annotations sit 253 rows below it. The row's own click handlers bail on
// `closest("a")`, so following it doesn't also select or toggle the row.
// Primary click goes through context navigate() (keeps ?view= / optimistic
// selection); AtlasLink's href is for middle-click / copy — AtlasLink only
// folds split/subset, not the active tab.
function AnnotatesLabel({ node, target }: { node: AtlasNode; target: string }) {
  const { navigate, docNoToId } = useAtlasActions();
  // The target is known by NUMBER; the route takes an id. Unresolvable (a
  // provider without the map, or a target still in the un-merged deep tier)
  // degrades to plain text rather than a dead link. A removed annotation
  // resolves by where it was placed (annotatedId).
  const targetId = annotatedId(node, docNoToId);
  if (!targetId) return <span className="atlas-annotates">Annotates {target}</span>;
  return (
    <AtlasLink to={atlasHref(targetId)} className="atlas-annotates" onOpen={() => navigate(targetId)}>
      Annotates {target}
    </AtlasLink>
  );
}

export interface NodeDocNoProps {
  node: AtlasNode;
  columns: RowColumns;
}

// Annotations hang directly off the doc they annotate, but their `.0.3.N`
// numbering indents them three columns past it — so they read as children of
// that doc's children. Three treatments pull them back: the label here, the
// smaller trailing chiclets, and the dropped chevron column (chevronColumn).
export function NodeDocNo({ node, columns }: NodeDocNoProps) {
  const { parts, depths, annotates } = columns;
  if (!annotates) return <DocNoChiclets parts={parts} depths={depths} />;
  return (
    <span className="atlas-docno-col">
      <DocNoChiclets parts={parts} depths={depths} minorFrom={parts.length - ANNOTATION_TAIL_SEGMENTS} />
      <AnnotatesLabel node={node} target={annotates} />
    </span>
  );
}
