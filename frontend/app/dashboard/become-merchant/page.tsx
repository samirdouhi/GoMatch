"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Cropper, { Area, Point } from "react-easy-crop";
import {
  Store,
  ArrowLeft,
  Camera,
  X,
  Mail,
  Phone,
  MapPin,
  BadgeInfo,
  User,
} from "lucide-react";
import { authFetch } from "@/lib/authApi";
import { clearAuthTokens, getAccessToken } from "@/lib/authTokens";

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

type MerchantFormState = {
  telephone: string;
  nomResponsable: string;
  emailProfessionnel: string;
  ville: string;
  adresseProfessionnelle: string;
  typeActivite: string;
};

type ExistingMerchantProfile = {
  status?: string | null;
};

const PROFILE_API = "/profile";
const MERCHANT_PROFILE_API = "/commercant-profile";

function pickString(obj: AnyObj, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
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

async function tryGetExistingMerchantProfile(): Promise<ExistingMerchantProfile | null> {
  const res = await authFetch("/commercant-profile/me", {
    method: "GET",
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = (await res.json()) as AnyObj;

  return {
    status: pickString(data, ["status", "Status"]) || null,
  };
}

export default function BecomeMerchantPage() {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

  const handleForbiddenProfileState = useCallback(() => {
    setSubmitError("Compte ou profil invalide. Merci de vous reconnecter.");
    clearAuthTokens();
    router.replace("/signin");
  }, [router]);

  const loadProfile = useCallback(async () => {
    try {
      const token = getAccessToken();

      if (!token) {
        router.replace("/signin");
        return;
      }

      const res = await authFetch(`${PROFILE_API}/me`, {
        method: "GET",
        cache: "no-store",
      });

      if (res.status === 401 || res.status === 403) {
        handleForbiddenProfileState();
        return;
      }

      if (res.status === 404) {
        setSubmitError("Profil introuvable.");
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

      const langue = pickString(userProfile, ["langue", "Langue"]);
      const photoUrlFromApi = normalizePhotoApiUrl(
        pickString(userProfile, ["photoUrl", "PhotoUrl"])
      );

      const prenom = pickString(userProfile, ["prenom", "Prenom"]);
      const nom = pickString(userProfile, ["nom", "Nom"]);
      const dateNaissance = pickString(userProfile, ["dateNaissance", "DateNaissance"]);
      const genre = pickString(userProfile, ["genre", "Genre"]);

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

      const existingMerchantProfile = await tryGetExistingMerchantProfile();

      if (existingMerchantProfile?.status === "Pending") {
        router.replace("/dashboard/merchant-request");
        return;
      }

      if (existingMerchantProfile?.status === "Approved") {
        router.replace("/merchant/dashboard");
        return;
      }

      // Si Rejected ou null => accès autorisé à cette page
    } catch {
      setSubmitError("Erreur réseau : impossible de charger le profil.");
    } finally {
      setLoadingProfile(false);
    }
  }, [handleForbiddenProfileState, loadProtectedPhoto, replaceBlobUrl, router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const canSubmitMerchant = useMemo(
    () =>
      merchantForm.telephone.trim().length > 0 &&
      merchantForm.nomResponsable.trim().length > 0 &&
      merchantForm.emailProfessionnel.trim().length > 0 &&
      merchantForm.typeActivite.trim().length > 0,
    [merchantForm]
  );

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
      return { ok: false, message: "Session expirée. Merci de vous reconnecter." };
    }

    if (res.status === 404) {
      return { ok: false, message: "Profil introuvable." };
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
        message: "Les informations de base du profil sont absentes.",
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
      return { ok: false, message: "Session expirée. Merci de vous reconnecter." };
    }

    if (res.status === 404) {
      return { ok: false, message: "Profil introuvable." };
    }

    if (!res.ok) {
      const message = await tryReadErrorMessage(res);
      return {
        ok: false,
        message: message ?? `Impossible d'enregistrer le profil. (HTTP ${res.status})`,
      };
    }

    return { ok: true };
  }, [profileState.langue, userProfileState]);

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

    return authFetch(`${MERCHANT_PROFILE_API}/me/business`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }, [merchantForm]);

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
        setSubmitError(userResult.message ?? "Impossible d'enregistrer le profil.");
        if (userResult.message?.includes("Session expirée")) {
          clearAuthTokens();
          router.replace("/signin");
        }
        return;
      }

      const photoResult = await savePhoto();

      if (!photoResult.ok) {
        setSubmitError(photoResult.message ?? "Impossible d'enregistrer la photo.");
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

  if (loadingProfile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        Chargement...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/[0.06]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour dashboard
        </button>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0b0d14] p-8 md:p-10">
          <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_top_left,#facc15,transparent_35%),radial-gradient(circle_at_bottom_right,#f97316,transparent_30%)]" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-yellow-400">
              <Store className="h-3 w-3" />
              Devenir commerçant
            </div>

            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight">
              Rejoindre la plateforme en tant que professionnel
            </h1>

            <p className="max-w-3xl text-sm leading-relaxed text-white/65">
              Complétez votre dossier commerçant. Votre demande sera transmise pour analyse
              après vérification de votre email professionnel.
            </p>
          </div>
        </section>

        {submitError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {submitError}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[#0b0d14] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-black uppercase italic tracking-tight">
                Profil actuel
              </h2>
              <p className="mt-2 text-sm text-white/50">
                Nous réutilisons les informations de votre profil de base.
              </p>
            </div>

            <div className="flex flex-col items-center gap-5">
              {profileState.photoUrl ? (
                <div className="relative h-32 w-32 overflow-hidden rounded-full border border-white/10">
                  <Image
                    src={profileState.photoUrl}
                    alt="Photo de profil"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40">
                  <Camera className="h-10 w-10" />
                </div>
              )}

              <button
                onClick={() => photoInputRef.current?.click()}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10"
              >
                Changer la photo
              </button>

              <input
                ref={photoInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoPick}
              />

              <div className="grid w-full gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    Nom complet
                  </p>
                  <p className="text-sm text-white/80">
                    {userProfileState.prenom} {userProfileState.nom}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    Langue
                  </p>
                  <p className="text-sm text-white/80">{profileState.langue}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0b0d14] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-black uppercase italic tracking-tight">
                Dossier commerçant
              </h2>
              <p className="mt-2 text-sm text-white/50">
                Les champs marqués d’un astérisque sont obligatoires.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  value={merchantForm.telephone}
                  onChange={(e) =>
                    setMerchantForm((prev) => ({ ...prev, telephone: e.target.value }))
                  }
                  placeholder="Téléphone *"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/40"
                />
              </div>

              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  value={merchantForm.nomResponsable}
                  onChange={(e) =>
                    setMerchantForm((prev) => ({ ...prev, nomResponsable: e.target.value }))
                  }
                  placeholder="Nom du responsable *"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/40"
                />
              </div>

              <div className="relative md:col-span-2">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  type="email"
                  value={merchantForm.emailProfessionnel}
                  onChange={(e) =>
                    setMerchantForm((prev) => ({
                      ...prev,
                      emailProfessionnel: e.target.value,
                    }))
                  }
                  placeholder="Email professionnel *"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/40"
                />
              </div>

              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  value={merchantForm.ville}
                  onChange={(e) =>
                    setMerchantForm((prev) => ({ ...prev, ville: e.target.value }))
                  }
                  placeholder="Ville"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/40"
                />
              </div>

              <div className="relative">
                <BadgeInfo className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  value={merchantForm.typeActivite}
                  onChange={(e) =>
                    setMerchantForm((prev) => ({ ...prev, typeActivite: e.target.value }))
                  }
                  placeholder="Type d’activité *"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/40"
                />
              </div>

              <textarea
                value={merchantForm.adresseProfessionnelle}
                onChange={(e) =>
                  setMerchantForm((prev) => ({
                    ...prev,
                    adresseProfessionnelle: e.target.value,
                  }))
                }
                placeholder="Adresse professionnelle"
                rows={5}
                className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/40"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => void confirmMerchantFlow()}
                disabled={saving || !canSubmitMerchant}
                className="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-4 text-sm font-black uppercase tracking-widest text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Envoi..." : "Envoyer la demande"}
              </button>
            </div>
          </div>
        </section>
      </div>

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
    </main>
  );
}