export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
        読み込み中...
      </div>
    </div>
  );
}
