export default function AdminTopbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06080d]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <div>
          <h1 className="text-lg font-black tracking-tight text-white">
            Interface administrateur
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gestion des demandes et supervision de la plateforme
          </p>
        </div>

        <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-400">
          Accès Admin
        </div>
      </div>
    </header>
  );
}