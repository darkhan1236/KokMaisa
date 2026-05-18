// src/app/components/AIChatPage.jsx
// KokMaisa 2025 — Premium dark/light theme, full i18n (EN/RU/KK), responsive, backend-safe

import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import Header from "@/app/components/Header";
import { apiErrorMessage } from "@/app/utils/apiErrors";
import {
  Bot, User, Send, RefreshCw, Copy, Check,
  Wheat, BarChart3, Leaf, Lightbulb, MessageSquareText,
  Plus, Trash2, Menu, X,
} from "lucide-react";

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const CHAT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .chat-root { font-family: 'DM Sans', sans-serif; min-height: 100vh; transition: background .4s; }

  /* Dark */
  .chat-root-dark { background: #061309; color: #fff; }
  /* Light */
  .chat-root-light { background: #f5fcf2; color: #1a3d20; }

  /* Header bar */
  .chat-header-dark  { background: rgba(4,13,6,.92); border-bottom: 1px solid rgba(74,222,128,.12); backdrop-filter: blur(20px); }
  .chat-header-light { background: rgba(240,250,242,.97); border-bottom: 1px solid rgba(34,197,94,.2);  backdrop-filter: blur(20px); box-shadow: 0 2px 12px rgba(34,197,94,.07); }

  /* Messages area */
  .chat-messages-dark  { background: transparent; }
  .chat-messages-light { background: transparent; }

  /* AI bubble */
  .bubble-ai-dark  { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); color: rgba(255,255,255,.88); }
  .bubble-ai-light { background: rgba(255,255,255,.95); border: 1px solid rgba(34,197,94,.2); color: #1a3d20; box-shadow: 0 2px 12px rgba(34,197,94,.07); }

  /* User bubble */
  .bubble-user { background: linear-gradient(135deg, #22c55e 0%, #0d9488 100%); color: #fff; }

  /* Input area */
  .chat-input-dark  { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: #fff; line-height: 1.45; min-height: 44px; }
  .chat-input-dark::placeholder { color: rgba(255,255,255,.62); opacity: 1; }
  .chat-input-dark:focus { border-color: rgba(74,222,128,.5); box-shadow: 0 0 0 3px rgba(74,222,128,.08); }
  .chat-input-light { background: rgba(255,255,255,.95); border: 1px solid rgba(34,197,94,.25); color: #1a3d20; line-height: 1.45; min-height: 44px; }
  .chat-input-light::placeholder { color: rgba(20,55,20,.62); opacity: 1; }
  .chat-input-light:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,.12); }

  /* Input bar wrapper */
  .chat-bar-dark  { background: rgba(4,13,6,.94); border-top: 1px solid rgba(74,222,128,.1); backdrop-filter: blur(20px); }
  .chat-bar-light { background: rgba(240,250,242,.97); border-top: 1px solid rgba(34,197,94,.15); backdrop-filter: blur(20px); box-shadow: 0 -2px 12px rgba(34,197,94,.06); }

  /* Send button */
  .send-btn { background: linear-gradient(135deg,#22c55e,#0d9488); color: #fff; border: none; border-radius: 14px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .2s, box-shadow .2s; flex-shrink: 0; }
  .send-btn:hover:not(:disabled) { transform: scale(1.07); box-shadow: 0 6px 20px rgba(34,197,94,.4); }
  .send-btn:disabled { opacity: .45; cursor: not-allowed; }

  /* Suggestion chips */
  .chip-dark  { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); color: rgba(255,255,255,.7); transition: background .2s, border-color .2s; }
  .chip-dark:hover { background: rgba(34,197,94,.12); border-color: rgba(34,197,94,.3); color: #fff; }
  .chip-light { background: rgba(255,255,255,.9); border: 1px solid rgba(34,197,94,.2); color: rgba(20,55,20,.75); transition: background .2s, border-color .2s; box-shadow: 0 1px 6px rgba(34,197,94,.06); }
  .chip-light:hover { background: rgba(34,197,94,.08); border-color: rgba(34,197,94,.35); color: #166534; }

  /* Loading dots */
  @keyframes chatDot {
    0%,80%,100% { transform: scale(.6); opacity: .4; }
    40%         { transform: scale(1);  opacity: 1; }
  }
  .dot1 { animation: chatDot 1.2s ease-in-out infinite; }
  .dot2 { animation: chatDot 1.2s ease-in-out .2s infinite; }
  .dot3 { animation: chatDot 1.2s ease-in-out .4s infinite; }

  /* Copy button */
  .copy-btn-dark  { color: rgba(255,255,255,.3); background: none; border: none; cursor: pointer; transition: color .2s; padding: 2px 6px; border-radius: 6px; font-size: 12px; display: flex; align-items: center; gap: 4px; }
  .copy-btn-dark:hover { color: #4ade80; }
  .copy-btn-light { color: rgba(20,55,20,.35); background: none; border: none; cursor: pointer; transition: color .2s; padding: 2px 6px; border-radius: 6px; font-size: 12px; display: flex; align-items: center; gap: 4px; }
  .copy-btn-light:hover { color: #16a34a; }

  /* Avatar ring */
  .ai-avatar  { background: linear-gradient(135deg,#22c55e,#0d9488); }
  .usr-avatar-dark  { background: rgba(255,255,255,.1); }
  .usr-avatar-light { background: rgba(34,197,94,.15); }

  /* Note text */
  .note-dark  { color: rgba(255,255,255,.25); }
  .note-light { color: rgba(20,55,20,.4); }

  /* Scrollbar */
  .chat-scroll::-webkit-scrollbar { width: 4px; }
  .chat-scroll::-webkit-scrollbar-thumb { background: rgba(74,222,128,.25); border-radius: 4px; }

  .chat-session-btn { width: 100%; text-align: left; border-radius: 12px; padding: 10px 12px; transition: background .2s, border-color .2s; }
  .chat-session-dark { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); color: rgba(255,255,255,.76); }
  .chat-session-dark:hover, .chat-session-dark.active { background: rgba(34,197,94,.12); border-color: rgba(34,197,94,.28); color: #fff; }
  .chat-session-light { background: rgba(255,255,255,.82); border: 1px solid rgba(34,197,94,.14); color: rgba(20,55,20,.76); }
  .chat-session-light:hover, .chat-session-light.active { background: rgba(34,197,94,.08); border-color: rgba(34,197,94,.28); color: #166534; }
  .chat-sidebar-dark { background: rgba(4,13,6,.72); border-right: 1px solid rgba(74,222,128,.1); }
  .chat-sidebar-light { background: rgba(240,250,242,.82); border-right: 1px solid rgba(34,197,94,.14); }
  .chat-history-toggle { display: none; }
  .chat-mobile-close { display: none; }
  .chat-backdrop { display: none; }

  @media (max-width: 640px) {
    .chat-header-inner { padding: 10px 14px; }
    .chat-bar-inner    { padding: 10px 12px; }
    .chat-input-dark, .chat-input-light { font-size: 16px; padding-top: 11px; padding-bottom: 11px; }
    .chat-history-toggle { display: flex; }
    .chat-mobile-close { display: flex; }
    .chat-main-panel { width: 100%; min-width: 0; }
    .chat-sidebar {
      display: block;
      position: fixed;
      top: 64px;
      bottom: 0;
      left: 0;
      width: min(86vw, 320px);
      z-index: 50;
      transform: translateX(-105%);
      transition: transform .24s ease;
      box-shadow: 20px 0 40px rgba(0,0,0,.28);
    }
    .chat-sidebar.open { transform: translateX(0); }
    .chat-backdrop {
      display: block;
      position: fixed;
      inset: 64px 0 0 0;
      z-index: 45;
      background: rgba(0,0,0,.38);
      backdrop-filter: blur(3px);
    }
  }
`;

/* ─── Suggested questions ──────────────────────────────────────────────────── */
const getSuggestions = (t) => [
  { icon: Wheat,     text: t("ai.suggestions.biomass"),        accent: "#4ade80" },
  { icon: BarChart3, text: t("ai.suggestions.rotation"),       accent: "#22d3ee" },
  { icon: Leaf,      text: t("ai.suggestions.pastureHealth"),  accent: "#a78bfa" },
  { icon: Lightbulb, text: t("ai.suggestions.weatherImpact"),  accent: "#fbbf24" },
];

/* ─── Typing indicator ──────────────────────────────────────────────────────── */
function TypingDots({ isDark }) {
  const col = isDark ? "#4ade80" : "#16a34a";
  return (
    <div className="flex items-center gap-1 py-1 px-2">
      <div className="w-2 h-2 rounded-full dot1" style={{ background: col }} />
      <div className="w-2 h-2 rounded-full dot2" style={{ background: col }} />
      <div className="w-2 h-2 rounded-full dot3" style={{ background: col }} />
    </div>
  );
}

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function MessageMarkdown({ content }) {
  const lines = content.split("\n");
  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="my-2 ml-5 list-disc space-y-1">
        {listItems.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      blocks.push(<div key={`space-${idx}`} className="h-2" />);
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushList();
      blocks.push(
        <div key={idx} className="mt-3 mb-2 font-semibold text-[15px]">
          {renderInline(heading[2])}
        </div>
      );
      return;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      listItems.push(bullet[1]);
      return;
    }

    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      listItems.push(numbered[1]);
      return;
    }

    const formulaLike = /NDVI\s*=|\/|\$/.test(line) && /[=()]/.test(line);
    flushList();
    blocks.push(
      formulaLike ? (
        <div key={idx} className="my-3 rounded-xl px-3 py-2 font-mono text-[13px] bg-black/10 overflow-x-auto">
          {line.replace(/\$/g, "")}
        </div>
      ) : (
        <p key={idx} className="mb-2 last:mb-0">{renderInline(line)}</p>
      )
    );
  });

  flushList();
  return <>{blocks}</>;
}

/* ─── Main Component ────────────────────────────────────────────────────────── */
export default function AIChatPage() {
  const { t, i18n }     = useTranslation();
  const { theme }       = useTheme();
  const {
    user,
    chatAI,
    chatAIStream,
    getAIChatSessions,
    getAIChatSession,
    deleteAIChatSession,
  } = useAuth();
  const navigate        = useNavigate();
  const location        = useLocation();
  const isDark          = theme === "dark";

  const makeWelcomeMessage = () => ({
    id: "welcome",
    role: "assistant",
    content: t("ai.welcome", { name: user?.full_name?.split(" ")[0] || "" }),
    timestamp: new Date(),
  });

  const [messages, setMessages] = useState([makeWelcomeMessage()]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [input, setInput]       = useState("");
  const [isLoading, setLoading] = useState(false);
  const [copiedId, setCopied]   = useState(null);
  const endRef                  = useRef(null);
  const inputRef                = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const refreshSessions = async () => {
    if (!user || !getAIChatSessions) return;
    setSessionsLoading(true);
    try {
      const data = await getAIChatSessions();
      setSessions(data || []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    refreshSessions();
  }, [user]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0]?.id === "welcome") return [makeWelcomeMessage()];
      return prev;
    });
  }, [i18n.language, user?.full_name]);

  /* ── Not logged in ── */
  if (!user) {
    return (
      <>
        <style>{CHAT_STYLE}</style>
        <div className={`chat-root ${isDark ? "chat-root-dark" : "chat-root-light"} flex items-center justify-center`}>
          <div className="text-center p-8 rounded-3xl max-w-sm mx-4"
            style={{
              background: isDark ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.9)",
              border: isDark ? "1px solid rgba(255,255,255,.1)" : "1px solid rgba(34,197,94,.2)",
            }}>
            <div className="w-16 h-16 ai-avatar rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquareText className="w-8 h-8 text-white" />
            </div>
            <p className="mb-5 text-sm" style={{ color: isDark ? "rgba(255,255,255,.6)" : "rgba(20,55,20,.65)" }}>
              {t("common.pleaseLogin")}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3 rounded-full text-white font-semibold text-sm send-btn"
              style={{ width: "auto", height: "auto", borderRadius: 999, padding: "12px 28px" }}
            >
              {t("nav.login")}
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ── Send message ── */
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const assistantId = (Date.now() + 1).toString();
      const startedAt = performance.now();
      setMessages(prev => [...prev, {
        id:        assistantId,
        role:      "assistant",
        content:   "",
        timestamp: new Date(),
        isStreaming: true,
      }]);

      const history = messages.filter(m => m.id !== "welcome" && !m.isError);
      let result = null;

      if (chatAIStream) {
        result = await chatAIStream(text, history, (_chunk, fullText) => {
          setMessages(prev => prev.map(msg =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: fullText,
                  thoughtSeconds: msg.thoughtSeconds ?? Math.max(0.1, (performance.now() - startedAt) / 1000),
                }
              : msg
          ));
        }, activeSessionId, pageContext);
      } else {
        const data       = await chatAI(text, history, activeSessionId, pageContext);
        result = data;
        const answerText = data?.answer ?? t("ai.emptyAnswer", "No response.");
        setMessages(prev => prev.map(msg =>
          msg.id === assistantId ? { ...msg, content: answerText } : msg
        ));
      }

      setMessages(prev => prev.map(msg =>
        msg.id === assistantId
          ? {
              ...msg,
              isStreaming: false,
              thoughtSeconds: msg.thoughtSeconds ?? Math.max(0.1, (performance.now() - startedAt) / 1000),
            }
          : msg
      ));

      if (result?.session_id) {
        setActiveSessionId(result.session_id);
      }
      refreshSessions();
    } catch (err) {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.isStreaming) {
          return prev.map(msg =>
            msg.id === last.id
              ? { ...msg, content: apiErrorMessage(err, i18n), isStreaming: false, isError: true }
              : msg
          );
        }

        return [...prev, {
          id:        (Date.now() + 1).toString(),
          role:      "assistant",
          content:   apiErrorMessage(err, i18n),
          timestamp: new Date(),
          isError:   true,
        }];
      });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([makeWelcomeMessage()]);
    setInput("");
    setHistoryOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const openSession = async (sessionId) => {
    if (isLoading || !getAIChatSession) return;
    try {
      const session = await getAIChatSession(sessionId);
      setActiveSessionId(session.id);
      const loaded = (session.messages || []).map(message => ({
        id: String(message.id),
        role: message.role,
        content: message.content,
        timestamp: message.created_at ? new Date(message.created_at) : new Date(),
      }));
      setMessages(loaded.length ? loaded : [makeWelcomeMessage()]);
      setHistoryOpen(false);
    } catch (err) {
      setMessages([{
        id: "load-error",
        role: "assistant",
        content: apiErrorMessage(err, i18n),
        timestamp: new Date(),
        isError: true,
      }]);
    }
  };

  const removeSession = async (event, sessionId) => {
    event.stopPropagation();
    if (!deleteAIChatSession) return;
    try {
      await deleteAIChatSession(sessionId);
      if (activeSessionId === sessionId) startNewChat();
      refreshSessions();
    } catch {}
  };

  const suggestions = getSuggestions(t);
  const searchParams = new URLSearchParams(location.search || "");
  const pastureRef = searchParams.get("pasture_id") || searchParams.get("pasture") || "";
  const farmRef = searchParams.get("farm_id") || searchParams.get("farm") || "";
  const pageContext = [
    "Page type: ai_chat.",
    "Current page: full KokMaisa AI consultant chat.",
    `Current route: ${location.pathname}${location.search || ""}.`,
    pastureRef ? `Selected pasture reference from URL: ${pastureRef}.` : "",
    farmRef ? `Selected farm reference from URL: ${farmRef}.` : "",
    "The user is using the full AI chat page.",
  ].filter(Boolean).join(" ");

  /* ── Colours ── */
  const nameColor    = isDark ? "rgba(255,255,255,.9)"  : "#1a3d20";
  const roleColor    = isDark ? "rgba(255,255,255,.45)" : "rgba(20,55,20,.55)";
  const timeColor    = isDark ? "rgba(255,255,255,.25)" : "rgba(20,55,20,.35)";
  const divColor     = isDark ? "rgba(255,255,255,.07)" : "rgba(34,197,94,.12)";
  const inputCls     = `w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none transition-all ${isDark ? "chat-input-dark" : "chat-input-light"}`;
  const bubbleAiCls  = `rounded-2xl rounded-tl-none px-4 py-3 text-sm leading-relaxed max-w-full ${isDark ? "bubble-ai-dark" : "bubble-ai-light"}`;
  const bubbleUsrCls = "bubble-user rounded-2xl rounded-tr-none px-4 py-3 text-sm leading-relaxed max-w-full";
  const chipCls      = `inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer border ${isDark ? "chip-dark" : "chip-light"}`;

  const formatTime = (date) =>
    date.toLocaleTimeString(isDark ? "ru-RU" : "en-US", { hour: "2-digit", minute: "2-digit" });

  const thoughtLabel = (msg) => {
    if (msg.thoughtSeconds == null) return null;
    const value = msg.thoughtSeconds.toFixed(1);
    if (i18n.language === "kk") return `Ойланды ${value} сек`;
    if (i18n.language === "en") return `Thought for ${value} seconds`;
    return `Думал ${value} сек`;
  };

  return (
    <>
      <style>{CHAT_STYLE}</style>
      <div className={`chat-root ${isDark ? "chat-root-dark" : "chat-root-light"} flex flex-col`}>
        <Header />

        {/* ── Chat layout ── */}
        <div className="flex-1 flex w-full pt-16" style={{ minHeight: 0 }}>
          {isHistoryOpen && (
            <button
              type="button"
              className="chat-backdrop"
              onClick={() => setHistoryOpen(false)}
              aria-label="Close chat history"
            />
          )}

          <aside className={`chat-sidebar ${isHistoryOpen ? "open" : ""} w-72 flex-shrink-0 p-4 overflow-y-auto ${isDark ? "chat-sidebar-dark" : "chat-sidebar-light"}`}>
            <div className="chat-mobile-close items-center justify-between mb-4">
              <div className="text-sm font-bold" style={{ color: nameColor }}>
                История
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: isDark ? "rgba(255,255,255,.07)" : "rgba(34,197,94,.1)",
                  border: isDark ? "1px solid rgba(255,255,255,.1)" : "1px solid rgba(34,197,94,.2)",
                  color: isDark ? "rgba(255,255,255,.7)" : "#16a34a",
                }}
                aria-label="Close chat history"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={startNewChat}
              className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#22c55e,#0d9488)" }}
            >
              <Plus className="w-4 h-4" />
              Новый чат
            </button>

            <div className="text-xs font-semibold mb-2 px-1" style={{ color: roleColor }}>
              История
            </div>

            <div className="space-y-2">
              {sessionsLoading && (
                <div className="text-xs px-1" style={{ color: roleColor }}>Загрузка...</div>
              )}
              {!sessionsLoading && sessions.length === 0 && (
                <div className="text-xs px-1" style={{ color: roleColor }}>Чатов пока нет</div>
              )}
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => openSession(session.id)}
                  className={`chat-session-btn ${isDark ? "chat-session-dark" : "chat-session-light"} ${activeSessionId === session.id ? "active" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquareText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{session.title}</div>
                      {session.last_message && (
                        <div className="truncate text-xs mt-1 opacity-60">{session.last_message}</div>
                      )}
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => removeSession(event, session.id)}
                      className="p-1 rounded-lg opacity-50 hover:opacity-100"
                      aria-label="Удалить чат"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="chat-main-panel flex-1 flex flex-col max-w-4xl w-full mx-auto px-0 sm:px-4" style={{ minHeight: 0 }}>

          {/* ── Chat Header bar ── */}
          <div className={`chat-header-inner flex items-center justify-between px-4 sm:px-6 py-3 sticky top-16 z-10 ${isDark ? "chat-header-dark" : "chat-header-light"}`}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="chat-history-toggle w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
                style={{
                  background: isDark ? "rgba(255,255,255,.07)" : "rgba(34,197,94,.1)",
                  border: isDark ? "1px solid rgba(255,255,255,.1)" : "1px solid rgba(34,197,94,.2)",
                  color: isDark ? "rgba(255,255,255,.7)" : "#16a34a",
                }}
                aria-label="Open chat history"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="ai-avatar w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <div className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif", color: nameColor }}>
                  {t("ai.title")}
                </div>
                <div className="text-xs flex items-center gap-1.5" style={{ color: roleColor }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  {t("ai.subtitle")}
                </div>
              </div>
            </div>
            <button
              onClick={startNewChat}
              title="Новый чат"
              style={{
                background: isDark ? "rgba(255,255,255,.07)" : "rgba(34,197,94,.1)",
                border: isDark ? "1px solid rgba(255,255,255,.1)" : "1px solid rgba(34,197,94,.2)",
                color: isDark ? "rgba(255,255,255,.55)" : "#16a34a",
                borderRadius: 10, width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "background .2s",
              }}
              aria-label="Новый чат"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* ── Messages ── */}
          <div className="chat-scroll flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5" style={{ minHeight: 0 }}>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* AI avatar */}
                {msg.role === "assistant" && (
                  <div className="ai-avatar w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" aria-hidden="true" />
                  </div>
                )}

                <div className="flex flex-col gap-1 max-w-[82%] sm:max-w-[75%]">
                  <div className={msg.role === "user" ? bubbleUsrCls : bubbleAiCls}
                    style={msg.isError ? { borderColor: "rgba(239,68,68,.4)", color: isDark ? "#fca5a5" : "#dc2626" } : undefined}
                  >
                    {msg.role === "assistant" && thoughtLabel(msg) && (
                      <div className="text-xs mb-3 flex items-center gap-2" style={{ color: isDark ? "rgba(255,255,255,.45)" : "rgba(20,55,20,.5)" }}>
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>{thoughtLabel(msg)}</span>
                      </div>
                    )}

                    {msg.isStreaming && !msg.content ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: isDark ? "rgba(255,255,255,.45)" : "rgba(20,55,20,.5)" }}>
                          {t("ai.thinking")}
                        </span>
                        <TypingDots isDark={isDark} />
                      </div>
                    ) : (
                      <MessageMarkdown content={msg.content} />
                    )}
                  </div>

                  {/* Copy + timestamp */}
                  <div className={`flex items-center gap-2 px-1 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className={isDark ? "copy-btn-dark" : "copy-btn-light"}
                        title={t("common.copy")}
                        aria-label={t("common.copy")}
                      >
                        {copiedId === msg.id
                          ? <><Check className="w-3 h-3" />{t("common.copied")}</>
                          : <><Copy className="w-3 h-3" />{t("common.copy")}</>
                        }
                      </button>
                    )}
                    <span className="text-xs" style={{ color: timeColor }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>

                {/* User avatar */}
                {msg.role === "user" && (
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? "usr-avatar-dark" : "usr-avatar-light"}`}>
                    <User className="w-4 h-4" style={{ color: isDark ? "rgba(255,255,255,.6)" : "#16a34a" }} aria-hidden="true" />
                  </div>
                )}
              </div>
            ))}

            <div ref={endRef} />
          </div>

          {/* ── Suggestion chips (shown when only welcome message) ── */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-4 sm:px-6 pb-3">
              <p className="text-xs mb-2.5" style={{ color: isDark ? "rgba(255,255,255,.35)" : "rgba(20,55,20,.45)" }}>
                {t("ai.suggestedQuestions")}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map(({ icon: Icon, text, accent }) => (
                  <button
                    key={text}
                    onClick={() => handleSuggestion(text)}
                    className={chipCls}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accent }} aria-hidden="true" />
                    <span className="text-left">{text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Input bar ── */}
          <div className={`chat-bar-inner px-4 sm:px-6 py-3 sm:py-4 ${isDark ? "chat-bar-dark" : "chat-bar-light"}`}>
            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                className={inputCls}
                placeholder={t("ai.inputPlaceholder")}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                }}
                rows={1}
                style={{ maxHeight: 120, overflowY: "auto" }}
                aria-label={t("ai.inputPlaceholder")}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="send-btn"
                aria-label={t("common.send")}
              >
                <Send className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
            <p className="text-center text-xs mt-2" style={{ color: isDark ? "rgba(255,255,255,.2)" : "rgba(20,55,20,.35)" }}>
              {t("ai.dataUsageNote")}
            </p>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
