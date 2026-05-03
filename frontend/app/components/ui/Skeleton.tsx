export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-[#0f1115]">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="space-y-3 p-6">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="mt-4 h-12 w-full" />
      </div>
    </div>
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`} />
      ))}
    </div>
  );
}

export function AvatarSkeleton({ size = 10 }: { size?: number }) {
  return (
    <div
      className="animate-pulse rounded-full bg-white/5"
      style={{ width: size * 4, height: size * 4 }}
    />
  );
}

export function PageLoadingState({ message = "Chargement..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#ffbd13]/20" />
          <div className="relative h-12 w-12 animate-spin rounded-full border-2 border-[#ffbd13]/20 border-t-[#ffbd13]" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/30">{message}</p>
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-red-500/20 bg-red-500/5 p-12 text-center">
      <span className="text-4xl">⚠️</span>
      <p className="text-sm font-bold text-red-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-black text-red-400 transition hover:bg-red-500/20"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
