"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
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
  CalendarDays,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { authFetch } from "@/lib/authApi";
import { getAccessToken } from "@/lib/authTokens";
import {
  getUpcomingMatches,
  formatMatchDate,
  type Match,
} from "@/lib/matchesApi";

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

function normalizeTeamName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/['’.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FLAG_CODE_MAP: Record<string, string> = {
  ENG: "gb-eng",
  SCO: "gb-sct",
  WAL: "gb-wls",
  NIR: "gb-nir",
};

function getFlagUrl(code?: string): string {
  const normalized = (code ?? "").trim().toUpperCase();
  if (!normalized || normalized === "TBD" || normalized.length < 2) return "";

  const mapped =
    FLAG_CODE_MAP[normalized] ?? normalized.toLowerCase().slice(0, 2);

  return `https://flagcdn.com/w80/${mapped}.png`;
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

function FollowedMatchMiniCard({
  match,
  onPlanMatch,
}: {
  match: Match;
  onPlanMatch: (match: Match) => void;
}) {
  const homeFlag = getFlagUrl(match.codeEquipe1);
  const awayFlag = getFlagUrl(match.codeEquipe2);

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      className="rounded-[1.8rem] border border-white/5 bg-[#0f0f10] p-5 shadow-xl transition"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">
          {match.isExperienceMatch ? "Match expérience" : "Match suivi"}
        </p>

        <div className="flex items-center gap-2">
          {match.locationSource === "gomatch_override" && (
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-300">
              Maroc
            </span>
          )}

          <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-yellow-300">
            {match.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <MiniTeam
          name={match.equipe1}
          crest={match.crestEquipe1}
          flagUrl={homeFlag}
          code={match.codeEquipe1}
          align="left"
        />

        <div className="flex justify-center">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-white/70">
            VS
          </div>
        </div>

        <MiniTeam
          name={match.equipe2}
          crest={match.crestEquipe2}
          flagUrl={awayFlag}
          code={match.codeEquipe2}
          align="right"
        />
      </div>

      <div className="mt-5 space-y-2.5">
        <MiniInfo icon={CalendarDays} text={formatMatchDate(match.date)} />
        <MiniInfo icon={Clock3} text={match.heure || "Heure non renseignée"} />
        <MiniInfo
          icon={MapPin}
          text={`${match.ville || "Ville"}${match.stade ? ` · ${match.stade}` : ""}`}
        />
      </div>

      {match.isExperienceMatch ? (
        <>
          {!!match.fanZones?.length && (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                Fan zones
              </p>

              <div className="flex flex-wrap gap-2">
                {match.fanZones.slice(0, 2).map((zone) => (
                  <span
                    key={zone.name}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/75"
                  >
                    {zone.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => onPlanMatch(match)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:scale-[1.02]"
          >
            Planifier ma journée
            <ArrowRight className="h-4 w-4" />
          </button>
        </>
      ) : (
        <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-center text-xs text-white/45">
          Recommandations bientôt disponibles
        </div>
      )}
    </motion.article>
  );
}

function MiniTeam({
  name,
  crest,
  flagUrl,
  code,
  align,
}: {
  name: string;
  crest?: string;
  flagUrl?: string;
  code?: string;
  align: "left" | "right";
}) {
  const imgSrc = crest || flagUrl || "";
  const isRight = align === "right";

  return (
    <div className={`min-w-0 ${isRight ? "text-right" : "text-left"}`}>
      <div className={`mb-2 flex ${isRight ? "justify-end" : "justify-start"}`}>
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-zinc-800">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={name}
              width={44}
              height={44}
              className="object-contain"
              unoptimized
            />
          ) : (
            <span className="text-xs font-black text-zinc-200">
              {code || "TBD"}
            </span>
          )}
        </div>
      </div>

      <p className="line-clamp-2 text-sm font-black leading-tight text-white">
        {name}
      </p>
    </div>
  );
}

function MiniInfo({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-[#facc15]" />
      <span className="truncate text-xs text-white/75">{text}</span>
    </div>
  );
}

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

  const [followedMatches, setFollowedMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);

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
          setMatchesLoading(false);
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

        const followedTeams = parseJsonArray(profileData?.equipesSuiviesJson);
        const normalizedFollowedTeams = followedTeams.map(normalizeTeamName);

        if (normalizedFollowedTeams.length > 0) {
          try {
            const upcomingMatches = await getUpcomingMatches();

            const filtered = upcomingMatches.filter((match) => {
              const team1 = normalizeTeamName(match.equipe1);
              const team2 = normalizeTeamName(match.equipe2);

              return (
                normalizedFollowedTeams.includes(team1) ||
                normalizedFollowedTeams.includes(team2)
              );
            });

            setFollowedMatches(filtered);
          } catch {
            setFollowedMatches([]);
          }
        } else {
          setFollowedMatches([]);
        }

        setIsLoading(false);
        setMatchesLoading(false);
      } catch {
        setLoadError("Erreur réseau lors du chargement du dashboard.");
        setIsLoading(false);
        setMatchesLoading(false);
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
    profile?.userProfile?.prenom ||
    merchantProfile?.userProfile?.prenom ||
    "Champion";

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
      <div className="flex h-screen w-full items-center justify-center bg-[#050505]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-2 border-[#facc15] border-t-transparent shadow-[0_0_15px_#facc15]"
        />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#050505] pb-20 font-sans text-white selection:bg-[#facc15]/30">
      <DynamicSpaceBackground />

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-10 px-6 py-10 lg:px-16 lg:py-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative"
        >
          <div className="mb-4 flex items-center gap-4">
            <span className="h-px w-12 bg-[#facc15]" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#facc15]">
              Espace Premium
            </span>
          </div>

          <h1 className="mb-4 text-5xl font-[1000] uppercase italic leading-[0.9] tracking-tighter md:text-7xl">
            {getGreeting(firstName)}
          </h1>

          <p className="max-w-2xl text-xs font-medium leading-relaxed text-white/40 md:text-sm">
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
                  <span className="font-semibold text-yellow-200">
                    {emailParam}
                  </span>
                  . Veuillez confirmer votre email professionnel pour transmettre
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

            <div className="flex items-start gap-3 pr-12">
              <MailCheck className="mt-0.5 h-5 w-5 text-green-300" />
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-green-300">
                  Email professionnel vérifié
                </p>
                <p className="text-sm leading-relaxed text-white/85">
                  Votre email professionnel a été confirmé avec succès. Votre
                  demande commerçant est maintenant en cours d’analyse.
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
            title="Équipes suivies"
            value={String(teams.length)}
            detail={`${teams.length} sélection(s) dans votre parcours`}
            icon={MapPinned}
            color="#ef4444"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className={`xl:col-span-2 rounded-[2.5rem] border ${merchantMeta.border} ${merchantMeta.bg} p-8 shadow-xl`}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
                  Statut du compte
                </p>
                <div className="flex items-center gap-3">
                  <StatusIcon className={`h-7 w-7 ${merchantMeta.color}`} />
                  <h2 className="text-3xl font-black uppercase italic tracking-tight">
                    {merchantMeta.label}
                  </h2>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65">
                  {merchantMeta.description}
                </p>

                {merchantStatus === "Rejected" &&
                  merchantProfile?.rejectionReason && (
                    <div className="mt-5 rounded-2xl border border-red-400/20 bg-black/20 p-4">
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-red-300">
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

              <div className="hidden h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 md:flex">
                <StatusIcon className={`h-8 w-8 ${merchantMeta.color}`} />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-[2.5rem] border border-white/5 bg-[#111] p-8 shadow-xl"
          >
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
              Prochaine action
            </p>

            <h3 className="mb-3 text-2xl font-black uppercase italic tracking-tight">
              {merchantStatus === "Approved"
                ? "Développer votre activité"
                : merchantStatus === "Pending"
                ? "Suivre votre demande"
                : merchantStatus === "Rejected"
                ? "Corriger votre dossier"
                : "Passer au niveau supérieur"}
            </h3>

            <p className="mb-6 text-sm leading-relaxed text-white/50">
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

                router.push("/dashboard/become-merchant");
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

        <div className="rounded-[2.5rem] border border-white/5 bg-[#111] p-8 shadow-xl">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                Vos équipes suivies
              </p>
              <h3 className="text-2xl font-black uppercase italic tracking-tight">
                Matchs à venir
              </h3>
            </div>

            <button
              onClick={() => router.push("/matches")}
              className="self-start rounded-2xl border border-[#facc15]/30 bg-[#facc15]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#facc15] transition hover:bg-[#facc15] hover:text-black"
            >
              Voir tous les matchs
            </button>
          </div>

          {matchesLoading ? (
            <div className="flex items-center justify-center py-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-10 w-10 rounded-full border-2 border-[#facc15] border-t-transparent"
              />
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-[2rem] border border-white/5 bg-white/[0.03] px-6 py-8 text-center">
              <p className="text-lg font-bold text-white">
                Aucune équipe suivie
              </p>
              <p className="mt-2 text-sm text-white/45">
                Ajoute des équipes dans ton profil pour voir ici leurs prochains
                matchs.
              </p>
            </div>
          ) : followedMatches.length === 0 ? (
            <div className="rounded-[2rem] border border-white/5 bg-white/[0.03] px-6 py-8 text-center">
              <p className="text-lg font-bold text-white">
                Aucun match à venir
              </p>
              <p className="mt-2 text-sm text-white/45">
                Il n’y a pas encore de match programmé pour les équipes que tu
                suis.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {followedMatches.slice(0, 6).map((match) => (
                <FollowedMatchMiniCard
                  key={match.id}
                  match={match}
                  onPlanMatch={(selectedMatch) =>
                    router.push(`/dashboard/match-day?matchId=${selectedMatch.id}`)
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Panel title="Résumé du profil" icon={User}>
            <div className="space-y-3 text-sm text-white/70">
              <Row label="Prénom" value={profile?.userProfile?.prenom || "-"} />
              <Row label="Nom" value={profile?.userProfile?.nom || "-"} />
              <Row
                label="Langue"
                value={profile?.userProfile?.langue || "-"}
              />
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
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
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
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Équipes suivies
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
                      Aucune équipe suivie enregistrée.
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
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                Accès rapides
              </p>
              <h3 className="text-2xl font-black uppercase italic tracking-tight">
                Vos actions principales
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                  <h4 className="mb-2 text-base font-black uppercase tracking-tight">
                    {action.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-white/45">
                    {action.desc}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[2.5rem] p-[1px]">
          <div className="absolute inset-0 bg-transparent">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0%,#facc15_25%,transparent_50%,#facc15_75%,transparent_100%)] opacity-20"
            />
          </div>

          <div className="relative rounded-[2.45rem] border border-white/5 bg-[#0A0A0A]/80 p-8 backdrop-blur-3xl lg:p-12">
            <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="flex items-center gap-3 text-3xl font-black uppercase italic tracking-tighter">
                  <Newspaper className="text-[#facc15]" /> Actualités GOMATCH
                </h3>
              </div>
              <button className="self-start rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-[#facc15] hover:text-black">
                Tout explorer
              </button>
            </div>

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              <motion.div
                whileHover={{ y: -5 }}
                className="group relative aspect-[16/10] cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 shadow-2xl lg:col-span-7"
              >
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000')] bg-cover bg-center transition-all duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute left-6 top-6">
                  <span className="flex items-center gap-2 rounded-lg bg-[#facc15] px-4 py-1.5 text-[9px] font-[1000] uppercase tracking-tighter text-black shadow-lg">
                    <Zap size={12} fill="currentColor" /> Live
                  </span>
                </div>
                <div className="absolute bottom-8 left-8 right-8">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#facc15]">
                    Grand Stade de Casablanca
                  </p>
                  <h4 className="text-3xl font-black uppercase italic leading-none tracking-tighter transition-colors group-hover:text-[#facc15] md:text-4xl">
                    L&apos;avancement des travaux
                    <br />
                    en direct du chantier
                  </h4>
                </div>
              </motion.div>

              <div className="flex flex-col justify-between space-y-4 py-2 lg:col-span-5">
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
      <div className="mb-6 flex items-center gap-3">
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
      <span className="text-right font-semibold text-white/80">{value}</span>
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
      className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#111] p-8 shadow-xl transition-all duration-500 hover:border-[#facc15]/40"
    >
      <div className="absolute -right-4 -top-4 rounded-full bg-white/5 p-10 transition-colors group-hover:bg-[#facc15]/10">
        <Icon
          size={40}
          className="text-white/5 transition-colors group-hover:text-[#facc15]/20"
        />
      </div>
      <p className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
        <Icon size={12} style={{ color }} /> {title}
      </p>
      <div className="relative z-10">
        <span className="text-6xl font-[1000] italic tracking-tighter transition-colors duration-500 group-hover:text-[#facc15]">
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
    <div className="group flex cursor-pointer items-center gap-6 rounded-2xl border border-transparent p-5 transition-all duration-300 hover:border-white/10 hover:bg-white/5">
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-white/5 bg-[#facc15]/5 transition-all group-hover:border-[#facc15]/50">
        <ArrowUpRight
          size={20}
          className="text-white/20 transition-all group-hover:text-[#facc15]"
        />
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-widest text-[#facc15]">
            {category}
          </p>
          <span className="text-[9px] font-bold uppercase text-white/20">
            {date}
          </span>
        </div>
        <p className="text-sm font-bold leading-tight text-white/70 transition-colors group-hover:text-white">
          {title}
        </p>
      </div>
    </div>
  );
}