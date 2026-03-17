import { createHash } from "node:crypto";

import { XMLParser } from "fast-xml-parser";

import { getHostnameLabel, isValidUrl, normalizeUrl } from "@/lib/url";
import type { Article, Feed, FeedFetchResult } from "@/lib/types";

type XmlRecord = Record<string, unknown>;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
  parseTagValue: true,
});

export class FeedFetchError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "FeedFetchError";
    this.status = status;
  }
}

export async function fetchFeed(url: string): Promise<FeedFetchResult> {
  if (!isValidUrl(url)) {
    throw new FeedFetchError("有効な http / https URL を指定してください。", 400);
  }

  const normalizedUrl = normalizeUrl(url);

  let response: Response;

  try {
    response = await fetch(normalizedUrl, {
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
      cache: "no-store",
    });
  } catch {
    throw new FeedFetchError("フィードの取得に失敗しました。", 502);
  }

  if (!response.ok) {
    throw new FeedFetchError(
      `フィードの取得に失敗しました。ステータス: ${response.status}`,
      502,
    );
  }

  const xml = await response.text();

  if (xml.trim().length === 0) {
    throw new FeedFetchError("フィードの内容が空です。", 422);
  }

  let parsed: unknown;

  try {
    parsed = xmlParser.parse(xml);
  } catch {
    throw new FeedFetchError("RSS / Atom の解析に失敗しました。", 422);
  }

  if (!isRecord(parsed)) {
    throw new FeedFetchError("RSS / Atom の解析結果が不正です。", 422);
  }

  if (isRecord(parsed.rss) && isRecord(parsed.rss.channel)) {
    return parseRssFeed(parsed.rss.channel, normalizedUrl);
  }

  if (isRecord(parsed.feed)) {
    return parseAtomFeed(parsed.feed, normalizedUrl);
  }

  throw new FeedFetchError("RSS / Atom フィードではありません。", 422);
}

function parseRssFeed(channel: XmlRecord, feedUrl: string): FeedFetchResult {
  const feedId = createStableId("feed", feedUrl);
  const now = new Date().toISOString();
  const rawItems = toArray(channel.item).filter(isRecord);
  const feed: Feed = {
    id: feedId,
    title: readText(channel.title) ?? getHostnameLabel(feedUrl),
    url: feedUrl,
    siteUrl: getFirstValidUrl([readText(channel.link), new URL(feedUrl).origin]),
    description: readText(channel.description),
    createdAt: now,
    lastFetchedAt: now,
    articleCount: rawItems.length,
  };

  const articles = rawItems
    .map((item) => parseRssItem(item, feed))
    .filter((article): article is Article => article !== null);

  return {
    feed: {
      ...feed,
      articleCount: articles.length,
    },
    articles,
  };
}

function parseAtomFeed(atomFeed: XmlRecord, feedUrl: string): FeedFetchResult {
  const feedId = createStableId("feed", feedUrl);
  const now = new Date().toISOString();
  const rawEntries = toArray(atomFeed.entry).filter(isRecord);
  const feed: Feed = {
    id: feedId,
    title: readText(atomFeed.title) ?? getHostnameLabel(feedUrl),
    url: feedUrl,
    siteUrl: getAtomLink(atomFeed.link) ?? new URL(feedUrl).origin,
    description: readText(atomFeed.subtitle),
    createdAt: now,
    lastFetchedAt: now,
    articleCount: rawEntries.length,
  };

  const articles = rawEntries
    .map((entry) => parseAtomEntry(entry, feed))
    .filter((article): article is Article => article !== null);

  return {
    feed: {
      ...feed,
      articleCount: articles.length,
    },
    articles,
  };
}

function parseRssItem(item: XmlRecord, feed: Feed): Article | null {
  const link = getFirstValidUrl([
    readText(item.link),
    readText(item.guid),
    readText(item.comments),
  ]);

  if (!link) {
    return null;
  }

  const title = readText(item.title) ?? getHostnameLabel(link);
  const summarySource =
    readText(item.description) ??
    readText(item["content:encoded"]) ??
    readText(item["content"]);

  return {
    id: createStableId("article", `${feed.id}:${link}`),
    feedId: feed.id,
    feedTitle: feed.title,
    title,
    summary: createSummary(summarySource),
    link: normalizeUrl(link),
    publishedAt: normalizeDate(
      readText(item.pubDate) ?? readText(item.isoDate) ?? readText(item["dc:date"]),
    ),
    thumbnailUrl: getMediaThumbnail(item),
  };
}

function parseAtomEntry(entry: XmlRecord, feed: Feed): Article | null {
  const link = getAtomLink(entry.link);

  if (!link) {
    return null;
  }

  const title = readText(entry.title) ?? getHostnameLabel(link);
  const summarySource = readText(entry.summary) ?? readText(entry.content);

  return {
    id: createStableId("article", `${feed.id}:${link}`),
    feedId: feed.id,
    feedTitle: feed.title,
    title,
    summary: createSummary(summarySource),
    link: normalizeUrl(link),
    publishedAt: normalizeDate(
      readText(entry.published) ?? readText(entry.updated) ?? readText(entry.created),
    ),
  };
}

function createStableId(prefix: string, value: string): string {
  const digest = createHash("sha1").update(value).digest("hex").slice(0, 16);

  return `${prefix}-${digest}`;
}

function createSummary(value?: string): string {
  const plainText = stripHtml(value ?? "").replace(/\s+/g, " ").trim();

  if (plainText.length === 0) {
    return "概要はまだ取得できていません。";
  }

  return plainText.length > 140 ? `${plainText.slice(0, 140)}...` : plainText;
}

function normalizeDate(value?: string): string {
  if (!value) {
    return new Date().toISOString();
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return new Date().toISOString();
  }

  return new Date(timestamp).toISOString();
}

function getMediaThumbnail(item: XmlRecord): string | undefined {
  const thumbnail = item["media:thumbnail"];

  if (isRecord(thumbnail) && typeof thumbnail.url === "string") {
    return thumbnail.url;
  }

  if (Array.isArray(thumbnail)) {
    const match = thumbnail.find(
      (entry) => isRecord(entry) && typeof entry.url === "string",
    );

    if (isRecord(match) && typeof match.url === "string") {
      return match.url;
    }
  }

  return undefined;
}

function getAtomLink(value: unknown): string | undefined {
  for (const linkCandidate of toArray(value)) {
    if (typeof linkCandidate === "string" && isValidUrl(linkCandidate)) {
      return normalizeUrl(linkCandidate);
    }

    if (!isRecord(linkCandidate) || typeof linkCandidate.href !== "string") {
      continue;
    }

    const rel = typeof linkCandidate.rel === "string" ? linkCandidate.rel : "alternate";

    if (rel === "alternate" || rel === "self") {
      return normalizeUrl(linkCandidate.href);
    }
  }

  return undefined;
}

function getFirstValidUrl(candidates: Array<string | undefined>): string | undefined {
  for (const candidate of candidates) {
    if (candidate && isValidUrl(candidate)) {
      return normalizeUrl(candidate);
    }
  }

  return undefined;
}

function stripHtml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function readText(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const text = readText(item);

      if (text) {
        return text;
      }
    }
  }

  if (isRecord(value) && typeof value["#text"] === "string") {
    return value["#text"].trim();
  }

  return undefined;
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (typeof value === "undefined") {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function isRecord(value: unknown): value is XmlRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
