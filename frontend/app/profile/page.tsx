"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as Flags from "country-flag-icons/react/3x2";
import {
  ArrowLeft,
  User,
  Mail,
  CalendarDays,
  Shield,
  Globe,
  Camera,
  Heart,
  Trophy,
  CheckCircle2,
  CircleAlert,
  ChevronRight,
  LayoutGrid,
  Info,
  Star,
  Layers3,
  BadgeCheck,
} from "lucide-react";
import { authFetch } from "@/lib/authApi";
import {
  findWorldCupTeam,
  type CountryCode,
} from "@/lib/world-cup-2026";

type AnyObj = Record<string, unknown>;

type ProfileData = {
  prenom: string;
  nom: string;
  email: string;
  dateNaissance: string;
  genre: string;
  photoUrl: string;
  langue: string;
  inscriptionTerminee: boolean;
  preferences: string[];
  equipesSuivies: string[];
};

type TabKey = "overview" | "infos" | "preferences" | "other";

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  const candidates = [
    "gomatch_access_token",
    "access_token",
    "accessToken",
    "token",
    "jwt",
    "auth_token",
  ];

  for (const key of candidates) {
    const value = localStorage.getItem(key);
    if (value && value.trim()) return value.trim();
  }

  return null;
}

function decodeJwtPayload(token: string): AnyObj | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    const json = atob(padded);
    return JSON.parse(json) as AnyObj;
  } catch {
    return null;
  }
}

function getEmailFromToken(token: string | null): string {
  if (!token) return "";

  const payload = decodeJwtPayload(token);
  if (!payload) return "";

  const candidates = [
    "email",
    "Email",
    "unique_name",
    "upn",
    "preferred_username",
    "sub",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
  ];

  for (const key of candidates) {
    const value = payload[key];
    if (typeof value === "string" && value.trim() && value.includes("@")) {
      return value.trim();
    }
  }

  return "";
}

function pickString(obj: AnyObj, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function pickBoolean(obj: AnyObj, keys: string[]): boolean {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "boolean") return value;
  }
  return false;
}

function parseJsonArray(value: string): string[] {
  if (!value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (x): x is string => typeof x === "string" && x.trim().length > 0
      );
    }
    return [];
  } catch {
    return [];
  }
}

function normalizePhotoApiUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";

  if (
    trimmed === "/profile/me/photo" ||
    trimmed === "/me/photo" ||
    trimmed === "/api/touriste/profile/me/photo"
  ) {
    return "/profile/me/photo";
  }

  return trimmed;
}

