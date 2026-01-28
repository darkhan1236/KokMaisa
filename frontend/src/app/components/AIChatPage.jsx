// src/app/components/AIChatPage.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import Header from "@/app/components/Header";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  Wheat,
  BarChart3,
  Leaf,
  Lightbulb,
  RefreshCw,
  Copy,
  Check,
  Trash2,
} from "lucide-react";


// Предложенные вопросы (переводимые)
const getSuggestedQuestions = (t) => [
  { icon: Wheat, text: t('ai.suggestions.biomass'), category: t('pastures.title') },
  { icon: BarChart3, text: t('ai.suggestions.rotation'), category: t('drones.title') },
  { icon: Leaf, text: t('ai.suggestions.droneMonitoring'), category: t('pastures.title') },
  { icon: Lightbulb, text: t('ai.suggestions.weatherImpact'), category: t('common.weather') },
];

export default function AIChatPage() {
  const { t } = useTranslation();
  const { user, chatAI  } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: t('ai.welcome', { name: user?.full_name || "" }),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = getSuggestedQuestions(t);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-4">
          <p className="text-gray-600 mb-6 text-lg">{t('common.pleaseLogin')}</p>
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-xl"
          >
            {t('nav.login')}
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const text = input.trim();

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await chatAI(text); // ✅ вызов через AuthContext
      const answerText = data?.answer ?? "Пустой ответ от AI.";

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: answerText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      const aiError = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Ошибка AI: ${err.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiError]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSuggestionClick = (question) => {
    setInput(question);
    // Можно сразу отправить, если хочешь:
    // handleSubmit({ preventDefault: () => {} });
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: t('ai.welcome', { name: user?.full_name?.split(" ")[0] || "" }),
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex-1 pt-20 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6">
        {/* Chat Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {t('ai.title')}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {t('ai.subtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={t('common.clearChat')}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-2xl p-3 sm:p-4 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-green-600 text-white rounded-tr-none"
                    : "bg-white border border-gray-200 rounded-tl-none shadow-sm"
                }`}
              >
                <div className="prose prose-sm sm:prose-base max-w-none">
                  {msg.content.split("\n").map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>

                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          {t('common.copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          {t('common.copy')}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-green-600 animate-spin" />
                  <span className="text-gray-600 text-sm">
                    {t('ai.thinking')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 2 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
            <p className="text-sm text-gray-500 mb-3">
              {t('ai.suggestedQuestions')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(q.text)}
                  className="flex items-center gap-3 p-3 text-left bg-gray-50 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50/50 transition-colors"
                >
                  <q.icon className="w-5 h-5 text-green-600 shrink-0" />
                  <span className="text-sm text-gray-800 line-clamp-2">
                    {q.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm sticky bottom-0 z-10">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('ai.inputPlaceholder')}
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                disabled={isLoading}
              />
              <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-5 sm:px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">{t('common.send')}</span>
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {t('ai.dataUsageNote')}
          </p>
        </div>
      </div>
    </div>
  );
}