"use client";

import Link from "next/link";
import Script from "next/script";
import { ArrowLeft, Zap, ArrowRight } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import NationaliteSelect from "@/components/NationaliteSelect";
import { googleLogin, type GoogleLoginResponse } from "@/lib/authApi";
import { setAuthTokens } from "@/lib/authTokens";
import { getFirstRoute } from "@/lib/profile/profile.routing";

/* -------------------- GOOGLE TYPES -------------------- */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number | string;
              logo_alignment?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

/* -------------------- BACKGROUND TYPES -------------------- */
interface Orbe {
  id: number;
  size: number;
  left: number;
  top: number;
  duration: number;
}

interface Comete {
  id: number;
  top: number;
  duration: number;
  delay: number;
}

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

/* -------------------- BACKGROUND -------------------- */
const DynamicSpaceBackground = () => {
  const elements = useMemo(() => {
    const newOrbes: Orbe[] = [...Array(5)].map((_, i) => ({
      id: i,
      size: 300 + i * 50,
      left: Math.floor(pseudoRandom(i + 1) * 100),
      top: Math.floor(pseudoRandom(i + 2) * 100),
      duration: 10 + i * 2,
    }));

    const newCometes: Comete[] = [...Array(12)].map((_, i) => ({
      id: i,
      top: Math.floor(pseudoRandom(i + 10) * 100),
      duration: 3 + pseudoRandom(i + 20) * 4,
      delay: pseudoRandom(i + 30) * 5,
    }));

    return { orbes: newOrbes, cometes: newCometes };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ y: [0, -40] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffd70005_1px,transparent_1px),linear-gradient(to_bottom,#ffd70005_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"
      />

      {elements.orbes.map((orbe) => (
        <motion.div
          key={`orbe-${orbe.id}`}
          className="absolute rounded-full bg-amber-500/10 blur-[100px]"
          style={{
            width: orbe.size,
            height: orbe.size,
            left: `${orbe.left}%`,
            top: `${orbe.top}%`,
          }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: orbe.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {elements.cometes.map((comete) => (
        <motion.div
          key={`comet-${comete.id}`}
          className="absolute h-[1px] w-[150px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"
          style={{ top: `${comete.top}%`, left: "-20%" }}
          animate={{ left: ["-20%", "120%"] }}
          transition={{
            duration: comete.duration,
            repeat: Infinity,
            delay: comete.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

/* -------------------- ERRORS -------------------- */
type FieldErrors = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  nationalite: string;
  birthDate: string;
  gender: string;
  password: string;
  confirmPassword: string;
  accepted: string;
}>;

const stepFields: Record<number, (keyof FieldErrors)[]> = {
  1: ["firstName", "lastName"],
  2: ["email", "nationalite"],
  3: ["birthDate", "gender"],
  4: ["password", "confirmPassword", "accepted"],
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function fieldHasError(fieldErrors: FieldErrors, key: keyof FieldErrors) {
  return typeof fieldErrors[key] === "string" && (fieldErrors[key] as string).trim().length > 0;
}

function firstErrorStep(fieldErrors: FieldErrors): number | null {
  for (const s of [1, 2, 3, 4]) {
    const fields = stepFields[s];
    if (fields.some((f) => fieldHasError(fieldErrors, f))) return s;
  }
  return null;
}

/* --------- backend parsing --------- */
type AnyObj = Record<string, unknown>;

function extractMessagesFromErrors(errors: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!errors || typeof errors !== "object") return out;

  for (const [k, v] of Object.entries(errors)) {
    if (Array.isArray(v)) {
      const msg = v.filter((x) => typeof x === "string" && x.trim()).join(" · ");
      if (msg) out[k] = msg;
    } else if (typeof v === "string" && v.trim()) {
      out[k] = v.trim();
    } else if (v && typeof v === "object") {
      const nested = extractMessagesFromErrors(v);
      for (const [nk, nv] of Object.entries(nested)) out[`${k}.${nk}`] = nv;
    }
  }
  return out;
}

function pickString(obj: AnyObj, keys: string[]): string | null {
  for (const k of keys) {
    const val = obj?.[k];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return null;
}

async function readBodySmart(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) return await res.json();
    return await res.text();
  } catch {
    return null;
  }
}

function backendToFieldErrors(
  payload: unknown,
  status: number
): { fieldErrors: FieldErrors; global?: string } {
  const fieldErrors: FieldErrors = {};
  let global: string | undefined;

  if (typeof payload === "string") {
    const t = payload.trim();
    if (t) global = t.length > 220 ? "Erreur serveur." : t;
    if (!global) {
      if (status === 409) fieldErrors.email = "Cet email est déjà utilisé.";
      else global = `Inscription échouée (HTTP ${status}).`;
    }
    return { fieldErrors, global };
  }

  if (!payload || typeof payload !== "object") {
    if (status === 409) fieldErrors.email = "Cet email est déjà utilisé.";
    else if (status === 422) fieldErrors.password = "Mot de passe non valide.";
    else if (status === 400) global = "Données invalides.";
    else global = `Inscription échouée (HTTP ${status}).`;
    return { fieldErrors, global };
  }

  const d = payload as AnyObj;

  const step = pickString(d, ["step"]);
  const error = pickString(d, ["error", "message", "detail"]);
  if (step || error) {
    return {
      fieldErrors,
      global: [step, error].filter(Boolean).join(" : "),
    };
  }

  const structured =
    extractMessagesFromErrors(d.errors) ||
    extractMessagesFromErrors(d.validationErrors) ||
    extractMessagesFromErrors(d.modelState);

  const keys = structured ? Object.keys(structured) : [];

  if (keys.length > 0) {
    for (const [k, msg] of Object.entries(structured)) {
      const key = k.toLowerCase();

      if (key.includes("email")) fieldErrors.email = msg;
      else if (key.includes("nationalite") || key.includes("nationality")) fieldErrors.nationalite = msg;
      else if (key.includes("password") || key.includes("mdp")) fieldErrors.password = msg;
      else if (key.includes("birth") || key.includes("date")) fieldErrors.birthDate = msg;
      else if (key.includes("gender") || key.includes("genre") || key.includes("sexe")) fieldErrors.gender = msg;
      else if (key.includes("prenom") || key.includes("firstname")) fieldErrors.firstName = msg;
      else if (key.includes("nom") || key.includes("lastname")) fieldErrors.lastName = msg;
      else global = msg;
    }

    return { fieldErrors, global };
  }

  const direct = pickString(d, ["erreur", "Erreur", "message", "error", "title", "detail", "description"]);

  if (direct) {
    const low = direct.toLowerCase();

    if (status === 409 || (low.includes("email") && (low.includes("existe") || low.includes("already") || low.includes("utilisé")))) {
      fieldErrors.email = direct;
    } else if (low.includes("nationalite") || low.includes("nationality")) {
      fieldErrors.nationalite = direct;
    } else if (low.includes("mot de passe") || low.includes("password")) {
      fieldErrors.password = direct;
    } else if (low.includes("prénom") || low.includes("prenom") || low.includes("first name") || low.includes("firstname")) {
      fieldErrors.firstName = direct;
    } else if (low.includes("nom") || low.includes("last name") || low.includes("lastname")) {
      fieldErrors.lastName = direct;
    } else if (low.includes("date")) {
      fieldErrors.birthDate = direct;
    } else if (low.includes("genre") || low.includes("gender") || low.includes("sexe")) {
      fieldErrors.gender = direct;
    } else {
      global = direct;
    }

    return { fieldErrors, global };
  }

  if (status === 409) fieldErrors.email = "Cet email est déjà utilisé.";
  else if (status === 422) fieldErrors.password = "Mot de passe non valide.";
  else global = `Inscription échouée (HTTP ${status}).`;

  return { fieldErrors, global };
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;

  return (
    <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-red-500 drop-shadow-[0_0_6px_#ef4444]">
      {msg}
    </p>
  );
}

async function finalizeExistingGoogleLogin(
  data: GoogleLoginResponse,
  router: ReturnType<typeof useRouter>
) {
  if (
    !data.login?.accessToken ||
    !data.login?.expiresAtUtc ||
    !data.login?.refreshToken
  ) {
    throw new Error("Réponse Google invalide.");
  }

  setAuthTokens(
    data.login.accessToken,
    data.login.expiresAtUtc,
    data.login.refreshToken
  );

  let route = "/dashboard";

  try {
    route = await getFirstRoute();
  } catch {
    route = "/dashboard";
  }

  router.replace(route);
}

/* -------------------- PAGE -------------------- */
export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googlePrefillAppliedRef = useRef(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [nationalite, setNationalite] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"Homme" | "Femme" | "">("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [accepted, setAccepted] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const [showEmailConfirmationModal, setShowEmailConfirmationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  useEffect(() => {
    if (googlePrefillAppliedRef.current) return;

    const google = searchParams.get("google") === "1";
    if (!google) return;

    const qpEmail = (searchParams.get("email") || "").trim();
    const qpPrenom = (searchParams.get("prenom") || "").trim();
    const qpNom = (searchParams.get("nom") || "").trim();

    if (qpPrenom) setFirstName(qpPrenom);
    if (qpNom) setLastName(qpNom);
    if (qpEmail) setEmail(qpEmail);

    if (!qpPrenom || !qpNom) {
      setStep(1);
    } else {
      setStep(2);
    }

    googlePrefillAppliedRef.current = true;
  }, [searchParams]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const tryInitGoogle = () => {
      if (cancelled) return;

      if (!window.google || !googleButtonRef.current) {
        attempts += 1;
        if (attempts < 40) {
          window.setTimeout(tryInitGoogle, 250);
        }
        return;
      }

      googleButtonRef.current.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) {
            setGlobalError("Google n'a pas renvoyé de jeton valide.");
            return;
          }

          setGlobalError("");
          setLoading(true);

          try {
            const data = await googleLogin({ idToken: response.credential });

            if (data.requiresRegistration) {
              const nextFirstName = data.prenom?.trim() ?? "";
              const nextLastName = data.nom?.trim() ?? "";
              const nextEmail = data.email?.trim() ?? "";

              setFirstName(nextFirstName);
              setLastName(nextLastName);
              setEmail(nextEmail);

              setFieldErrors((prev) => ({
                ...prev,
                firstName: "",
                lastName: "",
                email: "",
              }));

              if (!nextFirstName || !nextLastName) {
                setStep(1);
              } else {
                setStep(2);
              }

              return;
            }

            await finalizeExistingGoogleLogin(data, router);
          } catch (err: unknown) {
            setGlobalError(
              err instanceof Error ? err.message : "Erreur connexion Google."
            );
          } finally {
            setLoading(false);
          }
        },
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "signup_with",
        shape: "pill",
        width: 360,
        logo_alignment: "left",
      });

      setGoogleReady(true);
    };

    tryInitGoogle();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleContinueToSignin() {
    if (typeof window !== "undefined") {
      localStorage.setItem("gomatch_email_pending", "1");
      localStorage.removeItem("gomatch_email_confirmed");
    }

    setShowEmailConfirmationModal(false);
    router.replace("/signin");
  }

  function isStepValidNow(s: number) {
    if (s === 1) return !!firstName.trim() && !!lastName.trim();
    if (s === 2) return !!email.trim() && isValidEmail(email) && !!nationalite.trim();
    if (s === 3) return !!birthDate && !!gender;
    if (s === 4) return !!password && !!confirmPassword && password === confirmPassword && accepted;
    return false;
  }

  function validateCurrentStep(s: number): boolean {
    const next: FieldErrors = {};

    if (s === 1) {
      if (!firstName.trim()) next.firstName = "Prénom obligatoire.";
      if (!lastName.trim()) next.lastName = "Nom obligatoire.";
    }

    if (s === 2) {
      if (!email.trim()) next.email = "Email obligatoire.";
      else if (!isValidEmail(email)) next.email = "Email invalide.";
      if (!nationalite.trim()) next.nationalite = "Nationalité obligatoire.";
    }

    if (s === 3) {
      if (!birthDate) next.birthDate = "Date de naissance obligatoire.";
      if (!gender) next.gender = "Choisis Homme ou Femme.";
    }

    if (s === 4) {
      if (!password) next.password = "Mot de passe obligatoire.";

      if (password) {
        const rules: string[] = [];
        if (password.length < 8) rules.push("8+ caractères");
        if (!/[A-Z]/.test(password)) rules.push("1 majuscule");
        if (!/[0-9]/.test(password)) rules.push("1 chiffre");
        if (!/[^A-Za-z0-9]/.test(password)) rules.push("1 symbole");
        if (rules.length) next.password = `Mot de passe : ${rules.join(", ")}.`;
      }

      if (!confirmPassword) next.confirmPassword = "Confirme le mot de passe.";
      if (password && confirmPassword && password !== confirmPassword) {
        next.confirmPassword = "Les mots de passe diffèrent.";
      }

      if (!accepted) next.accepted = "Accepte les conditions.";
    }

    setFieldErrors((prev) => {
      const merged: FieldErrors = { ...prev };
      for (const f of stepFields[s] ?? []) delete merged[f];
      return { ...merged, ...next };
    });

    setGlobalError("");
    return Object.keys(next).length === 0;
  }

  const nextStep = () => {
    const ok = validateCurrentStep(step);
    if (!ok) return;
    setStep((prev) => Math.min(totalSteps, prev + 1));
  };

  const prevStep = () => {
    setGlobalError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const ok = validateCurrentStep(4);
    if (!ok) {
      setStep(4);
      return;
    }

    setLoading(true);
    setGlobalError("");

    try {
      const res = await fetch("/api/gateway/register-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizeEmail(email),
          password,
          confirmPassword,
          prenom: firstName.trim(),
          nom: lastName.trim(),
          nationalite: nationalite.trim(),
          dateNaissance: birthDate,
          genre: gender,
        }),
      });

      const payload = await readBodySmart(res);
      console.log("REGISTER STATUS:", res.status);
      console.log("REGISTER PAYLOAD:", payload);

      if (!res.ok) {
        const { fieldErrors: fe, global } = backendToFieldErrors(payload, res.status);
        setFieldErrors((prev) => ({ ...prev, ...fe }));
        setGlobalError(global ?? JSON.stringify(payload));

        const backendStep = firstErrorStep(fe);
        if (backendStep) setStep(backendStep);
        return;
      }

      setRegisteredEmail(normalizeEmail(email));
      setShowEmailConfirmationModal(true);
    } catch (err: unknown) {
      setGlobalError(
        err instanceof Error
          ? err.message
          : "Erreur réseau : impossible de contacter le serveur."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />

      <main className="dark min-h-screen w-full bg-[#010204] text-zinc-100 overflow-hidden font-sans antialiased selection:bg-amber-500/30">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-screen">
          <section className="relative hidden lg:flex flex-col justify-between p-20 overflow-hidden border-r border-white/5 bg-zinc-950">
            <motion.div
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 bg-[url('/photoRegister.png')] bg-cover bg-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#010204]/80 via-transparent to-transparent" />

            <div className="relative z-10">
              <p className="text-amber-400 font-black text-xs tracking-[0.5em] uppercase mb-2 drop-shadow-[0_0_8px_#fbbf24]">
                GOMATCH · 2030
              </p>
              <h2 className="text-5xl font-[1000] leading-none tracking-tighter uppercase italic bg-gradient-to-r from-white via-amber-400 to-red-500 bg-[length:200%_auto] animate-gradient-text bg-clip-text text-transparent">
                Rejoins <br /> L&apos;expérience 2030.
              </h2>
            </div>

            <div className="relative z-10">
              <h1 className="text-6xl font-[1000] tracking-tighter italic text-white leading-none uppercase">
                Étape {step} <br />
                <span className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                  sur {totalSteps}
                </span>
              </h1>
            </div>
          </section>

          <section className="relative flex flex-col items-center justify-center p-6 bg-[#010204] overflow-hidden">
            <DynamicSpaceBackground />

            <div className="w-full max-w-[440px] z-10">
              <div className="flex items-center justify-between mb-6 px-2">
                <button
                  onClick={() => (step > 1 ? prevStep() : router.push("/"))}
                  className="flex items-center gap-2 text-[10px] font-black text-zinc-500 hover:text-amber-400 transition-all uppercase tracking-widest"
                >
                  <ArrowLeft className="h-4 w-4" /> {step > 1 ? "Précédent" : "Retour"}
                </button>

                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    {[...Array(totalSteps)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 w-5 rounded-full transition-all duration-300 ${
                          step > i ? "bg-amber-500 shadow-[0_0_12px_#fbbf24]" : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <Zap className="h-4 w-4 text-amber-400 fill-amber-400 animate-pulse drop-shadow-[0_0_8px_#fbbf24]" />
                </div>
              </div>

              <div className="relative p-[1.5px] rounded-[2.6rem]">
                <div className="absolute inset-0 rounded-[2.6rem] overflow-hidden pointer-events-none">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0%,#fbbf24_25%,transparent_50%,#f85050_75%,transparent_100%)]"
                  />
                </div>

                <div className="relative rounded-[2.5rem] bg-[#0A0C10]/95 backdrop-blur-3xl p-10 border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10">
                  <div className="mb-6 flex flex-col items-center gap-4">
                    <div
                      className="w-full flex justify-center min-h-[44px]"
                      ref={googleButtonRef}
                    />

                    {!googleReady && (
                      <div className="text-[9px] text-zinc-600 uppercase tracking-widest">
                        Chargement de Google...
                      </div>
                    )}

                    <div className="flex items-center w-full gap-2">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">
                        ou
                      </span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="min-h-[320px] flex flex-col">
                    <AnimatePresence mode="wait">
                      {step === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -20, opacity: 0 }}
                          className="space-y-4 flex-1"
                        >
                          <h2 className="text-2xl font-[1000] text-white italic uppercase tracking-tighter mb-6">
                            Parle-nous de toi
                          </h2>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Prénom</label>
                            <input
                              type="text"
                              value={firstName}
                              onChange={(e) => {
                                setFirstName(e.target.value);
                                setFieldErrors((p) => ({ ...p, firstName: "" }));
                              }}
                              placeholder="Ton prénom"
                              className={`cyber-input neon-focus ${fieldHasError(fieldErrors, "firstName") ? "border-red-500/40" : ""}`}
                            />
                            <FieldError msg={fieldErrors.firstName} />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Nom</label>
                            <input
                              type="text"
                              value={lastName}
                              onChange={(e) => {
                                setLastName(e.target.value);
                                setFieldErrors((p) => ({ ...p, lastName: "" }));
                              }}
                              placeholder="Ton nom"
                              className={`cyber-input neon-focus ${fieldHasError(fieldErrors, "lastName") ? "border-red-500/40" : ""}`}
                            />
                            <FieldError msg={fieldErrors.lastName} />
                          </div>
                        </motion.div>
                      )}

                      {step === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -20, opacity: 0 }}
                          className="space-y-4 flex-1"
                        >
                          <h2 className="text-2xl font-[1000] text-white italic uppercase tracking-tighter mb-6">
                            Ton email
                          </h2>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Email</label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                setFieldErrors((p) => ({ ...p, email: "" }));
                              }}
                              placeholder="votre@email.com"
                              className={`cyber-input neon-focus ${fieldHasError(fieldErrors, "email") ? "border-red-500/40" : ""}`}
                            />
                            <FieldError msg={fieldErrors.email} />
                          </div>

                          <NationaliteSelect
                            value={nationalite}
                            onChange={(value) => {
                              setNationalite(value);
                              setFieldErrors((p) => ({ ...p, nationalite: "" }));
                            }}
                            error={fieldErrors.nationalite}
                          />
                        </motion.div>
                      )}

                      {step === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -20, opacity: 0 }}
                          className="space-y-4 flex-1"
                        >
                          <h2 className="text-2xl font-[1000] text-white italic uppercase tracking-tighter mb-6">
                            Détails
                          </h2>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">
                              Date de naissance
                            </label>
                            <input
                              type="date"
                              value={birthDate}
                              onChange={(e) => {
                                setBirthDate(e.target.value);
                                setFieldErrors((p) => ({ ...p, birthDate: "" }));
                              }}
                              className={`cyber-input neon-focus ${fieldHasError(fieldErrors, "birthDate") ? "border-red-500/40" : ""}`}
                            />
                            <FieldError msg={fieldErrors.birthDate} />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Sexe</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setGender("Homme");
                                  setFieldErrors((p) => ({ ...p, gender: "" }));
                                }}
                                className={`py-3 rounded-xl border text-[10px] font-bold uppercase transition-all duration-300 ${
                                  gender === "Homme"
                                    ? "border-amber-500 bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                                    : "border-white/5 bg-white/5 text-zinc-500 hover:border-white/10"
                                }`}
                              >
                                Homme
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setGender("Femme");
                                  setFieldErrors((p) => ({ ...p, gender: "" }));
                                }}
                                className={`py-3 rounded-xl border text-[10px] font-bold uppercase transition-all duration-300 ${
                                  gender === "Femme"
                                    ? "border-amber-500 bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                                    : "border-white/5 bg-white/5 text-zinc-500 hover:border-white/10"
                                }`}
                              >
                                Femme
                              </button>
                            </div>
                            <FieldError msg={fieldErrors.gender} />
                          </div>
                        </motion.div>
                      )}

                      {step === 4 && (
                        <motion.div
                          key="step4"
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -20, opacity: 0 }}
                          className="space-y-4 flex-1"
                        >
                          <h2 className="text-2xl font-[1000] text-white italic uppercase tracking-tighter mb-6">
                            Sécurité
                          </h2>

                          <div>
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                setFieldErrors((p) => ({ ...p, password: "" }));
                              }}
                              placeholder="Mot de passe"
                              className={`cyber-input neon-focus mb-2 ${fieldHasError(fieldErrors, "password") ? "border-red-500/40" : ""}`}
                            />
                            <FieldError msg={fieldErrors.password} />
                          </div>

                          <div>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setFieldErrors((p) => ({ ...p, confirmPassword: "" }));
                              }}
                              placeholder="Confirmer mot de passe"
                              className={`cyber-input neon-focus mb-2 ${fieldHasError(fieldErrors, "confirmPassword") ? "border-red-500/40" : ""}`}
                            />
                            <FieldError msg={fieldErrors.confirmPassword} />
                          </div>

                          <label className="flex items-start gap-2 pt-4 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={accepted}
                              onChange={(e) => {
                                setAccepted(e.target.checked);
                                setFieldErrors((p) => ({ ...p, accepted: "" }));
                              }}
                              className="mt-1 accent-amber-500"
                            />
                            <span className="text-[9px] text-zinc-500 font-bold uppercase leading-tight group-hover:text-zinc-300 transition-colors">
                              J&apos;accepte les conditions GoMatch.
                            </span>
                          </label>
                          <FieldError msg={fieldErrors.accepted} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {globalError && (
                      <p className="text-red-500 text-[9px] font-black uppercase text-center mt-4 tracking-widest drop-shadow-[0_0_5px_#ef4444]">
                        {globalError}
                      </p>
                    )}

                    <div className="mt-8">
                      {step < totalSteps ? (
                        <button
                          type="button"
                          onClick={nextStep}
                          disabled={!isStepValidNow(step)}
                          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed py-4 rounded-2xl text-zinc-950 font-[1000] text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]"
                        >
                          Suivant <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={loading || !isStepValidNow(step)}
                          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-2xl text-zinc-950 font-[1000] text-[10px] uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_10px_20px_-5px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)]"
                        >
                          {loading ? "CRÉATION..." : "TERMINER L'INSCRIPTION"}
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              <p className="text-center mt-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                DÉJÀ UN COMPTE ?{" "}
                <Link href="/signin" className="text-white hover:text-amber-400 transition-colors">
                  SE CONNECTER
                </Link>
              </p>
            </div>
          </section>
        </div>

        <AnimatePresence>
          {showEmailConfirmationModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md rounded-[2rem] border border-amber-500/20 bg-[#0A0C10]/95 p-8 shadow-[0_0_40px_rgba(0,0,0,0.7)]"
              >
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10">
                    <Zap className="h-7 w-7 text-amber-400 fill-amber-400" />
                  </div>

                  <h3 className="mb-3 text-xl font-[1000] uppercase italic tracking-tight text-white">
                    Vérifie ton email
                  </h3>

                  <p className="text-sm leading-6 text-zinc-300">
                    Nous venons d&apos;envoyer un email de confirmation à :
                  </p>

                  <p className="mt-2 break-all text-sm font-black text-amber-400">
                    {registeredEmail}
                  </p>

                  <p className="mt-4 text-sm leading-6 text-zinc-400">
                    Veuillez confirmer votre adresse email avant de vous connecter.
                  </p>

                  <button
                    type="button"
                    onClick={handleContinueToSignin}
                    className="mt-8 w-full rounded-2xl bg-amber-500 py-4 text-[10px] font-[1000] uppercase tracking-[0.2em] text-zinc-950 transition-all hover:bg-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.45)]"
                  >
                    Continuer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <style jsx global>{`
          @keyframes gradient-text {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .animate-gradient-text {
            animation: gradient-text 4s ease infinite;
          }

          .cyber-input {
            width: 100%;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 1.2rem;
            padding: 1.2rem;
            font-size: 0.85rem;
            color: white;
            outline: none;
            transition: all 0.3s ease;
          }

          .neon-focus:focus {
            border-color: rgba(251, 191, 36, 0.4);
            background: rgba(251, 191, 36, 0.04);
          }

          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
          }
        `}</style>
      </main>
    </>
  );
}