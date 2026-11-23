// Shapes shared by the auto-curation passes: the curation queue as the passes read it, the
// injected proposers, the resume cache, and the context one run threads through its passes.

export interface Candidate { key: string; score?: number; diff?: string }

export interface Case {
  key: string;
  kind: string;
  subjectKey: string;
  newerSha: string;
  olderSha: string;
  autoKey: string | null;
  subjectOrder?: number;
  candidates?: Candidate[];
}

export interface CurationNode {
  title: string;
  content: string;
  doc_no?: string | null;
  section?: string;
  ancestors?: string[];
  prev?: string[];
  next?: string[];
  scope?: string;
  parentTitle?: string;
}

export interface QueueCommit { sha: string; pr?: number | null; prTitle?: string; changeSummary?: string }

export interface CurationData {
  meta?: unknown;
  nodes: Record<string, CurationNode>;
  cases?: Case[];
  commits?: QueueCommit[];
}

// A loaded HTML commit; `nodes` carry contentHash (forwardLinks reads them).
export interface HtmlCommit { sha: string; nodes: unknown[] }

export interface Decision {
  caseKey: string;
  kind: string;
  subjectKey: string;
  newerSha: string;
  olderSha: string;
  chosenKey: string;
  agreedWithAuto: boolean;
  auto: string;
  why?: string;
  corroborator?: string;
}

export interface Proposal { caseKey: string; chosenKey: string; why: string; via?: string }

export interface AskEntry { chosenKey: string; why: string; model: string | null }
export interface ClusterEntry { model: string; assignments: ClusterAssignment[] }
export type LlmCache = Map<string, AskEntry | ClusterEntry>;

// What the proposers are given and return. These restate the types beside proposePredecessor and
// proposeClusterAssignment (src/server/history/history-curate.ts) structurally: importing them
// would put that module's server imports into every program that typechecks a pass.
export interface NodeContext { docNo?: string | null; prev: string[]; next: string[]; path?: string[]; scope?: string; parent?: string }
export interface ProposeSubject { title: string; content: string; context?: NodeContext | null }
export interface ClusterSubject extends ProposeSubject { key: string; order?: number }
export interface ProposeCandidate extends ProposeSubject { key: string; diff?: string; soleHome?: boolean; alsoClaimedBy?: number }
export interface ChangeContext { pr?: number | null; title?: string; summary?: string }
export interface ProposeResult { chosenKey: string; why: string }
export interface ClusterAssignment { subjectKey: string; chosenKey: string; why: string }

export type Propose = (subject: ProposeSubject, candidates: ProposeCandidate[], opts: { model?: string; change?: ChangeContext | null }) => Promise<ProposeResult>;
export type ProposeCluster = (subjects: ClusterSubject[], candidates: ProposeCandidate[], opts: { model: string; change?: ChangeContext | null }) => Promise<{ assignments: ClusterAssignment[] }>;
export interface Proposers { propose?: Propose; proposeCluster?: ProposeCluster | null }

export interface Tuning {
  haveKey: boolean;
  noLlm: boolean;
  limit: number;
  threshold: number;
  concurrency: number;
  containment: boolean;
  containThreshold: number;
  containMargin: number;
  positional: boolean;
  cluster: boolean;
  clusterModels: string[];
  clusterMaxSize: number;
  clusterConcurrency: number;
  clusterMaxSweeps: number;
  frontier: boolean;
  frontierModel: string | null;
  frontierLimit: number;
  frontierConcurrency: number;
  cheapModel: string | null;
}

export type Log = (message: string) => void;

export interface AutoCurateOptions extends Partial<Tuning>, Proposers {
  data: CurationData;
  commits: HtmlCommit[];
  cache?: LlmCache;
  log?: Log;
}

// One run's inputs, derived indexes and the state its passes share. `decisions`, `proposals`,
// `cache` and `cheapPicks` are appended to by the passes; everything else is read-only.
export interface RunContext extends Tuning, Proposers {
  data: CurationData;
  commits: HtmlCommit[];
  cases: Case[];
  cache: LlmCache;
  log: Log;
  claimIndex: Map<string, Set<string>>;
  changeBySha: Map<string, ChangeContext>;
  links: Map<string, string | null>;
  decisions: Decision[];
  proposals: Proposal[];
  cheapPicks: Map<string, string>;
}
