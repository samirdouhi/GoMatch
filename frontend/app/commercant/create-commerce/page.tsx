"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCategories, getTagsCulturels } from "@/lib/businessApi";
import { createCommerce, addTagsToCommerce } from "@/lib/commercesApi";
import LocationPicker, {
  type LocationData,
} from "@/app/components/commercant/LocationPicker";
import { MapPin } from "lucide-react";

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
  const [location, setLocation] = useState<LocationData | null>(null);
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

  function handleLocationChange(data: LocationData) {
    setLocation(data);
    // Auto-fill address field from reverse geocoding; user can override it
    setAdresse(data.address);
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
      setError("L'adresse est obligatoire.");
      return;
    }

    if (!location) {
      setError(
        "Veuillez sélectionner la position de votre commerce sur la carte."
      );
      return;
    }

    if (!categorieId) {
      setError("Veuillez sélectionner une catégorie.");
      return;
    }

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

      router.push("/commercant");
      router.refresh();
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

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-400/80">
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
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-2xl bg-white/5"
              />
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
                <label className="text-sm font-medium text-zinc-300">
                  Nom du commerce
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Café Rabat Médina"
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Catégorie
                </label>
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
              <label className="text-sm font-medium text-zinc-300">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre commerce, son ambiance, ses produits ou services..."
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20"
              />
            </div>

            {/* Location section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-400" />
                <h2 className="text-base font-semibold text-white">
                  Localisation du commerce
                </h2>
              </div>

              <p className="text-sm text-zinc-400">
                Cliquez sur la carte ou recherchez votre adresse pour placer
                précisément votre commerce. Vous pouvez aussi utiliser le
                bouton GPS pour votre position actuelle.
              </p>

              {/* Interactive map */}
              <LocationPicker value={location} onChange={handleLocationChange} />

              {/* Address field — auto-filled from map, editable */}
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
