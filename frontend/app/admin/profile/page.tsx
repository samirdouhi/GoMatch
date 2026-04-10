"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Mail,
  UserCircle2,
  BadgeCheck,
  Lock,
  Building2,
  Briefcase,
  Phone,
  RefreshCcw,
  TriangleAlert,
} from "lucide-react";
import {
  getMyAdminProfile,
  getMyAdminProfileStatus,
  initMyAdminProfile,
  updateMyAdminProfile,
  updateMyUserProfile,
  type AdminProfileResponse,
  type AdminProfileStatusResponse,
} from "@/lib/adminProfileApi";

type AnyObj = Record<string, unknown>;

const GENRE_OPTIONS = [
  { value: "", label: "Sélectionner un genre" },
  { value: "Homme", label: "Homme" },
  { value: "Femme", label: "Femme" },
];

const LANGUE_OPTIONS = [
  { value: "FR", label: "Français" },
  { value: "EN", label: "Anglais" },
  { value: "AR", label: "Arabe" },
];

const DEPARTEMENT_OPTIONS = [
  { value: "", label: "Sélectionner un département" },
  { value: "Administration", label: "Administration" },
  { value: "Validation", label: "Validation" },
  { value: "Modération", label: "Modération" },
  { value: "Support", label: "Support" },
  { value: "Technique", label: "Technique" },
  { value: "Supervision", label: "Supervision" },
];

const FONCTION_OPTIONS = [
  { value: "", label: "Sélectionner une fonction" },
  { value: "Administrateur principal", label: "Administrateur principal" },
  { value: "Administrateur plateforme", label: "Administrateur plateforme" },
  { value: "Responsable validation", label: "Responsable validation" },
  { value: "Modérateur", label: "Modérateur" },
  { value: "Superviseur", label: "Superviseur" },
];

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

function pickFirst(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "Non renseigné";
}

