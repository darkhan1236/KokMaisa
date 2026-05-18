import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bot, ExternalLink, MessageSquareText, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { apiErrorMessage } from "@/app/utils/apiErrors";

const FLOATING_AI_STYLE = `
  .floating-ai-root {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 12000;
    font-family: 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .floating-ai-button {
    width: 58px;
    height: 58px;
    border-radius: 18px;
    border: 0;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: linear-gradient(135deg, #22c55e, #0d9488);
    box-shadow: 0 18px 36px rgba(13, 148, 136, .36);
    transition: transform .18s ease, box-shadow .18s ease;
  }

  .floating-ai-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 44px rgba(13, 148, 136, .42);
  }

  .floating-ai-panel {
    width: min(390px, calc(100vw - 24px));
    height: min(620px, calc(100vh - 96px));
    border-radius: 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 26px 70px rgba(0, 0, 0, .32);
  }

  .floating-ai-panel-dark {
    background: rgba(5, 20, 10, .98);
    border: 1px solid rgba(74, 222, 128, .16);
    color: #fff;
  }

  .floating-ai-panel-light {
    background: rgba(248, 253, 247, .98);
    border: 1px solid rgba(34, 197, 94, .2);
    color: #16351d;
  }

  .floating-ai-header {
    min-height: 64px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid rgba(34, 197, 94, .14);
  }

  .floating-ai-avatar {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    flex: 0 0 auto;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #22c55e, #0d9488);
  }

  .floating-ai-icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    border: 1px solid transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background .18s ease, border-color .18s ease;
  }

  .floating-ai-icon-dark {
    background: rgba(255, 255, 255, .06);
    color: rgba(255, 255, 255, .72);
    border-color: rgba(255, 255, 255, .08);
  }

  .floating-ai-icon-light {
    background: rgba(34, 197, 94, .08);
    color: #15803d;
    border-color: rgba(34, 197, 94, .16);
  }

  .floating-ai-messages {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .floating-ai-messages::-webkit-scrollbar { width: 4px; }
  .floating-ai-messages::-webkit-scrollbar-thumb {
    background: rgba(34, 197, 94, .35);
    border-radius: 99px;
  }

  .floating-ai-row {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .floating-ai-row-user {
    justify-content: flex-end;
  }

  .floating-ai-bubble {
    max-width: 82%;
    border-radius: 16px;
    padding: 10px 12px;
    font-size: 13px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .floating-ai-bubble-dark {
    background: rgba(255, 255, 255, .06);
    border: 1px solid rgba(255, 255, 255, .09);
    color: rgba(255, 255, 255, .88);
  }

  .floating-ai-bubble-light {
    background: #fff;
    border: 1px solid rgba(34, 197, 94, .16);
    color: #16351d;
  }

  .floating-ai-bubble-user {
    background: linear-gradient(135deg, #22c55e, #0d9488);
    color: #fff;
    border: 0;
  }

  .floating-ai-form {
    padding: 12px;
    border-top: 1px solid rgba(34, 197, 94, .14);
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  .floating-ai-input {
    flex: 1;
    min-height: 42px;
    max-height: 110px;
    border-radius: 14px;
    resize: none;
    outline: none;
    padding: 10px 12px;
    font-size: 14px;
    line-height: 1.4;
  }

  .floating-ai-input-dark {
    background: rgba(255, 255, 255, .06);
    border: 1px solid rgba(255, 255, 255, .12);
    color: #fff;
  }

  .floating-ai-input-light {
    background: #fff;
    border: 1px solid rgba(34, 197, 94, .22);
    color: #16351d;
  }

  .floating-ai-send {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    flex: 0 0 auto;
    border: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: linear-gradient(135deg, #22c55e, #0d9488);
    cursor: pointer;
  }

  .floating-ai-send:disabled {
    opacity: .48;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    .floating-ai-root {
      right: 12px;
      bottom: 12px;
    }

    .floating-ai-panel {
      width: calc(100vw - 24px);
      height: min(72vh, 620px);
    }
  }
`;

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function MiniMarkdown({ content }) {
  const lines = (content || "").split("\n");
  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} style={{ margin: "6px 0 6px 18px", listStyle: "disc" }}>
        {listItems.map((item, index) => <li key={index}>{renderInline(item)}</li>)}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      blocks.push(<div key={`space-${index}`} style={{ height: 6 }} />);
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushList();
      blocks.push(
        <div key={index} style={{ fontWeight: 700, margin: "8px 0 5px" }}>
          {renderInline(heading[2])}
        </div>
      );
      return;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (bullet || numbered) {
      listItems.push((bullet || numbered)[1]);
      return;
    }

    flushList();
    blocks.push(<p key={index} style={{ margin: "0 0 6px" }}>{renderInline(line)}</p>);
  });

  flushList();
  return <>{blocks}</>;
}

