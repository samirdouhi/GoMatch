"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, MessageSquare, User, Tag, ArrowRight,
  CheckCircle2, AlertTriangle, Send, MapPin, Clock, Phone,
} from "lucide-react";

/* ─── Animated Morocco/Football Background ─── */
function WowBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpolygon points='40,4 47.6,24.3 69.5,24.3 52.6,39.2 58.8,59.7 40,46.8 21.2,59.7 27.4,39.2 10.5,24.3 32.4,24.3' fill='none' stroke='%23facc15' stroke-width='0.8'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />
      <div className="absolute -top-32 right-[5%] h-[480px] w-[480px] rounded-full bg-[#c1121f]/10 blur-[130px]" />
      <div className="absolute bottom-0 left-[5%] h-[480px] w-[480px] rounded-full bg-[#006233]/10 blur-[130px]" />
      <div className="absolute top-[35%] left-[40%] h-48 w-[40%] rounded-full bg-[#facc15]/5 blur-[80px]" />
      <motion.div
        className="absolute bottom-0 left-[8%] w-1 h-[70%] origin-bottom"
        style={{ background: "linear-gradient(to top, rgba(250,204,21,0.2), transparent)", filter: "blur(14px)", transform: "rotate(-10deg)" }}
        animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-[8%] w-1 h-[70%] origin-bottom"
        style={{ background: "linear-gradient(to top, rgba(250,204,21,0.2), transparent)", filter: "blur(14px)", transform: "rotate(10deg)" }}
        animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      />
      {[
        { x: "5%",  y: "10%", sz: 40, delay: 0,   r: 10 },
        { x: "91%", y: "15%", sz: 34, delay: 1.6,  r: -22 },
        { x: "10%", y: "72%", sz: 26, delay: 2.9,  r: 38 },
        { x: "86%", y: "67%", sz: 36, delay: 0.9,  r: -52 },
        { x: "48%", y: "86%", sz: 28, delay: 2.1,  r: 12 },
        { x: "31%", y: "4%",  sz: 20, delay: 1.1,  r: -35 },
      ].map((h, i) => (
        <motion.div key={i} className="absolute text-white/[0.06]" style={{ left: h.x, top: h.y }}
          animate={{ y: [0, -14, 0], rotate: [h.r, h.r + 180, h.r + 360], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 8 + i * 1.4, repeat: Infinity, delay: h.delay, ease: "easeInOut" }}>
          <svg width={h.sz} height={h.sz} viewBox="0 0 40 40" fill="none">
            <polygon points="20,1 36,11 36,29 20,39 4,29 4,11" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.25" />
          </svg>
        </motion.div>
      ))}
      <motion.div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#facc15]/10 to-transparent"
        animate={{ top: ["0%", "100%"] }} transition={{ duration: 13, repeat: Infinity, ease: "linear" }} />
      <div className="absolute top-6 right-6 opacity-[0.06]">
        <svg width="70" height="70" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="38" stroke="#c1121f" strokeWidth="3" />
          <circle cx="62" cy="50" r="28" fill="#030305" />
          <polygon points="75,22 78.5,31.5 88,32 81,38.5 83.5,48 75,43 66.5,48 69,38.5 62,32 71.5,31.5" fill="#facc15" />
        </svg>
      </div>
    </div>
  );
}

type Topic = "Bug" | "Suggestion" | "Partenariat" | "Commerçant" | "Autre";

