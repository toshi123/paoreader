import { createHash } from "node:crypto";

import { XMLParser } from "fast-xml-parser";

import { getHostnameLabel, isValidUrl, normalizeUrl } from "@/lib/url";
import type {
  Article,
  Feed,
  FeedCandidate,
  FeedFetchResponse,
  FeedFetchResult,
} from "@/lib/types";

type XmlRecord = Record<string, unknown>;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
  parseTagValue: true,
  htmlEntities: true,
  processEntities: {
    enabled: true,
    maxTotalExpansions: 100000,
  },
});

const FEED_ACCEPT_HEADER =
  "application/rss+xml,application/atom+xml,application/xml,text/xml;q=0.9,text/html;q=0.7,*/*;q=0.5";
const HTML_ACCEPT_HEADER =
  "text/html,application/xhtml+xml,application/xml;q=0.9,text/xml;q=0.8,*/*;q=0.5";

export class FeedFetchError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "FeedFetchError";
    this.status = status;
  }
}

export async function fetchFeed(url: string): Promise<FeedFetchResponse> {
  if (!isValidUrl(url)) {
    throw new FeedFetchError("有効な http / https URL を指定してください。", 400);
  }

  const normalizedUrl = normalizeUrl(url);
  const directDocument = await fetchDocument(normalizedUrl, FEED_ACCEPT_HEADER);
  const directFeedResult = parseFeedDocument(
    directDocument.body,
    normalizedUrl,
    normalizedUrl,
  );

  if (directFeedResult) {
    return directFeedResult;
  }

  const discoveryDocument = directDocument.contentType.includes("text/html")
    ? directDocument
    : await fetchDocument(normalizedUrl, HTML_ACCEPT_HEADER);
  const discoveredCandidates = discoverFeedCandidatesFromHtml(
    discoveryDocument.body,
    normalizedUrl,
  );

  if (discoveredCandidates.length === 0) {
    throw new FeedFetchError(
      "ページから RSS / Atom フィードを自動検出できませんでした。",
      422,
    );
  }

  if (discoveredCandidates.length > 1) {
    return {
      requiresSelection: true,
      siteUrl: normalizedUrl,
      candidates: discoveredCandidates,
    };
  }

  const [selectedCandidate] = discoveredCandidates;
  const discoveredFeedUrl = selectedCandidate.url;
  const feedDocument = await fetchDocument(discoveredFeedUrl, FEED_ACCEPT_HEADER);
  const discoveredFeedResult = parseFeedDocument(
    feedDocument.body,
    discoveredFeedUrl,
    normalizedUrl,
  );

  if (discoveredFeedResult) {
    return discoveredFeedResult;
  }

  throw new FeedFetchError("RSS / Atom の解析に失敗しました。", 422);
}

