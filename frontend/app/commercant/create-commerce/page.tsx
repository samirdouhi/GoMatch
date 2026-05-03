"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCategories, getTagsCulturels } from "@/lib/businessApi";
import {
  createCommerce,
  addTagsToCommerce,
  uploadPhoto,
  createHoraire,
  type Commerce,
  type PhotoCommerce,
} from "@/lib/commercesApi";
import LocationPicker, { type LocationData } from "@/app/components/commercant/LocationPicker";
import {
  MapPin, CheckCircle2, ChevronDown, Camera, ImagePlus, Trash2,
  Loader2, Clock, ChevronRight, Upload, X, Store,
} from "lucide-react";

type Categorie   = { id: string; nom: string };
type TagCulturel = { id: string; nom: string };

const JOURS_LABELS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const ORDRE_JOURS  = [1, 2, 3, 4, 5, 6, 0];

type HoraireLocal = {
  jourSemaine: number;
  heureOuverture: string;
  heureFermeture: string;
  estFerme: boolean;
};

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-black transition-all ${
            i + 1 < step  ? "border-orange-500 bg-orange-500 text-white" :
            i + 1 === step ? "border-orange-400 bg-orange-400/20 text-orange-300" :
                             "border-white/20 bg-white/5 text-zinc-600"
          }`}>
            {i + 1 < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 transition-all ${i + 1 < step ? "bg-orange-500" : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Étape 1 : Informations de base ─────────────────────────────────────────────

function StepInfos({
  categories,
  tags,
  onDone,
}: {
  categories: Categorie[];
  tags: TagCulturel[];
  onDone: (commerce: Commerce, tagIds: string[]) => void;
}) {
  const [nom, setNom]               = useState("");
  const [description, setDescription] = useState("");
  const [adresse, setAdresse]       = useState("");
  const [location, setLocation]     = useState<LocationData | null>(null);
  const [categorieId, setCategorieId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  function toggleTag(id: string) {
    setSelectedTags((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nom.trim())          return setError("Le nom du commerce est obligatoire.");
    if (!description.trim())  return setError("La description est obligatoire.");
    if (!adresse.trim())      return setError("L'adresse est obligatoire.");
    if (!location)            return setError("Veuillez sélectionner la position sur la carte.");
    if (!categorieId)         return setError("Veuillez sélectionner une catégorie.");

    try {
      setSaving(true);
      const commerce = await createCommerce({
        nom: nom.trim(), description: description.trim(), adresse: adresse.trim(),
        latitude: location.lat, longitude: location.lng, categorieId,
      });
      if (selectedTags.length > 0) await addTagsToCommerce(commerce.id, selectedTags);
      onDone(commerce, selectedTags);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création.";
      setError(msg.toLowerCase().includes("email") ? "Session expirée. Déconnectez-vous et reconnectez-vous." : msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-200">Nom du commerce</label>
          <input type="text" value={nom} onChange={(e) => setNom(e.target.value)}
            placeholder="Ex: Café Rabat Médina" disabled={saving}
            className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-500 hover:border-orange-400/40 focus:border-orange-400/70 focus:ring-4 focus:ring-orange-400/10 disabled:opacity-60"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-200">Catégorie</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <div className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.9)]" />
            </div>
            <select value={categorieId} onChange={(e) => setCategorieId(e.target.value)} disabled={saving}
              className="w-full appearance-none rounded-2xl border border-white/10 bg-zinc-900/80 py-3.5 pl-10 pr-12 text-sm text-white outline-none transition hover:border-orange-400/40 focus:border-orange-400/70 focus:ring-4 focus:ring-orange-400/10 disabled:opacity-60 [&>option]:bg-zinc-950">
              <option value="">Sélectionner une catégorie</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} disabled={saving}
          placeholder="Décrivez votre commerce, son ambiance, ses produits..."
          className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 disabled:opacity-60"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-orange-400" />
          <h2 className="text-base font-semibold text-white">Localisation</h2>
        </div>
        <LocationPicker value={location} onChange={(d) => { setLocation(d); setAdresse(d.address); }} />
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Adresse affichée</label>
          <input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} disabled={saving}
            placeholder="Ex: Avenue Mohammed V, Rabat"
            className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 disabled:opacity-60"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">Tags culturels</h2>
        {tags.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-zinc-400">Aucun tag disponible.</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => {
              const sel = selectedTags.includes(tag.id);
              return (
                <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${sel ? "border-orange-400/50 bg-orange-400/15 text-orange-300" : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"}`}>
                  {tag.nom}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button type="submit" disabled={saving}
        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-60">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Création en cours…</> : <>Créer mon commerce <ChevronRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}

// ── Étape 2 : Photos ────────────────────────────────────────────────────────────