export default function ContactPage() {
  const topics: Topic[] = useMemo(() => ["Bug", "Suggestion", "Partenariat", "Commerçant", "Autre"], []);
  const [topic, setTopic]     = useState<Topic>("Suggestion");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus]   = useState<"idle" | "ok" | "error">("idle");

  function isValidEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    if (!name.trim() || !isValidEmail(email) || message.trim().length < 10) { setStatus("error"); return; }
    setStatus("ok");
    setName(""); setEmail(""); setMessage(""); setTopic("Suggestion");
  }

  return (
    <main className="relative min-h-screen overflow-hidden py-16 lg:py-24">
      <WowBackground />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">

        {/* ─── Hero ─── */}
        <header className="flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3">
            <div className="h-px w-10 bg-[#facc15]/60" />
            <Mail className="h-4 w-4 text-[#facc15]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#facc15]">Canal de Communication</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none text-white uppercase italic">
            Écris l&apos;histoire{" "}
            <span className="bg-gradient-to-r from-[#facc15] via-[#ef4444] to-[#facc15] bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_5s_linear_infinite] not-italic">
              avec nous.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="max-w-xl text-lg text-white/50 leading-relaxed">
            Une idée, un bug, un partenariat ? Chaque message compte pour construire la meilleure expérience Maroc 2030.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <Link href="/aide"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white/60 hover:border-[#facc15]/30 hover:text-[#facc15] transition-all">
              Centre d&apos;aide <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </header>

        <div className="mt-14 grid gap-8 md:grid-cols-5 items-start">

          {/* ─── Form ─── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="md:col-span-3 rounded-[2.5rem] border border-white/8 bg-black/50 p-8 backdrop-blur-2xl shadow-2xl">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-[#facc15]/40 to-transparent" />

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-[#facc15]/10 border border-[#facc15]/20">
                <MessageSquare className="h-4 w-4 text-[#facc15]" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tighter text-white">Envoyer un message</h2>
            </div>

            <form onSubmit={onSubmit} className="grid gap-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Votre nom" icon={User}>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full h-12 rounded-xl bg-white/5 border border-white/8 pl-11 pr-4 text-sm text-white outline-none focus:border-[#facc15]/40 focus:ring-1 focus:ring-[#facc15]/15 placeholder:text-white/20 transition-all"
                    placeholder="Nom complet" />
                </Field>
                <Field label="Email" icon={Mail}>
                  <input value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full h-12 rounded-xl bg-white/5 border border-white/8 pl-11 pr-4 text-sm text-white outline-none focus:border-[#facc15]/40 focus:ring-1 focus:ring-[#facc15]/15 placeholder:text-white/20 transition-all"
                    placeholder="votre@email.com" />
                </Field>
              </div>

              <div>
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/35 mb-3">
                  <Tag className="h-3 w-3" /> Catégorie
                </span>
                <div className="flex flex-wrap gap-2">
                  {topics.map(t => (
                    <button type="button" key={t} onClick={() => setTopic(t)}
                      className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tight border transition-all ${
                        topic === t
                          ? "bg-[#facc15] border-[#facc15] text-black shadow-[0_0_14px_rgba(250,204,21,0.35)]"
                          : "bg-white/[0.03] border-white/8 text-white/40 hover:border-white/15 hover:text-white/70"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-3">Message</span>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  className="w-full min-h-[140px] rounded-xl bg-white/5 border border-white/8 p-4 text-sm text-white outline-none focus:border-[#facc15]/40 focus:ring-1 focus:ring-[#facc15]/15 placeholder:text-white/20 transition-all resize-none"
                  placeholder="Décrivez votre projet, suggestion ou problème..." />
              </div>

              <AnimatePresence>
                {status === "ok" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-4 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Message envoyé. Nos équipes reviennent sous 24h.
                  </motion.div>
                )}
                {status === "error" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/8 p-4 text-xs font-bold text-red-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> Vérifiez les champs requis (nom, email valide, message ≥ 10 car.)
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit"
                className="group flex items-center justify-center gap-3 h-14 rounded-2xl bg-[#facc15] text-black font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#facc15]/25">
                Envoyer <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </form>
          </motion.section>

          {/* ─── Aside ─── */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="md:col-span-2 space-y-5">

            {/* Contact info */}
            <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-7 backdrop-blur-xl">
              <h3 className="text-base font-black uppercase tracking-tighter text-white mb-5">Infos de contact</h3>
              <ul className="space-y-4">
                {[
                  { icon: Mail,   label: "Email",       val: "support@gomatch.ma" },
                  { icon: Phone,  label: "Téléphone",   val: "+212 5XX XXX XXX" },
                  { icon: MapPin, label: "Siège",        val: "Rabat, Maroc" },
                  { icon: Clock,  label: "Disponibilité", val: "Lun–Ven · 9h–18h" },
                ].map(({ icon: Icon, label, val }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-[#facc15]/10 border border-[#facc15]/15 shrink-0">
                      <Icon className="h-3.5 w-3.5 text-[#facc15]" />
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-white/30">{label}</div>
                      <div className="text-sm text-white/70 font-medium">{val}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Directives */}
            <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-7 backdrop-blur-xl">
              <h3 className="text-base font-black uppercase tracking-tighter text-white mb-5">Directives</h3>
              <ul className="space-y-4">
                {[
                  { label: "Bug",         text: "Incluez l'OS, la version et les étapes de reproduction." },
                  { label: "Partenariat", text: "Précisez votre secteur (Café, Artisanat, Coopérative)." },
                  { label: "Délai",       text: "Réponse moyenne sous 12h à 24h ouvrées." },
                ].map(({ label, text }, i) => (
                  <li key={i} className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-[#facc15] uppercase tracking-[0.2em]">{label}</span>
                    <p className="text-xs text-white/35 leading-relaxed">{text}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Vision promo */}
            <div className="relative overflow-hidden rounded-[2rem] border border-[#facc15]/20 bg-gradient-to-br from-[#facc15]/8 to-transparent p-7">
              <div className="absolute -right-6 -top-6 opacity-10">
                <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                  <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="#facc15" />
                </svg>
              </div>
              <p className="text-sm text-white/55 leading-relaxed relative z-10">
                Vous développez une solution locale ?{" "}
                <span className="text-[#facc15] font-bold">GoMatch recherche des partenaires passionnés</span>{" "}
                pour enrichir l&apos;expérience Maroc 2030.
              </p>
              <Link href="/a-propos"
                className="mt-5 inline-flex items-center gap-2 text-[11px] font-black text-white/60 uppercase tracking-widest hover:text-[#facc15] transition-colors relative z-10">
                Explorer la vision <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.aside>
        </div>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </main>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-2">{label}</span>
      <div className="relative group">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 group-focus-within:text-[#facc15] transition-colors" />
        {children}
      </div>
    </div>
  );
}
