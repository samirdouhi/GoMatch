"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Cropper, { Area, Point } from "react-easy-crop";
import * as Flags from "country-flag-icons/react/3x2";
import {
  Store,
  Sparkles,
  Check,
  ArrowLeft,
  Utensils,
  ShoppingBag,
  Landmark,
  MapPin,
  Heart,
  Leaf,
  Ticket,
  Camera,
  X,
  ChevronRight,
  Search,
} from "lucide-react";
import { authFetch } from "@/lib/authApi";
import { clearAuthTokens, getAccessToken } from "@/lib/authTokens";
import {
  WORLD_CUP_2026_TEAMS,
  type CountryCode,
} from "@/lib/world-cup-2026";

type Goal = "experience" | "business";
type StepNumber = 0 | 1 | 2 | 3 | 4;
type AnyObj = Record<string, unknown>;
type Language = "FR" | "EN" | "AR";

type ProfileState = {
  langue: Language;
  photoUrl: string;
  photoFile: File | null;
};

type UserProfileState = {
  prenom: string;
  nom: string;
  dateNaissance: string;
  genre: string;
};

type TouristeProfileState = {
  nationalite: string;
};

type MerchantFormState = {
  telephone: string;
  nomResponsable: string;
  emailProfessionnel: string;
  ville: string;
  adresseProfessionnelle: string;
  typeActivite: string;
};

const PROFILE_API = "/profile";
const MERCHANT_PROFILE_API = "/commercant-profile";

const GOALS = [
  {
    id: "experience" as Goal,
    title: "Vivre l’expérience",
    desc: "Matchs, bons plans et lieux secrets — une expérience 2030 sur mesure.",
    Icon: Sparkles,
    image: "/goal-experience.png",
    badge: "Supporter / Voyage",
    color: "from-yellow-500/10",
  },
  {
    id: "business" as Goal,
    title: "J’ai un commerce",
    desc: "Crée ton dossier commerçant. Il sera envoyé en attente de validation administrateur.",
    Icon: Store,
    image: "/goal-business.png",
    badge: "Professionnel",
    color: "from-orange-500/10",
  },
];

const INTERESTS = [
  { id: "Gastronomie", label: "Gastronomie", Icon: Utensils, hint: "Restaurants & spécialités" },
  { id: "Artisanat", label: "Artisanat", Icon: ShoppingBag, hint: "Produits locaux" },
  { id: "Culture", label: "Culture", Icon: Landmark, hint: "Musées & traditions" },
  { id: "Architecture", label: "Architecture", Icon: Landmark, hint: "Monuments" },
  { id: "Marchés", label: "Marchés", Icon: MapPin, hint: "Souks & marchés" },
  { id: "Cafés", label: "Cafés", Icon: Heart, hint: "Ambiance locale" },
  { id: "Football", label: "Football", Icon: Ticket, hint: "Matchs & fan zones" },
  { id: "Nature", label: "Nature", Icon: Leaf, hint: "Paysages & randos" },
  { id: "Shopping", label: "Shopping", Icon: ShoppingBag, hint: "Boutiques locales" },
  { id: "Nightlife", label: "Nightlife", Icon: Heart, hint: "Sorties & ambiance" },
  { id: "Events", label: "Événements", Icon: Ticket, hint: "Festivals & activités" },
  { id: "StreetFood", label: "Street Food", Icon: Utensils, hint: "Cuisine rapide locale" },
];

const LANGUAGE_OPTIONS: Array<{
  value: Language;
  label: string;
  flag: string;
  hint: string;
}> = [
  { value: "FR", label: "Français", flag: "🇫🇷", hint: "Interface et recommandations en français" },
  { value: "EN", label: "Anglais", flag: "🇬🇧", hint: "English experience for international visitors" },
  { value: "AR", label: "Arabe", flag: "🇲🇦", hint: "واجهة وتجربة باللغة العربية" },
];

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

function pickBoolean(obj: AnyObj, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "boolean") return value;
  }
  return null;
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

