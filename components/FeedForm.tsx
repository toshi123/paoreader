"use client";

import { useState } from "react";

import type { FeedCandidate } from "@/lib/types";

type FeedFormProps = {
  onSubmit: (
    url: string,
  ) => Promise<
    | { ok: true }
    | { ok: false; message: string }
    | { ok: false; requiresSelection: true; candidates: FeedCandidate[]; siteUrl: string }
  >;
};

export function FeedForm({ onSubmit }: FeedFormProps) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candidateSiteUrl, setCandidateSiteUrl] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<FeedCandidate[]>([]);
  const [selectedCandidateUrl, setSelectedCandidateUrl] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await onSubmit(url.trim());

      if (!result.ok && "requiresSelection" in result) {
        setCandidateSiteUrl(result.siteUrl);
        setCandidates(result.candidates);
        setSelectedCandidateUrl(result.candidates[0]?.url ?? null);
        setMessage("複数のフィードが見つかりました。登録したいものを選んでください。");
        return;
      }

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setUrl("");
      setCandidateSiteUrl(null);
      setCandidates([]);
      setSelectedCandidateUrl(null);
      setMessage("フィードを追加しました。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSelectCandidate() {
    if (!selectedCandidateUrl) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await onSubmit(selectedCandidateUrl);

      if (!result.ok && "requiresSelection" in result) {
        setCandidateSiteUrl(result.siteUrl);
        setCandidates(result.candidates);
        setSelectedCandidateUrl(result.candidates[0]?.url ?? null);
        setMessage("複数のフィード候補があるため、もう一度選択してください。");
        return;
      }

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setUrl("");
      setCandidateSiteUrl(null);
      setCandidates([]);
      setSelectedCandidateUrl(null);
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
          サイト URL または RSS / Atom URL
        </label>
        <input
          id="feed-url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <p className="text-xs leading-5 text-slate-500">
        ホームページ URL を入れると、HTML のメタデータから RSS / Atom を自動検出します。
      </p>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
      >
        {isSubmitting ? "追加中..." : "フィードを追加"}
      </button>
      {candidates.length > 0 && candidateSiteUrl ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">
              複数のフィード候補が見つかりました
            </p>
            <p className="break-all text-xs leading-5 text-slate-500">{candidateSiteUrl}</p>
          </div>
          <div className="space-y-2">
            {candidates.map((candidate) => (
              <label
                key={candidate.url}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3"
              >
                <input
                  type="radio"
                  name="feed-candidate"
                  value={candidate.url}
                  checked={selectedCandidateUrl === candidate.url}
                  onChange={() => setSelectedCandidateUrl(candidate.url)}
                  className="mt-1"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-slate-900">
                    {candidate.title}
                  </span>
                  <span className="block break-all text-xs text-slate-500">
                    {candidate.url}
                  </span>
                  <span className="block text-xs text-slate-400">{candidate.type}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isSubmitting || !selectedCandidateUrl}
              onClick={handleSelectCandidate}
              className="flex-1 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              このフィードを登録
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setCandidateSiteUrl(null);
                setCandidates([]);
                setSelectedCandidateUrl(null);
                setMessage(null);
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              閉じる
            </button>
          </div>
        </div>
      ) : null}
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
