import { annotatedId, ANNOTATION_TAIL_SEGMENTS } from "@/lib/annotation";
import { atlasHref } from "@/lib/routes";
import type { AtlasNode } from "@/types";
import { DocNoChiclets } from "../DocNoChiclets";
import { AtlasLink } from "../AtlasLink";
import { useAtlasActions } from "./AtlasActionsContext";
import type { RowColumns } from "./nodeRowLayout";

// A link because the atlas sorts the `0` directory after every real sibling, so the target can be far up.
// Primary click uses navigate() to keep ?view=; the href serves middle-click / copy.
function AnnotatesLabel({ node, target }: { node: AtlasNode; target: string }) {
  const { navigate, docNoToId } = useAtlasActions();
  // Unresolvable targets degrade to plain text rather than a dead link.
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

// `.0.3.N` numbering indents annotations three columns past their target; the label and minor chiclets pull them back.
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
