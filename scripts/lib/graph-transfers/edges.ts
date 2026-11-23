import type { Doc, Entity } from "../graph-records.ts";
import type { TransferCtx } from "./context.ts";

function pushFundsEdge(ctx: TransferCtx, edgeType: string, from: { id: string; type: string }, to: Entity, sourceDoc: Doc, meta: object): void {
  ctx.edges.push({
    fromId: from.id, fromType: from.type, toId: to.id, toType: "entity",
    edgeType, sourceDocNos: [sourceDoc.doc_no],
    meta: JSON.stringify(meta),
  });
}

export function addTransfer(ctx: TransferCtx, from: Entity, to: Entity, sourceDoc: Doc, meta: object): void {
  pushFundsEdge(ctx, "funds_transfer", { id: from.id, type: "entity" }, to, sourceDoc, meta);
}

const PAYMENT_RECORD_FIELDS = ["payee", "payment address", "amount paid", "transaction hash", "transaction date"];

export function addAuthorization(ctx: TransferCtx, from: Entity, to: Entity, sourceDoc: Doc, meta: { periodic?: boolean } & Record<string, unknown>): void {
  const { periodic = true, ...rest } = meta;
  pushFundsEdge(ctx, "funds_authorization", { id: from.id, type: "entity" }, to, sourceDoc, {
    ...rest,
    kind: "grant_authorization",
    status: "authorized",
    periodic,
    populated: false,
    recorded_transfer: false,
    silence_reason: periodic
      ? "Atlas authorizes recurring payments here but does not record completed transfer rows."
      : "Atlas authorizes a one-time payment here but does not record a completed transfer row.",
    expected_record_fields: [...(periodic ? ["reward period"] : []), ...PAYMENT_RECORD_FIELDS],
  });
}

/** From the source doc, not an entity: the atlas defers who sends what. */
export function addDataGap(ctx: TransferCtx, sourceDoc: Doc, relatedEntity: Entity, meta: object): void {
  pushFundsEdge(ctx, "funds_data_gap", { id: sourceDoc.id, type: "doc" }, relatedEntity, sourceDoc, {
    ...meta,
    populated: false,
    recorded_transfer: false,
    silence_reason: "Atlas describes a planned token movement here but defers recipient, amount, or execution details to a future iteration.",
    expected_record_fields: ["sender", "recipient", "amount", "token", "transaction hash", "transaction date"],
  });
}
