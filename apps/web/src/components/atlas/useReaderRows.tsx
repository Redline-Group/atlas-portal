import { useMemo, type ReactElement } from "react";
import type { FlatEntry } from "@/lib/atlasHelpers";
import type { AtlasFilter } from "../../lib/atlasFilter";
import { ancestorsOfMatches } from "../../lib/visualTree";
import { CollapsibleNode } from "./CollapsibleNode";
import { flatRows, treeRows, type ReaderRow, type ReaderRowList } from "./readerRows";
import type { ReaderDisclosure } from "./useReaderDisclosure";

interface RowContext {
  selectedId: string | null;
  expandedSet: ReadonlySet<string>;
  userToggles: ReadonlySet<string>;
  agentByDoc?: Map<string, string> | null;
  onExpandChildren?: (id: string) => void;
  inSelectedOnly: boolean;
}

function rowBlock(row: ReaderRow, cradleColor: string | undefined, ctx: RowContext): ReactElement[] {
  const id = row.entry.node.id;
  const node = (
    <CollapsibleNode
      key={id}
      entry={row.entry}
      isSelected={id === ctx.selectedId}
      isExpanded={ctx.expandedSet.has(id) !== ctx.userToggles.has(id)}
      hasChildren={row.hasChildren}
      isExiting={row.isExiting}
      rungLevel={row.rung.level}
      rungDir={row.rung.dir}
      gatedCount={row.gatedCount}
      onExpandChildren={ctx.onExpandChildren}
      cradle={row.cradle}
      cradleColor={row.cradle ? cradleColor : undefined}
      agentName={ctx.agentByDoc?.get(id)}
      inSelectedOnly={ctx.inSelectedOnly}
    />
  );
  if (!row.gap) return [node];
  return [
    <div key={`__gap-${id}`} className="selection-gap" aria-hidden="true">
      ⋯
    </div>,
    node,
  ];
}

// The group bounds the selected node's position:sticky to its cradle rows.
function renderRows(list: ReaderRowList, ctx: RowContext): ReactElement[] {
  const blocks = list.rows.map((row) => rowBlock(row, list.cradleColor, ctx));
  if (!list.group) return blocks.flat();
  const { start, end } = list.group;
  return [
    ...blocks.slice(0, start).flat(),
    <div key="__selection-group" className="selection-group">
      {blocks.slice(start, end + 1).flat()}
    </div>,
    ...blocks.slice(end + 1).flat(),
  ];
}

export interface ReaderRowsSource {
  flatNodes: FlatEntry[];
  selectedId: string | null;
  agentByDoc?: Map<string, string> | null;
}

// Memoized in two steps so a body toggle rebuilds elements without re-walking the atlas.
export function useReaderRows(source: ReaderRowsSource, filter: AtlasFilter, disclosure: ReaderDisclosure) {
  const { flatNodes, selectedId, agentByDoc } = source;
  const { filterSet, subset } = filter;
  const { rung, tree, hiddenNodeIds, exitingIds, expandHidden } = disclosure;
  const { expandedSet, userToggles } = disclosure.bodies;
  const parentIds = useMemo(() => ancestorsOfMatches(flatNodes, tree.parent, filterSet), [flatNodes, tree, filterSet]);
  const cradle = subset !== "changed";
  const list = useMemo(
    () =>
      filterSet
        ? flatRows({ flatNodes, filterSet, parentIds, rung, selectedId, cradle })
        : treeRows({ flatNodes, tree, rung, hiddenNodeIds, exitingIds, selectedId }),
    [flatNodes, filterSet, parentIds, rung, selectedId, cradle, tree, hiddenNodeIds, exitingIds],
  );
  const onExpandChildren = filterSet ? undefined : expandHidden;
  const inSelectedOnly = !!filterSet || subset === "selected";
  return useMemo(
    () => renderRows(list, { selectedId, expandedSet, userToggles, agentByDoc, onExpandChildren, inSelectedOnly }),
    [list, selectedId, expandedSet, userToggles, agentByDoc, onExpandChildren, inSelectedOnly],
  );
}
