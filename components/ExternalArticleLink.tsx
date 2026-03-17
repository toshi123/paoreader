import Link from "next/link";

type ExternalArticleLinkProps = {
  href: string;
  label?: string;
  variant?: "subtle" | "primary";
  onClick?: () => void;
};

export function ExternalArticleLink({
  href,
  label = "元記事を開く",
  variant = "subtle",
  onClick,
}: ExternalArticleLinkProps) {
  const className =
    variant === "primary"
      ? "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      : "inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50";

  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      aria-label={`${label}（外部リンク）`}
      onClick={onClick}
    >
      {label} ↗
    </Link>
  );
}
