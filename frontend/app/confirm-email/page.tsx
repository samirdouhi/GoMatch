"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertTriangle, Loader2, ArrowRight, Home } from "lucide-react";
import { clearAuthTokens } from "@/lib/authTokens";
import { confirmEmailRequest } from "@/lib/authApi";

type ConfirmState = "loading" | "success" | "error";

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<ConfirmState>("loading");
  const [message, setMessage] = useState(
    "Confirmation de votre adresse email..."
  );

  useEffect(() => {
    let isMounted = true;

    async function runConfirmation() {
      clearAuthTokens();

      if (!token) {
        if (!isMounted) return;
        setState("error");
        setMessage("Token de confirmation manquant.");
        return;
      }

      try {
        const data = await confirmEmailRequest(token);

        if (!isMounted) return;

        localStorage.removeItem("gomatch_email_pending");
        localStorage.setItem("gomatch_email_confirmed", "1");

        setState("success");
        setMessage(data?.message || "Email confirmé avec succès.");
      } catch (error: unknown) {
        if (!isMounted) return;

        setState("error");

        if (error instanceof Error) {
          if (error.message === "Failed to fetch") {
            setMessage("Impossible de contacter le serveur (Gateway).");
          } else {
            setMessage(error.message);
          }
        } else {
          setMessage("Erreur inconnue.");
        }
      }
    }

    void runConfirmation();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const isLoading = state === "loading";
  const isSuccess = state === "success";
  const isError = state === "error";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050816] px-6 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.12),transparent_30%),radial-gradient(circle_at_bottom,rgba(249,115,22,0.10),transparent_25%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:38px_38px] opacity-20" />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_0_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-yellow-400/10 via-orange-500/10 to-transparent px-8 py-7">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-yellow-400">
            GoMatch
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase italic tracking-tight text-white md:text-4xl">
            Confirmation email
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Validation de votre compte pour accéder à votre espace GoMatch.
          </p>
        </div>

        <div className="p-8 md:p-10">
          <div
            className={[
              "rounded-[24px] border p-6 transition-all",
              isLoading && "border-blue-400/20 bg-blue-400/5",
              isSuccess && "border-emerald-400/20 bg-emerald-400/5",
              isError && "border-red-400/20 bg-red-400/5",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="flex items-start gap-4">
              <div
                className={[
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
                  isLoading && "border-blue-400/20 bg-blue-400/10 text-blue-300",
                  isSuccess &&
                    "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
                  isError && "border-red-400/20 bg-red-400/10 text-red-300",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {isLoading && <Loader2 className="h-6 w-6 animate-spin" />}
                {isSuccess && <CheckCircle2 className="h-6 w-6" />}
                {isError && <AlertTriangle className="h-6 w-6" />}
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-extrabold uppercase tracking-wide text-white">
                  {isLoading && "Vérification en cours"}
                  {isSuccess && "Confirmation réussie"}
                  {isError && "Confirmation impossible"}
                </h2>

                <p
                  className={[
                    "mt-2 text-sm leading-6",
                    isLoading && "text-slate-300",
                    isSuccess && "text-emerald-300",
                    isError && "text-red-300",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {message}
                </p>

                {isSuccess && (
                  <p className="mt-3 text-sm text-slate-400">
                    Votre compte est activé. Vous pouvez maintenant vous connecter
                    et continuer votre expérience sur la plateforme.
                  </p>
                )}

                {isError && (
                  <p className="mt-3 text-sm text-slate-400">
                    Le lien peut être invalide, expiré, ou la route de confirmation
                    n’est pas correctement atteinte.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-black transition-transform duration-200 hover:scale-[1.02]"
            >
              Aller à la connexion
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              Retour accueil
              <Home className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}