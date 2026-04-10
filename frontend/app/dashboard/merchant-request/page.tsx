"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Store,
  Mail,
  Phone,
  MapPin,
  BadgeInfo,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { authFetch } from "@/lib/authApi";
import { getAccessToken } from "@/lib/authTokens";

type ApiObject = Record<string, unknown>;

type MerchantRequestData = {
  nomResponsable: string;
  telephone: string;
  emailProfessionnel: string;
  ville: string;
  adresseProfessionnelle: string;
  typeActivite: string;
  status: string;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
};

function pickString(obj: ApiObject, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function pickNullableString(obj: ApiObject, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function formatDate(value: string | null): string {
  if (!value) return "Non renseignée";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusMeta(status: string) {
  switch (status) {
    case "Approved":
      return {
        title: "Demande approuvée",
        description:
          "Votre demande commerçant a été acceptée. Vous pouvez maintenant accéder à votre futur espace commerçant.",
        icon: CheckCircle2,
        color: "text-green-400",
        border: "border-green-400/20",
        bg: "bg-green-400/10",
      };
    case "Rejected":
      return {
        title: "Demande refusée",
        description:
          "Votre demande commerçant a été refusée. Vérifiez la raison du refus et soumettez une nouvelle demande si nécessaire.",
        icon: AlertTriangle,
        color: "text-red-400",
        border: "border-red-400/20",
        bg: "bg-red-400/10",
      };
    default:
      return {
        title: "Demande en cours d’analyse",
        description:
          "Votre dossier est actuellement en cours de vérification par l’administrateur.",
        icon: Clock3,
        color: "text-yellow-400",
        border: "border-yellow-400/20",
        bg: "bg-yellow-400/10",
      };
  }
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/40">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm text-white/80 break-words">{value || "Non renseigné"}</p>
    </div>
  );
}

export default function MerchantRequestPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestData, setRequestData] = useState<MerchantRequestData | null>(null);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.replace("/signin");
      return;
    }

    async function loadRequest() {
      try {
        const res = await authFetch("/commercant-profile/me", {
          method: "GET",
          cache: "no-store",
        });

        if (res.status === 401 || res.status === 403) {
          router.replace("/signin");
          return;
        }

        if (res.status === 404) {
          setError("Aucune demande commerçant n’a été trouvée.");
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError("Impossible de charger votre demande commerçant.");
          setLoading(false);
          return;
        }

        const data = (await res.json()) as ApiObject;

        setRequestData({
          nomResponsable: pickString(data, ["nomResponsable", "NomResponsable"]),
          telephone: pickString(data, ["telephone", "Telephone"]),
          emailProfessionnel: pickString(data, ["emailProfessionnel", "EmailProfessionnel"]),
          ville: pickString(data, ["ville", "Ville"]),
          adresseProfessionnelle: pickString(data, [
            "adresseProfessionnelle",
            "AdresseProfessionnelle",
          ]),
          typeActivite: pickString(data, ["typeActivite", "TypeActivite"]),
          status: pickString(data, ["status", "Status"]) || "Pending",
          rejectionReason: pickNullableString(data, [
            "rejectionReason",
            "RejectionReason",
          ]),
          submittedAt: pickNullableString(data, ["submittedAt", "SubmittedAt"]),
          reviewedAt: pickNullableString(data, ["reviewedAt", "ReviewedAt"]),
        });
      } catch {
        setError("Erreur réseau lors du chargement de votre demande.");
      } finally {
        setLoading(false);
      }
    }

    void loadRequest();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-2 border-[#facc15] border-t-transparent"
        />
      </main>
    );
  }

  const statusMeta = getStatusMeta(requestData?.status || "Pending");
  const StatusIcon = statusMeta.icon;

  return (
    <main className="min-h-screen bg-[#050505] text-white px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/[0.06]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour dashboard
        </button>

        <section
          className={`rounded-[2rem] border ${statusMeta.border} ${statusMeta.bg} p-8`}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
              <StatusIcon className={`h-7 w-7 ${statusMeta.color}`} />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">
                Demande commerçant
              </p>
              <h1 className="text-3xl font-black uppercase italic tracking-tight">
                {statusMeta.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/70 leading-relaxed">
                {statusMeta.description}
              </p>

              {requestData?.submittedAt && (
                <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-white/50">
                  Dossier soumis le {formatDate(requestData.submittedAt)}
                </p>
              )}

              {requestData?.reviewedAt && requestData.status !== "Pending" && (
                <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-white/50">
                  Dernière revue le {formatDate(requestData.reviewedAt)}
                </p>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {requestData && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoRow
                icon={<Store className="h-4 w-4" />}
                label="Responsable"
                value={requestData.nomResponsable}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Téléphone"
                value={requestData.telephone}
              />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email professionnel"
                value={requestData.emailProfessionnel}
              />
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Ville"
                value={requestData.ville}
              />
              <InfoRow
                icon={<BadgeInfo className="h-4 w-4" />}
                label="Type d’activité"
                value={requestData.typeActivite}
              />
              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Statut"
                value={requestData.status}
              />
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                Adresse professionnelle
              </p>
              <p className="text-sm leading-relaxed text-white/75">
                {requestData.adresseProfessionnelle || "Non renseignée"}
              </p>
            </section>

            {requestData.status === "Rejected" && (
              <section className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-8">
                {requestData.rejectionReason && (
                  <>
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-red-300">
                      Raison du refus
                    </p>
                    <p className="text-sm leading-relaxed text-white/80">
                      {requestData.rejectionReason}
                    </p>
                  </>
                )}

                <div className="mt-6">
                  <button
                    onClick={() => router.push("/dashboard/become-merchant")}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-5 py-3 text-sm font-black uppercase tracking-widest text-black transition hover:scale-[1.02]"
                  >
                    Refaire ma demande
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </section>
            )}

            {requestData.status === "Pending" && (
              <section className="rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-8">
                <p className="text-sm leading-relaxed text-white/80">
                  Votre dossier est actuellement en attente de validation. Vous serez
                  informé par email dès qu’une décision sera prise.
                </p>
              </section>
            )}

            {requestData.status === "Approved" && (
              <section className="rounded-[2rem] border border-green-400/20 bg-green-400/10 p-8">
                <p className="text-sm leading-relaxed text-white/80">
                  Votre demande a été validée. Vous pouvez maintenant accéder à votre
                  futur espace commerçant.
                </p>

                <div className="mt-6">
                  <button
                    onClick={() => router.push("/merchant/dashboard")}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-5 py-3 text-sm font-black uppercase tracking-widest text-black transition hover:scale-[1.02]"
                  >
                    Accéder à mon espace commerçant
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}