export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeUrl(value: string): string {
  const url = new URL(value);

  url.hash = "";

  if (url.pathname.endsWith("/") && url.pathname !== "/") {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}

export function getHostnameLabel(value: string): string {
  return new URL(value).hostname.replace(/^www\./, "");
}

export function getHatenaEntryUrl(value: string): string {
  return `https://b.hatena.ne.jp/entry?url=${encodeURIComponent(
    normalizeUrl(value),
  )}`;
}
