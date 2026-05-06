"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, Check, MapPin, Globe, Layers, X } from "lucide-react";
import {
  getAllContenusAdmin,
  getCategories,
  getTags,
  createContenu,
  updateContenu,
  deleteContenu,
  publierContenu,
  depublierContenu,
  ajouterMedia,
  supprimerMedia,
  type ContenuCulturel,
  type CategorieCulturelle,
  type TagCulturel,
  type CreerContenuDto,
  type ModifierContenuDto,
  type AjouterMediaDto,
} from "@/lib/cultureApi";

// Dynamic import for map picker (Leaflet requires client-side only)
const LocationPickerMap = dynamic(
  () => import("@/app/components/commercant/LocationPickerMap"),
  { ssr: false, loading: () => <MapPickerSkeleton /> }
);

function MapPickerSkeleton() {
  return (
    <div className="flex h-72 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/60">
      <div className="flex items-center gap-3 text-zinc-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        <span className="text-sm">Chargement de la carte…</span>
      </div>
    </div>
  );
}

const LANGUES = [
  { value: "fr", label: "Français" },
  { value: "ar", label: "Arabe" },
  { value: "en", label: "Anglais" },
  { value: "es", label: "Espagnol" },
  { value: "de", label: "Allemand" },
  { value: "it", label: "Italien" },
  { value: "zh", label: "Chinois" },
];

const MEDIA_TYPES = [
  { value: "Image", label: "Image" },
  { value: "Video", label: "Vidéo" },
  { value: "Lien", label: "Lien externe" },
];

const STATUT_STYLE: Record<string, string> = {
  Brouillon: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  Publié: "border-green-500/30 bg-green-500/10 text-green-300",
  Dépublié: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
};

// ─── Custom Select ─────────────────────────────────────────────────────────────

