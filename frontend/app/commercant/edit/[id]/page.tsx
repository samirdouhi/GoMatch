"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCategories, getTagsCulturels } from "@/lib/businessApi";
import {
  getCommerceById,
  updateCommerce,
  addTagsToCommerce,
  type Commerce,
} from "@/lib/commercesApi";
import LocationPicker, {
  type LocationData,
} from "@/app/components/commercant/LocationPicker";
import { MapPin, ArrowLeft } from "lucide-react";

type Categorie = { id: string; nom: string };
type TagCulturel = { id: string; nom: string };

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
          getCommerceById(id),
          getCategories(),
          getTagsCulturels(),
        ]);

        if (!mounted) return;

        if (!commerceData) {
          setError("Commerce introuvable.");
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
  }, [id]);

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

    try {
      setSaving(true);
      setError(null);

      await updateCommerce(id, {
        nom: nom.trim(),
        description: description.trim(),
        adresse: adresse.trim(),
        latitude: location.lat,
        longitude: location.lng,
        categorieId,
      });

      if (selectedTags.length > 0) {
        await addTagsToCommerce(id, selectedTags);
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

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

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

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20"
            />
          </div>

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
              Les tags déjà associés sont pré-cochés. Cliquez pour en ajouter de nouveaux.
            </p>
          </div>

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
    </div>
  );
}