function parseJsonArray(value: string): string[] {
  if (!value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === "string");
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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function tryReadErrorMessage(res: Response): Promise<string | null> {
  try {
    const payload = await res.json();
    if (payload && typeof payload === "object") {
      const obj = payload as AnyObj;
      if (typeof obj.message === "string" && obj.message.trim()) return obj.message.trim();
      if (typeof obj.error === "string" && obj.error.trim()) return obj.error.trim();
      if (typeof obj.title === "string" && obj.title.trim()) return obj.title.trim();
      if (typeof obj.detail === "string" && obj.detail.trim()) return obj.detail.trim();
    }
    return null;
  } catch {
    return null;
  }
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

function clearLocalOnboardingState() {
  if (typeof window === "undefined") return;

  const keysToRemove = [
    "gomatch_onboarding",
    "gomatch_profile_mock_v3",
    "onboarding",
    "selectedInterests",
    "interests",
    "wizard",
    "setupStep",
    "skippedSteps",
  ];

  for (const key of keysToRemove) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  const [step, setStep] = useState<StepNumber>(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [teamQuery, setTeamQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [merchantConfirmOpen, setMerchantConfirmOpen] = useState(false);

  const [profileState, setProfileState] = useState<ProfileState>({
    langue: "FR",
    photoUrl: "",
    photoFile: null,
  });

  const [userProfileState, setUserProfileState] = useState<UserProfileState>({
    prenom: "",
    nom: "",
    dateNaissance: "",
    genre: "",
  });

  const [touristeProfileState, setTouristeProfileState] = useState<TouristeProfileState>({
    nationalite: "",
  });

  const [merchantForm, setMerchantForm] = useState<MerchantFormState>({
    telephone: "",
    nomResponsable: "",
    emailProfessionnel: "",
    ville: "",
    adresseProfessionnelle: "",
    typeActivite: "",
  });

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawPhotoSrc, setRawPhotoSrc] = useState("");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
      if (activeBlobUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, []);

  const forceAccountCreation = useCallback(() => {
    clearAuthTokens();
    clearLocalOnboardingState();
    router.replace("/Register?accountRequired=1");
  }, [router]);

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

  const fetchExistingProfile = useCallback(async (): Promise<Response> => {
    return authFetch(`${PROFILE_API}/me`, {
      method: "GET",
      cache: "no-store",
    });
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const token = getAccessToken();

      if (!token) {
        router.replace("/signin");
        return;
      }

      const res = await fetchExistingProfile();

      if (res.status === 401 || res.status === 403) {
        setSubmitError("Session expirée. Merci de vous reconnecter.");
        clearAuthTokens();
        router.replace("/signin");
        return;
      }

      if (res.status === 404) {
        forceAccountCreation();
        return;
      }

      if (!res.ok) {
        const message = await tryReadErrorMessage(res);
        setSubmitError(message ?? `Impossible de charger le profil. (HTTP ${res.status})`);
        return;
      }

      const data = (await res.json()) as AnyObj;

      const userProfile =
        data.userProfile && typeof data.userProfile === "object"
          ? (data.userProfile as AnyObj)
          : {};

      const existingPreferences = parseJsonArray(
        pickString(data, ["preferencesJson", "PreferencesJson"])
      );

      const existingTeams = parseJsonArray(
        pickString(data, ["equipesSuiviesJson", "EquipesSuiviesJson"])
      );

      const onboardingDone = pickBoolean(data, [
        "inscriptionTerminee",
        "InscriptionTerminee",
      ]);

      const langue = pickString(userProfile, ["langue", "Langue"]);
      const photoUrlFromApi = normalizePhotoApiUrl(
        pickString(userProfile, ["photoUrl", "PhotoUrl"])
      );

      const prenom = pickString(userProfile, ["prenom", "Prenom"]);
      const nom = pickString(userProfile, ["nom", "Nom"]);
      const dateNaissance = pickString(userProfile, ["dateNaissance", "DateNaissance"]);
      const genre = pickString(userProfile, ["genre", "Genre"]);
      const nationalite = pickString(data, ["nationalite", "Nationalite"]);

      let resolvedPhotoUrl = "";

      if (photoUrlFromApi) {
        try {
          resolvedPhotoUrl = await loadProtectedPhoto(photoUrlFromApi);
        } catch {
          resolvedPhotoUrl = "";
          replaceBlobUrl("");
        }
      } else {
        replaceBlobUrl("");
      }

      setInterests(existingPreferences);
      setTeams(existingTeams);

      setProfileState({
        langue: langue === "EN" || langue === "AR" ? langue : "FR",
        photoUrl: resolvedPhotoUrl,
        photoFile: null,
      });

      setUserProfileState({
        prenom,
        nom,
        dateNaissance,
        genre,
      });

      setTouristeProfileState({
        nationalite,
      });

      if (onboardingDone === true) {
        router.replace("/dashboard");
      }
    } catch {
      setSubmitError("Erreur réseau : impossible de charger le profil.");
    } finally {
      setLoadingProfile(false);
    }
  }, [fetchExistingProfile, forceAccountCreation, loadProtectedPhoto, replaceBlobUrl, router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const filteredTeams = useMemo(() => {
    const q = teamQuery.trim().toLowerCase();
    if (!q) return WORLD_CUP_2026_TEAMS;

    return WORLD_CUP_2026_TEAMS.filter(
      (team) =>
        team.label.toLowerCase().includes(q) ||
        team.id.toLowerCase().includes(q) ||
        team.code.toLowerCase().includes(q) ||
        team.aliases?.some((alias) => alias.toLowerCase().includes(q))
    );
  }, [teamQuery]);

  const canGoToPhoto = Boolean(profileState.langue);
  const canGoToTeams = interests.length >= 3;
  const canFinish = teams.length >= 1 && Boolean(profileState.langue) && goal === "experience";

  const canSubmitMerchant =
    merchantForm.telephone.trim().length > 0 &&
    merchantForm.nomResponsable.trim().length > 0 &&
    merchantForm.emailProfessionnel.trim().length > 0 &&
    merchantForm.typeActivite.trim().length > 0;

  const savePhoto = useCallback(async (): Promise<{ ok: boolean; message?: string }> => {
    if (!profileState.photoFile) {
      return { ok: true };
    }

    const formData = new FormData();
    formData.append("photo", profileState.photoFile);

    const res = await authFetch(`${PROFILE_API}/me/photo`, {
      method: "POST",
      body: formData,
    });

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        message: "Session expirée. Merci de vous reconnecter.",
      };
    }

    if (res.status === 404) {
      return {
        ok: false,
        message: "Profil introuvable. Veuillez créer un compte valide.",
      };
    }

    if (!res.ok) {
      const message = await tryReadErrorMessage(res);
      return {
        ok: false,
        message: message ?? `Erreur upload photo (HTTP ${res.status})`,
      };
    }

    try {
      const data = (await res.json()) as AnyObj;
      const uploadedPhotoUrl = normalizePhotoApiUrl(
        pickString(data, ["photoUrl", "PhotoUrl"])
      );

      let resolvedPhotoUrl = profileState.photoUrl;

      if (uploadedPhotoUrl) {
        try {
          resolvedPhotoUrl = await loadProtectedPhoto(uploadedPhotoUrl);
        } catch {
          resolvedPhotoUrl = profileState.photoUrl;
        }
      }

      setProfileState((prev) => ({
        ...prev,
        photoUrl: resolvedPhotoUrl,
        photoFile: null,
      }));
    } catch {
      setProfileState((prev) => ({
        ...prev,
        photoFile: null,
      }));
    }

    return { ok: true };
  }, [loadProtectedPhoto, profileState.photoFile, profileState.photoUrl]);

  const saveUserProfile = useCallback(async (): Promise<{ ok: boolean; message?: string }> => {
    if (
      !userProfileState.prenom.trim() ||
      !userProfileState.nom.trim() ||
      !userProfileState.dateNaissance.trim() ||
      !userProfileState.genre.trim()
    ) {
      return {
        ok: false,
        message:
          "Les informations de base du profil sont absentes. Vérifie que le compte a bien été créé avant l'onboarding.",
      };
    }

    let isoDate = userProfileState.dateNaissance;

    if (!isoDate.includes("T")) {
      isoDate = `${isoDate}T00:00:00`;
    }

    const body = {
      prenom: userProfileState.prenom,
      nom: userProfileState.nom,
      dateNaissance: isoDate,
      genre: userProfileState.genre,
      langue: profileState.langue,
    };

    const res = await authFetch(`${PROFILE_API}/me/user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        message: "Session expirée. Merci de vous reconnecter.",
      };
    }

    if (res.status === 404) {
      return {
        ok: false,
        message: "Profil introuvable. Veuillez créer un compte valide.",
      };
    }

    if (!res.ok) {
      const message = await tryReadErrorMessage(res);
      return {
        ok: false,
        message: message ?? `Impossible d'enregistrer la langue. (HTTP ${res.status})`,
      };
    }

    return { ok: true };
  }, [profileState.langue, userProfileState]);

  const savePreferences = useCallback(async (): Promise<Response> => {
    return authFetch(`${PROFILE_API}/me/preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        preferencesJson: JSON.stringify(interests),
        equipesSuiviesJson: JSON.stringify(teams),
      }),
    });
  }, [interests, teams]);

  const completeOnboarding = useCallback(async (): Promise<Response> => {
    return authFetch(`${PROFILE_API}/me/onboarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nationalite: touristeProfileState.nationalite || null,
        preferencesJson: JSON.stringify(interests),
        equipesSuiviesJson: JSON.stringify(teams),
      }),
    });
  }, [interests, teams, touristeProfileState.nationalite]);

  const initMerchantProfile = useCallback(async (): Promise<Response> => {
    return authFetch(`${MERCHANT_PROFILE_API}/me/init`, {
      method: "POST",
    });
  }, []);

  const submitMerchantProfile = useCallback(async (): Promise<Response> => {
    const payload = {
      telephone: merchantForm.telephone.trim(),
      nomResponsable: merchantForm.nomResponsable.trim(),
      emailProfessionnel: merchantForm.emailProfessionnel.trim(),
      ville: merchantForm.ville.trim() || null,
      adresseProfessionnelle: merchantForm.adresseProfessionnelle.trim() || null,
      typeActivite: merchantForm.typeActivite.trim(),
    };

    console.log("MERCHANT PAYLOAD:", payload);

    return authFetch(`${MERCHANT_PROFILE_API}/me/business`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }, [merchantForm]);

  const handleForbiddenProfileState = useCallback(() => {
    setSubmitError("Compte ou profil invalide. Veuillez créer un compte avant d'accéder à l'onboarding.");
    forceAccountCreation();
  }, [forceAccountCreation]);

  const finish = async () => {
    setSubmitError("");

    if (!goal) {
      setStep(0);
      setSubmitError("Choisis un objectif pour continuer.");
      return;
    }

    if (goal === "business") {
      setMerchantConfirmOpen(true);
      return;
    }

    if (!profileState.langue.trim()) {
      setStep(1);
      setSubmitError("Choisis une langue.");
      return;
    }

    if (interests.length < 3) {
      setStep(3);
      setSubmitError("Choisis au moins 3 centres d'intérêt.");
      return;
    }

    if (teams.length < 1) {
      setStep(4);
      setSubmitError("Choisis au moins un pays suivi.");
      return;
    }

    setSaving(true);

    try {
      const userResult = await saveUserProfile();

      if (!userResult.ok) {
        if (userResult.message?.includes("Profil introuvable")) {
          handleForbiddenProfileState();
          return;
        }

        setSubmitError(userResult.message ?? "Impossible d'enregistrer la langue.");
        if (userResult.message?.includes("Session expirée")) {
          clearAuthTokens();
          router.replace("/signin");
        }
        return;
      }

      const photoResult = await savePhoto();

      if (!photoResult.ok) {
        if (photoResult.message?.includes("Profil introuvable")) {
          handleForbiddenProfileState();
          return;
        }

        setSubmitError(photoResult.message ?? "Impossible d'enregistrer la photo du profil.");
        if (photoResult.message?.includes("Session expirée")) {
          clearAuthTokens();
          router.replace("/signin");
        }
        return;
      }

      const prefRes = await savePreferences();

      if (prefRes.status === 401 || prefRes.status === 403) {
        setSubmitError("Session expirée. Merci de vous reconnecter.");
        clearAuthTokens();
        router.replace("/signin");
        return;
      }

      if (prefRes.status === 404) {
        handleForbiddenProfileState();
        return;
      }

      if (!prefRes.ok) {
        const message = await tryReadErrorMessage(prefRes);
        setSubmitError(
          message ?? `Impossible d'enregistrer les préférences. (HTTP ${prefRes.status})`
        );
        return;
      }

      const onboardingRes = await completeOnboarding();

      if (onboardingRes.status === 401 || onboardingRes.status === 403) {
        setSubmitError("Session expirée. Merci de vous reconnecter.");
        clearAuthTokens();
        router.replace("/signin");
        return;
      }

      if (onboardingRes.status === 404) {
        handleForbiddenProfileState();
        return;
      }

      if (!onboardingRes.ok) {
        const message = await tryReadErrorMessage(onboardingRes);
        setSubmitError(
          message ?? `Impossible de finaliser l'onboarding. (HTTP ${onboardingRes.status})`
        );
        return;
      }

      router.replace("/dashboard");
    } catch {
      setSubmitError("Erreur réseau : impossible de contacter le serveur.");
    } finally {
      setSaving(false);
    }
  };

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

      const objectUrl = URL.createObjectURL(croppedFile);
      replaceBlobUrl(objectUrl);

      setProfileState((prev) => ({
        ...prev,
        photoUrl: objectUrl,
        photoFile: croppedFile,
      }));

      setCropModalOpen(false);
      setRawPhotoSrc("");
    } catch {
      setSubmitError("Impossible de recadrer la photo.");
    }
  };

  const goToNextFromGoal = () => {
    if (!goal) {
      setSubmitError("Choisis un objectif pour continuer.");
      return;
    }

    setSubmitError("");

    if (goal === "business") {
      setMerchantConfirmOpen(true);
      return;
    }

    setStep(1);
  };

  const confirmMerchantFlow = async () => {
    setSubmitError("");

    if (!merchantForm.telephone.trim()) {
      setSubmitError("Le téléphone est obligatoire.");
      return;
    }

    if (!merchantForm.nomResponsable.trim()) {
      setSubmitError("Le nom du responsable est obligatoire.");
      return;
    }

    if (!merchantForm.emailProfessionnel.trim()) {
      setSubmitError("L'email professionnel est obligatoire.");
      return;
    }

    if (!isValidEmail(merchantForm.emailProfessionnel)) {
      setSubmitError("Veuillez saisir une adresse email professionnelle valide.");
      return;
    }

    if (!merchantForm.typeActivite.trim()) {
      setSubmitError("Le type d’activité est obligatoire.");
      return;
    }

    if (!canSubmitMerchant) {
      setSubmitError(
        "Téléphone, nom du responsable, email professionnel et type d’activité sont obligatoires."
      );
      return;
    }

    setSaving(true);

    try {
      const userResult = await saveUserProfile();

      if (!userResult.ok) {
        if (userResult.message?.includes("Profil introuvable")) {
          handleForbiddenProfileState();
          return;
        }

        setSubmitError(userResult.message ?? "Impossible d'enregistrer le profil.");
        if (userResult.message?.includes("Session expirée")) {
          clearAuthTokens();
          router.replace("/signin");
        }
        return;
      }

      const photoResult = await savePhoto();

      if (!photoResult.ok) {
        if (photoResult.message?.includes("Profil introuvable")) {
          handleForbiddenProfileState();
          return;
        }

        setSubmitError(photoResult.message ?? "Impossible d'enregistrer la photo du profil.");
        if (photoResult.message?.includes("Session expirée")) {
          clearAuthTokens();
          router.replace("/signin");
        }
        return;
      }

      const initRes = await initMerchantProfile();

      if (initRes.status === 401 || initRes.status === 403) {
        setSubmitError("Session expirée. Merci de vous reconnecter.");
        clearAuthTokens();
        router.replace("/signin");
        return;
      }

      if (initRes.status === 404) {
        handleForbiddenProfileState();
        return;
      }

      if (!initRes.ok && initRes.status !== 409) {
        const message = await tryReadErrorMessage(initRes);
        setSubmitError(
          message ?? `Impossible d'initialiser le profil commerçant. (HTTP ${initRes.status})`
        );
        return;
      }

     const merchantRes = await submitMerchantProfile();

if (merchantRes.status === 401 || merchantRes.status === 403) {
  setSubmitError("Session expirée. Merci de vous reconnecter.");
  clearAuthTokens();
  router.replace("/signin");
  return;
}

if (merchantRes.status === 404) {
  handleForbiddenProfileState();
  return;
}

if (!merchantRes.ok) {
  const message = await tryReadErrorMessage(merchantRes);
  setSubmitError(
    message ?? `Impossible d'envoyer la demande commerçant. (HTTP ${merchantRes.status})`
  );
  return;
}

const prefRes = await savePreferences();

if (prefRes.status === 401 || prefRes.status === 403) {
  setSubmitError("Session expirée. Merci de vous reconnecter.");
  clearAuthTokens();
  router.replace("/signin");
  return;
}

if (prefRes.status === 404) {
  handleForbiddenProfileState();
  return;
}

if (!prefRes.ok) {
  const message = await tryReadErrorMessage(prefRes);
  setSubmitError(
    message ?? `Impossible d'enregistrer les préférences. (HTTP ${prefRes.status})`
  );
  return;
}

const onboardingRes = await completeOnboarding();

if (onboardingRes.status === 401 || onboardingRes.status === 403) {
  setSubmitError("Session expirée. Merci de vous reconnecter.");
  clearAuthTokens();
  router.replace("/signin");
  return;
}

if (onboardingRes.status === 404) {
  handleForbiddenProfileState();
  return;
}

if (!onboardingRes.ok) {
  const message = await tryReadErrorMessage(onboardingRes);
  setSubmitError(
    message ?? `Impossible de finaliser l'onboarding. (HTTP ${onboardingRes.status})`
  );
  return;
}

setMerchantConfirmOpen(false);
router.replace(
  `/dashboard?merchantRequest=email-verification-sent&email=${encodeURIComponent(
    merchantForm.emailProfessionnel.trim()
  )}`
);
    } catch {
      setSubmitError("Erreur réseau : impossible d’envoyer la demande commerçant.");
    } finally {
      setSaving(false);
    }
  };

  const skipLanguageStep = () => {
    setProfileState((prev) => ({ ...prev, langue: prev.langue || "FR" }));
    setSubmitError("");
    setStep(2);
  };

  const skipPhotoStep = () => {
    setSubmitError("");
    setStep(3);
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030409] text-slate-50">
        Chargement...
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#030409] text-slate-50 selection:bg-yellow-500/30">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
        <motion.div
          animate={
            reducedMotion
              ? {}
              : { scale: [1, 1.2, 1], x: [0, 30, 0], opacity: [0.15, 0.25, 0.15] }
          }
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] h-[70%] w-[70%] rounded-full bg-yellow-500 blur-[120px]"
        />
        <motion.div
          animate={
            reducedMotion
              ? {}
              : { scale: [1, 1.3, 1], x: [0, -40, 0], opacity: [0.1, 0.2, 0.1] }
          }
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] -right-[10%] h-[60%] w-[60%] rounded-full bg-orange-500 blur-[130px]"
        />
      </div>

      <header className="relative z-50 flex flex-col items-center px-6 pt-8 pb-4">
        <div className="flex w-full max-w-6xl justify-between items-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-black tracking-tighter md:text-3xl italic"
          >
            GO<span className="text-yellow-400">MATCH</span>
          </motion.h1>

          {step > 0 && (
            <button
              onClick={() => void finish()}
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest backdrop-blur-md transition hover:bg-white/10 active:scale-95"
            >
              Terminer plus tard <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="mt-8 w-full max-w-2xl">
          <div className="flex justify-between mb-2 px-1">
            {["Objectif", "Langue", "Photo", "Intérêts", "Pays"].map((label, i) => (
              <span
                key={i}
                className={`text-[10px] uppercase tracking-[0.2em] font-black transition-colors duration-500 ${
                  step >= i ? "text-yellow-400" : "text-white/20"
                }`}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-500"
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
        </div>
      </header>

      <main className="relative z-10 h-[calc(100dvh-180px)] overflow-y-auto px-6 py-4 custom-scrollbar">
        <div className="mx-auto max-w-6xl h-full">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                {...pageVariants}
                transition={{ duration: 0.4 }}
                className="grid h-full gap-6 md:grid-cols-2 lg:py-10"
              >
                {GOALS.map((g) => (
                  <motion.button
                    key={g.id}
                    whileHover={{ y: -5, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setGoal(g.id);
                      setSubmitError("");
                    }}
                    className={`group relative overflow-hidden rounded-[40px] border transition-all duration-500 ${
                      goal === g.id
                        ? "border-yellow-400/50 ring-1 ring-yellow-400/50"
                        : "border-white/10"
                    }`}
                  >
                    <Image
                      src={g.image}
                      alt=""
                      fill
                      className="object-cover opacity-70 transition duration-700 group-hover:scale-110 group-hover:opacity-90"
                    />

                    <div
                      className={`absolute inset-0 bg-gradient-to-t ${g.color} via-black/40 to-black/70`}
                    />

                    <div className="absolute inset-0 flex flex-col justify-end p-8 text-left">
                      <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-xl border border-white/5">
                        <g.Icon className="h-3 w-3 text-yellow-400" /> {g.badge}
                      </div>
                      <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white md:text-5xl leading-none">
                        {g.title}
                      </h2>
                      <p className="mt-4 max-w-[35ch] text-sm leading-relaxed text-slate-400">
                        {g.desc}
                      </p>
                      <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-black transition-transform group-hover:translate-x-3">
                        <ChevronRight size={28} />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                {...pageVariants}
                className="flex flex-col items-center gap-8 py-8"
              >
                <div className="text-center space-y-2">
                  <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-black">
                    Étape 2
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black italic tracking-tight uppercase">
                    Choisis ta langue
                  </h2>
                  <p className="text-slate-500 text-sm max-w-xl">
                    On adapte l’expérience, les recommandations et les contenus à ta langue.
                  </p>
                </div>

                <div className="w-full max-w-3xl grid gap-4">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const selected = profileState.langue === lang.value;

                    return (
                      <motion.button
                        key={lang.value}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSubmitError("");
                          setProfileState((prev) => ({
                            ...prev,
                            langue: lang.value,
                          }));
                        }}
                        className={`w-full rounded-[28px] border px-6 py-5 text-left transition-all ${
                          selected
                            ? "border-yellow-400 bg-yellow-400/15 shadow-[0_0_30px_rgba(250,204,21,0.15)]"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <span className="text-3xl">{lang.flag}</span>
                            <div>
                              <p className="text-lg font-black">{lang.label}</p>
                              <p className="text-sm text-slate-400">{lang.hint}</p>
                            </div>
                          </div>

                          {selected ? (
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400">
                              <Check className="h-4 w-4 text-black" />
                            </span>
                          ) : (
                            <span className="h-8 w-8 rounded-full border border-white/15" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                {...pageVariants}
                className="flex flex-col items-center gap-8 py-8"
              >
                <div className="text-center space-y-2">
                  <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-black">
                    Étape 3
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black italic tracking-tight uppercase">
                    Ajoute ta photo
                  </h2>
                  <p className="text-slate-500 text-sm max-w-xl">
                    Facultatif, mais utile pour personnaliser davantage ton profil.
                  </p>
                </div>

                <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-2xl">
                  <div className="flex flex-col items-center gap-6">
                    {profileState.photoUrl ? (
                      <motion.div
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative h-40 w-40 overflow-hidden rounded-full border border-white/10 shadow-[0_0_40px_rgba(250,204,21,0.15)]"
                      >
                        <Image
                          src={profileState.photoUrl}
                          alt="Photo de profil"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        animate={reducedMotion ? {} : { y: [0, -6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="flex h-40 w-40 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-500"
                      >
                        <Camera size={42} />
                      </motion.div>
                    )}

                    <input
                      ref={photoInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoPick}
                    />

                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-8 py-4 font-black text-black transition hover:from-yellow-300 hover:to-orange-400 active:scale-95 uppercase tracking-widest text-sm"
                    >
                      {profileState.photoUrl ? "Changer la photo" : "Ajouter une photo"}
                    </button>

                    <p className="text-xs text-slate-500 text-center max-w-md">
                      Tu pourras toujours la modifier plus tard depuis ton profil.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                {...pageVariants}
                className="flex flex-col gap-8 py-6 h-full items-center"
              >
                <div className="text-center space-y-2">
                  <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-black">
                    Étape 4
                  </p>
                  <h2 className="text-3xl font-black italic tracking-tight uppercase">
                    Tes centres d&apos;intérêt
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Sélectionne au moins 3 centres d&apos;intérêt pour affiner ton expérience.
                  </p>
                  <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-yellow-400">
                    {interests.length}/3 minimum
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 w-full">
                  {INTERESTS.map((it) => {
                    const selected = interests.includes(it.id);
                    return (
                      <motion.button
                        key={it.id}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() =>
                          setInterests((prev) =>
                            prev.includes(it.id)
                              ? prev.filter((i) => i !== it.id)
                              : [...prev, it.id]
                          )
                        }
                        className={`relative flex flex-col items-center gap-4 rounded-[32px] border p-8 transition-all duration-300 ${
                          selected
                            ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_40px_rgba(250,204,21,0.2)]"
                            : "border-white/5 bg-white/[0.02]"
                        }`}
                      >
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
                            selected
                              ? "bg-yellow-400 text-black"
                              : "bg-white/5 text-slate-500"
                          }`}
                        >
                          <it.Icon className="h-7 w-7" />
                        </div>
                        <div className="text-center">
                          <span className="block text-sm font-bold tracking-wide">
                            {it.label}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase font-medium mt-1">
                            {it.hint}
                          </span>
                        </div>
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-4 right-4 h-6 w-6 rounded-full bg-yellow-400 flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-black" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                {...pageVariants}
                className="flex flex-col gap-8 py-6 h-full items-center"
              >
                <div className="text-center space-y-2">
                  <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-black">
                    Étape 5
                  </p>
                  <h2 className="text-3xl font-black italic tracking-tight uppercase">
                    Pays suivis
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Choisis au moins un pays avec son drapeau.
                  </p>
                  <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-yellow-400">
                    {teams.length} sélectionné{teams.length > 1 ? "s" : ""}
                  </div>
                </div>

                <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl">
                  <div className="relative mb-5">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      value={teamQuery}
                      onChange={(e) => setTeamQuery(e.target.value)}
                      placeholder="Rechercher un pays..."
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-yellow-400/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {filteredTeams.map((team) => {
                      const selected = teams.includes(team.id);
                      const Flag = Flags[team.code as CountryCode];

                      if (!Flag) return null;

                      return (
                        <button
                          key={team.id}
                          onClick={() =>
                            setTeams((prev) =>
                              prev.includes(team.id)
                                ? prev.filter((t) => t !== team.id)
                                : [...prev, team.id]
                            )
                          }
                          className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-bold transition-all ${
                            selected
                              ? "border-yellow-400 bg-yellow-400/15 text-white shadow-[0_0_20px_rgba(250,204,21,0.25)]"
                              : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                          }`}
                        >
                          <Flag
                            title={team.label}
                            className="h-4 w-6 rounded-[3px] shrink-0 shadow-sm"
                          />
                          <span className="text-left leading-tight">{team.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {filteredTeams.length === 0 && (
                    <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-slate-500">
                      Aucun pays ne correspond à ta recherche.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {step > 0 && (
          <motion.footer
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 inset-x-0 z-50 p-6 md:p-10 pointer-events-none"
          >
            <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4 pointer-events-auto">
              <button
                onClick={() => {
                  setSubmitError("");
                  setStep((s) => Math.max(0, s - 1) as StepNumber);
                }}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition group"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Retour
              </button>

              <div className="flex items-center gap-3">
                {step === 1 && (
                  <>
                    <button
                      onClick={skipLanguageStep}
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-300 transition hover:bg-white/10"
                    >
                      Ignorer cette étape
                    </button>

                    <button
                      disabled={!canGoToPhoto}
                      onClick={() => {
                        setSubmitError("");
                        setStep(2);
                      }}
                      className={`flex items-center gap-3 rounded-2xl px-8 py-4 font-black uppercase tracking-widest text-sm transition-all ${
                        canGoToPhoto
                          ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-[0_20px_50px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95"
                          : "bg-white/5 text-white/20 cursor-not-allowed opacity-50"
                      }`}
                    >
                      Suivant <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <button
                      onClick={skipPhotoStep}
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-300 transition hover:bg-white/10"
                    >
                      Ignorer cette étape
                    </button>

                    <button
                      onClick={() => {
                        setSubmitError("");
                        setStep(3);
                      }}
                      className="flex items-center gap-3 rounded-2xl px-8 py-4 font-black uppercase tracking-widest text-sm transition-all bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-[0_20px_50px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95"
                    >
                      Suivant <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {step === 3 && (
                  <button
                    disabled={!canGoToTeams}
                    onClick={() => {
                      setSubmitError("");
                      setStep(4);
                    }}
                    className={`flex items-center gap-3 rounded-2xl px-8 py-4 font-black uppercase tracking-widest text-sm transition-all ${
                      canGoToTeams
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-[0_20px_50px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95"
                        : "bg-white/5 text-white/20 cursor-not-allowed opacity-50"
                    }`}
                  >
                    Suivant <ChevronRight className="h-5 w-5" />
                  </button>
                )}

                {step === 4 && (
                  <button
                    onClick={() => void finish()}
                    disabled={saving || !canFinish}
                    className="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-10 py-5 font-black uppercase tracking-widest text-sm text-black hover:from-yellow-300 hover:to-orange-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? "Enregistrement..." : "Accéder au Dashboard"}
                  </button>
                )}
              </div>
            </div>

            {submitError && (
              <div className="max-w-6xl mx-auto mt-4 pointer-events-auto">
                <p className="text-center text-xs font-bold text-red-400">
                  {submitError}
                </p>
              </div>
            )}
          </motion.footer>
        )}

        {step === 0 && (
          <motion.footer
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 inset-x-0 z-50 p-6 md:p-10 pointer-events-none"
          >
            <div className="max-w-6xl mx-auto flex justify-end pointer-events-auto">
              <button
                onClick={goToNextFromGoal}
                className={`flex items-center gap-3 rounded-2xl px-10 py-5 font-black uppercase tracking-widest text-sm transition-all ${
                  goal
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-[0_20px_50px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95"
                    : "bg-white/5 text-white/20 cursor-not-allowed opacity-50"
                }`}
              >
                Continuer <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {submitError && (
              <div className="max-w-6xl mx-auto mt-4 pointer-events-auto">
                <p className="text-center text-xs font-bold text-red-400">
                  {submitError}
                </p>
              </div>
            )}
          </motion.footer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {merchantConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0b0d14] p-6 shadow-2xl"
            >
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-yellow-400">
                  <Store className="h-3 w-3" />
                  Demande commerçant
                </div>

                <h3 className="text-2xl font-black uppercase italic tracking-tight">
                  Compléter le dossier commerçant
                </h3>

                <p className="text-sm leading-relaxed text-slate-400">
                  Renseigne les informations minimales du profil commerçant.
                  Une confirmation sera envoyée à l’adresse email professionnelle avant transmission de la demande.
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input
                  value={merchantForm.telephone}
                  onChange={(e) =>
                    setMerchantForm((prev) => ({ ...prev, telephone: e.target.value }))
                  }
                  placeholder="Téléphone *"
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-yellow-400/50"
                />

                <input
                  value={merchantForm.nomResponsable}
                  onChange={(e) =>
                    setMerchantForm((prev) => ({ ...prev, nomResponsable: e.target.value }))
                  }
                  placeholder="Nom du responsable *"
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-yellow-400/50"
                />

                <input
                  type="email"
                  value={merchantForm.emailProfessionnel}
                  onChange={(e) =>
                    setMerchantForm((prev) => ({ ...prev, emailProfessionnel: e.target.value }))
                  }
                  placeholder="Email professionnel *"
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-yellow-400/50"
                />

                <input
                  value={merchantForm.ville}
                  onChange={(e) =>
                    setMerchantForm((prev) => ({ ...prev, ville: e.target.value }))
                  }
                  placeholder="Ville"
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-yellow-400/50"
                />

                <input
                  value={merchantForm.typeActivite}
                  onChange={(e) =>
                    setMerchantForm((prev) => ({ ...prev, typeActivite: e.target.value }))
                  }
                  placeholder="Type d’activité *"
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-yellow-400/50 md:col-span-2"
                />

                <textarea
                  value={merchantForm.adresseProfessionnelle}
                  onChange={(e) =>
                    setMerchantForm((prev) => ({
                      ...prev,
                      adresseProfessionnelle: e.target.value,
                    }))
                  }
                  placeholder="Adresse professionnelle"
                  rows={4}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-yellow-400/50 md:col-span-2"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setMerchantConfirmOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 hover:bg-white/10"
                >
                  Annuler
                </button>

                <button
                  onClick={confirmMerchantFlow}
                  disabled={saving || !canSubmitMerchant}
                  className="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-5 py-3 text-sm font-black uppercase tracking-widest text-black hover:from-yellow-300 hover:to-orange-400 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Envoi..." : "Envoyer la demande"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cropModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0b0d14] p-6 shadow-2xl"
            >
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
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Zoom
                </label>
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
                  className="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-5 py-3 text-sm font-black uppercase tracking-widest text-black hover:from-yellow-300 hover:to-orange-400"
                >
                  Valider le recadrage
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}