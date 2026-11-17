import { useCallback, useRef, useState } from "react";
import { useLocation } from "wouter";
import { atlasHref, ROUTES } from "@/lib/routes";
import { useAtlasNodeId } from "../../hooks/useAtlasNodeId";
import { useSplitPane } from "../../hooks/useSplitPane";
import type { OnAtlas } from "./chatTypes";
import { ChatLauncher } from "./ChatLauncher";
import { ChatPanel } from "./ChatPanel";
import { useChatSession } from "./useChatSession";
import { usePageContext } from "./pageContext";
import { readFreshResume } from "./resume";
import { useChatOpenChannel } from "./useChatOpenChannel";
import { useResumeConversation, useResumeStamp } from "./useResume";
import { useAnchoredLayout, useChatHotkeys, useOpenState, usePlacement } from "./widgetHooks";
import "./chat.css";

// Top-level floating Redline Portal Chat: launcher ↔ panel. Mounted once in the app
// shell so it's available on every route. Open via click or ⌘K / Ctrl-K; Esc
// closes. Two placements (persisted): "float" (docked corner card) and
// "anchored" (full-height right column that pushes the shell over).
//
// Conversation state (useChatSession) is owned HERE, not by ChatPanel, so
// closing the panel only unmounts its DOM — the thread, an in-flight stream,
// and the rate-limit lock all survive minimize/reopen.
//
// Reload-resume: the snapshot is read once on first render; a fresh one
// (chat was open < RESUME_WINDOW_MS ago) opens the panel immediately — no
// launcher flash — and useResumeConversation rehydrates its conversation.
export function ChatWidget() {
  const [resume] = useState(readFreshResume);
  const { open, setOpen, openChat, closeChat } = useOpenState(resume !== null);
  const [placement, togglePlacement] = usePlacement();
  const [location, navigate] = useLocation();
  const { handleSplitChange } = useSplitPane(useAtlasNodeId());
  const context = usePageContext();
  const session = useChatSession(open);
  useResumeConversation(resume, session.openConversation);
  useResumeStamp(open, session.conversationId, session.title);
  useChatOpenChannel(session, setOpen);
  useChatHotkeys(openChat, closeChat);
  useAnchoredLayout(open, placement);
  // Atlas citation click → SPA-navigate to the reader, keep the panel open. A
  // shift-click on the reader opens the doc in its comparison pane instead,
  // like shift-clicking any other doc link there.
  // The route is read through a ref so onAtlas keeps one identity: every
  // answer's markdown renderer is memoized on it.
  const route = useRef(location);
  route.current = location;
  const onAtlas = useCallback<OnAtlas>(
    (uuid, opts) => {
      if (opts?.split && route.current === ROUTES.ATLAS) handleSplitChange(uuid, "link");
      else navigate(atlasHref(uuid));
    },
    [navigate, handleSplitChange],
  );
  if (!open) return <ChatLauncher onOpen={openChat} context={context} />;
  return (
    <ChatPanel
      session={session}
      onClose={closeChat}
      context={context}
      onAtlas={onAtlas}
      placement={placement}
      onTogglePlacement={togglePlacement}
    />
  );
}
