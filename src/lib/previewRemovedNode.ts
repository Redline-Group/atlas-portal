// A removed preview document as an AtlasNode, for every reader of removed.json
// that wants it in a tree: the browser's tree and reader (previewRemoved.ts)
// and the chat/MCP preview tools (src/server/preview/bundle-read.ts).
import type { AtlasNode } from "../types.ts";
import type { RemovedDoc } from "./previewPatch.ts";

/** `order` places it among its siblings; callers that never sort pass 0. */
export function removedDocNode(d: RemovedDoc, order: number): AtlasNode {
  return {
    id: d.id,
    doc_no: d.doc_no,
    title: d.title ?? "",
    type: d.type ?? "",
    depth: d.depth,
    parentId: d.parentId,
    content: d.content ?? "",
    order,
    addressRefs: [],
  };
}
