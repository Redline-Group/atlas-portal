// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { TitleMark } from "./TitleMark";
import { ConversationCollectionCard } from "../collections/ConversationCollectionCard";
import type { ConversationSummary } from "../../lib/conversationsApi";

afterEach(cleanup);

const conv = (over: Partial<ConversationSummary> = {}): ConversationSummary => ({
  id: "c1", title: "Rate limits", titleSource: "auto", updatedAt: "2026-01-15T00:00:00.000Z", messageCount: 2, contextTokens: null, citationCount: 1, ...over,
});

describe("TitleMark", () => {
  it("marks only a model-written title", () => {
    expect(render(<TitleMark conversation={conv()} />).container.querySelector("[data-source='ai']")).not.toBeNull();
    cleanup();
    for (const over of [{ titleSource: "user" as const }, { titleSource: "seed" as const }, { title: null }]) {
      expect(render(<TitleMark conversation={conv(over)} />).container.querySelector("[data-source]")).toBeNull();
      cleanup();
    }
  });

  it("shows on the conversation collection card too, not only the conversations list", () => {
    const { container } = render(<ConversationCollectionCard conversation={conv()} onOpen={() => {}} />);
    expect(container.querySelector("h2 [data-source='ai']")).not.toBeNull();
  });
});
