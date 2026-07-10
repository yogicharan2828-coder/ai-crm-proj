/**
 * Premium AI Chat Interface — Healthcare CRM Assistant
 *
 * Required packages (in addition to what you already have):
 *   npm install react-markdown remark-gfm lucide-react
 *
 * Backend contract is unchanged: POST /ai/chat  { message } -> { response }
 */
import { useState, useRef, useEffect, useCallback, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Send,
  X,
  Sparkles,
  Stethoscope,
  CalendarCheck,
  ClipboardList,
  Hospital,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Loader2,
} from "lucide-react";
import api from "../api/api";

/* ------------------------------------------------------------------ */
/*  Static config                                                      */
/* ------------------------------------------------------------------ */

const QUICK_SUGGESTIONS = [
  { text: "Show all doctors", icon: Stethoscope },
  { text: "Pending follow-ups", icon: CalendarCheck },
  { text: "Today's interactions", icon: ClipboardList },
  { text: "Summarize CRM", icon: Sparkles },
  { text: "Cardiologists", icon: Bot },
  { text: "Hospital details", icon: Hospital },
];

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  text: `👋 Welcome to **Healthcare AI Assistant**

I'm your intelligent CRM companion.

I can help you with:

- 👨‍⚕️ Doctor Information
- 🏥 Hospital Details
- 📅 Follow-up Schedule
- 📋 Interaction History
- 🧠 AI Clinical Insights

Ask me anything about your CRM database.`,
  displayed: null, // null = show fully immediately, no streaming
  streaming: false,
  time: new Date(),
};

const MAX_TEXTAREA_HEIGHT = 120; // px

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatTime(date) {
  try {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

let idCounter = 1;
const nextId = () => `m_${Date.now()}_${idCounter++}`;

/* ------------------------------------------------------------------ */
/*  Code block (with its own copy button)                              */
/* ------------------------------------------------------------------ */

const CodeBlock = memo(function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-white/10 bg-slate-950/70 max-w-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
        <span className="text-[10px] uppercase tracking-wide text-slate-400">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs sm:text-[13px] leading-relaxed text-cyan-100">
        <code>{code}</code>
      </pre>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Markdown renderer (shared components map)                          */
/* ------------------------------------------------------------------ */

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-lg font-bold mt-2 mb-1.5 text-white">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold mt-2 mb-1.5 text-white">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-bold mt-2 mb-1 text-white">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed break-words">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-200">{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-cyan-400 underline decoration-cyan-400/40 underline-offset-2 hover:text-cyan-300 break-all"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-cyan-500/50 pl-3 italic text-slate-300 my-2">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-2 rounded-lg border border-white/10 max-w-full">
      <table className="w-full text-xs sm:text-sm border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/10 text-cyan-200">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border-t border-white/5 align-top">
      {children}
    </td>
  ),
  hr: () => <hr className="my-2 border-white/10" />,
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className || "");
    const raw = String(children).replace(/\n$/, "");
    if (match) {
      return <CodeBlock language={match[1]} code={raw} />;
    }
    return (
      <code className="bg-slate-700/60 text-cyan-300 px-1.5 py-0.5 rounded text-[0.85em] break-words">
        {raw}
      </code>
    );
  },
  pre({ children }) {
    return <>{children}</>;
  },
};

/* ------------------------------------------------------------------ */
/*  Thinking indicator (animated bouncing dots)                        */
/* ------------------------------------------------------------------ */

