// Discourse JSON client for the allowlisted Sky Forum tags. No auth — the
// tagged cycle threads are public. Inject `fetch`/`sleep` so tests never hit
// the network. The worker is the only production caller.

import { sleep as defaultSleep } from "./retry.ts";
import { FORUM_CYCLES, FORUM_ORIGIN } from "../lib/forumKinds.ts";
import { getJson, type DiscourseFetch } from "./forum-discourse-http.ts";
import {
  parseTopicJson,
  posterFromList,
  tagListUrl,
  topicJsonUrl,
  type DiscourseTopic,
  type TagListTopic,
  type TagListUser,
} from "./forum-discourse-parse.ts";

interface CrawlOpts {
  origin?: string;
  fetch?: DiscourseFetch;
  sleep?: (ms: number) => Promise<unknown>;
}

type Crawl = Required<CrawlOpts>;
type Listed = { topics: TagListTopic[]; users: TagListUser[] };

function crawlOf(opts: CrawlOpts): Crawl {
  return { origin: opts.origin ?? FORUM_ORIGIN, fetch: opts.fetch ?? fetch, sleep: opts.sleep ?? defaultSleep };
}

/** Appends the rows whose id is new, in order. */
function appendUnseen<T extends { id: number }>(rows: T[], seen: Set<number>, out: T[]): void {
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
}

export async function listTaggedTopics(tag: string, opts: CrawlOpts = {}): Promise<Listed> {
  const { origin, fetch: fetchImpl, sleep } = crawlOf(opts);
  const out: TagListTopic[] = [];
  const users: TagListUser[] = [];
  const seen = new Set<number>();
  const seenUser = new Set<number>();
  for (let page = 0; page < 50; page++) {
    const body = (await getJson(tagListUrl(origin, tag, page), fetchImpl, { sleep })) as {
      users?: TagListUser[];
      topic_list?: { topics?: TagListTopic[]; more_topics_url?: string | null };
    };
    appendUnseen(body.users ?? [], seenUser, users);
    const topics = body.topic_list?.topics ?? [];
    appendUnseen(topics.filter((t) => typeof t.id === "number"), seen, out);
    if (!body.topic_list?.more_topics_url || topics.length === 0) break;
  }
  return { topics: out, users };
}

async function fetchTopic(row: TagListTopic, listed: Listed, kind: DiscourseTopic["kind"], crawl: Crawl): Promise<DiscourseTopic | null> {
  const raw = await getJson(topicJsonUrl(crawl.origin, row.id), crawl.fetch, { sleep: crawl.sleep });
  const parsed = parseTopicJson(raw, { kind, listPoster: posterFromList(row, listed.users), origin: crawl.origin });
  if (parsed && parsed.poster === "unknown") {
    parsed.poster = posterFromList(row, listed.users);
  }
  return parsed;
}

async function listCycle(tag: string, crawl: Crawl): Promise<Listed | null> {
  try {
    return await listTaggedTopics(tag, crawl);
  } catch (e) {
    console.warn(`forum: tag ${tag} unavailable — ${(e as Error).message}`);
    return null;
  }
}

export async function fetchAllowlistedTopics(opts: CrawlOpts = {}): Promise<DiscourseTopic[]> {
  const crawl = crawlOf(opts);
  const out: DiscourseTopic[] = [];
  const seen = new Set<number>();

  // Nothing here may abort the crawl. `maybeSyncForum` only starts writing
  // once this resolves and never advances its cursor on a throw, so one
  // permanently dead thread (deleted, moved, staff-only) would discard every
  // sibling fetched in the same pass and wedge indexing on every worker tick.
  // Skip the casualty, keep the rest, let the next crawl retry it.
  for (const cycle of FORUM_CYCLES) {
    const listed = await listCycle(cycle.forumTag, crawl);
    if (!listed) continue;
    for (const row of listed.topics) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      try {
        const parsed = await fetchTopic(row, listed, cycle.kind, crawl);
        if (parsed) out.push(parsed);
      } catch (e) {
        console.warn(`forum: skipping topic ${row.id} — ${(e as Error).message}`);
      }
      await crawl.sleep(150);
    }
  }
  return out;
}
