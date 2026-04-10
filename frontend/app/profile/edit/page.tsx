"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as Flags from "country-flag-icons/react/3x2";
import Cropper, { Area, Point } from "react-easy-crop";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Heart,
  Info,
  Lock,
  Mail,
  Save,
  Star,
  Trophy,
  User,
  X,
} from "lucide-react";
import { authFetch } from "@/lib/authApi";
import {
  WORLD_CUP_2026_TEAMS,
  findWorldCupTeam,
  type CountryCode,
} from "@/lib/world-cup-2026";

type AnyObj = Record<string, unknown>;
type TabKey = "overview" | "infos" | "preferences" | "photo";

type ProfileFormData = {
  prenom: string;
  nom: string;
  dateNaissance: string;
  genre: string;
  langue: string;
  preferences: string[];
  equipesSuivies: string[];
  photoUrl: string;
};

type SecurityFormData = {
  currentEmail: string;
  newEmail: string;
  currentPasswordForEmail: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

type Option = {
  value: string;
  label: string;
  aliases?: string[];
};

const PROFILE_API = "/profile";
const AUTH_API = "/auth";

const GENRE_OPTIONS: Option[] = [
  { value: "Homme", label: "Homme" },
  { value: "Femme", label: "Femme" },
];

const LANGUE_OPTIONS: Option[] = [
  { value: "FR", label: "Français" },
  { value: "EN", label: "Anglais" },
  { value: "AR", label: "Arabe" },
];

const PREFERENCE_OPTIONS: Option[] = [
  { value: "Gastronomie", label: "Gastronomie" },
  { value: "Artisanat", label: "Artisanat" },
  { value: "Culture", label: "Culture" },
  { value: "Architecture", label: "Architecture" },
  { value: "Marchés", label: "Marchés" },
  { value: "Cafés", label: "Cafés" },
  { value: "Football", label: "Football" },
  { value: "Nature", label: "Nature" },
  { value: "Shopping", label: "Shopping" },
  { value: "Nightlife", label: "Nightlife" },
  { value: "Events", label: "Événements" },
  { value: "StreetFood", label: "Street Food" },
];

const PREFERENCE_LEGACY_ALIASES: Record<string, string> = {
  "cafes traditionnels": "Cafés",
  "cafés traditionnels": "Cafés",
  "restaurants locaux": "StreetFood",
  "evenements sportifs": "Events",
  "événements sportifs": "Events",
  musees: "Culture",
  musées: "Culture",
  patrimoine: "Architecture",
  souvenirs: "Shopping",
  balades: "Nature",
};

const TEAM_OPTIONS: Option[] = WORLD_CUP_2026_TEAMS.map((team) => ({
  value: team.id,
  label: team.label,
  aliases: team.aliases ?? [],
}));

function pickString(obj: AnyObj, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function pickArray(obj: AnyObj, keys: string[]): string[] {
  for (const key of keys) {
    const value = obj[key];
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      );
    }
  }
  return [];
}

function parseJsonArray(value: string): string[] {
  if (!value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
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
    return `${PROFILE_API}/me/photo`;
  }

  return trimmed;
}