function formatDate(value?: string | null) {
  if (!value) return "Non renseignée";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("fr-FR");
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfileResponse | null>(null);
  const [profileStatus, setProfileStatus] =
    useState<AdminProfileStatusResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [needsInit, setNeedsInit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [prenomInput, setPrenomInput] = useState("");
  const [nomInput, setNomInput] = useState("");
  const [dateNaissanceInput, setDateNaissanceInput] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const [langueInput, setLangueInput] = useState("FR");

  const [departementInput, setDepartementInput] = useState("");
  const [fonctionInput, setFonctionInput] = useState("");
  const [telephoneProfessionnelInput, setTelephoneProfessionnelInput] =
    useState("");

  function hydrateForm(data: AdminProfileResponse) {
    setPrenomInput(data.userProfile?.prenom ?? "");
    setNomInput(data.userProfile?.nom ?? "");
    setDateNaissanceInput(toDateInputValue(data.userProfile?.dateNaissance));
    setGenreInput(data.userProfile?.genre ?? "");
    setLangueInput(data.userProfile?.langue || "FR");

    setDepartementInput(data.departement ?? "");
    setFonctionInput(data.fonction ?? "");
    setTelephoneProfessionnelInput(data.telephoneProfessionnel ?? "");
  }

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const status = await getMyAdminProfileStatus();
      setProfileStatus(status);

      if (status.needsInitialization || !status.adminProfileExists) {
        setProfile(null);
        setNeedsInit(true);
        setIsEditing(false);
        return;
      }

      const data = await getMyAdminProfile();
      setProfile(data);
      hydrateForm(data);
      setNeedsInit(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de charger le profil administrateur.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleInitProfile() {
    try {
      setInitializing(true);
      setError(null);
      setSuccessMessage(null);

      const data = await initMyAdminProfile();
      setProfile(data);
      hydrateForm(data);
      setNeedsInit(false);

      const status = await getMyAdminProfileStatus();
      setProfileStatus(status);

      window.dispatchEvent(new Event("admin-profile-status-changed"));
      setSuccessMessage("Profil administrateur initialisé avec succès.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible d’initialiser le profil administrateur.";
      setError(message);
    } finally {
      setInitializing(false);
    }
  }

  async function handleSaveProfile() {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await updateMyUserProfile({
        prenom: prenomInput.trim(),
        nom: nomInput.trim(),
        dateNaissance: dateNaissanceInput,
        genre: genreInput.trim(),
        langue: langueInput.trim() || "FR",
      });

      await updateMyAdminProfile({
        departement: departementInput.trim() || undefined,
        fonction: fonctionInput.trim() || undefined,
        telephoneProfessionnel:
          telephoneProfessionnelInput.trim() || undefined,
      });

      await loadProfile();
      setIsEditing(false);

      window.dispatchEvent(new Event("admin-profile-status-changed"));
      setSuccessMessage("Profil administrateur mis à jour avec succès.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour le profil administrateur.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const emailFromToken = useMemo(() => {
    const token = getStoredAccessToken();
    return getEmailFromToken(token);
  }, []);

  const prenom = useMemo(
    () => pickFirst(profile?.userProfile?.prenom),
    [profile]
  );

  const nom = useMemo(
    () => pickFirst(profile?.userProfile?.nom),
    [profile]
  );

  const email = useMemo(
    () => pickFirst(profile?.userProfile?.email, emailFromToken),
    [profile, emailFromToken]
  );

  const dateNaissance = useMemo(
    () => formatDate(profile?.userProfile?.dateNaissance),
    [profile]
  );

  const departement = useMemo(
    () => pickFirst(profile?.departement),
    [profile]
  );

  const fonction = useMemo(
    () => pickFirst(profile?.fonction),
    [profile]
  );

  const telephoneProfessionnel = useMemo(
    () => pickFirst(profile?.telephoneProfessionnel),
    [profile]
  );

  const inscriptionTerminee = profile?.inscriptionTerminee ? "Oui" : "Non";

  const initials = `${prenom !== "Non renseigné" ? prenom[0] : "A"}${
    nom !== "Non renseigné" ? nom[0] : "D"
  }`.toUpperCase();

  const isIncomplete =
    !!profileStatus &&
    profileStatus.adminProfileExists &&
    !profileStatus.isComplete;

  return (
    <div className="space-y-8 text-white">
      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-400">
                Profil administrateur
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight">
              Mon profil admin
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Espace dédié aux informations du compte administrateur et à la
              supervision de la plateforme.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {profile && (
              <button
                type="button"
                onClick={() => {
                  if (isEditing && profile) {
                    hydrateForm(profile);
                  }
                  setSuccessMessage(null);
                  setError(null);
                  setIsEditing((prev) => !prev);
                }}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
              >
                {isEditing ? "Annuler" : "Modifier"}
              </button>
            )}

            <button
              type="button"
              onClick={loadProfile}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
            >
              <RefreshCcw className="h-4 w-4" />
              Actualiser
            </button>

            <button
              type="button"
              onClick={handleInitProfile}
              disabled={initializing || !needsInit}
              className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/15 disabled:opacity-50"
            >
              {initializing ? "Initialisation..." : "Initialiser le profil"}
            </button>
          </div>
        </div>
      </section>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-zinc-300">
          Chargement du profil administrateur...
        </div>
      )}

      {!loading && needsInit && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6">
          <p className="font-semibold text-amber-300">
            Le profil admin n’est pas encore initialisé.
          </p>
          <p className="mt-2 text-sm text-amber-100/80">
            Clique sur “Initialiser le profil” pour créer automatiquement
            l’entrée AdminProfile liée à ton compte.
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <p className="font-semibold text-red-300">{error}</p>
        </div>
      )}

      {!loading && successMessage && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
          <p className="font-semibold text-emerald-300">{successMessage}</p>
        </div>
      )}

      {!loading && isIncomplete && !needsInit && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 text-red-300" />
            <div>
              <p className="font-semibold text-red-300">
                Le profil administrateur est incomplet.
              </p>
              <p className="mt-2 text-sm text-red-200/80">
                Merci de compléter toutes les informations requises pour finaliser
                le profil.
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && profile && (
        <>
          {isEditing && (
            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight">
                  Modifier le profil administrateur
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Mets à jour les informations utilisateur et administrateur.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  value={prenomInput}
                  onChange={(e) => setPrenomInput(e.target.value)}
                  placeholder="Prénom"
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500"
                />

                <input
                  value={nomInput}
                  onChange={(e) => setNomInput(e.target.value)}
                  placeholder="Nom"
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500"
                />

                <input
                  type="date"
                  value={dateNaissanceInput}
                  onChange={(e) => setDateNaissanceInput(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                />

                <select
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                >
                  {GENRE_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-[#0b0f19]"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={langueInput}
                  onChange={(e) => setLangueInput(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                >
                  {LANGUE_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-[#0b0f19]"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={departementInput}
                  onChange={(e) => setDepartementInput(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                >
                  {DEPARTEMENT_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-[#0b0f19]"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={fonctionInput}
                  onChange={(e) => setFonctionInput(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                >
                  {FONCTION_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-[#0b0f19]"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>

                <input
                  value={telephoneProfessionnelInput}
                  onChange={(e) =>
                    setTelephoneProfessionnelInput(e.target.value)
                  }
                  placeholder="Téléphone professionnel"
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500"
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/15 disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-black/20 text-3xl font-black text-white">
                  {initials}
                </div>

                <h2 className="mt-5 text-2xl font-black tracking-tight">
                  {prenom} {nom !== "Non renseigné" ? nom : ""}
                </h2>

                <p className="mt-2 text-sm text-zinc-400">{email}</p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                  <BadgeCheck className="h-4 w-4" />
                  Rôle Admin confirmé
                </div>
              </div>
            </div>

            <div className="xl:col-span-2 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight">
                  Informations administrateur
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Données récupérées depuis le backend admin.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-zinc-400">
                    <UserCircle2 className="h-4 w-4 text-amber-400" />
                    <span className="text-xs uppercase tracking-[0.18em]">
                      Prénom
                    </span>
                  </div>
                  <p className="text-base font-semibold text-white">{prenom}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-zinc-400">
                    <UserCircle2 className="h-4 w-4 text-amber-400" />
                    <span className="text-xs uppercase tracking-[0.18em]">
                      Nom
                    </span>
                  </div>
                  <p className="text-base font-semibold text-white">{nom}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-zinc-400">
                    <Mail className="h-4 w-4 text-amber-400" />
                    <span className="text-xs uppercase tracking-[0.18em]">
                      Email
                    </span>
                  </div>
                  <p className="text-base font-semibold text-white">{email}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-zinc-400">
                    <Shield className="h-4 w-4 text-amber-400" />
                    <span className="text-xs uppercase tracking-[0.18em]">
                      Rôle
                    </span>
                  </div>
                  <p className="text-base font-semibold text-white">
                    Administrateur
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-zinc-400">
                    <Building2 className="h-4 w-4 text-amber-400" />
                    <span className="text-xs uppercase tracking-[0.18em]">
                      Département
                    </span>
                  </div>
                  <p className="text-base font-semibold text-white">
                    {departement}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-zinc-400">
                    <Briefcase className="h-4 w-4 text-amber-400" />
                    <span className="text-xs uppercase tracking-[0.18em]">
                      Fonction
                    </span>
                  </div>
                  <p className="text-base font-semibold text-white">
                    {fonction}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-zinc-400">
                    <Phone className="h-4 w-4 text-amber-400" />
                    <span className="text-xs uppercase tracking-[0.18em]">
                      Téléphone professionnel
                    </span>
                  </div>
                  <p className="text-base font-semibold text-white">
                    {telephoneProfessionnel}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-zinc-400">
                    <Lock className="h-4 w-4 text-amber-400" />
                    <span className="text-xs uppercase tracking-[0.18em]">
                      Inscription terminée
                    </span>
                  </div>
                  <p className="text-base font-semibold text-white">
                    {inscriptionTerminee}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                Date de naissance
              </p>
              <p className="mt-3 text-2xl font-black text-white">
                {dateNaissance}
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                État du compte
              </p>
              <p className="mt-3 text-2xl font-black text-white">Actif</p>
              <p className="mt-2 text-sm text-zinc-400">
                Compte administrateur opérationnel.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                Permissions
              </p>
              <p className="mt-3 text-2xl font-black text-white">Admin</p>
              <p className="mt-2 text-sm text-zinc-400">
                Accès aux modules de validation et de supervision.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}