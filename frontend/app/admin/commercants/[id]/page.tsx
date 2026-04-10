"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  approveCommercant,
  getCommercantDetail,
  rejectCommercant,
  type AdminCommercantDetail,
} from "@/lib/adminProfileApi";

export default function AdminCommercantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<AdminCommercantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await getCommercantDetail(params.id);
        if (mounted) {
          setItem(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Erreur de chargement.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [params.id]);

  const handleApprove = async () => {
    setActionError("");
    setSaving(true);

    try {
      await approveCommercant(params.id);
      router.push("/admin/commercants");
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Impossible d’approuver.");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    setActionError("");

    if (!rejectReason.trim()) {
      setActionError("La raison du rejet est obligatoire.");
      return;
    }

    setSaving(true);

    try {
      await rejectCommercant(params.id, rejectReason.trim());
      router.push("/admin/commercants");
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Impossible de rejeter.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d14] px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">Chargement...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-[#0b0d14] px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl text-red-400">
          {error || "Demande introuvable."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d14] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase italic tracking-tight">
            Détail demande commerçant
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Vérification et traitement du dossier commerçant.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 text-lg font-black uppercase tracking-wide">
              Informations utilisateur
            </h2>
            <div className="grid gap-3 text-sm text-slate-300">
              <div>
                <span className="text-slate-500">Nom :</span>{" "}
                {item.userProfile.prenom} {item.userProfile.nom}
              </div>
              <div>
                <span className="text-slate-500">Date naissance :</span>{" "}
                {item.userProfile.dateNaissance || "-"}
              </div>
              <div>
                <span className="text-slate-500">Genre :</span>{" "}
                {item.userProfile.genre || "-"}
              </div>
              <div>
                <span className="text-slate-500">Langue :</span>{" "}
                {item.userProfile.langue || "-"}
              </div>
              <div>
                <span className="text-slate-500">Statut :</span>{" "}
                {item.status || "-"}
              </div>
              <div>
                <span className="text-slate-500">Soumis le :</span>{" "}
                {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "-"}
              </div>
              <div>
                <span className="text-slate-500">Revu le :</span>{" "}
                {item.reviewedAt ? new Date(item.reviewedAt).toLocaleString() : "-"}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 text-lg font-black uppercase tracking-wide">
              Informations commerçant
            </h2>
            <div className="grid gap-3 text-sm text-slate-300">
              <div>
                <span className="text-slate-500">Responsable :</span>{" "}
                {item.nomResponsable || "-"}
              </div>
              <div>
                <span className="text-slate-500">Téléphone :</span>{" "}
                {item.telephone || "-"}
              </div>
              <div>
                <span className="text-slate-500">Email pro :</span>{" "}
                {item.emailProfessionnel || "-"}
              </div>
              <div>
                <span className="text-slate-500">Ville :</span>{" "}
                {item.ville || "-"}
              </div>
              <div>
                <span className="text-slate-500">Adresse :</span>{" "}
                {item.adresseProfessionnelle || "-"}
              </div>
              <div>
                <span className="text-slate-500">Type activité :</span>{" "}
                {item.typeActivite || "-"}
              </div>
              <div>
                <span className="text-slate-500">CommerceId :</span>{" "}
                {item.commerceId || "-"}
              </div>
              <div>
                <span className="text-slate-500">Inscription terminée :</span>{" "}
                {item.inscriptionTerminee ? "Oui" : "Non"}
              </div>
              <div>
                <span className="text-slate-500">Motif rejet :</span>{" "}
                {item.rejectionReason || "-"}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-4 text-lg font-black uppercase tracking-wide">
            Action administrateur
          </h2>

          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder="Raison du rejet"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-yellow-400/50"
          />

          {actionError && (
            <p className="mt-3 text-sm text-red-400">{actionError}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleApprove}
              disabled={saving}
              className="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-5 py-3 text-sm font-black uppercase tracking-widest text-black disabled:opacity-60"
            >
              {saving ? "Traitement..." : "Approuver"}
            </button>

            <button
              onClick={handleReject}
              disabled={saving}
              className="rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-black uppercase tracking-widest text-red-300 disabled:opacity-60"
            >
              {saving ? "Traitement..." : "Rejeter"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}