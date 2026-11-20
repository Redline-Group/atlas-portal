// Shapes of the Discourse tag-list and topic JSON, and the pure functions
// that turn them into the topics the forum sync stores.

import { classifyForumTopic, FORUM_ORIGIN, tagSlugs, type ForumKind } from "../lib/forumKinds.ts";

export interface DiscourseTopic {
  topicId: number;
  kind: ForumKind;
  title: string;
  slug: string;
  url: string;
  poster: string;
  postedAt: string;
  lastPostedAt: string | null;
  tags: string[];
  postsCount: number;
  opHtml: string;
  posts: DiscoursePost[];
}

export interface DiscoursePost {
  postId: number;
  postNumber: number;
  poster: string;
  postedAt: string;
  html: string;
  replyToPostNumber: number | null;
}

export interface TagListTopic {
  id: number;
  title: string;
  slug: string;
  posts_count?: number;
  created_at?: string;
  last_posted_at?: string | null;
  tags?: unknown;
  posters?: { user_id: number; description?: string }[];
}

export interface TagListUser {
  id: number;
  username: string;
}

export function posterFromList(topic: TagListTopic, users: TagListUser[]): string {
  const byId = new Map(users.map((u) => [u.id, u.username]));
  const op = topic.posters?.find((p) => /original poster/i.test(p.description ?? ""));
  const uid = op?.user_id ?? topic.posters?.[0]?.user_id;
  return (uid != null && byId.get(uid)) || "unknown";
}

export function tagListUrl(origin: string, tag: string, page: number): string {
  const base = `${origin}/tag/${encodeURIComponent(tag)}.json`;
  return page > 0 ? `${base}?page=${page}` : base;
}

export function topicUrl(origin: string, slug: string, id: number): string {
  return `${origin}/t/${slug}/${id}`;
}

export function topicJsonUrl(origin: string, id: number): string {
  return `${origin}/t/${id}.json`;
}

interface TopicJsonPost {
  id: number;
  post_number: number;
  username?: string;
  created_at?: string;
  cooked?: string;
  reply_to_post_number?: number | null;
}

interface TopicJson {
  id?: number;
  title?: string;
  slug?: string;
  created_at?: string;
  last_posted_at?: string | null;
  posts_count?: number;
  tags?: unknown;
  details?: { created_by?: { username?: string } };
  post_stream?: { posts?: TopicJsonPost[] };
}

function toPost(p: TopicJsonPost, topicCreatedAt: string | undefined): DiscoursePost {
  return {
    postId: p.id,
    postNumber: p.post_number,
    poster: p.username ?? "unknown",
    postedAt: p.created_at ?? topicCreatedAt ?? new Date(0).toISOString(),
    html: p.cooked ?? "",
    replyToPostNumber: p.reply_to_post_number ?? null,
  };
}

export function parseTopicJson(
  raw: unknown,
  fallback: { kind: ForumKind; listPoster: string; origin?: string },
): DiscourseTopic | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as TopicJson;
  if (typeof t.id !== "number" || !t.title || !t.slug) return null;
  const posts = (t.post_stream?.posts ?? []).map((p) => toPost(p, t.created_at));
  const op = posts.find((p) => p.postNumber === 1);
  return {
    topicId: t.id,
    kind: classifyForumTopic(t.tags, t.title) ?? fallback.kind,
    title: t.title,
    slug: t.slug,
    url: topicUrl(fallback.origin ?? FORUM_ORIGIN, t.slug, t.id),
    poster: t.details?.created_by?.username ?? op?.poster ?? fallback.listPoster,
    postedAt: t.created_at ?? op?.postedAt ?? new Date(0).toISOString(),
    lastPostedAt: t.last_posted_at ?? null,
    tags: tagSlugs(t.tags),
    postsCount: t.posts_count ?? posts.length,
    opHtml: op?.html ?? "",
    posts,
  };
}
