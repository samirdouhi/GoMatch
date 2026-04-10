"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Send,
  Trash2,
  Clock,
  MapPin,
  Star,
  MessageSquare,
  Plus,
  Menu,
  X,
  Compass,
} from "lucide-react";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  ts: number;
};

type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
};

const quickPrompts = [
  "2h avant match : café traditionnel + artisanat près de moi",
  "Plan 1 journée à Rabat : culture + street food + shopping",
  "Je veux un resto familial pas cher près du stade",
  "Itinéraire à pied : médina + monuments + coucher de soleil",
];

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function makeTitleFrom(text: string) {
  const t = text.trim();
  if (!t) return "Nouveau chat";
  return t.length > 38 ? t.slice(0, 38) + "…" : t;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ✅ Changement des couleurs des boutons (Thème GoMatch Gold/Coral)
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FACC15] px-4 py-2 text-xs font-black text-black " +
  "shadow-sm ring-1 ring-white/15 hover:bg-white hover:text-black transition-all duration-200";

const btnPrimaryLg =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FACC15] px-4 py-3 text-sm font-black text-black " +
  "shadow-sm ring-1 ring-white/15 hover:bg-white hover:text-black transition-all duration-200";

const btnSoft =
  "inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-black text-white " +
  "ring-1 ring-white/10 hover:bg-white hover:text-black transition-all duration-200";

