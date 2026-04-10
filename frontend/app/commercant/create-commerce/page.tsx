"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCategories } from "@/lib/businessApi";
import { getTagsCulturels } from "@/lib/businessApi";
import { createCommerce, addTagsToCommerce } from "@/lib/commercesApi";

type Categorie = {
  id: string;
  nom: string;
};

type TagCulturel = {
  id: string;
  nom: string;
};

export default function CreateCommercePage() {
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [adresse, setAdresse] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [categorieId, setCategorieId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [tags, setTags] = useState<TagCulturel[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        console.error(err);

        if (!mounted) return;

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Erreur lors du chargement des données.");
        }
      } finally {
        if (mounted) {
          setLoadingData(false);
        }
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nom.trim()) {
      setError("Le nom du commerce est obligatoire.");
      return;
    }

    if (!description.trim()) {
      setError("La description est obligatoire.");
      return;
    }

    if (!adresse.trim()) {
      setError("L’adresse est obligatoire.");
      return;
    }

    if (!categorieId) {
      setError("Veuillez sélectionner une catégorie.");
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      setError("Latitude invalide. Elle doit être comprise entre -90 et 90.");
      return;
    }

    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      setError("Longitude invalide. Elle doit être comprise entre -180 et 180.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const commerce = await createCommerce({
        nom: nom.trim(),
        description: description.trim(),
        adresse: adresse.trim(),
        latitude: lat,
        longitude: lng,
        categorieId,
      });

      if (selectedTags.length > 0) {
        await addTagsToCommerce(commerce.id, selectedTags);
      }

      router.push("/commercant");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erreur lors de la création du commerce.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 text-white">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
          Espace commerçant
        </p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
          Créer mon commerce
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400 md:text-base">
          Ajoutez les informations principales de votre commerce pour le rendre
          visible sur la plateforme GoMatch.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
        {loadingData ? (
          <div className="space-y-4">
            <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Nom du commerce
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Café Rabat Médina"
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Catégorie
                </label>
                <select
                  value={categorieId}
                  onChange={(e) => setCategorieId(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre commerce, son ambiance, ses produits ou services..."
                rows={5}
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Adresse
              </label>
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex: Avenue Mohammed V, Rabat"
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Ex: 34.020882"
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Ex: -6.841650"
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-300">
                Tags culturels
              </label>

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
                            ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-300"
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

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Création en cours..." : "Créer mon commerce"}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
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