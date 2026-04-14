"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCategories, getTagsCulturels } from "@/lib/businessApi";
import {
  getMyCommerce,
  updateCommerce,
  addTagsToCommerce,
  getPhotos,
  uploadPhoto,
  deletePhoto,
  photoUrl,
  type Commerce,
  type PhotoCommerce,
} from "@/lib/commercesApi";
import LocationPicker, {
  type LocationData,
} from "@/app/components/commercant/LocationPicker";
import {
  MapPin,
  ArrowLeft,
  Camera,
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";

type Categorie = { id: string; nom: string };
type TagCulturel = { id: string; nom: string };

// ── Photos section ────────────────────────────────────────────────────────────

function PhotosSection({ commerceId }: { commerceId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoCommerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getPhotos(commerceId)
      .then((data) => {
        if (mounted) { setPhotos(data); setLoading(false); }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [commerceId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError("Fichier trop volumineux (max 10 Mo).");
      return;
    }
    setUploading(true);
    setPhotoError(null);
    try {
      const photo = await uploadPhoto(commerceId, file);
      setPhotos((prev) => [...prev, photo]);
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : "Erreur upload.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(photoId: string) {
    try {
      await deletePhoto(commerceId, photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : "Erreur suppression.");
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-orange-400" />
          <div>
            <h2 className="font-semibold text-white">Photos du commerce</h2>
            <p className="text-xs text-zinc-500">Max 10 photos · jpg / png / webp · 10 Mo</p>
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

      {photoError && (
        <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {photoError}
        </p>
      )}

      {loading ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[1, 2, 3].map((i) => (
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
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function EditCommercePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [commerce, setCommerce] = useState<Commerce | null>(null);

  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [adresse, setAdresse] = useState("");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [categorieId, setCategorieId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [tags, setTags] = useState<TagCulturel[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [commerceData, categoriesData, tagsData] = await Promise.all([
          getMyCommerce(),
          getCategories(),
          getTagsCulturels(),
        ]);

        if (!mounted) return;

        if (!commerceData) {
          router.replace("/commercant/create-commerce");
          return;
        }

        setCommerce(commerceData);
        setNom(commerceData.nom);
        setDescription(commerceData.description);
        setAdresse(commerceData.adresse);
        setLocation({
          lat: commerceData.latitude,
          lng: commerceData.longitude,
          address: commerceData.adresse,
        });
        setCategorieId(commerceData.categorieId);

        setCategories(categoriesData);
        setTags(tagsData);

        // Pré-sélectionner les tags existants (par nom → id)
        const existingTagIds = tagsData
          .filter((t) => commerceData.tagsCulturels.includes(t.nom))
          .map((t) => t.id);
        setSelectedTags(existingTagIds);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Erreur de chargement.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => { mounted = false; };
  }, [id, router]);

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((x) => x !== tagId) : [...prev, tagId]
    );
  }

  function handleLocationChange(data: LocationData) {
    setLocation(data);
    setAdresse(data.address);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nom.trim()) return setError("Le nom est obligatoire.");
    if (!description.trim()) return setError("La description est obligatoire.");
    if (!adresse.trim()) return setError("L'adresse est obligatoire.");
    if (!location) return setError("Veuillez placer votre commerce sur la carte.");
    if (!categorieId) return setError("Veuillez sélectionner une catégorie.");
    if (!commerce) return;

    try {
      setSaving(true);
      setError(null);

      await updateCommerce(commerce.id, {
        nom: nom.trim(),
        description: description.trim(),
        adresse: adresse.trim(),
        latitude: location.lat,
        longitude: location.lng,
        categorieId,
      });

      // Ajoute les nouveaux tags (le backend ignore les doublons)
      if (selectedTags.length > 0) {
        await addTagsToCommerce(commerce.id, selectedTags);
      }

      router.push("/commercant");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la modification.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  if (error && !commerce) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 backdrop-blur">
        <button
          type="button"
          onClick={() => router.push("/commercant")}
          className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-400/80">
          Espace commerçant
        </p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Modifier mon commerce</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400 md:text-base">
          Mettez à jour les informations de votre commerce.
        </p>
      </div>

      {/* Formulaire */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
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
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
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
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20"
            />
          </div>

          {/* Localisation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-400" />
              <h2 className="text-base font-semibold text-white">Localisation</h2>
            </div>

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
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">Tags culturels</label>
            {tags.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-zinc-400">
                Aucun tag culturel disponible.
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active
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
            <p className="text-xs text-zinc-500">
              Les tags déjà associés à votre commerce sont pré-cochés. Cliquez pour en ajouter de nouveaux.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/commercant")}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>

      {/* Photos */}
      {commerce && <PhotosSection commerceId={commerce.id} />}
    </div>
  );
}
