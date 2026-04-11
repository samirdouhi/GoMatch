"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyCommerce, type Commerce } from "@/lib/commercesApi";
import {
  MapPin,
  Clock,
  Tag,
  Store,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileWarning,
} from "lucide-react";

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

function CommerceMap({
  lat,
  lng,
  nom,
}: {
  lat: number;
  lng: number;
  nom: string;
}) {
  const delta = 0.006;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta},${lat - delta},${lng + delta},${lat + delta}&layer=mapnik&marker=${lat},${lng}`;
  const link = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10">
      <iframe
        src={src}
        title={`Carte de ${nom}`}
        className="h-56 w-full"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-zinc-800"
      >
        <ExternalLink className="h-3 w-3" />
        Voir sur OSM
      </a>
    </div>
  );
}

function StatusBanner({ commerce }: { commerce: Commerce }) {
  if (commerce.statut === "Approuve") {
    return (
      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
              Statut du commerce
            </p>
            <h2 className="mt-1 text-xl font-bold text-emerald-200">
              Commerce approuvé
            </h2>
            <p className="mt-2 text-sm leading-6 text-emerald-100/90">
              Votre commerce a été validé par l’équipe GoMatch. Il peut
              maintenant être affiché et exploité dans la plateforme.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (commerce.statut === "Rejete") {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/15">
            <XCircle className="h-5 w-5 text-red-300" />
          </div>

          <div className="w-full">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300/80">
              Statut du commerce
            </p>
            <h2 className="mt-1 text-xl font-bold text-red-200">
              Commerce rejeté
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-100/90">
              Votre demande d’ajout de commerce a été rejetée. Corrigez les
              informations demandées puis renvoyez votre fiche.
            </p>

            <div className="mt-4 rounded-2xl border border-red-500/20 bg-black/20 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-300/80">
                <FileWarning className="h-3.5 w-3.5" />
                Raison du rejet
              </p>
              <p className="mt-2 text-sm text-red-100">
                {commerce.raisonRejet?.trim()
                  ? commerce.raisonRejet
                  : "Aucune raison n’a été fournie par l’administrateur."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15">
          <AlertTriangle className="h-5 w-5 text-amber-300" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
            Statut du commerce
          </p>
          <h2 className="mt-1 text-xl font-bold text-amber-200">
            Commerce en attente de validation
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-100/90">
            Votre commerce a bien été soumis. Il est actuellement en cours de
            vérification par l’équipe GoMatch. Vous recevrez une réponse dès que
            la demande sera traitée.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ commerce }: { commerce: Commerce }) {
  if (commerce.statut === "Approuve") {
    return (
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
        <span className="h-2 w-2 rounded-full bg-current" />
        Commerce validé
      </div>
    );
  }

  if (commerce.statut === "Rejete") {
    return (
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300">
        <span className="h-2 w-2 rounded-full bg-current" />
        Commerce rejeté
      </div>
    );
  }

  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300">
      <span className="h-2 w-2 rounded-full bg-current" />
      En attente de validation
    </div>
  );
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
        if (!mounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du commerce."
        );
      } finally {
        if (mounted) setLoading(false);
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-400/80">
              Espace commerçant
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Mon commerce
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400 md:text-base">
              Consultez et gérez les informations de votre commerce, sa
              localisation, ses tags culturels et ses horaires.
            </p>
          </div>

          {!loading && commerce && <StatusChip commerce={commerce} />}
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
          <StatusBanner commerce={commerce} />

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-orange-400" />
                    <h2 className="text-2xl font-bold">{commerce.nom}</h2>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">
                    Créé le {formatDate(commerce.dateCreation)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/commercant/edit/${commerce.id}`)}
                  className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20"
                >
                  {commerce.statut === "Rejete" ? "Corriger" : "Modifier"}
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Catégorie
                  </p>
                  <p className="mt-2 text-base font-medium text-white">
                    {commerce.nomCategorie ?? "Non renseignée"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    <MapPin className="h-3 w-3" />
                    Adresse
                  </p>
                  <p className="mt-2 text-base font-medium text-white">
                    {commerce.adresse}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Description
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-200">
                  {commerce.description}
                </p>
              </div>

              <div className="mt-6">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  <MapPin className="h-3 w-3 text-orange-400" />
                  Localisation sur la carte
                </p>
                <CommerceMap
                  lat={commerce.latitude}
                  lng={commerce.longitude}
                  nom={commerce.nom}
                />
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Latitude
                    </p>
                    <p className="mt-1 font-mono text-sm text-orange-300">
                      {commerce.latitude.toFixed(6)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Longitude
                    </p>
                    <p className="mt-1 font-mono text-sm text-orange-300">
                      {commerce.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-orange-400" />
                  <h2 className="text-xl font-semibold">Tags culturels</h2>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/commercant/edit/${commerce.id}`)}
                  className="text-sm font-medium text-orange-300 transition hover:text-orange-200"
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
                      className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300"
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
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-400" />
                <div>
                  <h2 className="text-xl font-semibold">Horaires</h2>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    Horaires d’ouverture de votre commerce
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/commercant/horaires/${commerce.id}`)}
                className="inline-flex items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20"
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
                <div className="divide-y divide-white/[0.06]">
                  {horairesTries.map((horaire) => (
                    <div
                      key={horaire.id}
                      className="flex flex-col gap-2 px-5 py-4 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="font-medium text-white">
                        {jours[horaire.jourSemaine] ??
                          `Jour ${horaire.jourSemaine}`}
                      </span>

                      <span
                        className={`text-sm font-semibold ${
                          horaire.estFerme
                            ? "text-red-400"
                            : "text-emerald-300"
                        }`}
                      >
                        {horaire.estFerme
                          ? "Fermé"
                          : `${formatHeure(horaire.heureOuverture)} → ${formatHeure(horaire.heureFermeture)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {commerce.statut === "Rejete" && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push(`/commercant/edit/${commerce.id}`)}
                className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-500"
              >
                Corriger mon commerce
              </button>

              <button
                type="button"
                onClick={() => router.refresh()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-zinc-200 transition hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}