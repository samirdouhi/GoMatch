"use client";

import Link from "next/link";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import { setAuthTokens, clearAuthTokens } from "@/lib/authTokens";
import {
  googleLogin,
  loginRequest,
  resendConfirmationEmailRequest,
  type GoogleLoginResponse,
} from "@/lib/authApi";
import { getFirstRoute } from "@/lib/profile/profile.routing";

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

type DecodedJwt = {
  roles?: string[] | string;
  role?: string[] | string;
  email?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?:
    | string[]
    | string;
};

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

function normalizeRoles(value: string[] | string | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getRolesFromToken(token: string): string[] {
  try {
    const decoded = jwtDecode<DecodedJwt>(token);

    const roles = [
      ...normalizeRoles(decoded.roles),
      ...normalizeRoles(decoded.role),
      ...normalizeRoles(
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
      ),
    ];

    return [...new Set(roles.filter(Boolean))];
  } catch {
    return [];
  }
}

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
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
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

function clearOnboardingCaches() {
  if (typeof window === "undefined") return;

  const suspicious = [
    "gomatch_onboarding",
    "onboarding",
    "selectedInterests",
    "interests",
    "wizard",
    "setupStep",
    "skippedSteps",
    "gomatch_profile_mock_v3",
  ];

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (suspicious.some((s) => k.toLowerCase().includes(s))) {
      localStorage.removeItem(k);
    }
  }

  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const k = sessionStorage.key(i);
    if (!k) continue;
    if (suspicious.some((s) => k.toLowerCase().includes(s))) {
      sessionStorage.removeItem(k);
    }
  }
}

function clearEmailConfirmationFlags() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("gomatch_email_pending");
  localStorage.removeItem("gomatch_email_confirmed");
}

