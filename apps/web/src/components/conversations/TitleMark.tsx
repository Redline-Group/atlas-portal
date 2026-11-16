import type { ConversationSummary } from "../../lib/conversationsApi";
import { SourceMark } from "../SourceMark";

/** The AI mark beside a conversation title a model wrote; nothing for the user's own words or a rename. */
export function TitleMark({ conversation, className }: { conversation: Pick<ConversationSummary, "title" | "titleSource">; className?: string }) {
  if (!conversation.title || conversation.titleSource !== "auto") return null;
  return <SourceMark source="ai" bare unlinked hint="This title was written by a model." className={className} />;
}