function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Sélectionner",
  disabled = false,
  accentColor = "emerald",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  accentColor?: "emerald" | "blue";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;
  const accent = accentColor === "blue" ? "blue" : "emerald";
  const accentRing = accentColor === "blue" ? "ring-blue-400/20 border-blue-400/60" : "ring-emerald-400/20 border-emerald-400/60";
  const accentItem = accentColor === "blue" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white";
  const accentText = accentColor === "blue" ? "text-blue-400" : "text-emerald-400";

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className={`flex w-full items-center justify-between rounded-2xl border bg-zinc-900/80 px-4 py-3 text-sm text-white outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
          open
            ? `${accentRing} ring-2`
            : "border-white/10 hover:border-white/20"
        }`}
      >
        <span className={value ? "text-white" : "text-zinc-500"}>{selectedLabel}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? `rotate-180 ${accentText}` : "text-zinc-500"}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-[0_16px_48px_rgba(0,0,0,0.7)]">
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                  o.value === value
                    ? accentItem
                    : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {o.label}
                {o.value === value && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const emptyForm = (): CreerContenuDto => ({
  titre: "",
  corps: "",
  resume: "",
  lieu: "",
  latitude: undefined,
  longitude: undefined,
  langueOriginale: "fr",
  categorieId: "",
  tagIds: [],
});

export default function AdminCulturePage() {
  const [contenus, setContenus] = useState<ContenuCulturel[]>([]);
  const [categories, setCategories] = useState<CategorieCulturelle[]>([]);
  const [tags, setTags] = useState<TagCulturel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreerContenuDto>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Location picker state
  const [locationValue, setLocationValue] = useState<{ lat: number; lng: number; address: string } | null>(null);

  // Media modal
  const [mediaContenuId, setMediaContenuId] = useState<string | null>(null);
  const [mediaForm, setMediaForm] = useState<AjouterMediaDto>({ url: "", type: "Image", legende: "", ordre: 0 });
  const [savingMedia, setSavingMedia] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [c, cats, tgs] = await Promise.all([
        getAllContenusAdmin(),
        getCategories(),
        getTags(),
      ]);
      setContenus(c);
      setCategories(cats);
      setTags(tgs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
    setFormError(null);
    setLocationValue(null);
    setShowMapPicker(false);
  }

  function startEdit(c: ContenuCulturel) {
    setEditingId(c.id);
    const lat = c.latitude ?? undefined;
    const lng = c.longitude ?? undefined;
    setForm({
      titre: c.titre,
      corps: c.corps,
      resume: c.resume ?? "",
      lieu: c.lieu ?? "",
      latitude: lat,
      longitude: lng,
      langueOriginale: c.langueOriginale,
      categorieId: c.categorieId,
      tagIds: [],
    });
    if (lat !== undefined && lng !== undefined) {
      setLocationValue({ lat, lng, address: c.lieu ?? "" });
    } else {
      setLocationValue(null);
    }
    setFormError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleTag(id: string) {
    setForm(f => ({
      ...f,
      tagIds: f.tagIds.includes(id) ? f.tagIds.filter(t => t !== id) : [...f.tagIds, id],
    }));
  }

  function handleLocationChange(data: { lat: number; lng: number; address: string }) {
    setLocationValue(data);
    setForm(f => ({
      ...f,
      latitude: data.lat,
      longitude: data.lng,
      lieu: f.lieu || data.address.split(",")[0]?.trim() || f.lieu,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titre.trim() || !form.corps.trim() || !form.categorieId) {
      setFormError("Titre, corps et catégorie sont obligatoires.");
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      const payload = {
        ...form,
        resume: form.resume?.trim() || undefined,
        lieu: form.lieu?.trim() || undefined,
      };
      if (editingId) {
        const dto: ModifierContenuDto = {
          titre: payload.titre,
          corps: payload.corps,
          resume: payload.resume,
          lieu: payload.lieu,
          latitude: payload.latitude,
          longitude: payload.longitude,
          categorieId: payload.categorieId,
          tagIds: payload.tagIds,
        };
        await updateContenu(editingId, dto);
      } else {
        await createContenu(payload);
      }
      resetForm();
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erreur enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce contenu culturel définitivement ?")) return;
    try {
      await deleteContenu(id);
      if (editingId === id) resetForm();
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur suppression");
    }
  }

  async function handlePublier(c: ContenuCulturel) {
    try {
      if (c.statut === "Publié") await depublierContenu(c.id);
      else await publierContenu(c.id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function handleAjouterMedia(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaContenuId || !mediaForm.url.trim()) return;
    try {
      setSavingMedia(true);
      await ajouterMedia(mediaContenuId, { ...mediaForm, legende: mediaForm.legende?.trim() || undefined });
      setMediaForm({ url: "", type: "Image", legende: "", ordre: 0 });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur ajout média");
    } finally {
      setSavingMedia(false);
    }
  }

  async function handleSupprimerMedia(contenuId: string, mediaId: string) {
    if (!confirm("Supprimer ce média ?")) return;
    try {
      await supprimerMedia(contenuId, mediaId);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur suppression média");
    }
  }

  const totalPublies = contenus.filter(c => c.statut === "Publié").length;
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.nom }));

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
              Administration CultureService
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Contenus culturels</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Créez, modifiez, publiez et gérez les articles culturels affichés aux visiteurs.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300 text-center">
              <span className="block text-xl font-bold text-white">{contenus.length}</span>
              au total
            </div>
            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-zinc-300 text-center">
              <span className="block text-xl font-bold text-green-300">{totalPublies}</span>
              publiés
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[480px_minmax(0,1fr)]">
        {/* ── Form panel ── */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              {editingId ? "Modifier le contenu" : "Nouveau contenu"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {editingId
                ? "Mettez à jour les informations du contenu sélectionné."
                : "Remplissez les champs pour créer un nouvel article culturel."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Titre */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Titre *</label>
              <input
                value={form.titre}
                onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                placeholder="Ex: Les traditions du Ramadan…"
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                disabled={saving}
              />
            </div>

            {/* Langue + Catégorie */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                  <Globe className="h-3.5 w-3.5 text-zinc-400" />
                  Langue originale
                </label>
                <CustomSelect
                  value={form.langueOriginale}
                  options={LANGUES}
                  onChange={v => setForm(f => ({ ...f, langueOriginale: v }))}
                  disabled={saving || !!editingId}
                  accentColor="blue"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                  <Layers className="h-3.5 w-3.5 text-zinc-400" />
                  Catégorie *
                </label>
                <CustomSelect
                  value={form.categorieId}
                  options={[{ value: "", label: "— Choisir une catégorie —" }, ...categoryOptions]}
                  onChange={v => setForm(f => ({ ...f, categorieId: v }))}
                  placeholder="— Choisir une catégorie —"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Corps */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Corps de l&apos;article *</label>
              <textarea
                rows={6}
                value={form.corps}
                onChange={e => setForm(f => ({ ...f, corps: e.target.value }))}
                placeholder="Contenu principal de l'article culturel…"
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 resize-y"
                disabled={saving}
              />
            </div>

            {/* Résumé */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Résumé</label>
              <textarea
                rows={2}
                value={form.resume ?? ""}
                onChange={e => setForm(f => ({ ...f, resume: e.target.value }))}
                placeholder="Courte description affichée dans la liste…"
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 resize-none"
                disabled={saving}
              />
            </div>

            {/* Lieu */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Nom du lieu</label>
              <input
                value={form.lieu ?? ""}
                onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))}
                placeholder="Ex: Médina de Fès"
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                disabled={saving}
              />
            </div>

            {/* Localisation — carte interactive */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  Localisation sur la carte
                </label>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(p => !p)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    showMapPicker
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:border-emerald-400/30 hover:text-emerald-300"
                  }`}
                >
                  <MapPin className="h-3 w-3" />
                  {showMapPicker ? "Masquer la carte" : "Ouvrir la carte"}
                </button>
              </div>

              {/* Coordinates display */}
              {locationValue ? (
                <div className="mb-3 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-emerald-300">{locationValue.address || "Position sélectionnée"}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-emerald-400/60">
                      {locationValue.lat.toFixed(5)}, {locationValue.lng.toFixed(5)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLocationValue(null);
                      setForm(f => ({ ...f, latitude: undefined, longitude: undefined }));
                    }}
                    className="shrink-0 text-zinc-500 hover:text-zinc-300 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mb-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-center text-xs text-zinc-500">
                  Aucune position — ouvrez la carte pour en sélectionner une
                </div>
              )}

              {showMapPicker && (
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <LocationPickerMap value={locationValue} onChange={handleLocationChange} />
                </div>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Tags culturels</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        form.tagIds.includes(t.id)
                          ? "border-emerald-400/50 bg-emerald-400/20 text-emerald-300"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {t.nom}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Traitement…" : editingId ? "Enregistrer" : "Créer le contenu"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-zinc-200 transition hover:bg-white/10"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── List panel ── */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Tous les contenus</h2>
            <p className="mt-1 text-sm text-zinc-400">Brouillons, publiés et dépubliés.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
              ))}
            </div>
          ) : contenus.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-12 text-center">
              <p className="text-lg font-medium text-white">Aucun contenu</p>
              <p className="mt-2 text-sm text-zinc-400">Créez votre premier article culturel.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contenus.map(c => (
                <div
                  key={c.id}
                  className={`rounded-2xl border px-5 py-4 transition ${
                    editingId === c.id
                      ? "border-emerald-400/40 bg-emerald-400/10"
                      : "border-white/10 bg-zinc-900/60 hover:border-white/20"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUT_STYLE[c.statut] ?? "border-white/10 bg-white/5 text-zinc-400"}`}>
                          {c.statut}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">
                          {LANGUES.find(l => l.value === c.langueOriginale)?.label ?? c.langueOriginale.toUpperCase()}
                        </span>
                        {c.nomCategorie && (
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                            {c.nomCategorie}
                          </span>
                        )}
                        {c.latitude != null && (
                          <span className="flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300">
                            <MapPin className="h-2.5 w-2.5" />
                            Géolocalisé
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-white truncate">{c.titre}</p>
                      {c.resume && (
                        <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{c.resume}</p>
                      )}
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {new Date(c.dateCreation).toLocaleDateString("fr-FR")}
                        {c.lieu && ` · ${c.lieu}`}
                        {c.medias.length > 0 && ` · ${c.medias.length} média${c.medias.length > 1 ? "s" : ""}`}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(c)}
                        className="rounded-xl px-3 py-1.5 text-xs font-medium text-amber-300 transition hover:bg-amber-400/10"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handlePublier(c)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                          c.statut === "Publié"
                            ? "text-zinc-400 hover:bg-zinc-500/10 hover:text-zinc-300"
                            : "text-green-400 hover:bg-green-500/10 hover:text-green-300"
                        }`}
                      >
                        {c.statut === "Publié" ? "Dépublier" : "Publier"}
                      </button>
                      <button
                        onClick={() => setMediaContenuId(mediaContenuId === c.id ? null : c.id)}
                        className="rounded-xl px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/10 hover:text-blue-300"
                      >
                        Médias
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="rounded-xl px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {/* Media panel */}
                  {mediaContenuId === c.id && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="mb-3 text-sm font-semibold text-zinc-300">Médias ({c.medias.length})</p>

                      {c.medias.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {c.medias.map(m => (
                            <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                              <div className="min-w-0">
                                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300 mr-2">{m.type}</span>
                                <span className="text-xs text-zinc-300 truncate">{m.url}</span>
                                {m.legende && <span className="ml-2 text-[11px] text-zinc-500">— {m.legende}</span>}
                              </div>
                              <button
                                onClick={() => handleSupprimerMedia(c.id, m.id)}
                                className="shrink-0 text-[11px] font-medium text-red-400 hover:text-red-300"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <form onSubmit={handleAjouterMedia} className="flex flex-wrap gap-2">
                        <input
                          value={mediaForm.url}
                          onChange={e => setMediaForm(f => ({ ...f, url: e.target.value }))}
                          placeholder="URL du média"
                          className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/20"
                        />
                        <div className="w-36">
                          <CustomSelect
                            value={mediaForm.type}
                            options={MEDIA_TYPES}
                            onChange={v => setMediaForm(f => ({ ...f, type: v as "Image" | "Video" | "Lien" }))}
                            accentColor="blue"
                          />
                        </div>
                        <input
                          value={mediaForm.legende ?? ""}
                          onChange={e => setMediaForm(f => ({ ...f, legende: e.target.value }))}
                          placeholder="Légende (optionnel)"
                          className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/20"
                        />
                        <button
                          type="submit"
                          disabled={savingMedia}
                          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                        >
                          {savingMedia ? "…" : "Ajouter"}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
