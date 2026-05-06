"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCategories,
  createCategorieCulture,
  updateCategorieCulture,
  deleteCategorieCulture,
  type CategorieCulturelle,
} from "@/lib/cultureApi";

export default function AdminCultureCategoriesPage() {
  const [categories, setCategories] = useState<CategorieCulturelle[]>([]);
  const [nom,        setNom]        = useState("");
  const [description, setDescription] = useState("");
  const [icone,      setIcone]      = useState("");
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  async function loadCategories() {
    try {
      setError(null);
      setLoading(true);
      setCategories(await getCategories());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadCategories(); }, []);

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })),
    [categories]
  );

  function resetForm() {
    setNom(""); setDescription(""); setIcone("");
    setEditingId(null); setError(null);
  }

  function startEdit(c: CategorieCulturelle) {
    setEditingId(c.id);
    setNom(c.nom);
    setDescription(c.description ?? "");
    setIcone(c.icone ?? "");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) { setError("Le nom est obligatoire."); return; }
    try {
      setSaving(true); setError(null);
      const dto = {
        nom: nom.trim(),
        description: description.trim() || undefined,
        icone: icone.trim() || undefined,
      };
      if (editingId) await updateCategorieCulture(editingId, dto);
      else await createCategorieCulture(dto);
      resetForm();
      await loadCategories();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette catégorie culturelle ?")) return;
    try {
      setDeletingId(id);
      await deleteCategorieCulture(id);
      if (editingId === id) resetForm();
      await loadCategories();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur suppression");
    } finally {
      setDeletingId(null);
    }
  }

  const isEditing = editingId !== null;

  return (
    <div className="space-y-8 text-white">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
              Administration CultureService
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Catégories culturelles</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Gérez les catégories utilisées pour classifier les contenus culturels.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
            <span className="font-semibold text-white">{categories.length}</span>{" "}
            catégorie{categories.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        {/* Form */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">{isEditing ? "Modifier la catégorie" : "Ajouter une catégorie"}</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {isEditing ? "Mettez à jour les informations de la catégorie." : "Nouvelle catégorie pour les articles culturels."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">Nom *</label>
              <input
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Ex: Architecture, Gastronomie, Musique..."
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                disabled={saving}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description optionnelle..."
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60 resize-none"
                disabled={saving}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">Icône (emoji ou code)</label>
              <input
                value={icone}
                onChange={e => setIcone(e.target.value)}
                placeholder="Ex: 🕌 ou fa-mosque"
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60"
                disabled={saving}
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Traitement..." : isEditing ? "Enregistrer" : "Ajouter"}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} disabled={saving}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-zinc-200 transition hover:bg-white/10"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Liste des catégories</h2>
            <p className="mt-1 text-sm text-zinc-400">Modifiez ou supprimez les catégories.</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-12 text-center">
              <p className="text-lg font-medium">Aucune catégorie</p>
              <p className="mt-2 text-sm text-zinc-400">Commencez par en ajouter une.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((cat, idx) => {
                const isCurrentEditing = editingId === cat.id;
                const isDeleting = deletingId === cat.id;
                return (
                  <div key={cat.id} className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 transition md:flex-row md:items-center md:justify-between ${
                    isCurrentEditing ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/10 bg-zinc-900/60 hover:border-white/20 hover:bg-zinc-900/80"
                  }`}>
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-lg">
                        {cat.icone || String(idx + 1).padStart(2, "0")}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{cat.nom}</p>
                        {cat.description && (
                          <p className="truncate text-xs text-zinc-400">{cat.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end md:self-auto">
                      <button onClick={() => startEdit(cat)} className="rounded-xl px-3 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/10">
                        Modifier
                      </button>
                      <button onClick={() => handleDelete(cat.id)} disabled={isDeleting}
                        className="rounded-xl px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-60"
                      >
                        {isDeleting ? "..." : "Supprimer"}
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
