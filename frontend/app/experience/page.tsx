"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin, Calendar, Users, Star, Compass, ArrowRight,
  Flame, Globe, ShieldCheck, Zap, Trophy, Music,
  Coffee, UtensilsCrossed, Landmark, Ticket, Map,
} from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

const STADIUMS = [
  {
    city: "Rabat",
    name: "Grand Stade de Rabat",
    capacity: "115 000",
    lat: 34.0197, lng: -6.8396,
    highlight: "Stade principal, cérémonie d'ouverture",
    color: "#facc15",
    culture: "Médina de Rabat, Kasbah des Oudayas, Tour Hassan",
    food: "Café maure, pastilla au pigeon, brochettes de la médina",
    tags: ["Historique", "UNESCO", "Capitale"],
  },
  {
    city: "Casablanca",
    name: "Grand Stade Hassan II",
    capacity: "93 000",
    lat: 33.5610, lng: -7.6318,
    highlight: "Plus grand stade du Maroc",
    color: "#60a5fa",
    culture: "Mosquée Hassan II, Corniche, quartier Art déco",
    food: "Fruits de mer, tajine de poisson, cafés de bord de mer",
    tags: ["Métropole", "Cosmopolite", "Moderne"],
  },
  {
    city: "Marrakech",
    name: "Grand Stade Marrakech",
    capacity: "65 000",
    lat: 31.6258, lng: -7.9832,
    highlight: "La ville ocre, magie du souk",
    color: "#fb923c",
    culture: "Jemaa el-Fna, Palais Bahia, Jardin Majorelle",
    food: "Tajine d'agneau, couscous aux légumes, atay (thé à la menthe)",
    tags: ["Touristique", "Souk", "Nuit animée"],
  },
  {
    city: "Agadir",
    name: "Stade Adrar",
    capacity: "45 000",
    lat: 30.4278, lng: -9.5981,
    highlight: "Soleil, plage et ambiance détendue",
    color: "#4ade80",
    culture: "Souk El Had, Musée du Patrimoine Amazigh, Marina",
    food: "Poisson grillé, argan, couscous amazigh",
    tags: ["Plage", "Amazigh", "Moderne"],
  },
  {
    city: "Fès",
    name: "Grand Stade de Fès",
    capacity: "55 000",
    lat: 34.0370, lng: -5.0004,
    highlight: "La ville spirituelle du Maroc",
    color: "#a78bfa",
    culture: "Médina de Fès (UNESCO), Tanneries, Université Al-Qarawiyyine",
    food: "Bastilla, harira, sfenj du matin",
    tags: ["Spirituel", "Artisanat", "Université"],
  },
  {
    city: "Tanger",
    name: "Grand Stade Ibn Battouta",
    capacity: "65 000",
    lat: 35.7595, lng: -5.8340,
    highlight: "Porte entre l'Europe et l'Afrique",
    color: "#f472b6",
    culture: "Kasbah, Grottes d'Hercule, Cap Spartel",
    food: "Brochettes de la médina, thé à la menthe, pastilla",
    tags: ["Détroit", "Culturel", "Passage"],
  },
];

const EXPERIENCES = [
  {
    icon: Music,
    title: "Fan Zones Officielles",
    description: "Écrans géants, animations FIFA, concerts live et food trucks dans chaque ville hôte. Ambiance garantie même sans billet.",
    color: "#facc15",
  },
  {
    icon: UtensilsCrossed,
    title: "Gastronomie Marocaine",
    description: "Tajines, couscous, pastilla, sfenj… Découvrez la cuisine la plus riche d'Afrique à travers les commerces locaux partenaires GoMatch.",
    color: "#fb923c",
  },
  {
    icon: Landmark,
    title: "Richesse Culturelle",
    description: "5 sites UNESCO à moins de 30 min des stades. Médinas millénaires, kasbahs, tanneries et palais royaux au programme.",
    color: "#a78bfa",
  },
  {
    icon: ShieldCheck,
    title: "Sécurité & Confort",
    description: "Dispositif FIFA renforcé, guides officiels, application GoMatch pour navigation en temps réel. Voyagez serein.",
    color: "#4ade80",
  },
  {
    icon: Globe,
    title: "Coupe du Monde Unique",
    description: "Édition historique à 3 pays : Maroc, Espagne, Portugal. 104 matchs, 48 équipes, des millions de supporters réunis.",
    color: "#60a5fa",
  },
  {
    icon: Zap,
    title: "GoMatch AI Assistant",
    description: "Votre compagnon intelligent pour planifier chaque journée : recommandations personnalisées, itinéraires sur mesure, alertes en temps réel.",
    color: "#fbbf24",
  },
];