function StepPhotos({
  commerceId,
  onContinue,
}: {
  commerceId: string;
  onContinue: () => void;
}) {
  const inputRef              = useRef<HTMLInputElement>(null);
  const [photos, setPhotos]   = useState<PhotoCommerce[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    if (photos.length + arr.length > 10) {
      setError("Maximum 10 photos autorisées.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      for (const file of arr) {
        if (file.size > 10 * 1024 * 1024) { setError(`${file.name} dépasse 10 Mo.`); continue; }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          setError(`${file.name} : format non supporté (jpg/png/webp).`); continue;
        }
        const photo = await uploadPhoto(commerceId, file);
        setPhotos((p) => [...p, photo]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur upload.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [commerceId, photos.length]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    void uploadFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Camera className="mx-auto h-10 w-10 text-orange-400" />
        <h2 className="mt-3 text-xl font-bold text-white">Photos de votre commerce</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Ajoutez jusqu'à 10 photos · jpg / png / webp · 10 Mo max chacune
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <X className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
          dragging
            ? "border-orange-400/70 bg-orange-400/5"
            : "border-white/10 bg-white/[0.02] hover:border-orange-400/30 hover:bg-white/[0.04]"
        }`}
      >
        {uploading ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-400" />
        ) : (
          <>
            <Upload className="mx-auto h-8 w-8 text-zinc-600" />
            <p className="mt-3 text-sm font-medium text-zinc-300">
              Glissez-déposez vos photos ici
            </p>
            <p className="mt-1 text-xs text-zinc-600">ou cliquez pour sélectionner</p>
          </>
        )}
      </div>

      <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp"
        className="hidden" onChange={(e) => e.target.files && void uploadFiles(e.target.files)} />

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${process.env.NEXT_PUBLIC_GATEWAY_BASE_URL || "http://localhost:5006"}/business${photo.urlImage}`}
                alt={photo.nomFichier} className="h-full w-full object-cover transition group-hover:scale-105"
              />
              {idx === 0 && (
                <span className="absolute bottom-2 left-2 rounded-lg bg-orange-500/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">Principale</span>
              )}
            </div>
          ))}

          {photos.length < 10 && (
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 text-zinc-600 transition hover:border-orange-400/30 hover:text-zinc-400 disabled:opacity-40">
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs">Ajouter</span>
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onContinue} disabled={uploading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-60">
          Continuer <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={onContinue} disabled={uploading}
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-400 transition hover:text-zinc-200 disabled:opacity-40">
          Passer cette étape
        </button>
      </div>
    </div>
  );
}

// ── Étape 3 : Horaires ──────────────────────────────────────────────────────────

function StepHoraires({
  commerceId,
  onDone,
}: {
  commerceId: string;
  onDone: () => void;
}) {
  const [horaires, setHoraires] = useState<HoraireLocal[]>(
    ORDRE_JOURS.map((j) => ({
      jourSemaine: j,
      heureOuverture: "09:00",
      heureFermeture: "18:00",
      estFerme: j === 0,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function updateHoraire(idx: number, patch: Partial<HoraireLocal>) {
    setHoraires((prev) => prev.map((h, i) => (i === idx ? { ...h, ...patch } : h)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await Promise.all(
        horaires.map((h) =>
          createHoraire(commerceId, {
            jourSemaine: h.jourSemaine,
            heureOuverture: h.heureOuverture + ":00",
            heureFermeture: h.heureFermeture + ":00",
            estFerme: h.estFerme,
          })
        )
      );
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur enregistrement horaires.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Clock className="mx-auto h-10 w-10 text-orange-400" />
        <h2 className="mt-3 text-xl font-bold text-white">Horaires d'ouverture</h2>
        <p className="mt-2 text-sm text-zinc-400">Configurez vos horaires. Dimanche fermé par défaut.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
        {horaires.map((h, idx) => (
          <div key={h.jourSemaine}
            className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 ${idx > 0 ? "border-t border-white/[0.05]" : ""}`}>
            <span className="w-28 shrink-0 font-semibold text-white">
              {JOURS_LABELS[h.jourSemaine]}
            </span>

            <button type="button" onClick={() => updateHoraire(idx, { estFerme: !h.estFerme })}
              className={`inline-flex w-fit items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                h.estFerme
                  ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              }`}>
              {h.estFerme ? "Fermé" : "Ouvert"}
            </button>

            {!h.estFerme && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-500">De</label>
                  <input type="time" value={h.heureOuverture}
                    onChange={(e) => updateHoraire(idx, { heureOuverture: e.target.value })}
                    className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-sm text-white outline-none focus:border-orange-400/50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-500">À</label>
                  <input type="time" value={h.heureFermeture}
                    onChange={(e) => updateHoraire(idx, { heureFermeture: e.target.value })}
                    className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-sm text-white outline-none focus:border-orange-400/50"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={handleSave} disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-60">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Enregistrement…</> : <><CheckCircle2 className="h-4 w-4" />Terminer</>}
        </button>
        <button type="button" onClick={onDone} disabled={saving}
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-400 transition hover:text-zinc-200 disabled:opacity-40">
          Passer cette étape
        </button>
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────────────────────────────────────

export default function CreateCommercePage() {
  const router = useRouter();

  const [step, setStep]             = useState<1 | 2 | 3>(1);
  const [commerce, setCommerce]     = useState<Commerce | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [tags, setTags]             = useState<TagCulturel[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [cats, tgs] = await Promise.all([getCategories(), getTagsCulturels()]);
        if (!mounted) return;
        setCategories(cats as Categorie[]);
        setTags(tgs as TagCulturel[]);
      } finally {
        if (mounted) setLoadingData(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  const STEP_LABELS = ["Informations", "Photos", "Horaires"];

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-orange-400" />
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-400/80">Espace commerçant</p>
            </div>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Créer mon commerce</h1>
            <p className="mt-1 text-sm text-zinc-400">Étape {step} sur 3 — {STEP_LABELS[step - 1]}</p>
          </div>
          <StepIndicator step={step} total={3} />
        </div>
      </div>

      {/* Card contenu */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
        {loadingData ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 animate-pulse rounded-2xl bg-white/5" />)}
          </div>
        ) : step === 1 ? (
          <StepInfos
            categories={categories}
            tags={tags}
            onDone={(c) => { setCommerce(c); setStep(2); }}
          />
        ) : step === 2 && commerce ? (
          <StepPhotos commerceId={commerce.id} onContinue={() => setStep(3)} />
        ) : step === 3 && commerce ? (
          <StepHoraires
            commerceId={commerce.id}
            onDone={() => { router.push("/commercant"); router.refresh(); }}
          />
        ) : null}
      </div>
    </div>
  );
}