function AssistantSidebar(props: {
  sessions: ChatSession[];
  filteredSessions: ChatSession[];
  activeId: string;
  setActiveId: (id: string) => void;
  setMobileOpen: (v: boolean) => void;
  search: string;
  setSearch: (v: string) => void;
  createNewChat: () => void;
  clearActiveChat: () => void;
  deleteChat: (id: string) => void;
  setInput: (v: string) => void;
}) {
  const {
    filteredSessions,
    activeId,
    setActiveId,
    setMobileOpen,
    search,
    setSearch,
    createNewChat,
    clearActiveChat,
    deleteChat,
    setInput,
  } = props;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
              <MessageSquare className="h-5 w-5 text-white/80" />
            </span>
            <div>
              <div className="text-sm font-black text-white uppercase tracking-tight">Assistant GoMatch</div>
              <div className="text-xs text-white/60">Historique</div>
            </div>
          </div>

          <button type="button" onClick={createNewChat} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
          <Search className="h-4 w-4 text-white/55" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full bg-transparent text-sm font-semibold text-white placeholder:text-white/35 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 pr-2">
        {filteredSessions.map((s) => {
          const active = s.id === activeId;
          return (
            <div
              key={s.id}
              onClick={() => {
                setActiveId(s.id);
                setMobileOpen(false);
              }}
              className={[
                "group rounded-2xl border p-3 cursor-pointer transition mb-2",
                active
                  ? "border-[#FACC15]/40 bg-[#FACC15]/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className={`text-sm font-black truncate ${active ? "text-[#FACC15]" : "text-white"}`}>{s.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(s.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-4 w-4 text-white/70" />
                </button>
              </div>
            </div>
          );
        })}

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-black uppercase text-white/70 tracking-widest">Inspirations</div>
          <div className="mt-2 grid gap-2">
            {quickPrompts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setInput(p)}
                className="text-left rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-white/80 hover:border-[#FACC15]/30 hover:bg-white/10 transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-white/10">
        <button type="button" onClick={clearActiveChat} className={"w-full " + btnSoft}>
          <Trash2 className="h-4 w-4" />
          Effacer le chat
        </button>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const first: ChatSession = {
      id: uid(),
      title: "Nouveau chat",
      createdAt: Date.now(),
      messages: [
        {
          id: uid(),
          role: "assistant",
          content:
            "Salut 👋 Dis-moi : **ville**, **heure du match**, **budget**, **distance max**, et ce que tu veux (culture/food/shopping). Je te propose un plan clair ✅",
          ts: Date.now(),
        },
      ],
    };
    return [first];
  });

  const [activeId, setActiveId] = useState<string>(() => sessions[0]?.id ?? "");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeSession = useMemo(() => {
    const found = sessions.find((s) => s.id === activeId);
    return found ?? sessions[0];
  }, [sessions, activeId]);

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, search]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages?.length, isTyping]);

  function createNewChat() {
    const s: ChatSession = {
      id: uid(),
      title: "Nouveau chat",
      createdAt: Date.now(),
      messages: [
        {
          id: uid(),
          role: "assistant",
          content:
            "Nouveau chat ✅ Donne-moi ton contexte et je te propose un plan (spots + itinéraire).",
          ts: Date.now(),
        },
      ],
    };

    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setInput("");
    setMobileOpen(false);
  }

  function clearActiveChat() {
    if (!activeId) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId ? { ...s, messages: [], title: "Nouveau chat" } : s
      )
    );
  }

  function deleteChat(id: string) {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (id === activeId) setActiveId(next[0]?.id ?? "");
      if (next.length === 0) {
        const fresh: ChatSession = {
          id: uid(),
          title: "Nouveau chat",
          createdAt: Date.now(),
          messages: [
            {
              id: uid(),
              role: "assistant",
              content:
                "Salut 👋 Dis-moi : **ville**, **heure du match**, **budget**, **distance max**, et ce que tu veux.",
              ts: Date.now(),
            },
          ],
        };
        setActiveId(fresh.id);
        return [fresh];
      }
      return next;
    });
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !activeSession) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: trimmed,
      ts: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSession.id) return s;
        const nextTitle =
          s.title === "Nouveau chat" ? makeTitleFrom(trimmed) : s.title;
        return { ...s, title: nextTitle, messages: [...s.messages, userMsg] };
      })
    );

    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        ts: Date.now(),
        content:
          "✅ Proposition (exemple)\n\n" +
          "1) **Café traditionnel**\n" +
          "2) **Artisanat local**\n" +
          "3) Retour vers le stade\n\n" +
          "Donne-moi : **ville + budget + distance max** et je te donne 3 spots précis.",
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id ? { ...s, messages: [...s.messages, aiMsg] } : s
        )
      );
      setIsTyping(false);
    }, 650);
  }

  return (
    <main className="relative h-full min-h-0 overflow-hidden">
      {/* Fond Thème Sombre & Or */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0e0e10]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.12),rgba(0,0,0,0)_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(244,63,94,0.06),rgba(0,0,0,0)_60%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60" />
      </div>

      <div className="h-full w-full flex">
        <aside className="hidden lg:flex w-[320px] border-r border-white/10 bg-white/[0.02] backdrop-blur-2xl">
          <AssistantSidebar
            sessions={sessions}
            filteredSessions={filteredSessions}
            activeId={activeId}
            setActiveId={setActiveId}
            setMobileOpen={setMobileOpen}
            search={search}
            setSearch={setSearch}
            createNewChat={createNewChat}
            clearActiveChat={clearActiveChat}
            deleteChat={deleteChat}
            setInput={setInput}
          />
        </aside>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/80"
              onClick={() => setMobileOpen(false)}
              aria-label="Close overlay"
            />
            <div className="absolute left-0 top-0 h-full w-[86%] max-w-[360px] border-r border-white/10 bg-black/90 backdrop-blur-xl">
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <div className="text-sm font-black text-white uppercase tracking-tight">Historique</div>
                <button
                  type="button"
                  className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-white/80 hover:bg-white/10"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <AssistantSidebar
                sessions={sessions}
                filteredSessions={filteredSessions}
                activeId={activeId}
                setActiveId={setActiveId}
                setMobileOpen={setMobileOpen}
                search={search}
                setSearch={setSearch}
                createNewChat={createNewChat}
                clearActiveChat={clearActiveChat}
                deleteChat={deleteChat}
                setInput={setInput}
              />
            </div>
          </div>
        )}

        <section className="flex-1 h-full min-h-0 flex flex-col">
          <div className="px-4 sm:px-6 py-3 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FACC15] text-black shadow ring-1 ring-white/15">
                <Sparkles className="h-5 w-5 fill-current" />
              </span>

              <div className="min-w-0">
                <div className="text-sm font-black text-white truncate uppercase tracking-tight">
                  {activeSession?.title ?? "Assistant GoMatch"}
                </div>
                <div className="text-xs text-white/50 font-bold uppercase tracking-tighter">
                  Plans locaux • Food • Culture • Match
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={createNewChat} className={"hidden sm:inline-flex " + btnSoft}>
                <Plus className="h-4 w-4" />
                Nouveau
              </button>

              <Link href="/map" className={btnPrimary}>
                <MapPin className="h-4 w-4" />
                Carte
              </Link>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="mx-auto w-full max-w-3xl space-y-3">
              {activeSession?.messages?.length ? (
                <>
                  {activeSession.messages.map((m) => {
                    const isUser = m.role === "user";
                    return (
                      <div key={m.id} className={["flex", isUser ? "justify-end" : "justify-start"].join(" ")}>
                        <div
                          className={[
                            "max-w-[92%] rounded-3xl px-5 py-3 text-sm leading-relaxed",
                            isUser
                              ? "bg-[#F43F5E] text-white shadow-sm font-semibold"
                              : "bg-white/[0.05] border border-white/10 text-white/90 backdrop-blur-md",
                          ].join(" ")}
                        >
                          <div className="whitespace-pre-line">{m.content}</div>
                          <div className={["mt-2 text-[11px] font-bold uppercase opacity-50", isUser ? "text-white" : "text-white/70"].join(" ")}>
                            {formatTime(m.ts)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="rounded-3xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/80 backdrop-blur-md">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-white/70 animate-bounce" />
                          <span className="h-2 w-2 rounded-full bg-[#FACC15] animate-bounce [animation-delay:120ms]" />
                          <span className="h-2 w-2 rounded-full bg-white/70 animate-bounce [animation-delay:240ms]" />
                          <span className="ml-2 text-xs font-black uppercase tracking-widest text-white/40">Recherche...</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-white/80 backdrop-blur-md text-center">
                  <div className="text-sm font-black uppercase tracking-widest">Aucun message</div>
                  <div className="mt-2 text-sm text-white/40">
                    Commencez une exploration locale.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-white/10 bg-white/[0.02] backdrop-blur-xl">
            <div className="px-4 sm:px-6 py-4">
              <div className="mx-auto w-full max-w-3xl">
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-black text-white/50 uppercase tracking-widest">
                    <Star className="h-3 w-3 text-[#FACC15] fill-current" />
                    Authentique
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-black text-white/50 uppercase tracking-widest">
                    <Compass className="h-3 w-3 text-[#FACC15]" />
                    Proche
                  </span>
                </div>

                <div className="flex items-end gap-3 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-md focus-within:border-[#FACC15]/30 transition-all">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ex : 2h avant match à Rabat, budget 120 MAD..."
                    className="w-full resize-none bg-transparent text-sm font-semibold text-white placeholder:text-white/20 outline-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                  />

                  <button type="button" onClick={() => send(input)} className={btnPrimaryLg}>
                    <Send className="h-4 w-4" />
                    Envoyer
                  </button>
                </div>

                <div className="mt-2 text-[10px] text-white/30 text-center font-bold uppercase tracking-widest">
                  GOMATCH AI peut générer des erreurs.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}