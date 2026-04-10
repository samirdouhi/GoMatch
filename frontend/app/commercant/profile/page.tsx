"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authApi";
import { UserCircle2, Mail, Phone, MapPin, Building2, Briefcase, ArrowLeft } from "lucide-react";

type CommercantProfile = {
  userProfile: {
    userId: string;
    prenom?: string | null;
    nom?: string | null;
    photoUrl?: string | null;
    isActive: boolean;
  };
  nomResponsable?: string | null;
  telephone?: string | null;
  emailProfessionnel?: string | null;
  ville?: string | null;
  adresseProfessionnelle?: string | null;
  typeActivite?: string | null;
  status?: string | null;
};

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
        <Icon className="h-4 w-4 text-orange-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">{label}</p>
        <p className="mt-1 text-sm font-medium text-white">
          {value ?? <span className="text-zinc-600 italic">Non renseigné</span>}
        </p>
      </div>
    </div>
  );
}

export default function CommercantProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CommercantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res  = await authFetch("/profile/api/commercant/me");
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) throw new Error(data?.message ?? "Erreur chargement profil");
        setProfile(data as CommercantProfile);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Erreur chargement profil.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-white/[0.04]" />)}
      </div>
    );
  }

  if (error) {
    return <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">{error}</div>;
  }

  const nom    = [profile?.userProfile.prenom, profile?.userProfile.nom].filter(Boolean).join(" ") || "Commerçant";
  const initiale = nom[0]?.toUpperCase() ?? "C";

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.05] to-transparent p-6">
        <button type="button" onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />Retour
        </button>
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-2xl font-black text-white shadow-lg">
            {initiale}
          </div>
          <div>
            <h1 className="text-2xl font-black">{nom}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {profile?.typeActivite ?? "Commerçant GoMatch"}
              {profile?.ville ? ` · ${profile.ville}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Infos */}
      <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">Informations professionnelles</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field icon={UserCircle2} label="Responsable"          value={profile?.nomResponsable} />
          <Field icon={Mail}        label="Email professionnel"  value={profile?.emailProfessionnel} />
          <Field icon={Phone}       label="Téléphone"            value={profile?.telephone} />
          <Field icon={MapPin}      label="Ville"                value={profile?.ville} />
          <Field icon={Building2}   label="Adresse pro"          value={profile?.adresseProfessionnelle} />
          <Field icon={Briefcase}   label="Type d'activité"      value={profile?.typeActivite} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/profile/edit")}
          className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-500"
        >
          Modifier mon profil
        </button>
        <button
          type="button"
          onClick={() => router.push("/commercant")}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-zinc-200 transition hover:bg-white/10"
        >
          Mon commerce
        </button>
      </div>
    </div>
  );
}
