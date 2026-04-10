"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyCommerce, type Commerce } from "@/lib/commercesApi";
import {
  MapPin, Clock, Tag, Store, ExternalLink,
  CheckCircle2, AlertTriangle, XCircle,
  Eye, Pencil, Calendar, BarChart2,
} from "lucide-react";

const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
function formatHeure(v: string) { return v ? v.slice(0, 5) : "--:--"; }
function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { icon: React.ElementType; label: string; cls: string }> = {
    Approuve:  { icon: CheckCircle2,  label: "Commerce validé",          cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
    EnAttente: { icon: AlertTriangle, label: "En attente de validation", cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
    Rejete:    { icon: XCircle,       label: "Commerce rejeté",          cls: "border-red-500/30 bg-red-500/10 text-red-300" },
  };
  const cfg = map[statut] ?? map["EnAttente"];
  const Icon = cfg.icon;
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${cfg.cls}`}>
      <Icon className="h-4 w-4" />{cfg.label}
    </div>
  );
}

function CommerceMap({ lat, lng, nom }: { lat: number; lng: number; nom: string }) {
  const delta = 0.006;
  const src  = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta},${lat - delta},${lng + delta},${lat + delta}&layer=mapnik&marker=${lat},${lng}`;
  const link = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10">
      <iframe src={src} title={`Carte de ${nom}`} className="h-56 w-full" loading="lazy" referrerPolicy="no-referrer" />
      <a href={link} target="_blank" rel="noopener noreferrer"
        className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-zinc-800">
        <ExternalLink className="h-3 w-3" />Voir sur OSM
      </a>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon className="h-4 w-4" /></div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

export default function CommercantDashboardPage() {
  const router = useRouter();
  const [commerce, setCommerce] = useState<Commerce | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true); setError(null);
        const data = await getMyCommerce();
        if (!mounted) return;
        if (!data) { router.replace("/commercant/create-commerce"); return; }
        setCommerce(data);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Erreur chargement.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [router]);

  const horairesTries = useMemo(
    () => [...(commerce?.horaires ?? [])].sort((a, b) => a.jourSemaine - b.jourSemaine),
    [commerce]
  );
  const joursOuverts = useMemo(() => horairesTries.filter((h) => !h.estFerme).length, [horairesTries]);
  const statut = commerce?.statut ?? "EnAttente";

  if (loading) return <div className="space-y-4">{[1,2,3].map(i=><div key={i} className="h-28 animate-pulse rounded-3xl bg-white/[0.04]"/>)}</div>;
  if (error) return <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">{error}</div>;
  if (!commerce) return null;

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.05] to-transparent p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-orange-400" />
              <h1 className="text-2xl font-black md:text-3xl">{commerce.nom}</h1>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {commerce.nomCategorie ?? "Catégorie non renseignée"} · Créé le {formatDate(commerce.dateCreation)}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <StatutBadge statut={statut} />
            <button type="button" onClick={() => router.push(`/commercant/edit/${commerce.id}`)}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20">
              <Pencil className="h-4 w-4" />Modifier
            </button>
          </div>
        </div>
        {statut === "EnAttente" && (
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
            Votre commerce est en cours d'examen. Vous recevrez un email dès qu'une décision sera prise (délai : 24h).
          </div>
        )}
        {statut === "Rejete" && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            <p className="font-semibold">Votre demande a été refusée.</p>
            {commerce.raisonRejet && <p className="mt-1 text-red-400/70">Raison : {commerce.raisonRejet}</p>}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Eye}       label="Vues (bientôt)" value="—"               color="bg-blue-500/15 text-blue-400" />
        <StatCard icon={Tag}       label="Tags culturels" value={commerce.tagsCulturels.length} color="bg-orange-500/15 text-orange-400" />
        <StatCard icon={Calendar}  label="Jours ouverts"  value={`${joursOuverts}/7`} color="bg-emerald-500/15 text-emerald-400" />
        <StatCard icon={BarChart2} label="Horaires"       value={horairesTries.length > 0 ? "OK" : "À faire"} color="bg-purple-500/15 text-purple-400" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        {/* Infos */}
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">Informations</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Catégorie</p>
              <p className="mt-2 font-medium text-white">{commerce.nomCategorie ?? "Non renseignée"}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600"><MapPin className="h-3 w-3" />Adresse</p>
              <p className="mt-2 font-medium text-white">{commerce.adresse}</p>
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Description</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-300">{commerce.description}</p>
          </div>
          <div className="mt-5">
            <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              <MapPin className="h-3 w-3 text-orange-400" />Localisation
            </p>
            <CommerceMap lat={commerce.latitude} lng={commerce.longitude} nom={commerce.nom} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Latitude</p>
                <p className="mt-1 font-mono text-sm text-orange-300">{commerce.latitude.toFixed(6)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Longitude</p>
                <p className="mt-1 font-mono text-sm text-orange-300">{commerce.longitude.toFixed(6)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Tag className="h-4 w-4 text-orange-400" /><h2 className="font-semibold">Tags culturels</h2></div>
            <button type="button" onClick={() => router.push(`/commercant/edit/${commerce.id}`)}
              className="text-xs font-medium text-orange-400 transition hover:text-orange-300">Gérer</button>
          </div>
          {commerce.tagsCulturels.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/[0.07] px-4 py-8 text-center text-sm text-zinc-500">Aucun tag</div>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2">
              {commerce.tagsCulturels.map(tag => (
                <span key={tag} className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Horaires */}
      <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-400" />
            <div><h2 className="font-semibold">Horaires d'ouverture</h2><p className="text-xs text-zinc-500">Visibles par les touristes</p></div>
          </div>
          <button type="button" onClick={() => router.push(`/commercant/horaires/${commerce.id}`)}
            className="inline-flex items-center gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20">
            <Clock className="h-4 w-4" />Gérer
          </button>
        </div>
        {horairesTries.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/[0.07] px-4 py-10 text-center text-sm text-zinc-500">Aucun horaire configuré</div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.07]">
            <div className="divide-y divide-white/[0.05]">
              {horairesTries.map(h => (
                <div key={h.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-white">{JOURS[h.jourSemaine] ?? `Jour ${h.jourSemaine}`}</span>
                  <span className={`text-sm font-semibold ${h.estFerme ? "text-red-400" : "text-emerald-300"}`}>
                    {h.estFerme ? "Fermé" : `${formatHeure(h.heureOuverture)} → ${formatHeure(h.heureFermeture)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
