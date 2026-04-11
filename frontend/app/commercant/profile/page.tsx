"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircle2,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  ArrowLeft,
  ShieldCheck,
  CircleCheck,
  CircleOff,
  CalendarDays,
  AlertTriangle,
  PencilLine,
  Store,
} from "lucide-react";
import {
  getMyCommercantProfile,
  type CommercantProfileDto,
} from "@/lib/commercantProfileApi";

function formatDate(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
        <Icon className="h-5 w-5 text-orange-400" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-medium text-white">
          {value && value.trim() !== "" ? (
            value
          ) : (
            <span className="italic text-zinc-600">Non renseigné</span>
          )}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const normalized = (status ?? "").toLowerCase();

  if (normalized.includes("appr")) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
        <ShieldCheck className="h-4 w-4" />
        Profil approuvé
      </span>
    );
  }

  if (normalized.includes("rejet")) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
        <CircleOff className="h-4 w-4" />
        Profil rejeté
      </span>
    );
  }

  if (normalized.includes("attente")) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
        <ShieldCheck className="h-4 w-4" />
        En attente de validation
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300">
      <ShieldCheck className="h-4 w-4" />
      Statut non défini
    </span>
  );
}

export default function CommercantProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CommercantProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const data = await getMyCommercantProfile();

        if (!mounted) return;

        setProfile(data);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du profil commerçant."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
        <p className="font-semibold">Impossible de charger le profil commerçant</p>
        <p className="mt-2 text-sm text-red-200">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-300">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div>
            <p className="font-semibold">Profil commerçant non initialisé</p>
            <p className="mt-1 text-sm text-amber-200/90">
              Vous devez compléter votre profil professionnel avant d’utiliser
              pleinement l’espace commerçant.
            </p>

            <button
              type="button"
              onClick={() => router.push("/commercant/create-profile")}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              <Store className="h-4 w-4" />
              Créer mon profil commerçant
            </button>
          </div>
        </div>
      </div>
    );
  }

  const user = profile.userProfile ?? {};
  const fullName =
    [user.prenom, user.nom].filter(Boolean).join(" ") ||
    profile.nomResponsable ||
    "Commerçant";

  const initiale = fullName.charAt(0).toUpperCase() || "C";

  const submittedAt = formatDate(profile.submittedAt);
  const reviewedAt = formatDate(profile.reviewedAt);

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-orange-500/10 via-white/[0.03] to-transparent p-6 backdrop-blur">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {user.photoUrl ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 shadow-lg">
                <Image
                  src={user.photoUrl}
                  alt={fullName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-3xl font-black text-white shadow-lg">
                {initiale}
              </div>
            )}

            <div>
              <h1 className="text-2xl font-black lg:text-3xl">{fullName}</h1>
              <p className="mt-1 text-sm text-zinc-400">
                {profile.typeActivite || "Commerçant GoMatch"}
                {profile.ville ? ` · ${profile.ville}` : ""}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={profile.status} />

                {user.isActive ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <CircleCheck className="h-4 w-4" />
                    Compte actif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-500/20 bg-zinc-500/10 px-3 py-1 text-xs font-semibold text-zinc-400">
                    <CircleOff className="h-4 w-4" />
                    Compte inactif
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
        <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
          Informations professionnelles
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoField
            icon={UserCircle2}
            label="Responsable"
            value={profile.nomResponsable ?? fullName}
          />
          <InfoField
            icon={Mail}
            label="Email professionnel"
            value={profile.emailProfessionnel}
          />
          <InfoField
            icon={Phone}
            label="Téléphone"
            value={profile.telephone}
          />
          <InfoField icon={MapPin} label="Ville" value={profile.ville} />
          <InfoField
            icon={Building2}
            label="Adresse professionnelle"
            value={profile.adresseProfessionnelle}
          />
          <InfoField
            icon={Briefcase}
            label="Type d'activité"
            value={profile.typeActivite}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
        <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
          Statut de validation
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoField
            icon={ShieldCheck}
            label="Statut"
            value={profile.status ?? "Non défini"}
          />
          <InfoField
            icon={CalendarDays}
            label="Date de soumission"
            value={submittedAt}
          />
          <InfoField
            icon={CalendarDays}
            label="Date de validation"
            value={reviewedAt}
          />
          {profile.rejectionReason ? (
            <InfoField
              icon={CircleOff}
              label="Raison du rejet"
              value={profile.rejectionReason}
            />
          ) : (
            <InfoField
              icon={CircleCheck}
              label="Raison du rejet"
              value={null}
            />
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
        <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
          Informations du compte
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoField icon={UserCircle2} label="Prénom" value={user.prenom} />
          <InfoField icon={UserCircle2} label="Nom" value={user.nom} />
          <InfoField icon={Mail} label="Identifiant utilisateur" value={user.userId} />
          <InfoField
            icon={ShieldCheck}
            label="État du compte"
            value={user.isActive ? "Actif" : "Inactif"}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.push("/profile/edit")}
          className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-500"
        >
          <PencilLine className="h-4 w-4" />
          Modifier mon profil
        </button>

        <button
          type="button"
          onClick={() => router.push("/commercant/edit-profile")}
          className="inline-flex items-center gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-5 py-3 font-semibold text-orange-300 transition hover:bg-orange-500/20"
        >
          <Briefcase className="h-4 w-4" />
          Modifier informations professionnelles
        </button>

        <button
          type="button"
          onClick={() => router.push("/commercant")}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-zinc-200 transition hover:bg-white/10"
        >
          <Store className="h-4 w-4" />
          Retour à l’espace commerçant
        </button>
      </div>
    </div>
  );
}