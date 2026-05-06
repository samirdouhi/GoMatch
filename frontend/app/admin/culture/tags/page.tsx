"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getTags,
  createTagCulture,
  updateTagCulture,
  deleteTagCulture,
  type TagCulturel,
} from "@/lib/cultureApi";

export default function AdminCultureTagsPage() {
  const [tags,       setTags]       = useState<TagCulturel[]>([]);
  const [nom,        setNom]        = useState("");
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  async function loadTags() {
    try {
      setError(null); setLoading(true);
      setTags(await getTags());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadTags(); }, []);

  const sorted = useMemo(
    () => [...tags].sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })),
    [tags]
  );

  function resetForm() { setNom(""); setEditingId(null); setError(null); }

  function startEdit(t: TagCulturel) {
    setEditingId(t.id); setNom(t.nom); setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) { setError("Le nom est obligatoire."); return; }
    try {
      setSaving(true); setError(null);
      if (editingId) await updateTagCulture(editingId, { nom: nom.trim() });
      else await createTagCulture({ nom: nom.trim() });
      resetForm();
      await loadTags();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce tag culturel ?")) return;
    try {
      setDeletingId(id);
      await deleteTagCulture(id);
      if (editingId === id) resetForm();
      await loadTags();
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
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Tags culturels</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Gérez les tags associés aux contenus culturels pour faciliter la recherche.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
            <span className="font-semibold text-white">{tags.length}</span>{" "}
            tag{tags.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        {/* Form */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">{isEditing ? "Modifier le tag" : "Ajouter un tag"}</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {isEditing ? "Mettez à jour le nom du tag." : "Nouveau tag pour les articles culturels."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">Nom *</label>
              <input
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Ex: Patrimoine, Cuisine, Festival..."
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
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
            <h2 className="text-xl font-semibold">Liste des tags</h2>
            <p className="mt-1 text-sm text-zinc-400">Modifiez ou supprimez les tags non utilisés.</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-12 text-center">
              <p className="text-lg font-medium">Aucun tag</p>
              <p className="mt-2 text-sm text-zinc-400">Commencez par en ajouter un.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((tag, idx) => {
                const isCurrentEditing = editingId === tag.id;
                const isDeleting = deletingId === tag.id;
                return (
                  <div key={tag.id} className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 transition md:flex-row md:items-center md:justify-between ${
                    isCurrentEditing ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/10 bg-zinc-900/60 hover:border-white/20 hover:bg-zinc-900/80"
                  }`}>
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm font-semibold text-zinc-300">
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{tag.nom}</p>
                        <p className="text-xs text-zinc-500">
                          {new Date(tag.dateCreation).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end md:self-auto">
                      <button onClick={() => startEdit(tag)} className="rounded-xl px-3 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/10">
                        Modifier
                      </button>
                      <button onClick={() => handleDelete(tag.id)} disabled={isDeleting}
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