const TIPS = [
  { emoji: "🕌", tip: "Respectez les codes vestimentaires dans les médinas et lieux de culte." },
  { emoji: "💳", tip: "Les dirhams marocains (MAD) sont la monnaie locale. Les cartes Visa/Mastercard sont acceptées dans les grandes villes." },
  { emoji: "🌡️", tip: "Juin–juillet : 25–35°C selon la région. Pensez crème solaire et hydratation." },
  { emoji: "🚕", tip: "Utilisez des taxis officiels (compteur) ou des apps de VTC. Négociez avant de monter." },
  { emoji: "🤝", tip: "\"Marhaba\" (bienvenue) : les Marocains sont réputés pour leur hospitalité. N'hésitez pas à engager la conversation." },
  { emoji: "📱", tip: "Téléchargez GoMatch avant d'arriver : plans hors-ligne, recommandations IA, itinéraires personnalisés." },
  { emoji: "🍵", tip: "Le thé à la menthe est une tradition d'hospitalité — accepter une tasse est un signe de respect." },
  { emoji: "🛍️", tip: "Dans les souks, la négociation est culturelle. Comptez environ 50–60% du prix annoncé comme base de discussion." },
];

const TIMELINE = [
  { date: "11 juin 2030", event: "Cérémonie d'ouverture", city: "Rabat", icon: "🎉" },
  { date: "Groupes", event: "Phase de groupes — 6 villes", city: "Maroc", icon: "⚽" },
  { date: "Juillet 2030", event: "Huitièmes & Quarts", city: "Casablanca / Marrakech", icon: "🏆" },
  { date: "Mi-juillet", event: "Demi-finales", city: "Rabat / Casablanca", icon: "🥇" },
  { date: "20 juillet 2030", event: "Finale historique", city: "Rabat", icon: "🏟️" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExperiencePage() {
  const [activeStadium, setActiveStadium] = useState(0);

  const stadium = STADIUMS[activeStadium];

  return (
    <div className="min-h-full text-white" style={{ background: '#030305' }}>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-24 px-6 text-center">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-15 blur-[120px]" style={{ background: 'radial-gradient(circle, #c1272d, transparent)' }} />
          <div className="absolute top-10 right-1/4 w-80 h-80 rounded-full opacity-10 blur-[100px]" style={{ background: 'radial-gradient(circle, #facc15, transparent)' }} />
          <div className="absolute bottom-0 left-1/2 w-[600px] h-40 -translate-x-1/2 opacity-8 blur-[80px]" style={{ background: 'radial-gradient(ellipse, #006233, transparent)' }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-[#facc15]/20 bg-[#facc15]/5">
            <Trophy className="w-4 h-4 text-[#facc15]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#facc15]">Coupe du Monde FIFA 2030</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-[1000] tracking-tighter mb-6 leading-none">
            <span className="text-white">L&apos;Expérience</span>
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #facc15, #006233)' }}>
              Maroc 2030
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-white/50 leading-relaxed mb-10">
            104 matchs. 48 nations. 6 villes marocaines. Découvrez la coupe du monde la plus ambitieuse de l&apos;histoire — et comment GoMatch vous guide à travers chaque moment.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/assistant"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-black transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
            >
              <Zap className="w-4 h-4" />
              Planifier avec GoMatch
            </Link>
            <Link
              href="/test-map"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm border border-white/10 bg-white/5 text-white/80 hover:border-white/20 transition-all"
            >
              <Map className="w-4 h-4" />
              Explorer la carte
            </Link>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {[
            { value: "6", label: "Villes hôtes", color: "#facc15" },
            { value: "104", label: "Matchs", color: "#c1272d" },
            { value: "48", label: "Équipes", color: "#006233" },
            { value: "3", label: "Pays hôtes", color: "#60a5fa" },
          ].map(({ value, label, color }) => (
            <div key={label} className="rounded-2xl border border-white/8 bg-white/3 px-4 py-5 text-center">
              <p className="text-3xl font-[1000] tracking-tighter" style={{ color }}>{value}</p>
              <p className="text-xs text-white/40 mt-1 font-medium uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Stades interactifs ── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#facc15] mb-2">Les arènes du monde</p>
            <h2 className="text-3xl sm:text-4xl font-[1000] tracking-tight text-white">6 Stades, 6 Expériences</h2>
          </div>

          {/* City tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {STADIUMS.map((s, i) => (
              <button
                key={s.city}
                onClick={() => setActiveStadium(i)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={activeStadium === i
                  ? { background: s.color + '20', color: s.color, border: `1px solid ${s.color}40` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {s.city}
              </button>
            ))}
          </div>

          {/* Stadium detail card */}
          <motion.div
            key={activeStadium}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* Left: stadium info */}
            <div
              className="rounded-3xl p-8 border"
              style={{ background: `linear-gradient(135deg, ${stadium.color}08, rgba(255,255,255,0.02))`, borderColor: `${stadium.color}25` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" style={{ color: stadium.color }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: stadium.color }}>{stadium.city}</span>
                  </div>
                  <h3 className="text-2xl font-[1000] text-white leading-tight">{stadium.name}</h3>
                  <p className="text-white/50 text-sm mt-1">{stadium.highlight}</p>
                </div>
                <div
                  className="text-right px-4 py-3 rounded-2xl"
                  style={{ background: `${stadium.color}12`, border: `1px solid ${stadium.color}25` }}
                >
                  <p className="text-2xl font-[1000]" style={{ color: stadium.color }}>{stadium.capacity}</p>
                  <p className="text-xs text-white/40">places</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2">Culture & Patrimoine</p>
                  <p className="text-sm text-white/70 leading-relaxed">{stadium.culture}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2">Gastronomie Locale</p>
                  <p className="text-sm text-white/70 leading-relaxed">{stadium.food}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {stadium.tags.map(tag => (
                    <span key={tag} className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: `${stadium.color}12`, color: stadium.color, border: `1px solid ${stadium.color}25` }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: GoMatch CTA for this city */}
            <div className="flex flex-col gap-4">
              <div className="rounded-3xl border border-white/8 bg-white/3 p-6 flex-1">
                <Flame className="w-6 h-6 text-[#facc15] mb-3" />
                <h4 className="text-lg font-bold text-white mb-2">Préparer votre séjour à {stadium.city}</h4>
                <p className="text-sm text-white/50 mb-5 leading-relaxed">
                  GoMatch connaît les meilleurs endroits autour du stade — cafés, restaurants, fan zones, activités culturelles. Tout sélectionné et noté par notre IA.
                </p>
                <Link
                  href="/assistant"
                  className="flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-sm text-black group transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
                >
                  <span>Explorer {stadium.city} avec l&apos;IA</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Link href="/explore" className="rounded-2xl border border-white/8 bg-white/3 p-4 hover:border-white/15 transition-all group">
                  <Compass className="w-5 h-5 text-[#60a5fa] mb-2" />
                  <p className="text-sm font-bold text-white">Explorer</p>
                  <p className="text-xs text-white/40">Lieux proches</p>
                </Link>
                <Link href="/test-map" className="rounded-2xl border border-white/8 bg-white/3 p-4 hover:border-white/15 transition-all group">
                  <Map className="w-5 h-5 text-[#4ade80] mb-2" />
                  <p className="text-sm font-bold text-white">Carte</p>
                  <p className="text-xs text-white/40">Itinéraire visuel</p>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Expériences clés ── */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#facc15] mb-2">Ce qui vous attend</p>
            <h2 className="text-3xl sm:text-4xl font-[1000] tracking-tight text-white">Expériences Uniques</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EXPERIENCES.map(({ icon: Icon, title, description, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-white/8 bg-white/3 p-6 hover:border-white/12 transition-all"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline matchs ── */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#facc15] mb-2">Calendrier</p>
            <h2 className="text-3xl sm:text-4xl font-[1000] tracking-tight text-white">Les Grandes Dates</h2>
          </div>

          <div className="space-y-3">
            {TIMELINE.map(({ date, event, city, icon }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-white/8 bg-white/3 hover:border-white/12 transition-all"
              >
                <span className="text-2xl w-10 text-center flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{event}</p>
                  <p className="text-xs text-white/40 mt-0.5">{city}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-[#facc15]">{date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Conseils pratiques ── */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#facc15] mb-2">Guide du supporter</p>
            <h2 className="text-3xl sm:text-4xl font-[1000] tracking-tight text-white">Conseils Essentiels</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIPS.map(({ emoji, tip }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-white/8 bg-white/3 p-5"
              >
                <span className="text-2xl block mb-3">{emoji}</span>
                <p className="text-sm text-white/65 leading-relaxed">{tip}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GoMatch CTA final ── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center mb-6" style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)' }}>
              <Trophy className="w-8 h-8 text-[#facc15]" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-[1000] tracking-tight text-white mb-4">
              Vivez le Maroc 2030<br />
              <span style={{ backgroundImage: 'linear-gradient(90deg, #facc15, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                à votre façon
              </span>
            </h2>
            <p className="text-white/50 text-base mb-8 leading-relaxed">
              GoMatch est votre compagnon intelligent pour la Coupe du Monde. Découvrez, planifiez, explorez — avec l&apos;IA qui connaît le Maroc.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/assistant"
                className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm text-black transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)', boxShadow: '0 8px 30px rgba(250,204,21,0.3)' }}
              >
                <Zap className="w-4 h-4" />
                Démarrer avec l&apos;IA
              </Link>
              <Link
                href="/matches"
                className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm border border-white/10 bg-white/5 text-white/80 hover:border-white/20 transition-all"
              >
                <Ticket className="w-4 h-4" />
                Voir les matchs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
