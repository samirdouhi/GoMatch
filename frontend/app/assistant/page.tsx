"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  PanelRight, ChevronRight, Map, Navigation, RotateCcw,
  Menu, X, Zap, Moon, CalendarDays, Ticket, Coffee, UtensilsCrossed,
  Users, Landmark, Plus, Route,
} from "lucide-react";

import {
  sendChat,
  requestBeforeMatch,
  requestAfterMatch,
  requestDayPlan,
  getPrimaryItems,
  getAlternativeItems,
  type ConversationMemory,
  type RecommendationItemDto,
  type PlanStep as ApiPlanStep,
  type DayPlan as ApiDayPlan,
  type ChatMessage as ApiChatMessage,
} from "@/lib/recoApi";

import { AssistantInput }     from "@/app/components/assistant/AssistantInput";
import { LoadingThinking }    from "@/app/components/assistant/LoadingThinking";
import { WelcomeScreen }      from "@/app/components/assistant/WelcomeScreen";
import { DetailDrawer }       from "@/app/components/assistant/DetailDrawer";
import { RecommendationGrid } from "@/app/components/assistant/RecommendationGrid";
import { DayPlanTimeline }    from "@/app/components/assistant/DayPlanTimeline";
import type {
  MatchContext,
  UserContext,
  ChatMessage,
  RecommendationItem,
  DayPlan,
  PlanStep,
  Mode,
  Budget,
  ConversationMemory as LocalMemory,
} from "@/app/components/assistant/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_CONTEXT_KEY = "gomatch_plan_context";
const ACTIVE_PLAN_KEY  = "gomatch_active_plan";

// ─── Normalizers ──────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/** Convert RecommendationItemDto (backend spec-v3) → local RecommendationItem */
function normalizeItem(dto: RecommendationItemDto): RecommendationItem {
  return {
    id: dto.id,
    source: dto.source as "business" | "discovery" | "event" | "culture",
    type: dto.type,
    name: dto.name,
    description: dto.description ?? undefined,
    address: dto.address ?? undefined,
    latitude: dto.latitude ?? undefined,
    longitude: dto.longitude ?? undefined,
    distanceKm: dto.distanceKm ?? undefined,
    estimatedTravelMinutes: dto.estimatedTravelMinutes ?? undefined,
    imageUrl: dto.imageUrl ?? undefined,
    category: dto.category ?? undefined,
    tags: dto.tags ?? [],
    noteGlobale: dto.noteGlobale ?? undefined,
    nombreAvis: dto.nombreAvis ?? undefined,
    isOpen: dto.isOpen ?? undefined,
    scoreTotal: dto.scoreTotal ?? 0,
    scoreBreakdown: dto.scoreBreakdown,
    reason: dto.reason ?? "",
    callToAction: dto.callToAction,
  };
}

/** Convert backend ApiPlanStep → local PlanStep */
function normalizeStep(s: ApiPlanStep): PlanStep {
  return {
    startTime: s.startTime ?? "00:00",
    endTime: s.endTime ?? "00:00",
    type: s.type ?? "default",
    title: s.title ?? "",
    description: s.description ?? undefined,
    address: s.address ?? undefined,
    latitude: s.latitude ?? undefined,
    longitude: s.longitude ?? undefined,
    durationMinutes: s.estimatedDurationMinutes ?? 30,
    reason: s.reason ?? undefined,
    imageUrl: s.photo_url ?? undefined,
    source: s.source as PlanStep["source"],
  };
}