function getRouteLabel(pathname) {
  const routes = {
    "/farms": "farms page",
    "/pastures": "pastures page",
    "/biomass": "measurements page",
    "/biomass-dashboard": "dashboard page",
    "/settings": "settings page",
    "/admin": "admin panel",
    "/suggestions": "suggestions page",
    "/ai-chat": "full AI chat page",
  };

  return routes[pathname] || "KokMaisa page";
}

function getPageType(pathname, searchParams) {
  if (pathname === "/biomass-dashboard") return "dashboard";
  if (pathname === "/farms") return "farms";
  if (pathname === "/pastures") {
    return searchParams.get("pasture_id") || searchParams.get("pasture")
      ? "pasture_detail"
      : "pastures";
  }
  if (pathname === "/biomass") return "measurements";
  if (pathname === "/ai-chat") return "ai_chat";
  return "other";
}

function buildPageContext(location) {
  const searchParams = new URLSearchParams(location.search || "");
  const page = getRouteLabel(location.pathname);
  const pageType = getPageType(location.pathname, searchParams);
  const title = typeof document !== "undefined" ? document.title : "";
  const pastureRef = searchParams.get("pasture_id") || searchParams.get("pasture") || "";
  const farmRef = searchParams.get("farm_id") || searchParams.get("farm") || "";
  return [
    `Page type: ${pageType}.`,
    `Current page: ${page}.`,
    `Current route: ${location.pathname}${location.search || ""}.`,
    pastureRef ? `Selected pasture reference from URL: ${pastureRef}.` : "",
    farmRef ? `Selected farm reference from URL: ${farmRef}.` : "",
    title ? `Browser title: ${title}.` : "",
    "The user opened the floating KokMaisa AI consultant from this page.",
  ].filter(Boolean).join(" ");
}

function getWelcomeText(language, name) {
  if (language === "kk") {
    return `Сәлем${name ? `, ${name}` : ""}. Мен KokMaisa AI кеңесшісімін. Осы бет бойынша сұрақ қойыңыз.`;
  }
  if (language === "en") {
    return `Hi${name ? `, ${name}` : ""}. I'm the KokMaisa AI consultant. Ask a question about this page.`;
  }
  return `Здравствуйте${name ? `, ${name}` : ""}. Я AI-консультант KokMaisa. Задайте вопрос по этой странице.`;
}

function getPlaceholder(language) {
  if (language === "kk") return "Осы бет бойынша сұрақ қойыңыз...";
  if (language === "en") return "Ask about this page...";
  return "Спросите по этой странице...";
}

