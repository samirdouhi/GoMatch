"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  ArrowUpRight,
  Newspaper,
  Zap,
  LucideIcon,
  User,
  Store,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Sparkles,
  MapPinned,
  Languages,
  ShieldCheck,
  RefreshCcw,
  X,
  MailCheck,
} from "lucide-react";
import { authFetch } from "@/lib/authApi";
import { getAccessToken } from "@/lib/authTokens";

type UserProfileSummary = {
  userId: string;
  prenom?: string | null;
  nom?: string | null;
  dateNaissance?: string | null;
  genre?: string | null;
  langue?: string | null;
  photoUrl?: string | null;
  isActive: boolean;
};

type TouristeProfileResponse = {
  userProfile: UserProfileSummary;
  nationalite?: string | null;
  preferencesJson?: string | null;
  equipesSuiviesJson?: string | null;
  inscriptionTerminee: boolean;
};

type CommercantProfileResponse = {
  userProfile: UserProfileSummary;
  nomResponsable?: string | null;
  telephone?: string | null;
  emailProfessionnel?: string | null;
  ville?: string | null;
  adresseProfessionnelle?: string | null;
  typeActivite?: string | null;
  status?: string | null;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  commerceId?: string | null;
  inscriptionTerminee: boolean;
};

type MerchantStatus = "Pending" | "Approved" | "Rejected" | null;

interface StatCardProps {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  color: string;
}

interface NewsItemProps {
  title: string;
  category: string;
  date: string;
}