/** Build a DayPlan from backend ApiDayPlan (first day) or plan steps array */
function buildDayPlan(
  days: ApiDayPlan[] | undefined,
  steps: ApiPlanStep[] | undefined,
  matchCtx: MatchContext | null,
  mode: Mode,
  safety?: { kickoff?: string | null; recommendedArrival?: string | null; latestDepartureToStadium?: string | null; warningMessage?: string | null } | null,
): DayPlan | null {
  let rawSteps: ApiPlanStep[] = [];

  if (days && days.length > 0 && days[0].plan?.length > 0) {
    rawSteps = days[0].plan;
  } else if (steps && steps.length > 0) {
    rawSteps = steps;
  }

  if (rawSteps.length === 0) return null;

  const modeLabel =
    mode === "before_match" ? "Avant match" :
    mode === "after_match"  ? "Après match" :
    mode === "day_plan"     ? "Journée complète" : "Programme";

  const matchLabel = matchCtx
    ? ` — ${matchCtx.homeTeam} vs ${matchCtx.awayTeam}`
    : "";

  return {
    title: `${modeLabel}${matchLabel}`,
    summary: matchCtx
      ? `Programme avec arrivée au stade/fan zone avant ${matchCtx.kickoffTime}`
      : "Programme personnalisé GoMatch",
    mode,
    matchId: matchCtx?.selectedMatchId,
    steps: rawSteps.map(normalizeStep),
    safety: safety
      ? {
          kickoff: safety.kickoff,
          recommendedArrival: safety.recommendedArrival,
          latestDepartureToStadium: safety.latestDepartureToStadium,
          warningMessage: safety.warningMessage,
        }
      : undefined,
  };
}

/** Parse stored match context from localStorage */
function loadMatchContext(): MatchContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAN_CONTEXT_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);

    // Support both old and new key formats
    const matchId   = obj.selectedMatchId || obj.matchId || obj.id;
    const homeTeam  = obj.homeTeam  || obj.equipe1 || "";
    const awayTeam  = obj.awayTeam  || obj.equipe2 || "";
    const stadium   = obj.stadium   || obj.stade   || "";
    const city      = obj.city      || obj.ville   || "Rabat";
    const kickoffT  = obj.kickoffTime || obj.kickoff || obj.heure || "18:00";
    const kickoffD  = obj.kickoffDate || obj.date_iso || obj.date || "";
    const kickoffISO= obj.kickoffISO  || obj.date    || "";

    if (!matchId) return null;

    return {
      selectedMatchId: String(matchId),
      homeTeam,
      awayTeam,
      stadium,
      city,
      kickoffTime:  kickoffT,
      kickoffDate:  kickoffD,
      kickoffISO:   kickoffISO,
      hasTicket:    obj.hasTicket ?? true,
      stadiumLat:   typeof obj.lat === "number" ? obj.lat : obj.stadiumLat,
      stadiumLng:   typeof obj.lng === "number" ? obj.lng : obj.stadiumLng,
      fanZones:     obj.fanZones ?? [],
    };
  } catch {
    return null;
  }
}

function getPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation)
      return resolve({ latitude: 34.0209, longitude: -6.8416 });
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => resolve({ latitude: 34.0209, longitude: -6.8416 }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssistantPage() {
  const router = useRouter();

  // ── Core state
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [matchContext, setMatchContext]   = useState<MatchContext | null>(null);
  const [userContext, setUserContext]     = useState<UserContext>({
    budget: "medium", mode: "general", preferences: [], hasTicket: true,
  });
  const [isLoading, setIsLoading]         = useState(false);
  const [quickReplies, setQuickReplies]   = useState<string[]>([]);

  // ── Results panel state
  const [primaryItems, setPrimaryItems]   = useState<RecommendationItem[]>([]);
  const [altItems, setAltItems]           = useState<RecommendationItem[]>([]);
  const [activePlan, setActivePlan]       = useState<DayPlan | null>(null);
  const [showPlan, setShowPlan]           = useState(false);
  const [activeFilter, setActiveFilter]   = useState<string | null>(null);
  const [activeIntent, setActiveIntent]   = useState<string | null>(null);

  // ── Conversation memory
  const [memory, setMemory]               = useState<LocalMemory>({});
  const [sessionIds, setSessionIds]       = useState<string[]>([]);
  const [history, setHistory]             = useState<ApiChatMessage[]>([]);

  // ── Phase state machine
  const [phase, setPhase]                 = useState<'welcome' | 'results'>('welcome');

  // ── Detail drawer
  const [detailItem, setDetailItem]       = useState<RecommendationItem | null>(null);

  // ── Layout state
  const [rightOpen, setRightOpen]         = useState(true);
  const [sidebarOpen, setSidebarOpen]     = useState(true);

  const chatRef = useRef<HTMLDivElement>(null);

  // ── Init
  useEffect(() => {
    const ctx = loadMatchContext();
    if (ctx) {
      setMatchContext(ctx);
      setUserContext((prev) => ({ ...prev, hasTicket: ctx.hasTicket }));
    }
    getPosition().then((pos) => {
      setUserContext((prev) => ({ ...prev, latitude: pos.latitude, longitude: pos.longitude }));
    });
  }, []);

  // ── Scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // ── Add message
  const addMessage = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    setMessages((prev) => [...prev, { ...msg, id: uid(), timestamp: Date.now() }]);
  }, []);

  // ── Save plan to localStorage
  const savePlanToStorage = useCallback(
    (plan: DayPlan) => {
      if (typeof window === "undefined") return;
      const payload = {
        source: "assistant",
        mode: plan.mode,
        summary: plan.summary,
        match: matchContext
          ? {
              id: matchContext.selectedMatchId,
              homeTeam: matchContext.homeTeam,
              awayTeam: matchContext.awayTeam,
              stadium: matchContext.stadium,
              kickoff: `${matchContext.kickoffDate}T${matchContext.kickoffTime}`,
            }
          : null,
        steps: plan.steps.map((s, i) => ({
          order: i + 1,
          title: s.title,
          type: s.type,
          source: s.source ?? "discovery",
          description: s.description ?? "",
          startTime: s.startTime,
          endTime: s.endTime,
          latitude: s.latitude,
          longitude: s.longitude,
          address: s.address ?? "",
          durationMinutes: s.durationMinutes,
          reason: s.reason ?? "",
        })),
        savedAt: Date.now(),
      };
      localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(payload));
    },
    [matchContext]
  );

  // ── Main send function
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      setPhase('results');
      setIsLoading(true);

      addMessage({ role: "user", content: text });

      const newHistory: ApiChatMessage[] = [
        ...history.slice(-10),
        { role: "user", content: text },
      ];

      const hasTicket = matchContext ? userContext.hasTicket : undefined;

      try {
        let response;

        const matchPayload = {
          userLatitude:     userContext.latitude,
          userLongitude:    userContext.longitude,
          matchId:          matchContext?.selectedMatchId,
          hasTicket,
          availableMinutes: userContext.availableMinutes,
          budget:           userContext.budget,
          preferences:      userContext.preferences,
          excludedIds:      sessionIds,
        };

        const chatPayload = {
          message:             text,
          userLatitude:        userContext.latitude,
          userLongitude:       userContext.longitude,
          selectedMatchId:     matchContext?.selectedMatchId,
          hasTicket,
          availableMinutes:    userContext.availableMinutes,
          budget:              userContext.budget,
          preferences:         userContext.preferences,
          excludedIds:         sessionIds,
          conversationHistory: newHistory,
          conversationMemory:  memory as ConversationMemory,
        };

        if (userContext.mode === "before_match" && matchContext) {
          response = await requestBeforeMatch(matchPayload);
        } else if (userContext.mode === "after_match" && matchContext) {
          response = await requestAfterMatch(matchPayload);
        } else if (userContext.mode === "day_plan") {
          response = await requestDayPlan({
            userLatitude:  userContext.latitude,
            userLongitude: userContext.longitude,
            matchId:       matchContext?.selectedMatchId,
            hasTicket,
            budget:        userContext.budget,
            preferences:   userContext.preferences,
            excludedIds:   sessionIds,
            city:          matchContext?.city,
          });
        } else {
          response = await sendChat(chatPayload);
        }

        const primary = getPrimaryItems(response).map(normalizeItem);
        const alts    = getAlternativeItems(response).map(normalizeItem);

        setPrimaryItems(primary);
        setAltItems(alts);

        const determinedMode: Mode =
          userContext.mode !== "general"
            ? userContext.mode
            : response.mode === "match_day" || response.mode === "specific" && (response.plan?.length ?? 0) > 0
            ? "before_match"
            : "general";

        const plan = buildDayPlan(
          response.days,
          response.plan,
          matchContext,
          determinedMode,
          response.safety ?? undefined,
        );

        if (plan) {
          setActivePlan(plan);
          setShowPlan(true);
          savePlanToStorage(plan);
        } else {
          setShowPlan(false);
        }

        const replies =
          response.followUpQuestions?.length
            ? response.followUpQuestions
            : response.followups?.length
            ? response.followups
            : [];
        setQuickReplies(replies.slice(0, 5));

        if (response.memory_updates) {
          const updates = response.memory_updates as LocalMemory & { resolved_type?: string };
          setMemory((prev) => ({ ...prev, ...updates }));
          if (updates.resolved_type) setActiveFilter(updates.resolved_type);
          else if (!primary.length && !alts.length) setActiveFilter(null);
        }
        if (response.intent) setActiveIntent(response.intent);

        const newIds = [...primary.map((i) => i.id), ...alts.map((i) => i.id)];
        setSessionIds((prev) => {
          const combined = [...new Set([...prev, ...newIds])];
          return combined.slice(-80);
        });

        setHistory([...newHistory, { role: "assistant", content: response.summary || response.message || "" }]);

        const assistantText =
          (response.needs_clarification && response.clarification_question)
            ? response.clarification_question
            : response.summary || response.message || "Voilà mes recommandations !";

        addMessage({
          role: "assistant",
          content: assistantText,
          needsClarification: response.needs_clarification,
          clarificationQuestion: response.clarification_question ?? undefined,
          quickReplies: replies.slice(0, 5),
          hasResults: primary.length > 0 || alts.length > 0 || !!plan,
        });
      } catch (err) {
        addMessage({
          role: "assistant",
          content: "Désolé, une erreur est survenue. Veuillez réessayer.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, matchContext, userContext, memory, sessionIds, history, addMessage, savePlanToStorage]
  );

  // ── View on map (single item)
  const viewOnMap = useCallback((item: RecommendationItem) => {
    if (typeof window === "undefined") return;
    const plan: DayPlan = {
      title: item.name,
      summary: item.reason || "",
      mode: "general",
      steps: [{
        startTime: "now", endTime: "now", type: item.type, title: item.name,
        latitude: item.latitude, longitude: item.longitude,
        address: item.address, durationMinutes: 60, source: item.source,
      }],
    };
    savePlanToStorage(plan);
    router.push("/test-map");
  }, [router, savePlanToStorage]);

  // ── View full plan on map
  const viewFullMap = useCallback(() => {
    if (activePlan) {
      savePlanToStorage(activePlan);
      router.push("/test-map");
    }
  }, [activePlan, router, savePlanToStorage]);

  // ── Reset conversation
  const resetChat = useCallback(() => {
    setMessages([]);
    setPhase('welcome');
    setPrimaryItems([]);
    setAltItems([]);
    setActivePlan(null);
    setShowPlan(false);
    setActiveFilter(null);
    setActiveIntent(null);
    setQuickReplies([]);
    setMemory({});
    setSessionIds([]);
    setHistory([]);
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  const hasResults = primaryItems.length > 0 || altItems.length > 0 || !!activePlan;

  return (
    // h-full works because ClientShell gives main flex-1 min-h-0 overflow-hidden
    <div className="flex flex-col h-full font-sans" style={{ background: '#06060a' }}>

      {/* ── MAIN ROW: chat + desktop panel ─────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── LEFT SIDEBAR ────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="hidden lg:flex flex-col flex-shrink-0 overflow-hidden relative z-20"
            style={{ background: 'rgba(8,8,12,0.98)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-4 pt-5 pb-4 flex-shrink-0">
              <div className="relative w-9 h-9 flex-shrink-0">
                <Image src="/LogoGoMatch2030.png" alt="GoMatch" fill className="object-contain" priority />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[13px] font-black text-white tracking-tight">GoMatch</span>
                  <span
                    className="text-[13px] font-black tracking-tight"
                    style={{ background: 'linear-gradient(90deg,#facc15,#fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    AI
                  </span>
                </div>
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Assistant</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto w-6 h-6 flex items-center justify-center rounded-lg text-zinc-700 hover:text-zinc-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* New chat */}
            <div className="px-3 mb-4">
              <button
                onClick={resetChat}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
                style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)', color: '#facc15' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(250,204,21,0.14)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(250,204,21,0.08)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Nouveau chat
              </button>
            </div>

            {/* Match context */}
            {matchContext && (
              <div className="mx-3 mb-4 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.12)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-[9px] uppercase tracking-widest text-green-500 font-bold">Match actif</p>
                </div>
                <p className="text-[11px] font-semibold text-white truncate">
                  {matchContext.homeTeam} vs {matchContext.awayTeam}
                </p>
                {matchContext.kickoffTime && (
                  <p className="text-[10px] text-zinc-500 mt-0.5">{matchContext.kickoffTime} · {matchContext.city}</p>
                )}
                {/* Ticket toggle */}
                <button
                  onClick={() => setUserContext(prev => ({ ...prev, hasTicket: !prev.hasTicket }))}
                  className="mt-2 w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={userContext.hasTicket
                    ? { background: 'rgba(250,204,21,0.1)', color: '#facc15', border: '1px solid rgba(250,204,21,0.2)' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#71717a', border: '1px solid rgba(255,255,255,0.07)' }
                  }
                >
                  <Ticket className="w-3 h-3" />
                  {userContext.hasTicket ? 'Avec billet' : 'Sans billet'}
                </button>
              </div>
            )}

            {/* Shortcuts */}
            <div className="px-3 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <p className="text-[9px] uppercase tracking-widest text-zinc-700 font-bold mb-2 px-1">Raccourcis</p>
              {[
                { icon: Zap,            label: 'Avant le match',   prompt: "Prépare-moi pour le match, propose des activités avant le coup d'envoi" },
                { icon: Moon,           label: 'Après le match',   prompt: "Le match vient de se terminer, que faire ce soir ?" },
                { icon: CalendarDays,   label: 'Journée complète', prompt: "Génère-moi un programme complet pour la journée" },
                { icon: Users,          label: 'Fan zone',         prompt: "Trouve-moi une fan zone ou un endroit pour regarder le match" },
                { icon: Coffee,         label: 'Café',             prompt: "Propose-moi un café ou salon de thé proche" },
                { icon: UtensilsCrossed,label: 'Restaurant',       prompt: "Je cherche un restaurant marocain" },
                { icon: Landmark,       label: 'Culture',          prompt: "Propose-moi des lieux culturels à visiter" },
                { icon: Route,          label: 'Itinéraire',       prompt: "Trace-moi un itinéraire pour la journée" },
              ].map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(prompt)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] text-zinc-400 hover:text-white transition-colors hover:bg-white/5 mb-0.5 text-left"
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0 text-zinc-600" />
                  {label}
                </button>
              ))}
            </div>

            {/* Results toggle if panel is closed */}
            {!rightOpen && hasResults && (
              <div className="px-3 pb-4 mt-2">
                <button
                  onClick={() => setRightOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
                  style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)', color: '#facc15' }}
                >
                  <PanelRight className="w-3.5 h-3.5" />
                  Voir les résultats ({primaryItems.length + altItems.length})
                </button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── CHAT COLUMN ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">

        {/* Thin top bar: sidebar toggle + match info (replaces old header) */}
        <div
          className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(6,6,10,0.95)' }}
        >
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all flex-shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0" />
          {matchContext && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[11px] text-zinc-600 truncate">
                {matchContext.homeTeam} vs {matchContext.awayTeam}
                {matchContext.kickoffTime ? ` · ${matchContext.kickoffTime}` : ""}
              </p>
            </div>
          )}
          <motion.button
            onClick={resetChat}
            whileTap={{ scale: 0.9 }}
            title="Nouveau chat"
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#52525b' }}
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Nouveau</span>
          </motion.button>
          {!rightOpen && hasResults && (
            <button
              onClick={() => setRightOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', color: '#facc15' }}
            >
              <PanelRight className="w-3 h-3" />
              <span>Résultats</span>
            </button>
          )}
        </div>

        {/* Messages — scrollable, centered content */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#1c1c20 transparent' }}
        >
          {/* Subtle radial glow top */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 opacity-20 blur-3xl rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(250,204,21,0.3), transparent 70%)' }} />

          {phase === 'welcome' ? (
            <WelcomeScreen matchContext={matchContext} onSelect={sendMessage} />
          ) : (
            <div className="px-4 sm:px-6 py-6 space-y-5 max-w-2xl mx-auto w-full">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} onQuickReply={sendMessage} />
                ))}
              </AnimatePresence>
              {isLoading && <LoadingThinking />}
              {/* Bottom padding so last message isn't hidden behind input */}
              <div className="h-2" />
            </div>
          )}
        </div>

        {/* Bottom bar — filter chips + input, both centered at max-w-2xl */}
        <div
          className="flex-shrink-0 relative z-20"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(6,6,10,0.97)', backdropFilter: 'blur(24px)' }}
        >
          {/* Top glow line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(250,204,21,0.3), transparent)' }} />

          <div className="max-w-2xl mx-auto w-full">
            <AssistantInput
              onSend={sendMessage}
              isLoading={isLoading}
              quickReplies={quickReplies}
              placeholder={
                userContext.mode === 'before_match' ? 'Demande avant le match…' :
                userContext.mode === 'after_match'  ? 'Que faire après le match ?' :
                userContext.mode === 'day_plan'     ? 'Planifiez votre journée…' :
                'Café, restaurant, fan zone, programme…'
              }
            />
          </div>
        </div>
      </div>{/* end chat column */}


      {/* ── DESKTOP Results Panel (inside main row) ─────────────────────── */}
      <AnimatePresence>
        {rightOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="hidden lg:flex flex-col overflow-hidden flex-shrink-0"
            style={{ background: 'rgba(9,9,13,0.98)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}
          >
            {/* Panel header */}
            <div
              className="flex-shrink-0 px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                    {showPlan && activePlan ? "Itinéraire" : "Résultats"}
                  </span>
                  {hasResults && (
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(250,204,21,0.1)', color: '#facc15' }}
                    >
                      {primaryItems.length + altItems.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setRightOpen(false)}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/5 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              {hasResults && (
                <div
                  className="flex gap-1 p-1 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <button
                    onClick={() => setShowPlan(false)}
                    className="flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all"
                    style={!showPlan ? {
                      background: '#facc15',
                      color: '#000',
                      boxShadow: '0 2px 8px rgba(250,204,21,0.25)',
                    } : { color: '#52525b' }}
                  >
                    Lieux
                  </button>
                  {activePlan && (
                    <button
                      onClick={() => setShowPlan(true)}
                      className="flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all"
                      style={showPlan ? {
                        background: '#facc15',
                        color: '#000',
                        boxShadow: '0 2px 8px rgba(250,204,21,0.25)',
                      } : { color: '#52525b' }}
                    >
                      Plan
                    </button>
                  )}
                </div>
              )}

              {/* Active filter badge */}
              {activeFilter && !showPlan && (() => {
                const FILTER_META: Record<string, { icon: string; label: string }> = {
                  cafe: { icon: '☕', label: 'Cafés' }, restaurant: { icon: '🍽️', label: 'Restaurants' },
                  hotel: { icon: '🏨', label: 'Hôtels' }, activity: { icon: '🎭', label: 'Activités' },
                  cultural: { icon: '🏛️', label: 'Culture' }, fanzone: { icon: '⚽', label: 'Fan zones' },
                  nightlife: { icon: '🍸', label: 'Soirée' }, souk: { icon: '🛍️', label: 'Souks' },
                }
                const meta = FILTER_META[activeFilter]
                if (!meta) return null
                const total = primaryItems.length + altItems.length
                return (
                  <div
                    className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold w-fit"
                    style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.2)', color: '#facc15' }}
                  >
                    <span>{meta.icon}</span><span>{meta.label}</span>
                    <span className="opacity-40">·</span>
                    <span>{total} résultat{total > 1 ? 's' : ''}</span>
                    <button onClick={() => setActiveFilter(null)} className="ml-1 opacity-60 hover:opacity-100 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px]">✕</button>
                  </div>
                )
              })()}
            </div>

            <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}>
              {!hasResults ? (
                <ResultsEmptyHint />
              ) : showPlan && activePlan ? (
                <DayPlanTimeline
                  plan={activePlan}
                  matchContext={matchContext}
                  onViewOnMap={(step) => {
                    if (step.latitude && step.longitude) {
                      const fakeItem: RecommendationItem = {
                        id: uid(), source: (step.source as "business" | "discovery" | "event") ?? "discovery",
                        type: step.type, name: step.title, latitude: step.latitude,
                        longitude: step.longitude, address: step.address, tags: [], scoreTotal: 0, reason: step.reason ?? "",
                      };
                      viewOnMap(fakeItem);
                    }
                  }}
                  onReplace={(step) => sendMessage(`Remplace l'étape "${step.title}" dans mon programme`)}
                  onViewFullMap={viewFullMap}
                />
              ) : (
                <RecommendationGrid
                  primary={primaryItems}
                  alternatives={altItems}
                  activeFilter={activeFilter}
                  activeIntent={activeIntent}
                  onAddToPlan={(item) => sendMessage(`Ajoute "${item.name}" à mon programme`)}
                  onViewOnMap={viewOnMap}
                  onViewDetails={(item) => setDetailItem(item)}
                  onGetRoute={(item) => { savePlanToStorage({ title: item.name, summary: item.reason || '', mode: 'general', steps: [{ startTime: 'now', endTime: 'now', type: item.type, title: item.name, latitude: item.latitude, longitude: item.longitude, address: item.address, durationMinutes: 60, source: item.source }] }); router.push('/test-map'); }}
                  onQuickFilter={(filter) => sendMessage(filter)}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>{/* end main row */}

      {/* ── MOBILE: Results — below the main row ─────────────────────────── */}
      <AnimatePresence>
        {hasResults && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="lg:hidden flex-shrink-0 overflow-hidden"
            style={{ background: 'rgba(9,9,13,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)', maxHeight: '280px' }}
          >
            <div
              className="flex items-center justify-between px-5 py-2.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                {showPlan && activePlan ? "Programme" : "Points d'intérêt"}
              </span>
              {activePlan && (
                <button
                  onClick={() => setShowPlan((v) => !v)}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(250,204,21,0.08)', color: '#facc15', border: '1px solid rgba(250,204,21,0.18)' }}
                >
                  {showPlan ? "Lieux" : "Itinéraire"}
                </button>
              )}
            </div>
            <div className="p-3 overflow-y-auto" style={{ maxHeight: '220px', scrollbarWidth: 'none' }}>
              {showPlan && activePlan ? (
                <DayPlanTimeline plan={activePlan} matchContext={matchContext} onViewFullMap={viewFullMap} />
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1 snap-x" style={{ scrollbarWidth: 'none' }}>
                  {primaryItems.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-56 snap-start">
                      <MobileCard item={item} onViewOnMap={viewOnMap} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Detail Drawer ──────────────────────────────────────────────── */}
      {detailItem && (
        <DetailDrawer
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onAddToPlan={(item) => { setDetailItem(null); sendMessage(`Ajoute "${item.name}" à mon programme`); }}
          onViewOnMap={(item) => { setDetailItem(null); viewOnMap(item); }}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const FILTER_ITEMS: {
  value: Mode;
  label: string;
  icon: string;
  color: string;
  prompt: (mc: { homeTeam: string; awayTeam: string } | null) => string;
}[] = [
  { value: 'before_match', label: 'Avant match', icon: '⚽', color: '#22c55e', prompt: (mc) => mc ? `Programme avant ${mc.homeTeam} vs ${mc.awayTeam}` : 'Programme avant le match' },
  { value: 'after_match',  label: 'Après match', icon: '🎉', color: '#a855f7', prompt: () => 'Que faire après le match ?' },
  { value: 'day_plan',     label: 'Journée',     icon: '☀️', color: '#3b82f6', prompt: () => 'Programme pour toute la journée' },
  { value: 'general',      label: 'Sans ticket', icon: '🎟️', color: '#f97316', prompt: () => "Je n'ai pas de ticket, que faire ?" },
];

function FilterBar({ activeMode, matchContext, isLoading, onSelect }: {
  activeMode: Mode;
  matchContext: { homeTeam: string; awayTeam: string } | null;
  isLoading: boolean;
  onSelect: (mode: Mode, prompt: string) => void;
}) {
  return (
    <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {FILTER_ITEMS.map((f) => {
        const isActive = activeMode === f.value;
        return (
          <motion.button
            key={f.value}
            whileTap={{ scale: 0.93 }}
            onClick={() => onSelect(f.value, f.prompt(matchContext))}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl flex-shrink-0 text-[11px] font-bold transition-all duration-200 disabled:opacity-40"
            style={
              isActive
                ? { background: `${f.color}18`, border: `1px solid ${f.color}40`, color: f.color, boxShadow: `0 0 16px ${f.color}14` }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#52525b' }
            }
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = `${f.color}28`;
                e.currentTarget.style.color = '#a1a1aa';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.color = '#52525b';
              }
            }}
          >
            <span className="text-sm leading-none">{f.icon}</span>
            <span>{f.label}</span>
            {isActive && (
              <motion.span
                layoutId="filter-dot"
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: f.color }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function ChatBubble({ message, onQuickReply }: { message: ChatMessage; onQuickReply: (t: string) => void }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="flex justify-end"
      >
        <div
          className="max-w-[78%] px-5 py-3.5 rounded-2xl rounded-tr-md text-[14px] font-medium text-black leading-relaxed"
          style={{
            background: 'linear-gradient(135deg, #facc15, #fbbf24)',
            boxShadow: '0 4px 20px rgba(250,204,21,0.25), 0 1px 0 rgba(255,255,255,0.3) inset',
          }}
        >
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -16, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="flex items-start gap-3"
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-black"
        style={{
          background: 'linear-gradient(135deg, rgba(250,204,21,0.2), rgba(251,146,60,0.1))',
          border: '1px solid rgba(250,204,21,0.22)',
          color: '#facc15',
          boxShadow: '0 0 14px rgba(250,204,21,0.08)',
        }}
      >
        GM
      </div>

      <div className="flex-1 min-w-0 space-y-2.5">
        {/* Bubble */}
        <div
          className="relative rounded-2xl rounded-tl-md px-5 py-4 text-[14px] text-zinc-200 leading-relaxed max-w-[92%]"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderLeft: '2px solid rgba(250,204,21,0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          {message.content}

          {message.hasResults && (
            <div
              className="flex items-center gap-2 mt-3 pt-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                style={{ background: '#facc15', boxShadow: '0 0 6px #facc15' }}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                Résultats mis à jour dans le panneau
              </span>
            </div>
          )}
        </div>

        {/* Quick replies */}
        {message.quickReplies && message.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {message.quickReplies.map((r, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onQuickReply(r)}
                className="text-[11px] font-medium px-3 py-1.5 rounded-xl transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#a1a1aa',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(250,204,21,0.3)'
                  e.currentTarget.style.color = '#facc15'
                  e.currentTarget.style.background = 'rgba(250,204,21,0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.color = '#a1a1aa'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
              >
                {r}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ResultsEmptyHint() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20 px-6">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <Map className="w-7 h-7 text-zinc-700" />
      </div>
      <h3 className="text-[13px] font-black uppercase tracking-widest text-zinc-500 mb-2">En attente</h3>
      <p className="text-[13px] text-zinc-700 max-w-[220px] leading-relaxed">
        Vos recommandations apparaîtront ici après chaque échange.
      </p>
    </div>
  );
}

function MobileCard({ item, onViewOnMap }: { item: RecommendationItem; onViewOnMap: (item: RecommendationItem) => void }) {
  const typeIcons: Record<string, string> = {
    cafe: "☕", restaurant: "🍽️", hotel: "🏨", activity: "🎭",
    cultural: "🏛️", fanzone: "⚽", nightlife: "🍸", souk: "🛍️",
  };
  const icon = typeIcons[item.type?.toLowerCase?.()] ?? "📍";
  const dist = item.distanceKm != null
    ? item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)}m` : `${item.distanceKm.toFixed(1)}km`
    : null;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all hover:translate-y-[-2px]"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="relative h-28" style={{ background: 'rgba(255,255,255,0.03)' }}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">{icon}</div>
        )}
        <div
          className="absolute top-2 right-2 px-2 py-1 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <span className="text-xs">{icon}</span>
        </div>
      </div>
      <div className="p-3">
        <p className="text-[13px] font-bold text-zinc-200 truncate">{item.name}</p>
        <div className="flex items-center justify-between mt-2.5">
          {dist ? (
            <span className="text-[10px] text-zinc-600 font-medium">{dist}</span>
          ) : <span />}
          <button
            onClick={() => onViewOnMap(item)}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
            style={{ background: 'rgba(250,204,21,0.12)', color: '#facc15', border: '1px solid rgba(250,204,21,0.2)' }}
          >
            Carte
          </button>
        </div>
      </div>
    </div>
  );
}