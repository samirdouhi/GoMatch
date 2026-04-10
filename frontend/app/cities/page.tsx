export default function CitiesPage() {
  return (
    <main className="pt-28">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-black">Cities</h1>
        <p className="mt-3 text-muted-foreground">
          Choisis une ville pour démarrer (Rabat en priorité).
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["Rabat", "Casablanca", "Marrakech", "Tanger", "Fès"].map((city) => (
            <a
              key={city}
              href="#"
              className="glass rounded-2xl p-6 hover:shadow-md transition"
            >
              <div className="text-lg font-black">{city}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Découvrir commerces, culture et parcours.
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