function parseJsonArray(value?: string | null): string[] {
  if (!value?.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function getMerchantStatusMeta(status: MerchantStatus) {
  switch (status) {
    case "Pending":
      return {
        label: "Demande en cours",
        description:
          "Votre demande commerçant est en cours d’analyse par l’administrateur.",
        icon: Clock3,
        color: "text-yellow-400",
        border: "border-yellow-400/20",
        bg: "bg-yellow-400/10",
      };
    case "Approved":
      return {
        label: "Commerçant approuvé",
        description:
          "Votre demande a été acceptée. Vous pouvez maintenant accéder à votre espace commerçant.",
        icon: CheckCircle2,
        color: "text-green-400",
        border: "border-green-400/20",
        bg: "bg-green-400/10",
      };
    case "Rejected":
      return {
        label: "Demande refusée",
        description:
          "Votre demande a été refusée. Vous pouvez corriger les informations et refaire une demande.",
        icon: AlertTriangle,
        color: "text-red-400",
        border: "border-red-400/20",
        bg: "bg-red-400/10",
      };
    default:
      return {
        label: "Compte touriste",
        description:
          "Vous profitez actuellement de l’expérience GoMatch en tant qu’utilisateur standard.",
        icon: Sparkles,
        color: "text-sky-400",
        border: "border-sky-400/20",
        bg: "bg-sky-400/10",
      };
  }
}

function getGreeting(name?: string | null) {
  const hour = new Date().getHours();
  const prefix =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  return `${prefix}, ${name?.trim() || "Champion"}`;
}

const DynamicSpaceBackground = () => {
  const elements = useMemo(() => {
    const newOrbes = [...Array(5)].map((_, i) => ({
      id: i,
      size: 400 + i * 100,
      left: [5, 85, 15, 75, 50][i],
      top: [15, 10, 80, 75, 45][i],
      duration: 12 + i * 4,
    }));
    return { orbes: newOrbes };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#facc1503_1px,transparent_1px),linear-gradient(to_bottom,#facc1503_1px,transparent_1px)] bg-[size:60px_60px]" />
      {elements.orbes.map((orbe) => (
        <motion.div
          key={orbe.id}
          className="absolute rounded-full bg-[#facc15]/5 blur-[120px]"
          style={{
            width: orbe.size,
            height: orbe.size,
            left: `${orbe.left}%`,
            top: `${orbe.top}%`,
          }}
          animate={{
            x: [0, 30, -30, 0],
            y: [0, -30, 30, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: orbe.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !getAccessToken();
    }
    return true;
  });

  const [profile, setProfile] = useState<TouristeProfileResponse | null>(null);
  const [merchantProfile, setMerchantProfile] =
    useState<CommercantProfileResponse | null>(null);
  const [merchantStatus, setMerchantStatus] = useState<MerchantStatus>(null);
  const [loadError, setLoadError] = useState("");

  const [showRequestBanner, setShowRequestBanner] = useState(true);
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(true);

  const merchantRequest = searchParams.get("merchantRequest");
  const emailParam = searchParams.get("email");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/signin");
      return;
    }

    async function loadDashboardData() {
      try {
        const profileRes = await authFetch("/profile/me", {
          method: "GET",
          cache: "no-store",
        });

        if (profileRes.status === 401 || profileRes.status === 403) {
          router.replace("/signin");
          return;
        }

        if (!profileRes.ok) {
          setLoadError("Impossible de charger le profil utilisateur.");
          setIsLoading(false);
          return;
        }

        const profileData =
          (await profileRes.json()) as TouristeProfileResponse;
        setProfile(profileData);

        const merchantRes = await authFetch("/commercant-profile/me", {
          method: "GET",
          cache: "no-store",
        });

        if (merchantRes.ok) {
          const merchantData =
            (await merchantRes.json()) as CommercantProfileResponse;
          setMerchantProfile(merchantData);

          const normalizedStatus = merchantData.status?.trim() as MerchantStatus;
          setMerchantStatus(
            normalizedStatus === "Pending" ||
              normalizedStatus === "Approved" ||
              normalizedStatus === "Rejected"
              ? normalizedStatus
              : null
          );
        } else if (merchantRes.status === 404) {
          setMerchantProfile(null);
          setMerchantStatus(null);
        } else if (merchantRes.status === 401 || merchantRes.status === 403) {
          router.replace("/signin");
          return;
        }

        setIsLoading(false);
      } catch {
        setLoadError("Erreur réseau lors du chargement du dashboard.");
        setIsLoading(false);
      }
    }

    void loadDashboardData();
  }, [router]);

  const preferences = useMemo(
    () => parseJsonArray(profile?.preferencesJson),
    [profile?.preferencesJson]
  );

  const teams = useMemo(
    () => parseJsonArray(profile?.equipesSuiviesJson),
    [profile?.equipesSuiviesJson]
  );

  const firstName =
    profile?.userProfile?.prenom || merchantProfile?.userProfile?.prenom || "Champion";

  const merchantMeta = getMerchantStatusMeta(merchantStatus);
  const StatusIcon = merchantMeta.icon;

  const quickActions = [
    {
      title: "Mon profil",
      desc: "Consulter ou modifier vos informations personnelles",
      onClick: () => router.push("/profile"),
      icon: User,
    },
    {
      title: "Préférences",
      desc: "Mettre à jour vos centres d’intérêt",
      onClick: () => router.push("/profile/edit"),
      icon: Star,
    },
    {
      title:
        merchantStatus === "Approved"
          ? "Espace commerçant"
          : merchantStatus === "Pending"
          ? "Voir ma demande"
          : merchantStatus === "Rejected"
          ? "Refaire ma demande"
          : "Devenir commerçant",
      desc:
        merchantStatus === "Approved"
          ? "Accéder aux fonctionnalités commerçant"
          : merchantStatus === "Pending"
          ? "Suivre l’état de votre dossier"
          : merchantStatus === "Rejected"
          ? "Soumettre une nouvelle demande"
          : "Créer un dossier commerçant",
      onClick: () => {
        if (merchantStatus === "Approved") {
          router.push("/merchant/dashboard");
          return;
        }

        if (merchantStatus === "Pending") {
          router.push("/dashboard/merchant-request");
          return;
        }

        router.push("/dashboard/become-merchant");
      },
      icon: Store,
    },
    {
      title: "Explorer",
      desc: "Découvrir les expériences et commerces",
      onClick: () => router.push("/"),
      icon: Sparkles,
    },
  ];

  const recentEvents = [
    "Email confirmé",
    profile?.inscriptionTerminee ? "Onboarding terminé" : "Onboarding en cours",
    merchantStatus === "Pending" ? "Demande commerçant envoyée" : null,
    merchantStatus === "Approved" ? "Demande commerçant approuvée" : null,
    merchantStatus === "Rejected" ? "Demande commerçant refusée" : null,
  ].filter(Boolean) as string[];

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-[#facc15] border-t-transparent rounded-full shadow-[0_0_15px_#facc15]"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#facc15]/30 relative pb-20">
      <DynamicSpaceBackground />

      <div className="w-full px-6 py-10 lg:px-16 lg:py-12 max-w-[1600px] mx-auto space-y-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative"
        >
          <div className="flex items-center gap-4 mb-4">
            <span className="h-px w-12 bg-[#facc15]" />
            <span className="text-[#facc15] text-[10px] font-black uppercase tracking-[0.5em]">
              Espace Premium
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-[1000] tracking-tighter italic uppercase leading-[0.9] mb-4">
            {getGreeting(firstName)}
          </h1>

          <p className="text-white/40 text-xs md:text-sm font-medium max-w-2xl leading-relaxed">
            {merchantMeta.description}
          </p>
        </motion.div>

        {merchantRequest === "email-verification-sent" &&
          emailParam &&
          showRequestBanner && (
            <div className="relative rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 px-6 py-5">
              <button
                onClick={() => setShowRequestBanner(false)}
                className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/20 p-2 text-white/70 hover:bg-black/30"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="pr-12">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-yellow-300">
                  Confirmation requise
                </p>
                <p className="text-sm leading-relaxed text-white/85">
                  Un email de confirmation a été envoyé à{" "}
                  <span className="font-semibold text-yellow-200">{emailParam}</span>.
                  Veuillez confirmer votre email professionnel pour transmettre
                  votre demande à l’équipe GoMatch.
                </p>
              </div>
            </div>
          )}

        {merchantRequest === "email-verified" && showVerifiedBanner && (
          <div className="relative rounded-[2rem] border border-green-400/20 bg-green-400/10 px-6 py-5">
            <button
              onClick={() => setShowVerifiedBanner(false)}
              className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/20 p-2 text-white/70 hover:bg-black/30"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="pr-12 flex items-start gap-3">
              <MailCheck className="mt-0.5 h-5 w-5 text-green-300" />
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-green-300">
                  Email professionnel vérifié
                </p>
                <p className="text-sm leading-relaxed text-white/85">
                  Votre email professionnel a été confirmé avec succès.
                  Votre demande commerçant est maintenant en cours d’analyse.
                </p>
              </div>
            </div>
          </div>
        )}

        {loadError && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm text-red-300">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Profil complété"
            value={profile?.inscriptionTerminee ? "100%" : "60%"}
            detail={
              profile?.inscriptionTerminee
                ? "Votre profil principal est finalisé"
                : "Complétez les éléments restants"
            }
            icon={ShieldCheck}
            color="#facc15"
          />
          <StatCard
            title="Centres d’intérêt"
            value={String(preferences.length)}
            detail={`${preferences.length} préférence(s) enregistrée(s)`}
            icon={Star}
            color="#facc15"
          />
          <StatCard
            title="Pays suivis"
            value={String(teams.length)}
            detail={`${teams.length} sélection(s) dans votre parcours`}
            icon={MapPinned}
            color="#ef4444"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className={`xl:col-span-2 rounded-[2.5rem] border ${merchantMeta.border} ${merchantMeta.bg} p-8 shadow-xl`}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-3">
                  Statut du compte
                </p>
                <div className="flex items-center gap-3">
                  <StatusIcon className={`h-7 w-7 ${merchantMeta.color}`} />
                  <h2 className="text-3xl font-black uppercase italic tracking-tight">
                    {merchantMeta.label}
                  </h2>
                </div>

                <p className="mt-4 max-w-2xl text-sm text-white/65 leading-relaxed">
                  {merchantMeta.description}
                </p>

                {merchantStatus === "Rejected" &&
                  merchantProfile?.rejectionReason && (
                    <div className="mt-5 rounded-2xl border border-red-400/20 bg-black/20 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300 mb-2">
                        Raison du refus
                      </p>
                      <p className="text-sm text-white/70">
                        {merchantProfile.rejectionReason}
                      </p>
                    </div>
                  )}

                {merchantStatus === "Pending" &&
                  merchantProfile?.submittedAt && (
                    <p className="mt-5 text-xs uppercase tracking-[0.2em] text-yellow-300">
                      Dossier soumis le{" "}
                      {new Date(
                        merchantProfile.submittedAt
                      ).toLocaleDateString()}
                    </p>
                  )}
              </div>

              <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                <StatusIcon className={`h-8 w-8 ${merchantMeta.color}`} />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-[2.5rem] border border-white/5 bg-[#111] p-8 shadow-xl"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-3">
              Prochaine action
            </p>

            <h3 className="text-2xl font-black uppercase italic tracking-tight mb-3">
              {merchantStatus === "Approved"
                ? "Développer votre activité"
                : merchantStatus === "Pending"
                ? "Suivre votre demande"
                : merchantStatus === "Rejected"
                ? "Corriger votre dossier"
                : "Passer au niveau supérieur"}
            </h3>

            <p className="text-sm text-white/50 leading-relaxed mb-6">
              {merchantStatus === "Approved"
                ? "Accédez à votre futur espace commerçant et commencez à gérer votre présence."
                : merchantStatus === "Pending"
                ? "Votre dossier est en cours d’analyse. Vous pouvez continuer à profiter de l’expérience GoMatch."
                : merchantStatus === "Rejected"
                ? "Mettez à jour les informations nécessaires et soumettez une nouvelle demande."
                : "Créez votre dossier commerçant pour rejoindre la plateforme en tant que professionnel."}
            </p>

            <button
              onClick={() => {
                if (merchantStatus === "Approved") {
                  router.push("/commercant");
                  return;
                }

                if (merchantStatus === "Pending") {
                  router.push("/dashboard/merchant-request");
                  return;
                }

                if (merchantStatus === "Rejected" || !merchantStatus) {
                  router.push("/dashboard/become-merchant");
                  return;
                }
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-5 py-4 text-sm font-black uppercase tracking-widest text-black transition hover:scale-[1.02]"
            >
              {merchantStatus === "Approved"
                ? "Accéder à mon espace commerçant"
                : merchantStatus === "Pending"
                ? "Voir ma demande"
                : merchantStatus === "Rejected"
                ? "Refaire ma demande"
                : "Devenir commerçant"}
            </button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Panel title="Résumé du profil" icon={User}>
            <div className="space-y-3 text-sm text-white/70">
              <Row label="Prénom" value={profile?.userProfile?.prenom || "-"} />
              <Row label="Nom" value={profile?.userProfile?.nom || "-"} />
              <Row label="Langue" value={profile?.userProfile?.langue || "-"} />
              <Row label="Nationalité" value={profile?.nationalite || "-"} />
              <Row
                label="Rôle actif"
                value={
                  merchantStatus === "Approved"
                    ? "Touriste + Commerçant"
                    : "Touriste"
                }
              />
            </div>
          </Panel>

          <Panel title="Préférences" icon={Languages}>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">
                  Centres d’intérêt
                </p>
                <div className="flex flex-wrap gap-2">
                  {preferences.length > 0 ? (
                    preferences.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-white/40">
                      Aucun centre d’intérêt enregistré.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">
                  Pays suivis
                </p>
                <div className="flex flex-wrap gap-2">
                  {teams.length > 0 ? (
                    teams.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-white/40">
                      Aucun pays suivi enregistré.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Activité récente" icon={RefreshCcw}>
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div
                  key={event}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"
                >
                  <span className="h-2 w-2 rounded-full bg-[#facc15]" />
                  <span className="text-sm text-white/70">{event}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="rounded-[2.5rem] border border-white/5 bg-[#111] p-8 shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">
                Accès rapides
              </p>
              <h3 className="text-2xl font-black uppercase italic tracking-tight">
                Vos actions principales
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.title}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.onClick}
                  className="rounded-[1.8rem] border border-white/5 bg-white/[0.03] p-5 text-left transition hover:border-[#facc15]/30 hover:bg-white/[0.05]"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#facc15]/10 text-[#facc15]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-base font-black uppercase tracking-tight mb-2">
                    {action.title}
                  </h4>
                  <p className="text-sm text-white/45 leading-relaxed">
                    {action.desc}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="relative group p-[1px] rounded-[2.5rem] overflow-hidden">
          <div className="absolute inset-0 bg-transparent">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0%,#facc15_25%,transparent_50%,#facc15_75%,transparent_100%)] opacity-20"
            />
          </div>

          <div className="relative bg-[#0A0A0A]/80 rounded-[2.45rem] p-8 lg:p-12 backdrop-blur-3xl border border-white/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <Newspaper className="text-[#facc15]" /> Actualités GOMATCH
                </h3>
              </div>
              <button className="bg-white/5 hover:bg-[#facc15] hover:text-black transition-all px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 self-start">
                Tout explorer
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <motion.div
                whileHover={{ y: -5 }}
                className="lg:col-span-7 aspect-[16/10] rounded-[2rem] bg-zinc-900 overflow-hidden relative group cursor-pointer border border-white/10 shadow-2xl"
              >
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000')] bg-cover bg-center transition-all duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute top-6 left-6">
                  <span className="bg-[#facc15] text-black text-[9px] font-[1000] px-4 py-1.5 rounded-lg uppercase tracking-tighter flex items-center gap-2 shadow-lg">
                    <Zap size={12} fill="currentColor" /> Live
                  </span>
                </div>
                <div className="absolute bottom-8 left-8 right-8">
                  <p className="text-[#facc15] text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                    Grand Stade de Casablanca
                  </p>
                  <h4 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none group-hover:text-[#facc15] transition-colors">
                    L&apos;avancement des travaux
                    <br />
                    en direct du chantier
                  </h4>
                </div>
              </motion.div>

              <div className="lg:col-span-5 flex flex-col justify-between py-2 space-y-4">
                <NewsItem
                  title="Nouvelle procédure de billetterie FIFA"
                  category="Mise à jour"
                  date="Il y a 2h"
                />
                <NewsItem
                  title="Transport : Le TGV Marrakech-Agadir confirmé"
                  category="Infrastructure"
                  date="Il y a 5h"
                />
                <NewsItem
                  title="Partenariat exclusif avec la FRMF"
                  category="Officiel"
                  date="Hier"
                />
                <NewsItem
                  title="Sélections : Les Lions en préparation"
                  category="Sport"
                  date="2 jours"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="rounded-[2.5rem] border border-white/5 bg-[#111] p-8 shadow-xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#facc15]/10 text-[#facc15]">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-black uppercase italic tracking-tight">
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
      <span className="text-white/35">{label}</span>
      <span className="font-semibold text-white/80 text-right">{value}</span>
    </div>
  );
}

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  color,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-[#111] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group transition-all duration-500 hover:border-[#facc15]/40 shadow-xl"
    >
      <div className="absolute -right-4 -top-4 bg-white/5 p-10 rounded-full group-hover:bg-[#facc15]/10 transition-colors">
        <Icon
          size={40}
          className="text-white/5 group-hover:text-[#facc15]/20 transition-colors"
        />
      </div>
      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
        <Icon size={12} style={{ color }} /> {title}
      </p>
      <div className="relative z-10">
        <span className="text-6xl font-[1000] tracking-tighter italic group-hover:text-[#facc15] transition-colors duration-500">
          {value}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
        <span className="h-1 w-1 rounded-full" style={{ backgroundColor: color }} />
        {detail}
      </div>
    </motion.div>
  );
}

function NewsItem({ title, category, date }: NewsItemProps) {
  return (
    <div className="flex items-center gap-6 p-5 rounded-2xl hover:bg-white/5 transition-all duration-300 cursor-pointer border border-transparent hover:border-white/10 group">
      <div className="h-14 w-14 rounded-xl bg-[#facc15]/5 flex-shrink-0 flex items-center justify-center border border-white/5 group-hover:border-[#facc15]/50 transition-all">
        <ArrowUpRight
          size={20}
          className="text-white/20 group-hover:text-[#facc15] transition-all"
        />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[9px] text-[#facc15] font-black tracking-widest uppercase">
            {category}
          </p>
          <span className="text-[9px] text-white/20 font-bold uppercase">
            {date}
          </span>
        </div>
        <p className="text-sm font-bold text-white/70 group-hover:text-white transition-colors leading-tight">
          {title}
        </p>
      </div>
    </div>
  );
}