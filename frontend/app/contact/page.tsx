"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  MessageSquare, 
  User, 
  Tag, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Send,
  Sparkles
} from "lucide-react";

type Topic = "Bug" | "Suggestion" | "Partenariat" | "Commerçant" | "Autre";

export default function ContactPage() {
  const topics: Topic[] = useMemo(() => ["Bug", "Suggestion", "Partenariat", "Commerçant", "Autre"], []);
  const [topic, setTopic] = useState<Topic>("Suggestion");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    if (!name.trim() || !isValidEmail(email) || message.trim().length < 10) {
      setStatus("error");
      return;
    }

    // Simulation d'envoi
    setStatus("ok");
    setName("");
    setEmail("");
    setMessage("");
    setTopic("Suggestion");
  }

  return (
    <main className="relative min-h-full py-12 lg:py-20 overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-6 relative z-10">
        
        {/* HEADER FUTURISTE */}
        <header className="flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-amber-500"
          >
            <Mail className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Canal de Communication</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic"
          >
            Écris l&apos;histoire <br />
            <span className="text-amber-500 not-italic text-5xl md:text-7xl">avec nous.</span>
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              href="/aide"
              className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all"
            >
              CENTRE D&apos;AIDE <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </header>

        <div className="mt-16 grid gap-8 md:grid-cols-5 items-start">
          {/* FORMULAIRE PRINCIPAL */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="md:col-span-3 rounded-[2.5rem] border border-white/5 bg-black/40 p-8 backdrop-blur-2xl shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">Transmission de données</h2>
            </div>

            <form onSubmit={onSubmit} className="grid gap-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Identité</span>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 text-sm text-white outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      placeholder="Nom complet"
                    />
                  </div>
                </div>

                <div className="grid gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Point de contact</span>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 text-sm text-white outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-2">
                  <Tag className="h-3 w-3" /> Catégorie de message
                </span>
                <div className="flex flex-wrap gap-2">
                  {topics.map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setTopic(t)}
                      className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-tighter border transition-all duration-300 ${
                        topic === t
                          ? "bg-amber-500 border-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                          : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[160px] rounded-2xl bg-white/5 border border-white/10 p-5 text-sm text-white outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none"
                  placeholder="Décrivez votre projet, suggestion ou problème technique..."
                />
              </div>

              <AnimatePresence>
                {status === "ok" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-400"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    TRANSMISSION RÉUSSIE. NOS ÉQUIPES ANALYSENT VOTRE REQUÊTE.
                  </motion.div>
                )}

                {status === "error" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-400"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    ERREUR DE PROTOCOLE : VÉRIFIEZ LES CHAMPS REQUIS.
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                className="group flex items-center justify-center gap-3 h-14 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                Lancer l&apos;envoi <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </button>
            </form>
          </motion.section>

          {/* ASIDE INFOS */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-2 space-y-6"
          >
            <div className="rounded-[2rem] border border-white/5 bg-white/5 p-8 backdrop-blur-xl">
              <h3 className="text-lg font-black uppercase tracking-tighter text-white mb-4">Directives</h3>
              <ul className="space-y-4">
                {[
                  { label: "Bug", text: "Incluez la version de l'OS et les étapes de reproduction." },
                  { label: "Partenariat", text: "Précisez votre secteur (Café, Artisanat, Coopérative)." },
                  { label: "Support", text: "Délai de réponse moyen : 12h à 24h." }
                ].map((item, i) => (
                  <li key={i} className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">{item.label}</span>
                    <p className="text-sm text-zinc-400 leading-relaxed">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-8 relative overflow-hidden group">
              <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-amber-500/10 group-hover:scale-110 transition-transform" />
              <p className="text-sm text-zinc-300 leading-relaxed relative z-10">
                Vous développez une solution locale ? Nous sommes toujours à la recherche de nouveaux talents et commerçants passionnés pour enrichir l&apos;expérience <span className="text-white font-bold italic text-amber-500">Maroc 2030</span>.
              </p>
              <Link
                href="/a-propos"
                className="mt-6 inline-flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest hover:text-amber-500 transition-colors relative z-10"
              >
                Explorer la vision <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.aside>
        </div>
      </div>
    </main>
  );
}