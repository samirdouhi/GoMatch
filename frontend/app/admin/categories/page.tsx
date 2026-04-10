"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createCategorie,
  deleteCategorie,
  getCategories,
  updateCategorie,
} from "@/lib/businessApi";

type Categorie = {
  id: string;
  nom: string;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [nom, setNom] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadCategories() {
    try {
      setError(null);
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (err: unknown) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erreur lors du chargement des catégories.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) =>
      a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
    );
  }, [categories]);

  const isEditing = editingId !== null;
  const submitLabel = isEditing ? "Enregistrer" : "Ajouter";
  const sectionTitle = isEditing
    ? "Modifier la catégorie"
    : "Ajouter une catégorie";

  function resetForm() {
    setNom("");
    setEditingId(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedNom = nom.trim();

    if (!trimmedNom) {
      setError("Le nom de la catégorie est obligatoire.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingId) {
        await updateCategorie(editingId, { nom: trimmedNom });
      } else {
        await createCategorie({ nom: trimmedNom });
      }

      resetForm();
      await loadCategories();
    } catch (err: unknown) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erreur lors de l’enregistrement.");
      }
    } finally {
      setSaving(false);
    }
  }

  function startEdit(categorie: Categorie) {
    setEditingId(categorie.id);
    setNom(categorie.nom);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette catégorie ?"
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError(null);
      await deleteCategorie(id);

      if (editingId === id) {
        resetForm();
      }

      await loadCategories();
    } catch (err: unknown) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
        alert(err.message);
      } else {
        setError("Erreur suppression");
        alert("Erreur suppression");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8 text-white">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400/80">
              Administration BusinessService
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Catégories</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400 md:text-base">
              Gérez les catégories utilisées par les commerçants lors de la
              création de leurs commerces.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
            <span className="font-semibold text-white">{categories.length}</span>{" "}
            catégorie{categories.length > 1 ? "s" : ""} au total
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">{sectionTitle}</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {isEditing
                ? "Mettez à jour le nom de la catégorie sélectionnée."
                : "Ajoutez une nouvelle catégorie qui sera proposée aux commerçants."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="nom-categorie"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Nom catégorie
              </label>
              <input
                id="nom-categorie"
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Artisanat, Restauration, Souvenirs..."
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20"
                disabled={saving}
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Traitement..." : submitLabel}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Liste des catégories</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Modifiez ou supprimez les catégories non utilisées.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
                />
              ))}
            </div>
          ) : sortedCategories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-12 text-center">
              <p className="text-lg font-medium text-white">Aucune catégorie</p>
              <p className="mt-2 text-sm text-zinc-400">
                Commencez par ajouter une première catégorie.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map((categorie, index) => {
                const isDeleting = deletingId === categorie.id;
                const isCurrentEditing = editingId === categorie.id;

                return (
                  <div
                    key={categorie.id}
                    className={`group flex flex-col gap-4 rounded-2xl border px-4 py-4 transition md:flex-row md:items-center md:justify-between ${
                      isCurrentEditing
                        ? "border-amber-400/40 bg-amber-400/10"
                        : "border-white/10 bg-zinc-900/60 hover:border-white/20 hover:bg-zinc-900/80"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm font-semibold text-zinc-300">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-base font-medium text-white">
                          {categorie.nom}
                        </p>
                        <p className="text-sm text-zinc-400">
                          ID : <span className="font-mono text-xs">{categorie.id}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                      <button
                        type="button"
                        onClick={() => startEdit(categorie)}
                        className="rounded-xl px-3 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/10 hover:text-amber-200"
                      >
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(categorie.id)}
                        disabled={isDeleting}
                        className="rounded-xl px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeleting ? "Suppression..." : "Supprimer"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}