function normalizeDateForInput(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function mapGenreFromApi(value: string): string {
  const v = value.trim().toLowerCase();
  if (v === "0" || v === "homme" || v === "male") return "Homme";
  if (v === "1" || v === "femme" || v === "female") return "Femme";
  return value || "";
}

function mapGenreToApi(value: string): string {
  const v = value.trim().toLowerCase();
  if (v === "homme") return "Homme";
  if (v === "femme") return "Femme";
  return value;
}

function mapLangueFromApi(value: string): string {
  const v = value.trim().toUpperCase();
  if (v === "0" || v === "FR") return "FR";
  if (v === "1" || v === "EN") return "EN";
  if (v === "2" || v === "AR") return "AR";
  return value || "";
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function toggleValue(values: string[], value: string): string[] {
  const normalized = value.trim();
  if (!normalized) return values;
  return values.includes(normalized)
    ? values.filter((item) => item !== normalized)
    : [...values, normalized];
}

function findPreferenceOption(rawValue: string): Option | null {
  const raw = rawValue.trim();
  if (!raw) return null;

  const direct = PREFERENCE_OPTIONS.find(
    (option) =>
      option.value === raw ||
      option.label === raw ||
      normalizeText(option.value) === normalizeText(raw) ||
      normalizeText(option.label) === normalizeText(raw)
  );

  if (direct) return direct;

  const legacyMapped = PREFERENCE_LEGACY_ALIASES[normalizeText(raw)];
  if (!legacyMapped) return null;

  return PREFERENCE_OPTIONS.find((option) => option.value === legacyMapped) ?? null;
}

function normalizePreferenceValues(values: string[]): string[] {
  return uniqueStrings(
    values
      .map((value) => findPreferenceOption(value)?.value ?? "")
      .filter(Boolean)
  );
}

function findTeamOption(rawValue: string): Option | null {
  const raw = rawValue.trim();
  if (!raw) return null;

  const direct = TEAM_OPTIONS.find(
    (option) =>
      option.value === raw ||
      option.label === raw ||
      normalizeText(option.value) === normalizeText(raw) ||
      normalizeText(option.label) === normalizeText(raw) ||
      option.aliases?.some((alias) => normalizeText(alias) === normalizeText(raw))
  );

  if (direct) return direct;

  const team = WORLD_CUP_2026_TEAMS.find(
    (item) =>
      item.id === raw ||
      item.label === raw ||
      normalizeText(item.id) === normalizeText(raw) ||
      normalizeText(item.label) === normalizeText(raw) ||
      item.aliases?.some((alias) => normalizeText(alias) === normalizeText(raw))
  );

  if (!team) return null;

  return TEAM_OPTIONS.find((option) => option.value === team.id) ?? null;
}

function normalizeTeamValues(values: string[]): string[] {
  return uniqueStrings(
    values
      .map((value) => findTeamOption(value)?.value ?? "")
      .filter(Boolean)
  );
}

async function tryReadErrorMessage(res: Response): Promise<string | null> {
  try {
    const text = await res.text();
    if (!text.trim()) return null;

    try {
      const json = JSON.parse(text) as AnyObj;
      if (typeof json.message === "string" && json.message.trim()) return json.message.trim();
      if (typeof json.error === "string" && json.error.trim()) return json.error.trim();
      if (typeof json.title === "string" && json.title.trim()) return json.title.trim();
      if (typeof json.detail === "string" && json.detail.trim()) return json.detail.trim();
    } catch {
      return text.trim();
    }

    return text.trim();
  } catch {
    return null;
  }
}

function getCompletionScore(form: ProfileFormData, hasPhoto: boolean) {
  let score = 0;
  if (form.prenom) score += 18;
  if (form.nom) score += 18;
  if (form.dateNaissance) score += 14;
  if (form.genre) score += 14;
  if (form.langue) score += 10;
  if (form.preferences.length > 0) score += 10;
  if (form.equipesSuivies.length > 0) score += 10;
  if (hasPhoto) score += 6;
  return Math.min(score, 100);
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas non disponible");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Impossible de créer l'image recadrée"));
        return;
      }
      resolve(blob);
    }, "image/jpeg", 0.95);
  });
}

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [imageError, setImageError] = useState(false);

  const [securityForm, setSecurityForm] = useState<SecurityFormData>({
    currentEmail: "",
    newEmail: "",
    currentPasswordForEmail: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawPhotoSrc, setRawPhotoSrc] = useState("");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [form, setForm] = useState<ProfileFormData>({
    prenom: "",
    nom: "",
    dateNaissance: "",
    genre: "",
    langue: "",
    preferences: [],
    equipesSuivies: [],
    photoUrl: "",
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
        throw new Error(`HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      replaceBlobUrl(blobUrl);
      return blobUrl;
    },
    [replaceBlobUrl]
  );

  const loadAuthDetails = useCallback(async () => {
    try {
      const res = await authFetch(`${AUTH_API}/me/details`, {
        method: "GET",
        cache: "no-store",
      });

      if (res.status === 401) {
        router.replace("/signin");
        return;
      }

      if (!res.ok) return;

      const data = (await res.json()) as AnyObj;
      const email = pickString(data, ["email", "Email"]);

      setSecurityForm((prev) => ({
        ...prev,
        currentEmail: email,
      }));
    } catch {
      // noop
    }
  }, [router]);

  const loadProfile = useCallback(async () => {
    try {
      setError("");
      setImageError(false);

      const res = await authFetch(`${PROFILE_API}/me`, {
        method: "GET",
        cache: "no-store",
      });

      if (res.status === 401) {
        router.replace("/signin");
        return;
      }

      if (!res.ok) {
        const message = await tryReadErrorMessage(res);
        setError(message ?? "Erreur de chargement.");
        return;
      }

      const data = (await res.json()) as AnyObj;

      const userProfile =
        data.userProfile && typeof data.userProfile === "object"
          ? (data.userProfile as AnyObj)
          : {};

      const photoUrlFromApi = normalizePhotoApiUrl(
        pickString(userProfile, [
          "photoUrl",
          "PhotoUrl",
          "avatarUrl",
          "AvatarUrl",
          "photo",
          "Photo",
        ])
      );

      let resolvedPhotoUrl = "";

      if (photoUrlFromApi) {
        try {
          resolvedPhotoUrl = await loadProtectedPhoto(photoUrlFromApi);
        } catch {
          resolvedPhotoUrl = "";
          replaceBlobUrl("");
          setImageError(true);
        }
      } else {
        replaceBlobUrl("");
      }

      setForm({
        prenom: pickString(userProfile, ["prenom", "Prenom", "firstName", "FirstName"]),
        nom: pickString(userProfile, ["nom", "Nom", "lastName", "LastName"]),
        dateNaissance: normalizeDateForInput(
          pickString(userProfile, [
            "dateNaissance",
            "DateNaissance",
            "birthDate",
            "BirthDate",
          ])
        ),
        genre: mapGenreFromApi(pickString(userProfile, ["genre", "Genre"])),
        langue: mapLangueFromApi(pickString(userProfile, ["langue", "Langue"])),
        preferences: normalizePreferenceValues(
          parseJsonArray(pickString(data, ["preferencesJson", "PreferencesJson"]))
        ),
        equipesSuivies: normalizeTeamValues(
          parseJsonArray(pickString(data, ["equipesSuiviesJson", "EquipesSuiviesJson"]))
        ),
        photoUrl: resolvedPhotoUrl,
      });
    } catch {
      setError("Erreur réseau : impossible de charger le profil.");
    } finally {
      setLoading(false);
    }
  }, [loadProtectedPhoto, replaceBlobUrl, router]);

  useEffect(() => {
    void loadProfile();
    void loadAuthDetails();
  }, [loadProfile, loadAuthDetails]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  const hasCurrentPhoto = Boolean(photoPreview || (form.photoUrl && !imageError));
  const completionScore = useMemo(
    () => getCompletionScore(form, hasCurrentPhoto),
    [form, hasCurrentPhoto]
  );

  const tabs = [
    { key: "overview" as const, label: "Général", icon: <User className="h-4 w-4" /> },
    { key: "infos" as const, label: "Infos", icon: <Info className="h-4 w-4" /> },
    { key: "preferences" as const, label: "Passions", icon: <Star className="h-4 w-4" /> },
    { key: "photo" as const, label: "Photo", icon: <Camera className="h-4 w-4" /> },
  ];

  const isValid =
    form.prenom.trim().length > 0 &&
    form.nom.trim().length > 0 &&
    form.dateNaissance.trim().length > 0 &&
    form.genre.trim().length > 0 &&
    form.langue.trim().length > 0;

  const currentPhoto = photoPreview || form.photoUrl;

  const handlePhotoPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;

      setRawPhotoSrc(result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const confirmCrop = async () => {
    if (!rawPhotoSrc || !croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(rawPhotoSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], "profile-photo.jpg", {
        type: "image/jpeg",
      });

      setPhotoFile(croppedFile);
      setCropModalOpen(false);
      setRawPhotoSrc("");
      setSuccess("Photo recadrée. Clique sur Appliquer pour l’envoyer.");
    } catch {
      setError("Impossible de recadrer la photo.");
    }
  };

  async function handlePhotoUpload() {
    if (!photoFile) {
      setSuccess("");
      setError("Sélectionnez une photo.");
      return;
    }

    try {
      setUploadingPhoto(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("photo", photoFile);

      const res = await authFetch(`${PROFILE_API}/me/photo`, {
        method: "POST",
        body: formData,
      });

      if (res.status === 401) {
        router.replace("/signin");
        return;
      }

      if (!res.ok) {
        const message = await tryReadErrorMessage(res);
        setError(message ?? "Erreur d'envoi.");
        return;
      }

      setPhotoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadProfile();
      setSuccess("Photo mise à jour !");
      setActiveTab("photo");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleEmailChange() {
    if (!securityForm.newEmail.trim()) {
      setError("Saisis le nouvel email.");
      return;
    }

    if (!securityForm.currentPasswordForEmail.trim()) {
      setError("Saisis le mot de passe actuel pour changer l’email.");
      return;
    }

    try {
      setChangingEmail(true);
      setError("");
      setSuccess("");

      const res = await authFetch(`${AUTH_API}/me/email`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: securityForm.newEmail.trim(),
          currentPassword: securityForm.currentPasswordForEmail,
        }),
      });

      if (res.status === 401) {
        router.replace("/signin");
        return;
      }

      if (!res.ok) {
        const message = await tryReadErrorMessage(res);
        setError(message ?? "Impossible de modifier l’email.");
        return;
      }

      setSecurityForm((prev) => ({
        ...prev,
        currentEmail: prev.newEmail.trim(),
        newEmail: "",
        currentPasswordForEmail: "",
      }));

      setSuccess("Email modifié avec succès.");
    } catch {
      setError("Erreur réseau lors du changement d’email.");
    } finally {
      setChangingEmail(false);
    }
  }

  async function handlePasswordChange() {
    if (!securityForm.currentPassword.trim()) {
      setError("Saisis le mot de passe actuel.");
      return;
    }

    if (!securityForm.newPassword.trim()) {
      setError("Saisis le nouveau mot de passe.");
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmNewPassword) {
      setError("La confirmation du nouveau mot de passe ne correspond pas.");
      return;
    }

    try {
      setChangingPassword(true);
      setError("");
      setSuccess("");

      const res = await authFetch(`${AUTH_API}/me/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: securityForm.currentPassword,
          newPassword: securityForm.newPassword,
        }),
      });

      if (res.status === 401) {
        router.replace("/signin");
        return;
      }

      if (!res.ok) {
        const message = await tryReadErrorMessage(res);
        setError(message ?? "Impossible de modifier le mot de passe.");
        return;
      }

      setSecurityForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      }));

      setSuccess("Mot de passe modifié avec succès.");
    } catch {
      setError("Erreur réseau lors du changement du mot de passe.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!isValid) {
      setSuccess("");
      setError("Remplissez tous les champs.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const profilePayload = {
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        dateNaissance: form.dateNaissance.includes("T")
          ? form.dateNaissance
          : `${form.dateNaissance}T00:00:00`,
        genre: mapGenreToApi(form.genre),
        langue: form.langue,
      };

      const profileRes = await authFetch(`${PROFILE_API}/me/user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });

      if (profileRes.status === 401) {
        router.replace("/signin");
        return;
      }

      if (!profileRes.ok) {
        const message = await tryReadErrorMessage(profileRes);
        setError(message ?? "Erreur profil.");
        return;
      }

      const prefRes = await authFetch(`${PROFILE_API}/me/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferencesJson: JSON.stringify(normalizePreferenceValues(form.preferences)),
          equipesSuiviesJson: JSON.stringify(normalizeTeamValues(form.equipesSuivies)),
        }),
      });

      if (prefRes.status === 401) {
        router.replace("/signin");
        return;
      }

      if (!prefRes.ok) {
        const message = await tryReadErrorMessage(prefRes);
        setError(message ?? "Erreur préférences.");
        return;
      }

      await loadProfile();
      setSuccess("Profil enregistré !");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#FFB800]/30">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/5 pb-6 md:flex-row md:items-center md:justify-between">
          <button
            onClick={() => router.back()}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
            Retour
          </button>

          <div className="rounded-xl bg-gradient-to-r from-[#FFB800] to-[#FF8A00] px-5 py-2.5 text-xs font-black text-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,184,0,0.2)]">
            Espace Membre GoMatch
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-[#FFB800]/20 bg-[#FFB800]/10 px-5 py-4 text-sm text-[#FFB800]">
            {success}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#121212] overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-b from-[#FFB800]/10 to-transparent p-8 text-center border-b border-white/5">
                <div className="relative mx-auto mb-5 h-32 w-32">
                  <div className="absolute inset-0 rounded-full border-2 border-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.4)]" />
                  <div className="h-full w-full overflow-hidden rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                    {currentPhoto && !imageError ? (
                      <Image
                        src={currentPhoto}
                        alt="Avatar"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-3xl font-black text-[#FFB800]">
                        {`${form.prenom.charAt(0)}${form.nom.charAt(0)}`.toUpperCase() || "GM"}
                      </span>
                    )}
                  </div>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-white uppercase">
                  {form.prenom || "Champion"}
                </h2>
                <p className="mt-1 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Membre Officiel
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div className="rounded-2xl bg-white/5 p-5 border border-white/5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      Progression Profil
                    </p>
                    <span className="text-sm font-black text-[#FFB800]">{completionScore}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FFB800] to-[#FF8A00] transition-all duration-700 shadow-[0_0_8px_#FFB800]"
                      style={{ width: `${completionScore}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <MiniMetricDark label="Préfs" value={`${form.preferences.length}`} />
                  <MiniMetricDark label="Équipes" value={`${form.equipesSuivies.length}`} />
                  <MiniMetricDark label="Langue" value={form.langue || "—"} />
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    form="edit-profile-form"
                    disabled={saving}
                    className="flex w-full items-center justify-between rounded-2xl bg-[#FFB800] px-6 py-4 text-sm font-black text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    {saving ? "SYNCHRONISATION..." : "ENREGISTRER"}
                    <Save className="h-4 w-4" />
                  </button>

                  <Link
                    href="/profile"
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    VOIR LE PROFIL
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <nav className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#121212] border border-white/5">
              {tabs.map((tab) => {
                const active = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest transition-all ${
                      active
                        ? "bg-[#FFB800] text-black shadow-lg"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <form
              id="edit-profile-form"
              onSubmit={handleSave}
              className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              {activeTab === "overview" && (
                <div className="grid gap-6">
                  <div className="rounded-3xl border border-white/10 bg-[#121212] p-8">
                    <div className="mb-8 flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/20">
                        <User className="h-6 w-6 text-[#FFB800]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold uppercase">Identité Joueur</h3>
                        <p className="text-xs text-gray-500 font-medium">
                          Informations visibles sur votre passeport GoMatch
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <DarkField label="Prénom">
                        <input
                          value={form.prenom}
                          onChange={(e) => setForm((p) => ({ ...p, prenom: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[#FFB800] outline-none transition"
                          placeholder="Ex: Amine"
                        />
                      </DarkField>

                      <DarkField label="Nom">
                        <input
                          value={form.nom}
                          onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[#FFB800] outline-none transition"
                          placeholder="Ex: Alaoui"
                        />
                      </DarkField>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "infos" && (
                <div className="space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-[#121212] overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-white/5 px-6 py-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/5">
                        <User className="h-5 w-5 text-[#FFB800]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-wide text-white">
                          Informations personnelles
                        </h3>
                        <p className="text-xs text-gray-500">
                          Données gérées par le profil utilisateur
                        </p>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        <DarkField label="Prénom">
                          <input
                            value={form.prenom}
                            onChange={(e) => setForm((p) => ({ ...p, prenom: e.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FFB800]"
                            placeholder="Prénom"
                          />
                        </DarkField>

                        <DarkField label="Nom">
                          <input
                            value={form.nom}
                            onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FFB800]"
                            placeholder="Nom"
                          />
                        </DarkField>

                        <DarkField label="Date de naissance">
                          <input
                            type="date"
                            value={form.dateNaissance}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, dateNaissance: e.target.value }))
                            }
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FFB800] scheme-dark"
                          />
                        </DarkField>

                        <DarkField label="Genre">
                          <DarkSelect
                            value={form.genre}
                            options={GENRE_OPTIONS}
                            onChange={(v) => setForm((p) => ({ ...p, genre: v }))}
                          />
                        </DarkField>

                        <DarkField label="Langue">
                          <DarkSelect
                            value={form.langue}
                            options={LANGUE_OPTIONS}
                            onChange={(v) => setForm((p) => ({ ...p, langue: v }))}
                          />
                        </DarkField>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-[#121212] overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-white/5 px-6 py-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/5">
                        <Mail className="h-5 w-5 text-[#FFB800]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-wide text-white">
                          Paramètres du compte
                        </h3>
                        <p className="text-xs text-gray-500">Email géré par AuthService</p>
                      </div>
                    </div>

                    <div className="divide-y divide-white/5">
                      <div className="grid gap-4 px-6 py-5 md:grid-cols-[1.1fr_1fr_1fr_auto] md:items-end">
                        <DarkField label="Email actuel">
                          <input
                            value={securityForm.currentEmail}
                            readOnly
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400 outline-none"
                          />
                        </DarkField>

                        <DarkField label="Nouvel email">
                          <input
                            type="email"
                            value={securityForm.newEmail}
                            onChange={(e) =>
                              setSecurityForm((prev) => ({
                                ...prev,
                                newEmail: e.target.value,
                              }))
                            }
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FFB800]"
                            placeholder="nouvel@email.com"
                          />
                        </DarkField>

                        <DarkField label="Mot de passe actuel">
                          <input
                            type="password"
                            value={securityForm.currentPasswordForEmail}
                            onChange={(e) =>
                              setSecurityForm((prev) => ({
                                ...prev,
                                currentPasswordForEmail: e.target.value,
                              }))
                            }
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FFB800]"
                            placeholder="Mot de passe"
                          />
                        </DarkField>

                        <button
                          type="button"
                          onClick={handleEmailChange}
                          disabled={changingEmail}
                          className="h-[50px] rounded-2xl bg-white/5 px-5 text-xs font-black uppercase tracking-widest text-white border border-white/10 transition hover:bg-white/10 disabled:opacity-50"
                        >
                          {changingEmail ? "..." : "Modifier"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-[#121212] overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-white/5 px-6 py-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/5">
                        <Lock className="h-5 w-5 text-[#FFB800]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-wide text-white">
                          Sécurité
                        </h3>
                        <p className="text-xs text-gray-500">
                          Mise à jour du mot de passe
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                      <DarkField label="Mot de passe actuel">
                        <input
                          type="password"
                          value={securityForm.currentPassword}
                          onChange={(e) =>
                            setSecurityForm((prev) => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FFB800]"
                          placeholder="Mot de passe actuel"
                        />
                      </DarkField>

                      <DarkField label="Nouveau mot de passe">
                        <input
                          type="password"
                          value={securityForm.newPassword}
                          onChange={(e) =>
                            setSecurityForm((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FFB800]"
                          placeholder="Nouveau mot de passe"
                        />
                      </DarkField>

                      <DarkField label="Confirmation">
                        <input
                          type="password"
                          value={securityForm.confirmNewPassword}
                          onChange={(e) =>
                            setSecurityForm((prev) => ({
                              ...prev,
                              confirmNewPassword: e.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FFB800]"
                          placeholder="Confirmation"
                        />
                      </DarkField>

                      <button
                        type="button"
                        onClick={handlePasswordChange}
                        disabled={changingPassword}
                        className="h-[50px] rounded-2xl bg-[#FFB800] px-5 text-xs font-black uppercase tracking-widest text-black transition hover:scale-[1.02] disabled:opacity-50"
                      >
                        {changingPassword ? "..." : "Modifier"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "preferences" && (
                <div className="space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-[#121212] p-8">
                    <h3 className="text-xl font-bold uppercase mb-6 flex items-center gap-3 italic">
                      <Heart className="h-6 w-6 text-red-500 fill-red-500" />
                      Vos Passions Marocaines
                    </h3>

                    {form.preferences.length > 0 && (
                      <div className="mb-5 flex flex-wrap gap-2">
                        {form.preferences.map((value) => {
                          const option = PREFERENCE_OPTIONS.find((o) => o.value === value);
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setForm((p) => ({
                                  ...p,
                                  preferences: normalizePreferenceValues(
                                    toggleValue(p.preferences, value)
                                  ),
                                }))
                              }
                              className="inline-flex items-center gap-2 rounded-full bg-[#FFB800] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-black"
                            >
                              {option?.label ?? value}
                              <span className="text-black/70">×</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {PREFERENCE_OPTIONS.map((opt) => {
                        const isSelected = form.preferences.includes(opt.value);

                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              setForm((p) => ({
                                ...p,
                                preferences: normalizePreferenceValues(
                                  toggleValue(p.preferences, opt.value)
                                ),
                              }))
                            }
                            className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all border ${
                              isSelected
                                ? "bg-[#FFB800] text-black border-[#FFB800] shadow-[0_0_10px_rgba(255,184,0,0.3)]"
                                : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <TeamSelectorDark
                    values={form.equipesSuivies}
                    onChange={(nextValues) =>
                      setForm((p) => ({
                        ...p,
                        equipesSuivies: normalizeTeamValues(nextValues),
                      }))
                    }
                  />
                </div>
              )}

              {activeTab === "photo" && (
                <div className="rounded-3xl border border-white/10 bg-[#121212] p-8 text-center">
                  <div className="max-w-md mx-auto space-y-8">
                    <div className="relative mx-auto h-48 w-48 group">
                      <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#FFB800]/30 animate-[spin_20s_linear_infinite]" />
                      <div className="absolute inset-2 overflow-hidden rounded-full bg-black/40 border-2 border-white/10">
                        {currentPhoto && !imageError ? (
                          <Image
                            src={currentPhoto}
                            alt="Preview"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/5">
                            <Camera className="h-10 w-10 text-white/20" />
                          </div>
                        )}
                      </div>
                    </div>

                    {photoFile && (
                      <div className="rounded-2xl border border-[#FFB800]/20 bg-[#FFB800]/10 px-4 py-3 text-sm text-[#FFB800]">
                        Nouvelle image prête : <span className="font-bold">{photoFile.name}</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoPick}
                      />

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 rounded-2xl border border-[#FFB800] px-6 py-4 text-xs font-black uppercase text-[#FFB800] transition hover:bg-[#FFB800] hover:text-black"
                        >
                          Choisir Image
                        </button>

                        <button
                          type="button"
                          onClick={handlePhotoUpload}
                          disabled={uploadingPhoto || !photoFile}
                          className="flex-1 rounded-2xl bg-white px-6 py-4 text-xs font-black uppercase text-black transition hover:bg-gray-200 disabled:opacity-30"
                        >
                          {uploadingPhoto ? "Envoi..." : "Appliquer"}
                        </button>
                      </div>

                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        Format JPG, PNG (Max 2Mo)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {cropModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0b0d14] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase italic">Recadrer la photo</h3>
                <p className="text-sm text-slate-400">Ajuste l’image avant l’envoi</p>
              </div>

              <button
                onClick={() => {
                  setCropModalOpen(false);
                  setRawPhotoSrc("");
                }}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative h-[380px] overflow-hidden rounded-3xl bg-black">
              <Cropper
                image={rawPhotoSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-300">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setCropModalOpen(false);
                  setRawPhotoSrc("");
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 hover:bg-white/10"
              >
                Annuler
              </button>

              <button
                onClick={() => void confirmCrop()}
                className="rounded-2xl bg-gradient-to-r from-[#FFB800] to-[#FF8A00] px-5 py-3 text-sm font-black uppercase tracking-widest text-black"
              >
                Valider le recadrage
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function DarkField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] ml-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function DarkSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Option[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const currentLabel = options.find((o) => o.value === value)?.label || "Sélectionner";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:border-white/20"
      >
        <span>{currentLabel}</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A] shadow-2xl backdrop-blur-xl">
          {options.map((opt) => {
            const active = opt.value === value;

            return (
              <button
                key={opt.value}
                type="button"
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold uppercase tracking-tighter transition ${
                  active
                    ? "bg-[#FFB800] text-black"
                    : "text-gray-400 hover:bg-[#FFB800] hover:text-black"
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {active && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniMetricDark({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-3 text-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function TeamSelectorDark({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const filteredTeams = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return TEAM_OPTIONS;

    return TEAM_OPTIONS.filter((option) => {
      const team = findWorldCupTeam(option.value);
      return (
        option.label.toLowerCase().includes(normalized) ||
        option.value.toLowerCase().includes(normalized) ||
        option.aliases?.some((alias) => alias.toLowerCase().includes(normalized)) ||
        team?.aliases?.some((alias) => alias.toLowerCase().includes(normalized))
      );
    });
  }, [query]);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#121212] p-8">
      <h3 className="text-xl font-bold uppercase mb-6 flex items-center gap-3">
        <Trophy className="h-6 w-6 text-[#FFB800]" />
        Équipes de Cœur
      </h3>

      <div className="mb-5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une équipe..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-[#FFB800]"
        />
      </div>

      {values.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {values.map((value) => {
            const team = findWorldCupTeam(value);
            const option = TEAM_OPTIONS.find((o) => o.value === value);
            const Flag = team ? Flags[team.code as CountryCode] : null;

            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange(toggleValue(values, value))}
                className="inline-flex items-center gap-2 rounded-full bg-[#FFB800] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-black"
              >
                {Flag ? (
                  <Flag
                    title={team?.label ?? option?.label ?? value}
                    className="h-3.5 w-5 shrink-0 rounded-[2px] shadow-sm"
                  />
                ) : null}
                {team?.label ?? option?.label ?? value}
                <span className="text-black/70">×</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredTeams.map((teamOption) => {
          const isSelected = values.includes(teamOption.value);
          const team = findWorldCupTeam(teamOption.value);
          const Flag = team ? Flags[team.code as CountryCode] : null;

          return (
            <button
              key={teamOption.value}
              type="button"
              onClick={() => onChange(toggleValue(values, teamOption.value))}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                isSelected
                  ? "border-[#FFB800] bg-[#FFB800]/10 shadow-[0_0_10px_rgba(255,184,0,0.12)]"
                  : "border-white/5 bg-white/5 opacity-70 hover:opacity-100 hover:border-white/15"
              }`}
            >
              <div className="w-10 h-7 overflow-hidden rounded-md shadow-sm bg-white/10 flex items-center justify-center">
                {Flag ? (
                  <Flag className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] text-gray-400">N/A</span>
                )}
              </div>

              <span
                className={`text-[10px] font-black uppercase tracking-tighter text-center leading-tight ${
                  isSelected ? "text-white" : "text-gray-300"
                }`}
              >
                {team?.label ?? teamOption.label}
              </span>
            </button>
          );
        })}
      </div>

      {filteredTeams.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-gray-400">
          Aucune équipe ne correspond à la recherche.
        </div>
      )}
    </div>
  );
}