export default function FloatingAIConsultant() {
  const { user, chatAIStream, chatAI } = useAuth();
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const location = useLocation();
  const isDark = theme === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const firstName = user?.full_name?.split(" ")[0] || "";
  const initialMessage = useMemo(() => ({
    id: "welcome",
    role: "assistant",
    content: getWelcomeText(i18n.language, firstName),
  }), [i18n.language, firstName]);

  const [messages, setMessages] = useState([initialMessage]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0]?.id === "welcome") return [initialMessage];
      return prev;
    });
  }, [initialMessage]);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  if (!user || location.pathname === "/ai-chat") return null;

  const pageContext = buildPageContext(location);
  const panelClass = `floating-ai-panel ${isDark ? "floating-ai-panel-dark" : "floating-ai-panel-light"}`;
  const iconClass = `floating-ai-icon-btn ${isDark ? "floating-ai-icon-dark" : "floating-ai-icon-light"}`;
  const inputClass = `floating-ai-input ${isDark ? "floating-ai-input-dark" : "floating-ai-input-light"}`;
  const assistantBubbleClass = `floating-ai-bubble ${isDark ? "floating-ai-bubble-dark" : "floating-ai-bubble-light"}`;

  const sendMessage = async (event) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: String(Date.now()),
      role: "user",
      content: text,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const assistantId = String(Date.now() + 1);
    setMessages(prev => [...prev, {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
    }]);

    const history = messages.filter(message => message.id !== "welcome" && !message.isError);

    try {
      let result = null;
      if (chatAIStream) {
        result = await chatAIStream(text, history, (_chunk, fullText) => {
          setMessages(prev => prev.map(message =>
            message.id === assistantId ? { ...message, content: fullText } : message
          ));
        }, sessionId, pageContext);
      } else {
        result = await chatAI(text, history, sessionId, pageContext);
        setMessages(prev => prev.map(message =>
          message.id === assistantId ? { ...message, content: result?.answer || "" } : message
        ));
      }

      setMessages(prev => prev.map(message =>
        message.id === assistantId ? { ...message, isStreaming: false } : message
      ));

      if (result?.session_id) setSessionId(result.session_id);
    } catch (error) {
      setMessages(prev => prev.map(message =>
        message.id === assistantId
          ? {
              ...message,
              content: apiErrorMessage(error, i18n),
              isStreaming: false,
              isError: true,
            }
          : message
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{FLOATING_AI_STYLE}</style>
      <div className="floating-ai-root">
        {!isOpen ? (
          <button
            type="button"
            className="floating-ai-button"
            onClick={() => setIsOpen(true)}
            aria-label="Open KokMaisa AI consultant"
            title="KokMaisa AI"
          >
            <MessageSquareText size={25} aria-hidden="true" />
          </button>
        ) : (
          <section className={panelClass} aria-label="KokMaisa AI consultant">
            <div className="floating-ai-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div className="floating-ai-avatar">
                  <Bot size={20} aria-hidden="true" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    KokMaisa AI
                  </div>
                  <div style={{ fontSize: 12, opacity: .62, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {getRouteLabel(location.pathname)}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <Link className={iconClass} to="/ai-chat" title="Open full chat" aria-label="Open full AI chat">
                  <ExternalLink size={16} aria-hidden="true" />
                </Link>
                <button type="button" className={iconClass} onClick={() => setIsOpen(false)} aria-label="Close AI consultant">
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="floating-ai-messages">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`floating-ai-row ${message.role === "user" ? "floating-ai-row-user" : ""}`}
                >
                  {message.role === "assistant" && (
                    <div className="floating-ai-avatar" style={{ width: 28, height: 28, borderRadius: 10 }}>
                      <Bot size={14} aria-hidden="true" />
                    </div>
                  )}
                  <div
                    className={
                      message.role === "user"
                        ? "floating-ai-bubble floating-ai-bubble-user"
                        : assistantBubbleClass
                    }
                    style={message.isError ? { borderColor: "rgba(239,68,68,.42)", color: isDark ? "#fca5a5" : "#dc2626" } : undefined}
                  >
                    {message.isStreaming && !message.content ? (
                      <span style={{ opacity: .72 }}>{i18n.language === "en" ? "Thinking..." : "Думаю..."}</span>
                    ) : (
                      <MiniMarkdown content={message.content} />
                    )}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <form className="floating-ai-form" onSubmit={sendMessage}>
              <textarea
                ref={inputRef}
                className={inputClass}
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                placeholder={getPlaceholder(i18n.language)}
                aria-label={getPlaceholder(i18n.language)}
              />
              <button
                type="submit"
                className="floating-ai-send"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                <Send size={17} aria-hidden="true" />
              </button>
            </form>
          </section>
        )}
      </div>
    </>
  );
}
