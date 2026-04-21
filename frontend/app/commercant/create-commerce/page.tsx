"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCategories, getTagsCulturels } from "@/lib/businessApi";
import { createCommerce, addTagsToCommerce } from "@/lib/commercesApi";
import LocationPicker, {
  type LocationData,
} from "@/app/components/commercant/LocationPicker";
import { MapPin, CheckCircle2, ChevronDown } from "lucide-react";

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
  const [success, setSuccess] = useState<string | null>(null);

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
    setAdresse(data.address);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setSuccess(null);

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

      setSuccess(
        "Votre commerce a bien été soumis. Il est maintenant en cours de vérification par l’équipe GoMatch. Vous recevrez une réponse sous 24h."
      );

      setTimeout(() => {
        router.push("/commercant");
        router.refresh();
      }, 1800);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du commerce.";

      if (message.toLowerCase().includes("email introuvable dans le token")) {
        setError(
          "Votre session ne contient pas l’adresse email nécessaire. Déconnectez-vous puis reconnectez-vous avant de créer votre commerce."
        );
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 text-white">
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

            {success && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">
                  Nom du commerce
                </label>
                <p className="text-xs text-zinc-500">
                  Entrez le nom affiché de votre commerce sur GoMatch
                </p>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Café Rabat Médina"
                  className="w-full rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black/90 px-4 py-3.5 text-sm font-medium text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] outline-none transition-all duration-200 placeholder:text-zinc-500 hover:border-orange-400/40 focus:border-orange-400/70 focus:ring-4 focus:ring-orange-400/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">
                  Catégorie
                </label>

                <p className="text-xs text-zinc-500">
                  Choisissez la catégorie principale de votre commerce
                </p>

                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <div className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.9)]" />
                  </div>

                  <select
                    value={categorieId}
                    onChange={(e) => setCategorieId(e.target.value)}
                    disabled={saving}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black/90 py-3.5 pl-10 pr-12 text-sm font-medium text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] outline-none transition-all duration-200 hover:border-orange-400/40 hover:bg-zinc-900 focus:border-orange-400/70 focus:ring-4 focus:ring-orange-400/10 disabled:cursor-not-allowed disabled:opacity-60 [&>option]:bg-zinc-950 [&>option]:text-white"
                  >
                    <option value="" className="bg-zinc-950 text-zinc-400">
                      Sélectionner une catégorie
                    </option>

                    {categories.map((categorie) => (
                      <option
                        key={categorie.id}
                        value={categorie.id}
                        className="bg-zinc-950 text-white"
                      >
                        {categorie.nom}
                      </option>
                    ))}
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <ChevronDown className="h-4 w-4 text-zinc-400 transition group-focus-within:text-orange-300" />
                  </div>
                </div>
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
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-400" />
                <h2 className="text-base font-semibold text-white">
                  Localisation du commerce
                </h2>
              </div>

              <p className="text-sm text-zinc-400">
                Cliquez sur la carte ou recherchez votre adresse pour placer
                précisément votre commerce. Vous pouvez aussi utiliser le bouton
                GPS pour votre position actuelle.
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

            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Tags culturels
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Sélectionnez les tags qui correspondent à l’identité culturelle
                  de votre commerce.
                </p>
              </div>

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