function parseRssFeed(
  channel: XmlRecord,
  feedUrl: string,
  siteUrlHint?: string,
): FeedFetchResult {
  const feedId = createStableId("feed", feedUrl);
  const now = new Date().toISOString();
  const rawItems = toArray(channel.item).filter(isRecord);
  const feed: Feed = {
    id: feedId,
    title: readText(channel.title) ?? getHostnameLabel(feedUrl),
    url: feedUrl,
    siteUrl: getFirstValidUrl([
      readText(channel.link),
      siteUrlHint,
      new URL(feedUrl).origin,
    ]),
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

function parseAtomFeed(
  atomFeed: XmlRecord,
  feedUrl: string,
  siteUrlHint?: string,
): FeedFetchResult {
  const feedId = createStableId("feed", feedUrl);
  const now = new Date().toISOString();
  const rawEntries = toArray(atomFeed.entry).filter(isRecord);
  const feed: Feed = {
    id: feedId,
    title: readText(atomFeed.title) ?? getHostnameLabel(feedUrl),
    url: feedUrl,
    siteUrl: getAtomLink(atomFeed.link) ?? siteUrlHint ?? new URL(feedUrl).origin,
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

function parseRdfFeed(
  rdfFeed: XmlRecord,
  feedUrl: string,
  siteUrlHint?: string,
): FeedFetchResult {
  const feedId = createStableId("feed", feedUrl);
  const now = new Date().toISOString();
  const channel = isRecord(rdfFeed.channel) ? rdfFeed.channel : {};
  const rawItems = toArray(rdfFeed.item).filter(isRecord);
  const feed: Feed = {
    id: feedId,
    title: readText(channel.title) ?? getHostnameLabel(feedUrl),
    url: feedUrl,
    siteUrl: getFirstValidUrl([
      readText(channel.link),
      siteUrlHint,
      new URL(feedUrl).origin,
    ]),
    description: readText(channel.description),
    createdAt: now,
    lastFetchedAt: now,
    articleCount: rawItems.length,
  };

  const articles = rawItems
    .map((item) => parseRdfItem(item, feed))
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
    hatenaBookmarkCount: null,
  };
}

function parseRdfItem(item: XmlRecord, feed: Feed): Article | null {
  const link = getFirstValidUrl([
    readText(item.link),
    readText(item["rdf:about"]),
  ]);

  if (!link) {
    return null;
  }

  const title = readText(item.title) ?? getHostnameLabel(link);
  const summarySource =
    readText(item.description) ??
    readText(item["content:encoded"]) ??
    readText(item["content"]);
  const publishedAt = normalizeDate(readText(item["dc:date"]));

  return {
    id: createStableId("article", `${feed.id}:${link}`),
    feedId: feed.id,
    feedTitle: feed.title,
    title,
    summary: createSummary(summarySource),
    link: normalizeUrl(link),
    publishedAt,
    thumbnailUrl: readText(item["hatena:imageurl"]),
    hatenaBookmarkCount: readNumber(item["hatena:bookmarkcount"]),
    hatenaCountFetchedAt: publishedAt,
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
    hatenaBookmarkCount: null,
  };
}

function parseFeedDocument(
  document: string,
  feedUrl: string,
  siteUrlHint?: string,
): FeedFetchResult | null {
  if (document.trim().length === 0) {
    throw new FeedFetchError("フィードの内容が空です。", 422);
  }

  const documentCandidates = [
    document,
    extractEmbeddedFeedXml(document),
  ].filter((candidate, index, candidates): candidate is string => {
    return typeof candidate === "string" && candidates.indexOf(candidate) === index;
  });

  for (const documentCandidate of documentCandidates) {
    let parsed: unknown;

    try {
      parsed = xmlParser.parse(documentCandidate);
    } catch {
      continue;
    }

    if (!isRecord(parsed)) {
      continue;
    }

    if (isRecord(parsed["rdf:RDF"])) {
      return parseRdfFeed(parsed["rdf:RDF"], feedUrl, siteUrlHint);
    }

    if (isRecord(parsed.rss) && isRecord(parsed.rss.channel)) {
      return parseRssFeed(parsed.rss.channel, feedUrl, siteUrlHint);
    }

    if (isRecord(parsed.feed)) {
      return parseAtomFeed(parsed.feed, feedUrl, siteUrlHint);
    }
  }

  return null;
}

function extractEmbeddedFeedXml(document: string): string | null {
  const feedRootPattern = /<\?xml[\s\S]*|<rdf:RDF\b[\s\S]*|<rss\b[\s\S]*|<feed\b[\s\S]*/i;
  const feedRootMatch = document.match(feedRootPattern);

  if (!feedRootMatch) {
    return null;
  }

  return feedRootMatch[0].trim();
}

async function fetchDocument(
  url: string,
  accept: string,
): Promise<{ body: string; contentType: string }> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: accept,
      },
      cache: "no-store",
    });
  } catch {
    throw new FeedFetchError("URL の取得に失敗しました。", 502);
  }

  if (!response.ok) {
    throw new FeedFetchError(
      `URL の取得に失敗しました。ステータス: ${response.status}`,
      502,
    );
  }

  return {
    body: await response.text(),
    contentType: response.headers.get("content-type")?.toLowerCase() ?? "",
  };
}

function discoverFeedCandidatesFromHtml(html: string, pageUrl: string): FeedCandidate[] {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  const candidates = new Map<string, FeedCandidate>();

  for (const linkTag of linkTags) {
    const candidate = parseFeedCandidate(linkTag, pageUrl);

    if (!candidate) {
      continue;
    }

    candidates.set(candidate.url, candidate);
  }

  return Array.from(candidates.values());
}

function parseFeedCandidate(linkTag: string, pageUrl: string): FeedCandidate | null {
  const attributes = parseHtmlAttributes(linkTag);
  const rel = attributes.rel?.toLowerCase() ?? "";
  const type = attributes.type?.toLowerCase() ?? "";
  const href = attributes.href;

  if (!href) {
    return null;
  }

  const isAlternate = rel.split(/\s+/).includes("alternate");
  const isFeedType = [
    "application/rss+xml",
    "application/atom+xml",
    "application/xml",
    "text/xml",
  ].includes(type);

  if (!isAlternate || !isFeedType) {
    return null;
  }

  try {
    const resolvedUrl = new URL(href, pageUrl).toString();

    if (!isValidUrl(resolvedUrl)) {
      return null;
    }

    const normalizedCandidateUrl = normalizeUrl(resolvedUrl);

    return {
      url: normalizedCandidateUrl,
      title:
        attributes.title?.trim() ||
        `${getHostnameLabel(pageUrl)} ${type.includes("atom") ? "Atom" : "RSS"}`,
      type,
    };
  } catch {
    return null;
  }
}

function parseHtmlAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attributePattern =
    /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;

  for (const match of tag.matchAll(attributePattern)) {
    const [, rawKey, doubleQuotedValue, singleQuotedValue, unquotedValue] = match;
    const value = doubleQuotedValue ?? singleQuotedValue ?? unquotedValue ?? "";

    attributes[rawKey.toLowerCase()] = value;
  }

  return attributes;
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

function readNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsedNumber = Number(value.trim());

    return Number.isNaN(parsedNumber) ? null : parsedNumber;
  }

  return null;
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
