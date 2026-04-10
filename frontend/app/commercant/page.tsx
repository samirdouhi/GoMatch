"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyCommerce, type Commerce } from "@/lib/commercesApi";

const jours = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

function formatHeure(valeur: string) {
  if (!valeur) return "--:--";
  return valeur.slice(0, 5);
}

function formatDate(dateIso: string) {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return dateIso;

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function CommercantDashboardPage() {
  const router = useRouter();

  const [commerce, setCommerce] = useState<Commerce | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadCommerce() {
      try {
        setLoading(true);
        setError(null);

        const data = await getMyCommerce();

        if (!mounted) return;

        if (!data) {
          router.replace("/commercant/create-commerce");
          return;
        }

        setCommerce(data);
      } catch (err: unknown) {
        console.error(err);

        if (!mounted) return;

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Erreur lors du chargement du commerce.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCommerce();

    return () => {
      mounted = false;
    };
  }, [router]);

  const horairesTries = useMemo(() => {
    if (!commerce?.horaires) return [];
    return [...commerce.horaires].sort((a, b) => a.jourSemaine - b.jourSemaine);
  }, [commerce]);

  return (
    <div className="space-y-8 text-white">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
              Espace commerçant
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Mon commerce
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400 md:text-base">
              Consultez les informations de votre commerce, ses tags culturels
              et ses horaires.
            </p>
          </div>

          {!loading && commerce && (
            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
                commerce.estValide
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {commerce.estValide ? "Commerce validé" : "En attente de validation"}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-28 animate-pulse rounded-3xl bg-white/[0.04]" />
          <div className="h-52 animate-pulse rounded-3xl bg-white/[0.04]" />
          <div className="h-64 animate-pulse rounded-3xl bg-white/[0.04]" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      ) : !commerce ? null : (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{commerce.nom}</h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Créé le {formatDate(commerce.dateCreation)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/commercant/edit/${commerce.id}`)}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
                >
                  Modifier
                </button>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Catégorie
                  </p>
                  <p className="mt-2 text-base font-medium text-white">
                    {commerce.nomCategorie || "Non renseignée"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Adresse
                  </p>
                  <p className="mt-2 text-base font-medium text-white">
                    {commerce.adresse}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Latitude
                  </p>
                  <p className="mt-2 text-base font-medium text-white">
                    {commerce.latitude}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Longitude
                  </p>
                  <p className="mt-2 text-base font-medium text-white">
                    {commerce.longitude}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Description
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-200">
                  {commerce.description}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Tags culturels</h2>

                <button
                  type="button"
                  onClick={() => router.push(`/commercant/edit/${commerce.id}`)}
                  className="text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
                >
                  Gérer
                </button>
              </div>

              {commerce.tagsCulturels.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-400">
                  Aucun tag culturel associé pour le moment.
                </div>
              ) : (
                <div className="mt-5 flex flex-wrap gap-3">
                  {commerce.tagsCulturels.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Horaires</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Consultez et mettez à jour les horaires d’ouverture de votre commerce.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/commercant/horaires/${commerce.id}`)}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Gérer les horaires
              </button>
            </div>

            {horairesTries.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-10 text-center text-sm text-zinc-400">
                Aucun horaire enregistré.
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                <div className="divide-y divide-white/10">
                  {horairesTries.map((horaire) => (
                    <div
                      key={horaire.id}
                      className="flex flex-col gap-2 bg-zinc-900/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="font-medium text-white">
                        {jours[horaire.jourSemaine] ?? `Jour ${horaire.jourSemaine}`}
                      </div>

                      <div className="text-sm text-zinc-300">
                        {horaire.estFerme
                          ? "Fermé"
                          : `${formatHeure(horaire.heureOuverture)} → ${formatHeure(
                              horaire.heureFermeture
                            )}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}