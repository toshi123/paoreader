import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
