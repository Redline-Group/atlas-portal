// The one place the signatures of the untyped .mjs rule modules the passes call are stated.
// Each import resolves with inferred types where the project checks .mjs and as untyped where
// it does not, so every export carries an explicit signature and the passes import from here.

// @ts-ignore — untyped .mjs
import * as rules from "../auto-curate.mjs";
// @ts-ignore — untyped .mjs
import * as clusters from "../curate-clusters.mjs";
// @ts-ignore — untyped .mjs
import * as context from "../curate-context.mjs";
// @ts-ignore — untyped .mjs
import * as forward from "../history-forward-trace.mjs";
// @ts-ignore — untyped .mjs
import * as positional from "../history-positional.mjs";
import type { Candidate, Case, CurationNode, HtmlCommit, ProposeCandidate, ProposeSubject } from "./types.ts";

type Nodes = Record<string, CurationNode>;
interface Signals { autoKey: string | null; fwdKey: string | null; containKey: string | null }

export interface Cluster { caseKeys: string[]; candidateKeys: string[]; size: number; oversized?: boolean }
export interface PositionalPick { chosenKey: string; top: number; margin: number; p1: number | null; p2: number | null }

export const LLM_CONFIRM_THRESHOLD = rules.LLM_CONFIRM_THRESHOLD as number;
export const forwardAgrees = rules.forwardAgrees as (kase: Case, fwdOlderKey: string | null) => boolean;
export const llmEligible = rules.llmEligible as (kase: Case, threshold?: number) => boolean;
export const llmConfirms = rules.llmConfirms as (kase: Case, llmChosenKey: string) => boolean;
export const frontierTriggers = rules.frontierTriggers as (kase: Case, signals: Omit<Signals, "autoKey"> & { cheapKey: string | undefined }) => Set<string>;
export const frontierCorroborator = rules.frontierCorroborator as (chosenKey: string, signals: Signals) => string | null;

export const buildClusters = clusters.buildClusters as (cases: Case[], resolved: Set<string>, claimed: Set<string>, opts: { maxSize: number }) => { clusters: Cluster[] };

export const buildClaimIndex = context.buildClaimIndex as (cases: Case[]) => Map<string, Set<string>>;
export const enrichSubject = context.enrichSubject as (subjectKey: string, nodes: Nodes) => ProposeSubject | null;
export const enrichCandidates = context.enrichCandidates as (kase: { candidates?: Candidate[] }, nodes: Nodes, claimIndex: Map<string, Set<string>>) => ProposeCandidate[];

export const forwardLinks = forward.forwardLinks as (commits: HtmlCommit[]) => Map<string, string | null>;

export const positionalPick = positional.positionalPick as (subjectNode: CurationNode | undefined, candidateKeys: string[], nodes: Nodes) => PositionalPick | null;
export const positionalSelfCorroborates = positional.positionalSelfCorroborates as (pick: PositionalPick | null) => pick is PositionalPick & { p1: number; p2: number };