function ThinkingDots() {
  return (
    <div className="flex items-center gap-2">
      <Bot size={16} className="text-cyan-400" />
      <span className="text-cyan-300 text-sm">AI is thinking</span>
      <span className="flex items-center gap-1">
        <span
          className="thinking-dot w-1.5 h-1.5 rounded-full bg-cyan-400"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="thinking-dot w-1.5 h-1.5 rounded-full bg-cyan-400"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="thinking-dot w-1.5 h-1.5 rounded-full bg-cyan-400"
          style={{ animationDelay: "300ms" }}
        />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single message bubble                                              */
/* ------------------------------------------------------------------ */

const MessageBubble = memo(function MessageBubble({
  msg,
  isRegenerating,
  onCopy,
  onRegenerate,
  copied,
}) {
  const isUser = msg.role === "user";
  const bodyText = msg.displayed !== null ? msg.displayed : msg.text;

  return (
    <div
      className={`flex w-full animate-fade-slide-in ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex flex-col min-w-0 max-w-[88%] sm:max-w-[80%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`min-w-0 rounded-2xl px-4 py-3 shadow-lg backdrop-blur-xl border ${
            isUser
              ? "bg-gradient-to-br from-cyan-500/90 to-blue-500/90 text-white border-cyan-300/30 rounded-br-md shadow-cyan-500/20"
              : "bg-slate-800/60 text-slate-100 border-white/10 rounded-bl-md shadow-black/20"
          }`}
        >
          {isRegenerating ? (
            <ThinkingDots />
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {msg.text}
            </p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none min-w-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {bodyText}
              </ReactMarkdown>
              {msg.streaming && (
                <span className="typing-cursor inline-block w-[2px] h-4 align-middle bg-cyan-300 ml-0.5" />
              )}
            </div>
          )}
        </div>

        {/* Meta row: timestamp + actions */}
        <div
          className={`flex items-center gap-3 mt-1 px-1 text-[11px] text-slate-500 ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span>{formatTime(msg.time)}</span>

          {!isUser && msg.id !== "welcome" && !msg.streaming && !isRegenerating && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onCopy(msg.id, msg.text)}
                className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <Copy size={12} />
                )}
              </button>
              <button
                onClick={() => onRegenerate(msg.id)}
                className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
                title="Regenerate response"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [copiedId, setCopiedId] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const intervalsRef = useRef(new Set());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Clean up any in-flight streaming intervals on unmount
  useEffect(() => {
    const intervals = intervalsRef.current;
    return () => {
      intervals.forEach((id) => clearInterval(id));
      intervals.clear();
    };
  }, []);

  /* ---------------- streaming ---------------- */

  const streamInto = useCallback((id, fullText) => {
    const tokens = fullText.split(/(\s+)/);
    const speed = tokens.length > 220 ? 4 : tokens.length > 90 ? 2 : 1;
    let i = 0;

    const interval = setInterval(() => {
      i += speed;
      const chunk = tokens.slice(0, i).join("");
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, displayed: chunk } : m))
      );

      if (i >= tokens.length) {
        clearInterval(interval);
        intervalsRef.current.delete(interval);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, displayed: fullText, streaming: false } : m
          )
        );
      }
    }, 22);

    intervalsRef.current.add(interval);
  }, []);

  /* ---------------- textarea auto-resize ---------------- */

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }
  };

  const resetTextareaHeight = () => {
    const el = textareaRef.current;
    if (el) el.style.height = "auto";
  };

  /* ---------------- send / ask ---------------- */

  const isBusy = loading || messages.some((m) => m.streaming) || !!regeneratingId;

  const askAI = async (customQuestion = null) => {
    const query = (customQuestion ?? question).trim();
    if (!query || isBusy) return;

    const userMsg = {
      id: nextId(),
      role: "user",
      text: query,
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);

    if (!customQuestion) {
      setQuestion("");
      resetTextareaHeight();
    }

    setLoading(true);

    try {
      const res = await api.post("/ai/chat", { message: query });
      const responseText =
        res?.data?.response ?? "I didn't get a response for that. Please try again.";

      const assistantId = nextId();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          text: responseText,
          displayed: "",
          streaming: true,
          time: new Date(),
        },
      ]);
      setLoading(false);
      streamInto(assistantId, responseText);
    } catch {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: "Sorry, I'm unable to connect to the AI service right now.",
          displayed: null,
          streaming: false,
          time: new Date(),
        },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askAI();
    }
    // Shift+Enter => allow default (newline)
  };

  /* ---------------- copy ---------------- */

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      // ignore
    }
  };

  /* ---------------- regenerate ---------------- */

  const handleRegenerate = async (assistantId) => {
    if (isBusy) return;

    const idx = messages.findIndex((m) => m.id === assistantId);
    if (idx === -1) return;

    // find the preceding user message
    let userText = null;
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userText = messages[i].text;
        break;
      }
    }
    if (!userText) return;

    setRegeneratingId(assistantId);

    try {
      const res = await api.post("/ai/chat", { message: userText });
      const responseText =
        res?.data?.response ?? "I didn't get a response for that. Please try again.";

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, text: responseText, displayed: "", streaming: true, time: new Date() }
            : m
        )
      );
      setRegeneratingId(null);
      streamInto(assistantId, responseText);
    } catch {
      setRegeneratingId(null);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                text: "Sorry, I'm unable to connect to the AI service right now.",
                displayed: null,
                streaming: false,
                time: new Date(),
              }
            : m
        )
      );
    }
  };

  /* ---------------- clear conversation ---------------- */

  const handleClear = () => {
    setMessages([WELCOME_MESSAGE]);
    setCopiedId(null);
    setRegeneratingId(null);
  };

  /* ---------------- render ---------------- */

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blinkCursor {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes bounceDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .animate-fade-slide-in { animation: fadeSlideIn 0.35s ease-out both; }
        .typing-cursor { animation: blinkCursor 0.9s step-start infinite; }
        .thinking-dot { animation: bounceDot 1.3s infinite ease-in-out; }
        .chat-scroll::-webkit-scrollbar { width: 6px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.25);
          border-radius: 999px;
        }
        .chat-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.45);
        }
      `}</style>

      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-2xl shadow-cyan-500/40 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-cyan-400/60 active:scale-95"
          aria-label="Open AI assistant"
        >
          <Bot size={28} className="text-white" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="
            fixed inset-x-3 bottom-3 top-16
            sm:inset-x-auto sm:top-auto
            sm:bottom-8 sm:right-8
            w-auto sm:w-[400px]
            h-auto sm:h-[650px]
            max-h-[calc(100vh-5rem)] sm:max-h-[650px]
            bg-slate-950/90
            backdrop-blur-2xl
            border border-cyan-500/20
            rounded-3xl
            shadow-2xl shadow-cyan-500/20
            flex flex-col
            overflow-hidden
            z-50
            animate-fade-slide-in
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-cyan-500/15 via-slate-900/40 to-slate-900/40 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/40">
                <Sparkles className="text-white" size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  Healthcare AI Assistant
                </h2>
                <p className="text-emerald-400 text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleClear}
                title="Clear Conversation"
                className="p-2 rounded-lg text-slate-400 hover:text-red-300 hover:bg-white/5 transition-colors"
              >
                <Trash2 size={17} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-4 space-y-4 bg-gradient-to-b from-slate-950 to-slate-900 min-h-0">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isRegenerating={regeneratingId === msg.id}
                copied={copiedId === msg.id}
                onCopy={handleCopy}
                onRegenerate={handleRegenerate}
              />
            ))}

            {loading && (
              <div className="flex justify-start animate-fade-slide-in">
                <div className="bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
                  <ThinkingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-3 sm:px-4 pt-3 pb-2 border-t border-white/10 bg-slate-900/60 shrink-0">
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map(({ text, icon: Icon }) => (
                <button
                  key={text}
                  onClick={() => askAI(text)}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 text-[11px] sm:text-xs bg-slate-800/70 hover:bg-cyan-500 hover:text-white text-cyan-300 px-3 py-1.5 rounded-full border border-white/5 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  <Icon size={13} />
                  {text}
                </button>
              ))}
            </div>
          </div>

          {/* Input Section */}
          <div className="border-t border-white/10 bg-slate-900/60 p-3 sm:p-4 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                value={question}
                onChange={handleQuestionChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about doctors, hospitals, follow-ups..."
                className="flex-1 min-w-0 resize-none bg-slate-800/70 border border-slate-700 rounded-2xl px-4 py-2.5 sm:py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-colors overflow-y-auto"
                style={{ maxHeight: MAX_TEXTAREA_HEIGHT }}
              />
              <button
                onClick={() => askAI()}
                disabled={isBusy || !question.trim()}
                className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-90 shadow-lg shadow-cyan-500/30"
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 size={19} className="text-white animate-spin" />
                ) : (
                  <Send size={19} className="text-white" />
                )}
              </button>
            </div>

            <p className="text-center text-slate-600 text-[10px] mt-2.5">
              Powered by LangGraph • Groq AI • FastAPI
            </p>
          </div>
        </div>
      )}
    </>
  );
}