function buildRegisterUrlFromGoogle(data: GoogleLoginResponse): string {
  const params = new URLSearchParams();
  params.set("google", "1");

  if (data.email?.trim()) {
    params.set("email", data.email.trim());
  }

  if (data.prenom?.trim()) {
    params.set("prenom", data.prenom.trim());
  }

  if (data.nom?.trim()) {
    params.set("nom", data.nom.trim());
  }

  return `/Register?${params.toString()}`;
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailPending, setEmailPending] = useState(false);

  const loweredError = error.toLowerCase();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncEmailConfirmationState = () => {
      const urlRegistered = searchParams.get("registered") === "1";
      const storedPending =
        localStorage.getItem("gomatch_email_pending") === "1";
      const storedConfirmed =
        localStorage.getItem("gomatch_email_confirmed") === "1";

      if (storedConfirmed) {
        localStorage.removeItem("gomatch_email_pending");
        localStorage.removeItem("gomatch_email_confirmed");
        setEmailPending(false);
        setInfoMessage("");
        return;
      }

      if (urlRegistered) {
        localStorage.setItem("gomatch_email_pending", "1");
        setEmailPending(true);
        setInfoMessage(
          "Nous venons d’envoyer un email de confirmation. Veuillez confirmer votre adresse email avant de vous connecter."
        );
        return;
      }

      if (storedPending) {
        setEmailPending(true);
        setInfoMessage(
          "Votre adresse email doit être confirmée avant la connexion."
        );
        return;
      }

      setEmailPending(false);
      setInfoMessage("");
    };

    syncEmailConfirmationState();

    const onStorage = () => {
      syncEmailConfirmationState();
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  async function finalizeLogin(
    accessToken: string,
    expiresAtUtc: string,
    refreshToken: string
  ) {
    try {
      setAuthTokens(accessToken, expiresAtUtc, refreshToken);
      clearEmailConfirmationFlags();
      setEmailPending(false);
      setInfoMessage("");

      const roles = getRolesFromToken(accessToken);

      if (roles.includes("Admin")) {
        router.replace("/admin");
        return;
      }

      let route = "/dashboard";

      try {
        route = await getFirstRoute();
      } catch (err) {
        console.error("getFirstRoute ERROR:", err);
      }

      router.replace(route);
    } catch (err) {
      console.error("FINALIZE LOGIN ERROR:", err);
      clearAuthTokens();
      router.replace("/signin");
    }
  }

  async function handleGoogleLogin(credential: string) {
    setError("");
    setResendMessage("");
    setLoading(true);

    try {
      const data = await googleLogin({
        idToken: credential,
      });

      if (data.requiresRegistration) {
        clearAuthTokens();
        clearOnboardingCaches();
        clearEmailConfirmationFlags();
        setEmailPending(false);
        setInfoMessage("");
        router.replace(buildRegisterUrlFromGoogle(data));
        return;
      }

      if (
        !data.login?.accessToken ||
        !data.login?.expiresAtUtc ||
        !data.login?.refreshToken
      ) {
        throw new Error("Réponse Google invalide.");
      }

      await finalizeLogin(
        data.login.accessToken,
        data.login.expiresAtUtc,
        data.login.refreshToken
      );
    } catch (err: unknown) {
      clearAuthTokens();
      setError(err instanceof Error ? err.message : "Erreur Google");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmationEmail() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Saisis ton adresse email pour renvoyer l’email de confirmation.");
      return;
    }

    setError("");
    setResendMessage("");
    setResendLoading(true);

    try {
      await resendConfirmationEmailRequest(normalizedEmail);

      setResendMessage(
        "Un nouvel email de confirmation a été envoyé à votre adresse email."
      );

      if (typeof window !== "undefined") {
        localStorage.setItem("gomatch_email_pending", "1");
        localStorage.removeItem("gomatch_email_confirmed");
      }

      setEmailPending(true);
      setInfoMessage(
        "Votre adresse email doit être confirmée avant la connexion."
      );

      setResendCooldown(10);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur réseau lors du renvoi de l’email."
      );
    } finally {
      setResendLoading(false);
    }
  }

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
        callback: (response: { credential?: string }) => {
          if (!response.credential) {
            setError("Google n'a pas renvoyé de jeton valide.");
            return;
          }

          void handleGoogleLogin(response.credential);
        },
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
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
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setResendMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Email et mot de passe obligatoires.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginRequest({
        email: normalizedEmail,
        password,
      });

      clearEmailConfirmationFlags();

      await finalizeLogin(
        data.accessToken,
        data.expiresAtUtc,
        data.refreshToken
      );
    } catch (err: unknown) {
      console.error("LOGIN ERROR:", err);

      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);

      const lowered = message.toLowerCase();

      if (
        lowered.includes("confirmer votre adresse email") ||
        lowered.includes("email non confirmé") ||
        lowered.includes("email confirme")
      ) {
        if (typeof window !== "undefined") {
          localStorage.setItem("gomatch_email_pending", "1");
          localStorage.removeItem("gomatch_email_confirmed");
        }

        setEmailPending(true);
        setInfoMessage(
          "Votre adresse email doit être confirmée avant la connexion."
        );

        if (resendCooldown <= 0) {
          setResendCooldown(10);
        }
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("gomatch_email_pending");
        }
        setEmailPending(false);
      }
    } finally {
      setLoading(false);
    }
  }

  const showResendButton =
    emailPending ||
    loweredError.includes("confirmer votre adresse email") ||
    loweredError.includes("email non confirmé") ||
    loweredError.includes("email confirme");

  return (
    <main className="h-screen w-full overflow-hidden bg-[#010204] font-sans text-zinc-100 antialiased select-none">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_1fr]">
        <section className="relative hidden overflow-hidden p-20 lg:flex lg:flex-col lg:justify-end">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute inset-0 bg-[url('/photosignin.png')] bg-cover bg-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#010204] via-[#010204]/40 to-transparent" />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="mb-6 flex items-center gap-3 text-amber-400">
                <div className="h-[1px] w-12 bg-amber-500 shadow-[0_0_8px_#fbbf24]" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">
                  GoMatch · 2030
                </span>
              </div>

              <h1 className="mb-8 text-7xl font-[1000] leading-[0.85] tracking-tighter italic text-white">
                LE FOOTBALL <br />
                <span className="animate-gradient-x bg-gradient-to-r from-white via-amber-400 to-red-500 bg-[length:200%_auto] bg-clip-text text-transparent">
                  AU CŒUR DU ROYAUME
                </span>
              </h1>

              <p className="max-w-md border-l-2 border-amber-500/50 py-2 pl-6 text-lg font-light text-zinc-400">
                Connectez-vous pour vivre L&apos;expérience exclusive de la Coupe
                du Monde au Maroc.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="relative flex flex-col items-center justify-center bg-[#010204] p-6 lg:p-12">
          <DynamicSpaceBackground />

          <div className="relative z-10 w-full max-w-[440px]">
            <div className="mb-8 flex items-center justify-between px-2">
              <Link
                href="/"
                className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-all hover:text-amber-400"
              >
                <ArrowLeft className="h-4 w-4" />
                RETOUR
              </Link>

              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2">
                <Zap className="h-3 w-3 animate-pulse fill-amber-400 text-amber-400" />
                <span className="animate-pulse text-[9px] font-black uppercase tracking-tighter text-amber-400">
                  Rapide
                </span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[2.6rem] p-[1.5px]">
              <div className="absolute inset-0 bg-transparent">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute left-1/2 top-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0%,#fbbf24_25%,transparent_50%,#f85050_75%,transparent_100%)]"
                />
              </div>

              <div className="relative rounded-[2.5rem] bg-[#0A0C10]/95 p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl lg:p-12">
                <div className="mb-10 text-center">
                  <div className="mb-6 inline-flex rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-4 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
                    <ShieldCheck className="h-8 w-8 text-amber-400" />
                  </div>
                  <h2 className="mb-2 text-3xl font-[1000] uppercase italic tracking-tight text-white">
                    Connexion
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                    Accédez à votre espace membre GoMatch
                  </p>
                </div>

                <AnimatePresence>
                  {infoMessage && !error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-center text-[10px] font-black uppercase tracking-widest text-amber-300"
                    >
                      {infoMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-[10px] font-black uppercase tracking-widest text-red-400"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {resendMessage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center text-[10px] font-black uppercase tracking-widest text-emerald-300"
                    >
                      {resendMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                {showResendButton && (
                  <div className="mb-6">
                    <button
                      type="button"
                      onClick={handleResendConfirmationEmail}
                      disabled={resendLoading || resendCooldown > 0}
                      className="w-full rounded-2xl border border-amber-500/25 bg-amber-500/10 py-4 text-[10px] font-[1000] uppercase tracking-[0.2em] text-amber-300 transition-all hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resendLoading
                        ? "RENVOI EN COURS..."
                        : resendCooldown > 0
                        ? `RENVOYER L'EMAIL (${resendCooldown}s)`
                        : "RENVOYER L'EMAIL DE CONFIRMATION"}
                    </button>
                  </div>
                )}

                <div className="mb-6 flex flex-col items-center gap-4">
                  <div
                    className="flex min-h-[44px] w-full justify-center"
                    ref={googleButtonRef}
                  />

                  {!googleReady && (
                    <div className="text-[9px] uppercase tracking-widest text-zinc-600">
                      Chargement de Google...
                    </div>
                  )}

                  <div className="flex w-full items-center gap-4">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[9px] uppercase tracking-widest text-zinc-600">
                      ou
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="ml-2 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
                      Identifiant Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nom@exemple.com"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.02] py-5 pl-14 pr-4 text-sm outline-none transition-all placeholder:text-zinc-800 focus:border-amber-500/40 focus:bg-amber-500/[0.04]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
                        Mot de passe
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-[9px] font-black uppercase text-amber-500/40 transition-colors hover:text-amber-400"
                      >
                        Oublié ?
                      </Link>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.02] py-5 pl-14 pr-14 text-sm outline-none transition-all placeholder:text-zinc-800 focus:border-amber-500/40 focus:bg-amber-500/[0.04]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={loading}
                    className="group relative w-full overflow-hidden rounded-2xl bg-amber-500 py-6 text-[11px] font-[1000] uppercase tracking-[0.4em] text-zinc-950 shadow-[0_20px_40px_-10px_rgba(251,191,36,0.5)] transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:animate-shine" />
                    <span className="relative flex items-center justify-center gap-3">
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Accéder au stade{" "}
                          <ChevronRight className="h-4 w-4 stroke-[3px]" />
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>

                <div className="mt-12 border-t border-white/5 pt-8 text-center">
                  <p className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    Nouveau ici ?
                    <Link
                      href="/Register"
                      className="border-b-2 border-amber-500/50 pb-0.5 text-white transition-all hover:text-amber-400"
                    >
                      Rejoindre l&apos;aventure
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes gradient-x {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-gradient-x {
          animation: gradient-x 5s ease infinite;
        }

        @keyframes shine {
          0% {
            transform: translateX(-150%) skewX(-20deg);
          }
          100% {
            transform: translateX(150%) skewX(-20deg);
          }
        }

        .animate-shine {
          animation: shine 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        html,
        body {
          height: 100%;
          overflow: hidden;
          background: #010204;
        }

        ::placeholder {
          color: #1a1a1c !important;
          letter-spacing: 0.1em;
        }
      `}</style>
    </main>
  );
}