function formatDate(value: string) {
  if (!value) return "Non renseignée";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function mapGenre(value: string) {
  const v = value.trim().toLowerCase();

  if (v === "0" || v === "homme" || v === "male") return "Homme";
  if (v === "1" || v === "femme" || v === "female") return "Femme";

  return value || "Non renseigné";
}

function mapLangue(value: string) {
  const v = value.trim().toUpperCase();

  if (v === "0" || v === "FR") return "Français";
  if (v === "1" || v === "EN") return "Anglais";
  if (v === "2" || v === "AR") return "Arabe";

  return value || "Non renseignée";
}

function getInitials(prenom: string, nom: string) {
  const a = prenom.trim().charAt(0).toUpperCase();
  const b = nom.trim().charAt(0).toUpperCase();
  return `${a}${b}`.trim() || "GM";
}

async function tryReadErrorMessage(res: Response): Promise<string | null> {
  try {
    const text = await res.text();

    if (!text.trim()) return null;

    try {
      const payload = JSON.parse(text) as AnyObj;
      if (typeof payload.message === "string" && payload.message.trim()) {
        return payload.message.trim();
      }
      if (typeof payload.error === "string" && payload.error.trim()) {
        return payload.error.trim();
      }
      if (typeof payload.title === "string" && payload.title.trim()) {
        return payload.title.trim();
      }
      if (typeof payload.detail === "string" && payload.detail.trim()) {
        return payload.detail.trim();
      }
    } catch {
      return text.trim();
    }

    return text.trim();
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const activeBlobUrlRef = useRef<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [imageError, setImageError] = useState(false);
  const [resolvedPhotoUrl, setResolvedPhotoUrl] = useState("");

  const [profile, setProfile] = useState<ProfileData>({
    prenom: "",
    nom: "",
    email: "",
    dateNaissance: "",
    genre: "",
    photoUrl: "",
    langue: "",
    inscriptionTerminee: false,
    preferences: [],
    equipesSuivies: [],
  });

  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, []);

  const replaceBlobUrl = useCallback((nextUrl: string) => {
    if (
      activeBlobUrlRef.current &&
      activeBlobUrlRef.current.startsWith("blob:") &&
      activeBlobUrlRef.current !== nextUrl
    ) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
    }

    activeBlobUrlRef.current = nextUrl.startsWith("blob:") ? nextUrl : null;
  }, []);

  const loadProtectedPhoto = useCallback(
    async (url: string): Promise<string> => {
      const res = await authFetch(url, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Impossible de charger la photo. (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      replaceBlobUrl(blobUrl);
      return blobUrl;
    },
    [replaceBlobUrl]
  );

  const loadProfile = useCallback(async () => {
    try {
      setError("");
      setImageError(false);

      const res = await authFetch("/profile/me", {
        method: "GET",
        cache: "no-store",
      });

      if (res.status === 401) {
        router.replace("/signin");
        return;
      }

      if (!res.ok) {
        const message = await tryReadErrorMessage(res);
        setError(
          message ?? `Impossible de charger le profil. (HTTP ${res.status})`
        );
        return;
      }

      const data = (await res.json()) as AnyObj;
      const token = getStoredAccessToken();
      const emailFromApi = pickString(data, ["email", "Email"]);
      const emailFromToken = getEmailFromToken(token);

      const userProfile =
        data.userProfile && typeof data.userProfile === "object"
          ? (data.userProfile as AnyObj)
          : {};

      const nextProfile: ProfileData = {
        prenom: pickString(userProfile, [
          "prenom",
          "Prenom",
          "firstName",
          "FirstName",
        ]),
        nom: pickString(userProfile, [
          "nom",
          "Nom",
          "lastName",
          "LastName",
        ]),
        email: emailFromApi || emailFromToken,
        dateNaissance: pickString(userProfile, [
          "dateNaissance",
          "DateNaissance",
          "birthDate",
          "BirthDate",
        ]),
        genre: pickString(userProfile, ["genre", "Genre"]),
        photoUrl: normalizePhotoApiUrl(
          pickString(userProfile, ["photoUrl", "PhotoUrl", "photo", "Photo"])
        ),
        langue: pickString(userProfile, ["langue", "Langue"]),
        inscriptionTerminee: pickBoolean(data, [
          "inscriptionTerminee",
          "InscriptionTerminee",
          "onboardingCompleted",
          "OnboardingCompleted",
        ]),
        preferences: parseJsonArray(
          pickString(data, ["preferencesJson", "PreferencesJson"])
        ),
        equipesSuivies: parseJsonArray(
          pickString(data, ["equipesSuiviesJson", "EquipesSuiviesJson"])
        ),
      };

      setProfile(nextProfile);

      if (nextProfile.photoUrl) {
        try {
          const photoBlobUrl = await loadProtectedPhoto(nextProfile.photoUrl);
          setResolvedPhotoUrl(photoBlobUrl);
        } catch {
          replaceBlobUrl("");
          setResolvedPhotoUrl("");
          setImageError(true);
        }
      } else {
        replaceBlobUrl("");
        setResolvedPhotoUrl("");
      }
    } catch {
      setError("Erreur réseau : impossible de charger le profil.");
    } finally {
      setLoading(false);
    }
  }, [loadProtectedPhoto, replaceBlobUrl, router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const fullName = useMemo(() => {
    return `${profile.prenom} ${profile.nom}`.trim() || "Profil GoMatch";
  }, [profile.prenom, profile.nom]);

  const completionScore = useMemo(() => {
    let score = 0;
    if (profile.prenom) score += 15;
    if (profile.nom) score += 15;
    if (profile.email) score += 15;
    if (profile.dateNaissance) score += 10;
    if (profile.genre) score += 10;
    if (profile.langue) score += 10;
    if (resolvedPhotoUrl) score += 10;
    if (profile.preferences.length > 0) score += 10;
    if (profile.equipesSuivies.length > 0) score += 5;
    return Math.min(score, 100);
  }, [profile, resolvedPhotoUrl]);

  const tabs: { key: TabKey; label: string; icon: ReactNode }[] = [
    {
      key: "overview",
      label: "Vue générale",
      icon: <LayoutGrid className="h-4 w-4" />,
    },
    {
      key: "infos",
      label: "Informations",
      icon: <Info className="h-4 w-4" />,
    },
    {
      key: "preferences",
      label: "Préférences",
      icon: <Star className="h-4 w-4" />,
    },
    {
      key: "other",
      label: "Autres",
      icon: <Layers3 className="h-4 w-4" />,
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-12 w-40 rounded-xl bg-slate-200" />
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="h-[520px] rounded-3xl bg-slate-200" />
              <div className="space-y-6">
                <div className="h-20 rounded-3xl bg-slate-200" />
                <div className="h-72 rounded-3xl bg-slate-200" />
                <div className="h-72 rounded-3xl bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          <div className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Mon profil
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_0_24px_rgba(245,158,11,0.10)]">
            <div className="border-b border-slate-200 bg-white p-6">
              <div className="flex flex-col items-center text-center">
                {!imageError && resolvedPhotoUrl ? (
                  <div className="mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-slate-200 bg-white shadow-md">
                    <img
                      src={resolvedPhotoUrl}
                      alt="Photo de profil"
                      className="h-full w-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-200 bg-white text-2xl font-semibold text-slate-700 shadow-md">
                    {getInitials(profile.prenom, profile.nom)}
                  </div>
                )}

                <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
                <p className="mt-1 break-all text-sm text-slate-500">
                  {profile.email || "Email non renseigné"}
                </p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700">
                  {profile.inscriptionTerminee ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Profil complété</span>
                    </>
                  ) : (
                    <>
                      <CircleAlert className="h-4 w-4 text-amber-600" />
                      <span>Profil incomplet</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">
                    Complétion du profil
                  </p>
                  <span className="text-lg font-semibold text-slate-900">
                    {completionScore}%
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                    style={{ width: `${completionScore}%` }}
                  />
                </div>

                <p className="mt-3 text-xs leading-6 text-slate-500">
                  Un profil complet améliore la personnalisation de l’expérience.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <Link
                  href="/profile/edit"
                  className="group inline-flex w-full items-center justify-between rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800 hover:shadow-[0_0_22px_rgba(15,23,42,0.22)]"
                >
                  <span>Compléter / Modifier</span>
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/dashboard"
                  className="group inline-flex w-full items-center justify-between rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:shadow-[0_0_18px_rgba(148,163,184,0.16)]"
                >
                  <span>Retour dashboard</span>
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <MiniMetric label="Préférences" value={`${profile.preferences.length}`} />
                <MiniMetric label="Pays" value={`${profile.equipesSuivies.length}`} />
                <MiniMetric
                  label="Photo"
                  value={resolvedPhotoUrl && !imageError ? "Oui" : "Non"}
                />
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-[0_0_22px_rgba(99,102,241,0.08)]">
              <div className="flex flex-wrap gap-3">
                {tabs.map((tab) => {
                  const active = activeTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={[
                        "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition",
                        active
                          ? "bg-slate-900 text-white shadow-[0_0_18px_rgba(15,23,42,0.18)]"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                      ].join(" ")}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                exit={reducedMotion ? {} : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {activeTab === "overview" && (
                  <>
                    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                      <SectionCard
                        title="Informations principales"
                        subtitle="Vue d’ensemble des données essentielles du compte"
                        icon={
                          <IconBox tone="amber">
                            <BadgeCheck className="h-5 w-5 text-amber-600" />
                          </IconBox>
                        }
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <InfoCard
                            icon={<User className="h-4 w-4 text-sky-600" />}
                            label="Prénom"
                            value={profile.prenom || "Non renseigné"}
                          />
                          <InfoCard
                            icon={<User className="h-4 w-4 text-sky-600" />}
                            label="Nom"
                            value={profile.nom || "Non renseigné"}
                          />
                          <InfoCard
                            icon={<Mail className="h-4 w-4 text-violet-600" />}
                            label="Email"
                            value={profile.email || "Non renseigné"}
                          />
                          <InfoCard
                            icon={<CalendarDays className="h-4 w-4 text-emerald-600" />}
                            label="Date de naissance"
                            value={formatDate(profile.dateNaissance)}
                          />
                        </div>
                      </SectionCard>

                      <SectionCard
                        title="Résumé du statut"
                        subtitle="Indicateurs clés de ton profil"
                        icon={
                          <IconBox tone="blue">
                            <Info className="h-5 w-5 text-blue-600" />
                          </IconBox>
                        }
                      >
                        <div className="grid gap-3">
                          <StatRow
                            label="Profil complété"
                            value={profile.inscriptionTerminee ? "Oui" : "Non"}
                          />
                          <StatRow
                            label="Préférences enregistrées"
                            value={`${profile.preferences.length}`}
                          />
                          <StatRow
                            label="Pays suivis"
                            value={`${profile.equipesSuivies.length}`}
                          />
                          <StatRow
                            label="Photo disponible"
                            value={resolvedPhotoUrl && !imageError ? "Oui" : "Non"}
                          />
                        </div>
                      </SectionCard>
                    </section>

                    <section className="grid gap-6 md:grid-cols-3">
                      <StatCard
                        label="Complétion"
                        value={`${completionScore}%`}
                        note="Progression globale"
                      />
                      <StatCard
                        label="Préférences"
                        value={`${profile.preferences.length}`}
                        note="Centres d’intérêt"
                      />
                      <StatCard
                        label="Pays suivis"
                        value={`${profile.equipesSuivies.length}`}
                        note="Sélections favorites"
                      />
                    </section>
                  </>
                )}

                {activeTab === "infos" && (
                  <SectionCard
                    title="Informations personnelles"
                    subtitle="Données détaillées du compte"
                    icon={
                      <IconBox tone="blue">
                        <User className="h-5 w-5 text-blue-600" />
                      </IconBox>
                    }
                  >
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <InfoCard
                        icon={<User className="h-4 w-4 text-sky-600" />}
                        label="Prénom"
                        value={profile.prenom || "Non renseigné"}
                      />
                      <InfoCard
                        icon={<User className="h-4 w-4 text-sky-600" />}
                        label="Nom"
                        value={profile.nom || "Non renseigné"}
                      />
                      <InfoCard
                        icon={<Mail className="h-4 w-4 text-violet-600" />}
                        label="Email"
                        value={profile.email || "Non renseigné"}
                      />
                      <InfoCard
                        icon={<CalendarDays className="h-4 w-4 text-emerald-600" />}
                        label="Date de naissance"
                        value={formatDate(profile.dateNaissance)}
                      />
                      <InfoCard
                        icon={<Shield className="h-4 w-4 text-rose-600" />}
                        label="Genre"
                        value={mapGenre(profile.genre)}
                      />
                      <InfoCard
                        icon={<Globe className="h-4 w-4 text-amber-600" />}
                        label="Langue"
                        value={mapLangue(profile.langue)}
                      />
                    </div>
                  </SectionCard>
                )}

                {activeTab === "preferences" && (
                  <div className="grid gap-6">
                    <SectionCard
                      title="Préférences"
                      subtitle="Centres d’intérêt sélectionnés"
                      icon={
                        <IconBox tone="rose">
                          <Heart className="h-5 w-5 text-rose-600" />
                        </IconBox>
                      }
                    >
                      {profile.preferences.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {profile.preferences.map((item) => (
                            <TagChip key={item} text={item} />
                          ))}
                        </div>
                      ) : (
                        <EmptyState text="Aucune préférence enregistrée pour le moment." />
                      )}
                    </SectionCard>

                    <SectionCard
                      title="Pays suivis"
                      subtitle="Sélections que l’utilisateur souhaite suivre"
                      icon={
                        <IconBox tone="amber">
                          <Trophy className="h-5 w-5 text-amber-600" />
                        </IconBox>
                      }
                    >
                      {profile.equipesSuivies.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {profile.equipesSuivies.map((item) => {
                            const team = findWorldCupTeam(item);
                            const Flag = team ? Flags[team.code as CountryCode] : null;

                            return (
                              <div
                                key={item}
                                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-300 hover:shadow-[0_0_18px_rgba(245,158,11,0.10)]"
                              >
                                {Flag ? (
                                  <Flag
                                    title={team?.label ?? item}
                                    className="h-4 w-6 shrink-0 rounded-[3px] shadow-sm"
                                  />
                                ) : (
                                  <div className="flex h-4 w-6 shrink-0 items-center justify-center rounded-[3px] bg-slate-200 text-[9px] font-bold text-slate-600">
                                    --
                                  </div>
                                )}
                                <span className="text-sm font-medium text-slate-800">
                                  {team?.label ?? item}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <EmptyState text="Aucun pays suivi enregistré pour le moment." />
                      )}
                    </SectionCard>
                  </div>
                )}

                {activeTab === "other" && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <SectionCard
                      title="Autres informations"
                      subtitle="Éléments complémentaires du profil"
                      icon={
                        <IconBox tone="violet">
                          <Layers3 className="h-5 w-5 text-violet-600" />
                        </IconBox>
                      }
                    >
                      <div className="grid gap-4">
                        <InfoCard
                          icon={<Camera className="h-4 w-4 text-amber-600" />}
                          label="Photo de profil"
                          value={
                            resolvedPhotoUrl && !imageError
                              ? "Disponible"
                              : "Non renseignée"
                          }
                        />
                        <InfoCard
                          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                          label="Statut du compte"
                          value={
                            profile.inscriptionTerminee
                              ? "Inscription terminée"
                              : "Inscription incomplète"
                          }
                        />
                        <InfoCard
                          icon={<Info className="h-4 w-4 text-blue-600" />}
                          label="Niveau de complétion"
                          value={`${completionScore}%`}
                        />
                      </div>
                    </SectionCard>

                    <SectionCard
                      title="Résumé rapide"
                      subtitle="Synthèse utile du profil"
                      icon={
                        <IconBox tone="amber">
                          <Star className="h-5 w-5 text-amber-600" />
                        </IconBox>
                      }
                    >
                      <div className="space-y-3">
                        <SummaryLine label="Nom complet" value={fullName} />
                        <SummaryLine label="Langue" value={mapLangue(profile.langue)} />
                        <SummaryLine label="Genre" value={mapGenre(profile.genre)} />
                        <SummaryLine
                          label="Nombre de préférences"
                          value={`${profile.preferences.length}`}
                        />
                        <SummaryLine
                          label="Nombre de pays suivis"
                          value={`${profile.equipesSuivies.length}`}
                        />
                      </div>
                    </SectionCard>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_0_24px_rgba(99,102,241,0.08)]">
      <div className="mb-6 flex items-start gap-4">
        {icon}
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function IconBox({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "amber" | "blue" | "rose" | "violet";
}) {
  const toneClass =
    tone === "amber"
      ? "bg-amber-50"
      : tone === "blue"
      ? "bg-blue-50"
      : tone === "rose"
      ? "bg-rose-50"
      : tone === "violet"
      ? "bg-violet-50"
      : "bg-slate-100";

  return (
    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
      {children}
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:shadow-[0_0_16px_rgba(148,163,184,0.12)]">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <p className="break-words text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-all duration-300 hover:shadow-[0_0_16px_rgba(245,158,11,0.08)]">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.08)]">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition-all duration-300 hover:shadow-[0_0_14px_rgba(148,163,184,0.12)]">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function TagChip({ text }: { text: string }) {
  return (
    <span className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-300 hover:border-amber-300 hover:shadow-[0_0_14px_rgba(245,158,11,0.10)]">
      {text}
    </span>
  );
}

function SummaryLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition-all duration-300 hover:shadow-[0_0_14px_rgba(148,163,184,0.12)]">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
      {text}
    </div>
  );
}