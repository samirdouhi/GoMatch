"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCategories, getTagsCulturels } from "@/lib/businessApi";
import {
  createCommerce,
  addTagsToCommerce,
  uploadPhoto,
  deletePhoto,
  getPhotos,
  photoUrl,
  type Commerce,
  type PhotoCommerce,
} from "@/lib/commercesApi";
import LocationPicker, {
  type LocationData,
} from "@/app/components/commercant/LocationPicker";
import {
  MapPin,
  Camera,
  ImagePlus,
  Loader2,
  Trash2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

type Categorie = { id: string; nom: string };
type TagCulturel = { id: string; nom: string };

// ── Étape 2 : upload photos ───────────────────────────────────────────────────

function PhotoUploadStep({
  commerce,
  onFinish,
}: {
  commerce: Commerce;
  onFinish: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoCommerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getPhotos(commerce.id)
      .then((data) => { if (mounted) { setPhotos(data); setLoading(false); } })
      .catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [commerce.id]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 10 Mo).");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const photo = await uploadPhoto(commerce.id, file);
      setPhotos((prev) => [...prev, photo]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur upload.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(photoId: string) {
    try {
      await deletePhoto(commerce.id, photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur suppression.");
    }
  }

  return (
    <div className="space-y-8 text-white">
      {/* Succès */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-white">Commerce créé avec succès !</h1>
            <p className="mt-1 text-sm text-zinc-400">
              <span className="font-semibold text-white">{commerce.nom}</span> a été soumis pour validation.
            </p>
          </div>
        </div>
      </div>

      {/* Upload photos */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-orange-400" />
            <div>
              <h2 className="font-semibold text-white">Ajouter des photos</h2>
              <p className="text-xs text-zinc-500">
                Optionnel · Max 10 photos · jpg / png / webp · 10 Mo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || photos.length >= 10}
            className="inline-flex items-center gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {uploading ? "Upload…" : "Ajouter"}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[1, 2].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/[0.07] py-10 text-center">
            <Camera className="mx-auto h-10 w-10 text-zinc-700" />
            <p className="mt-3 text-sm text-zinc-500">Aucune photo ajoutée</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-3 text-sm font-medium text-orange-400 hover:underline"
            >
              Ajouter la première photo
            </button>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-zinc-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl(photo.urlImage)}
                  alt={photo.nomFichier}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-xl bg-black/60 text-red-400 opacity-0 backdrop-blur transition hover:bg-red-500/20 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {photo.ordre === 0 && (
                  <span className="absolute bottom-2 left-2 rounded-lg bg-orange-500/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                    Principale
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => { router.push("/commercant"); router.refresh(); }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-500"
        >
          Accéder au tableau de bord
          <ArrowRight className="h-4 w-4" />
        </button>

        {photos.length === 0 && (
          <button
            type="button"
            onClick={() => { router.push("/commercant"); router.refresh(); }}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-zinc-200 transition hover:bg-white/10"
          >
            Passer cette étape
          </button>
        )}
      </div>
    </div>
  );
}

// ── Étape 1 : formulaire de création ─────────────────────────────────────────

export default function CreateCommercePage() {
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [adresse, setAdresse] = useState("");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [categorieId, setCategorieId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [tags, setTags] = useState<TagCulturel[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Après création, on passe à l'étape 2
  const [createdCommerce, setCreatedCommerce] = useState<Commerce | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoadingData(true);
        setError(null);

        const [categoriesData, tagsData] = await Promise.all([
          getCategories(),
          getTagsCulturels(),
        ]);

        if (!mounted) return;
        setCategories(categoriesData);
        setTags(tagsData);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des données."
        );
      } finally {
        if (mounted) setLoadingData(false);
      }
    }

    void loadData();
    return () => { mounted = false; };
  }, []);

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  function handleLocationChange(data: LocationData) {
    setLocation(data);
    setAdresse(data.address);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nom.trim()) { setError("Le nom du commerce est obligatoire."); return; }
    if (!description.trim()) { setError("La description est obligatoire."); return; }
    if (!adresse.trim()) { setError("L'adresse est obligatoire."); return; }
    if (!location) { setError("Veuillez sélectionner la position de votre commerce sur la carte."); return; }
    if (!categorieId) { setError("Veuillez sélectionner une catégorie."); return; }

    try {
      setSaving(true);
      setError(null);

      const commerce = await createCommerce({
        nom: nom.trim(),
        description: description.trim(),
        adresse: adresse.trim(),
        latitude: location.lat,
        longitude: location.lng,
        categorieId,
      });

      if (selectedTags.length > 0) {
        await addTagsToCommerce(commerce.id, selectedTags);
      }

      // Passer à l'étape 2 : upload des photos
      setCreatedCommerce(commerce);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du commerce."
      );
    } finally {
      setSaving(false);
    }
  }

  // Étape 2
  if (createdCommerce) {
    return (
      <PhotoUploadStep
        commerce={createdCommerce}
        onFinish={() => { router.push("/commercant"); router.refresh(); }}
      />
    );
  }

  // Étape 1
  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-400/80">
          Espace commerçant
        </p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Créer mon commerce</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400 md:text-base">
          Ajoutez les informations principales de votre commerce pour le rendre visible sur la
          plateforme GoMatch.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
        {loadingData ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Nom + Catégorie */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Nom du commerce</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Café Rabat Médina"
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Catégorie</label>
                <select
                  value={categorieId}
                  onChange={(e) => setCategorieId(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((categorie) => (
                    <option key={categorie.id} value={categorie.id}>
                      {categorie.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre commerce, son ambiance, ses produits ou services..."
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20"
              />
            </div>

            {/* Localisation */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-400" />
                <h2 className="text-base font-semibold text-white">Localisation du commerce</h2>
              </div>

              <p className="text-sm text-zinc-400">
                Cliquez sur la carte ou recherchez votre adresse pour placer précisément votre
                commerce. Vous pouvez aussi utiliser le bouton GPS pour votre position actuelle.
              </p>

              <LocationPicker value={location} onChange={handleLocationChange} />

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Adresse affichée
                  <span className="ml-2 text-xs font-normal text-zinc-500">
                    (auto-remplie depuis la carte, modifiable)
                  </span>
                </label>
                <input
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="Ex: Avenue Mohammed V, Rabat"
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20"
                />
              </div>
            </div>

            {/* Tags culturels */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-300">Tags culturels</label>

              {tags.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-zinc-400">
                  Aucun tag culturel disponible.
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          isSelected
                            ? "border-orange-400/50 bg-orange-400/15 text-orange-300"
                            : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {tag.nom}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Création en cours…" : "Créer mon commerce"}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
