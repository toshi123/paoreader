"use client";

import { useState } from "react";

type FeedFormProps = {
  onSubmit: (url: string) => Promise<{ ok: true } | { ok: false; message: string }>;
};

export function FeedForm({ onSubmit }: FeedFormProps) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await onSubmit(url.trim());

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setUrl("");
      setMessage("フィードを追加しました。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="space-y-1">
        <label htmlFor="feed-url" className="text-sm font-medium text-slate-800">
          RSS / Atom URL
        </label>
        <input
          id="feed-url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/feed.xml"
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
      >
        {isSubmitting ? "追加中..." : "フィードを追加"}
      </button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
