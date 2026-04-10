export default function CommercantTopbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06080d]/80 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between px-6 lg:px-10">
        <div>
          <h1 className="text-lg font-black tracking-tight text-white">
            Espace commerçant
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gérez votre commerce et vos informations
          </p>
        </div>

        <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-400">
          Accès Commerçant
        </div>
      </div>
    </header>
  );
}
