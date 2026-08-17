import {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
} from "react";

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
  Paperclip,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

import api from "../api/api";

/* ================================================================
   QUICK SUGGESTIONS
================================================================ */

const QUICK_SUGGESTIONS = [
  {
    text: "Show all doctors",
    icon: Stethoscope,
  },
  {
    text: "Pending follow-ups",
    icon: CalendarCheck,
  },
  {
    text: "Today's interactions",
    icon: ClipboardList,
  },
  {
    text: "Summarize CRM",
    icon: Sparkles,
  },
  {
    text: "Cardiologists",
    icon: Bot,
  },
  {
    text: "Hospital details",
    icon: Hospital,
  },
];

/* ================================================================
   WELCOME MESSAGE
================================================================ */

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
- 📄 Uploaded Reports & Documents
- 🩻 AI-assisted image analysis

Ask me anything about your CRM database or upload up to 3 reports/images for analysis.`,
  displayed: null,
  streaming: false,
  time: new Date(),
};

/* ================================================================
   CONSTANTS
================================================================ */

const MAX_FILES = 3;
const MAX_TEXTAREA_HEIGHT = 120;

let idCounter = 1;

const nextId = () =>
  `m_${Date.now()}_${idCounter++}`;

/* ================================================================
   TIME
================================================================ */

function formatTime(date) {
  try {
    return new Date(date).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  } catch {
    return "";
  }
}

/* ================================================================
   CODE BLOCK
================================================================ */

const CodeBlock = memo(function CodeBlock({
  language,
  code,
}) {
  const [copied, setCopied] =
    useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        code
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="my-2 w-full max-w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950/80">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-3 py-1.5">
        <span className="min-w-0 truncate text-[10px] uppercase tracking-wide text-slate-400">
          {language || "code"}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1 text-[11px] text-slate-400 transition-colors hover:text-cyan-300"
        >
          {copied ? (
            <>
              <Check
                size={12}
                className="text-emerald-400"
              />
              <span className="text-emerald-400">
                Copied!
              </span>
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>

      <pre className="max-w-full overflow-x-auto p-3 text-xs leading-relaxed text-cyan-100 sm:text-[13px]">
        <code>{code}</code>
      </pre>
    </div>
  );
});

/* ================================================================
   MARKDOWN
================================================================ */

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-2 text-lg font-bold text-white">
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2 className="mb-2 mt-2 text-base font-bold text-white">
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-2 text-sm font-bold text-white">
      {children}
    </h3>
  ),

  p: ({ children }) => (
    <p className="mb-2 break-words leading-relaxed last:mb-0">
      {children}
    </p>
  ),

  strong: ({ children }) => (
    <strong className="font-semibold text-white">
      {children}
    </strong>
  ),

  em: ({ children }) => (
    <em className="italic text-slate-200">
      {children}
    </em>
  ),

  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5">
      {children}
    </ul>
  ),

  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5">
      {children}
    </ol>
  ),

  li: ({ children }) => (
    <li className="break-words leading-relaxed">
      {children}
    </li>
  ),

  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="break-all text-cyan-400 underline decoration-cyan-400/40 underline-offset-2 hover:text-cyan-300"
    >
      {children}
    </a>
  ),

  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-cyan-500/50 pl-3 italic text-slate-300">
      {children}
    </blockquote>
  ),

  table: ({ children }) => (
    <div className="my-3 w-full max-w-full overflow-x-auto rounded-lg border border-white/10">
      <table className="w-max min-w-full border-collapse text-xs sm:text-sm">
        {children}
      </table>
    </div>
  ),

  thead: ({ children }) => (
    <thead className="bg-white/10 text-cyan-200">
      {children}
    </thead>
  ),

  tbody: ({ children }) => (
    <tbody>{children}</tbody>
  ),

  tr: ({ children }) => (
    <tr className="border-b border-white/5 last:border-b-0">
      {children}
    </tr>
  ),

  th: ({ children }) => (
    <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="max-w-[280px] break-words px-3 py-2 align-top">
      {children}
    </td>
  ),

  hr: () => (
    <hr className="my-3 border-white/10" />
  ),

  code({
    className,
    children,
  }) {
    const match =
      /language-(\w+)/.exec(
        className || ""
      );

    const raw = String(children).replace(
      /\n$/,
      ""
    );

    if (match) {
      return (
        <CodeBlock
          language={match[1]}
          code={raw}
        />
      );
    }

    return (
      <code className="break-words rounded bg-slate-700/60 px-1.5 py-0.5 text-[0.85em] text-cyan-300">
        {raw}
      </code>
    );
  },

  pre({ children }) {
    return <>{children}</>;
  },
};

/* ================================================================
   THINKING
================================================================ */

function ThinkingDots() {
  return (
    <div className="flex items-center gap-2">
      <Bot
        size={16}
        className="shrink-0 text-cyan-400"
      />

      <span className="text-sm text-cyan-300">
        AI is thinking
      </span>

      <span className="flex items-center gap-1">
        <span
          className="thinking-dot h-1.5 w-1.5 rounded-full bg-cyan-400"
          style={{
            animationDelay: "0ms",
          }}
        />

        <span
          className="thinking-dot h-1.5 w-1.5 rounded-full bg-cyan-400"
          style={{
            animationDelay: "150ms",
          }}
        />

        <span
          className="thinking-dot h-1.5 w-1.5 rounded-full bg-cyan-400"
          style={{
            animationDelay: "300ms",
          }}
        />
      </span>
    </div>
  );
}

/* ================================================================
   MESSAGE BUBBLE
================================================================ */

const MessageBubble = memo(
  function MessageBubble({
    msg,
    isRegenerating,
    onCopy,
    onRegenerate,
    copied,
  }) {
    const isUser =
      msg.role === "user";

    const bodyText =
      msg.displayed !== null
        ? msg.displayed
        : msg.text;

    return (
      <div
        className={`flex w-full min-w-0 animate-fade-slide-in ${
          isUser
            ? "justify-end"
            : "justify-start"
        }`}
      >
        <div
          className={`flex min-w-0 max-w-[94%] flex-col sm:max-w-[88%] lg:max-w-[84%] ${
            isUser
              ? "items-end"
              : "items-start"
          }`}
        >
          <div
            className={`min-w-0 max-w-full overflow-hidden rounded-2xl px-3.5 py-3 shadow-lg backdrop-blur-xl sm:px-4 ${
              isUser
                ? "rounded-br-md border border-cyan-300/30 bg-gradient-to-br from-cyan-500/90 to-blue-500/90 text-white shadow-cyan-500/20"
                : "rounded-bl-md border border-white/10 bg-slate-800/60 text-slate-100 shadow-black/20"
            }`}
          >
            {isRegenerating ? (
              <ThinkingDots />
            ) : isUser ? (
              <p className="break-words whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </p>
            ) : (
              <div className="prose prose-invert min-w-0 max-w-none break-words text-sm">
                <ReactMarkdown
                  remarkPlugins={[
                    remarkGfm,
                  ]}
                  components={
                    markdownComponents
                  }
                >
                  {bodyText}
                </ReactMarkdown>

                {msg.streaming && (
                  <span className="typing-cursor ml-0.5 inline-block h-4 w-[2px] align-middle bg-cyan-300" />
                )}
              </div>
            )}
          </div>

          <div
            className={`mt-1 flex items-center gap-3 px-1 text-[11px] text-slate-500 ${
              isUser
                ? "flex-row-reverse"
                : "flex-row"
            }`}
          >
            <span>
              {formatTime(
                msg.time
              )}
            </span>

            {!isUser &&
              msg.id !==
                "welcome" &&
              !msg.streaming &&
              !isRegenerating && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onCopy(
                        msg.id,
                        msg.text
                      )
                    }
                    className="flex items-center gap-1 transition-colors hover:text-cyan-300"
                  >
                    {copied ? (
                      <>
                        <Check
                          size={12}
                          className="text-emerald-400"
                        />
                        <span className="text-emerald-400">
                          Copied!
                        </span>
                      </>
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onRegenerate(
                        msg.id
                      )
                    }
                    className="flex items-center gap-1 transition-colors hover:text-cyan-300"
                    title="Regenerate response"
                  >
                    <RotateCcw
                      size={12}
                    />
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }
);

/* ================================================================
   DOCUMENT PREVIEW CARD
================================================================ */

function DocumentCard({
  document,
  onRemove,
  disabled,
}) {
  const isImage =
    document.file_type ===
    "image";

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-2 sm:px-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15">
        {isImage ? (
          <ImageIcon
            size={16}
            className="text-cyan-300"
          />
        ) : (
          <FileText
            size={16}
            className="text-cyan-300"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-white">
          {document.name}
        </p>

        <p className="text-[10px] text-emerald-400">
          {isImage
            ? "Image ready for AI"
            : "Document ready for AI"}
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          onRemove(document.id)
        }
        disabled={disabled}
        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
        title="Remove document"
      >
        <X size={15} />
      </button>
    </div>
  );
}

/* ================================================================
   MAIN CHAT
================================================================ */

export default function ChatInterface() {
  const [isOpen, setIsOpen] =
    useState(false);

  const [question, setQuestion] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [messages, setMessages] =
    useState([
      WELCOME_MESSAGE,
    ]);

  const [copiedId, setCopiedId] =
    useState(null);

  const [
    regeneratingId,
    setRegeneratingId,
  ] = useState(null);

  /* ---------------------------------------------------------------
     MULTIPLE DOCUMENTS
  --------------------------------------------------------------- */

  const [documents, setDocuments] =
    useState([]);

  const [
    documentUploading,
    setDocumentUploading,
  ] = useState(false);

  const [
    documentError,
    setDocumentError,
  ] = useState(null);

  /* ---------------------------------------------------------------
     REFS
  --------------------------------------------------------------- */

  const messagesEndRef =
    useRef(null);

  const textareaRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  const intervalsRef =
    useRef(new Set());

  /* ================================================================
     AUTO SCROLL
  ================================================================ */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
        block: "nearest",
      }
    );
  }, [messages, loading]);

  /* ================================================================
     CLEANUP
  ================================================================ */

  useEffect(() => {
    const intervals =
      intervalsRef.current;

    return () => {
      intervals.forEach(
        (id) =>
          clearInterval(id)
      );

      intervals.clear();
    };
  }, []);

  /* ================================================================
     STREAM
  ================================================================ */

  const streamInto = useCallback(
    (id, fullText) => {
      const tokens =
        fullText.split(
          /(\s+)/
        );

      const speed =
        tokens.length > 220
          ? 4
          : tokens.length > 90
          ? 2
          : 1;

      let i = 0;

      const interval =
        setInterval(() => {
          i += speed;

          const chunk =
            tokens
              .slice(0, i)
              .join("");

          setMessages(
            (prev) =>
              prev.map((m) =>
                m.id === id
                  ? {
                      ...m,
                      displayed:
                        chunk,
                    }
                  : m
              )
          );

          if (
            i >=
            tokens.length
          ) {
            clearInterval(
              interval
            );

            intervalsRef.current.delete(
              interval
            );

            setMessages(
              (prev) =>
                prev.map((m) =>
                  m.id === id
                    ? {
                        ...m,
                        displayed:
                          fullText,
                        streaming:
                          false,
                      }
                    : m
                )
            );
          }
        }, 22);

      intervalsRef.current.add(
        interval
      );
    },
    []
  );

  /* ================================================================
     TEXTAREA
  ================================================================ */

  const handleQuestionChange =
    (e) => {
      setQuestion(
        e.target.value
      );

      const el =
        textareaRef.current;

      if (el) {
        el.style.height =
          "auto";

        el.style.height = `${Math.min(
          el.scrollHeight,
          MAX_TEXTAREA_HEIGHT
        )}px`;
      }
    };

  const resetTextareaHeight =
    () => {
      const el =
        textareaRef.current;

      if (el) {
        el.style.height =
          "auto";
      }
    };

  /* ================================================================
     BUSY
  ================================================================ */

  const isBusy =
    loading ||
    documentUploading ||
    messages.some(
      (m) => m.streaming
    ) ||
    !!regeneratingId;

  /* ================================================================
     UPLOAD DOCUMENTS
  ================================================================ */

  const handleDocumentUpload =
    async (e) => {
      const selectedFiles =
        Array.from(
          e.target.files || []
        );

      if (
        selectedFiles.length ===
        0
      ) {
        return;
      }

      setDocumentError(
        null
      );

      const allowedTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
      ];

      /* -----------------------------------------------------------
         Validate count
      ----------------------------------------------------------- */

      if (
        documents.length +
          selectedFiles.length >
        MAX_FILES
      ) {
        setDocumentError(
          `You can have a maximum of ${MAX_FILES} files attached at once.`
        );

        e.target.value = "";

        return;
      }

      /* -----------------------------------------------------------
         Validate types
      ----------------------------------------------------------- */

      const invalidFile =
        selectedFiles.find(
          (file) =>
            !allowedTypes.includes(
              file.type
            )
        );

      if (invalidFile) {
        setDocumentError(
          `"${invalidFile.name}" is not a supported file. Please use PDF, JPG, JPEG, or PNG.`
        );

        e.target.value = "";

        return;
      }

      /* -----------------------------------------------------------
         Upload
      ----------------------------------------------------------- */

      try {
        setDocumentUploading(
          true
        );

        const formData =
          new FormData();

        /*
         IMPORTANT:
         Backend expects the field name "files"
         because ai_routes.py now uses:

         files: list[UploadFile] = File(...)
        */

        selectedFiles.forEach(
          (file) => {
            formData.append(
              "files",
              file
            );
          }
        );

        const res =
          await api.post(
            "/ai/upload-document",
            formData
          );

        const data =
          res?.data;

        if (!data?.success) {
          throw new Error(
            "Document processing failed."
          );
        }

        /* ---------------------------------------------------------
           Build document cards
        --------------------------------------------------------- */

        const processedDocuments =
          data.documents || [];

        const newDocuments =
          processedDocuments.map(
            (
              item,
              index
            ) => ({
              id: `${Date.now()}_${index}_${Math.random()}`,

              name:
                item.filename ||
                selectedFiles[
                  index
                ]?.name ||
                `Document ${index + 1}`,

              file_type:
                item.file_type,

              text:
                item.text ||
                null,

              images:
                item.images ||
                [],
            })
          );

        setDocuments(
          (prev) => [
            ...prev,
            ...newDocuments,
          ]
        );
      } catch (error) {
        console.error(
          "Document upload failed:",
          error
        );

        const detail =
          error?.response
            ?.data?.detail;

        setDocumentError(
          detail ||
            "Unable to process the uploaded files. Please try again."
        );
      } finally {
        setDocumentUploading(
          false
        );

        e.target.value = "";
      }
    };

  /* ================================================================
     REMOVE SINGLE DOCUMENT
  ================================================================ */

  const removeDocument =
    (documentId) => {
      setDocuments(
        (prev) =>
          prev.filter(
            (doc) =>
              doc.id !==
              documentId
          )
      );

      setDocumentError(
        null
      );
    };

  /* ================================================================
     BUILD CHAT PAYLOAD
  ================================================================ */

  const buildChatPayload =
    (message) => {
      const payload = {
        message,
      };

      /* -----------------------------------------------------------
         Combine PDF text
      ----------------------------------------------------------- */

      const textDocuments =
        documents.filter(
          (doc) =>
            doc.text
        );

      if (
        textDocuments.length >
        0
      ) {
        payload.document_context =
          textDocuments
            .map(
              (doc) =>
                `===== ${doc.name} =====\n${doc.text}`
            )
            .join(
              "\n\n"
            );

        payload.document_name =
          textDocuments
            .map(
              (doc) =>
                doc.name
            )
            .join(", ");
      }

      /* -----------------------------------------------------------
         Collect actual image data
      ----------------------------------------------------------- */

      const images =
        documents.flatMap(
          (doc) =>
            doc.images || []
        );

      if (
        images.length >
        0
      ) {
        payload.document_images =
          images
            .slice(
              0,
              3
            )
            .map(
              (image) => ({
                name:
                  image.name,

                mime_type:
                  image.mime_type,

                data:
                  image.data,
              })
            );
      }

      return payload;
    };

  /* ================================================================
     ASK AI
  ================================================================ */

  const askAI = async (
    customQuestion = null
  ) => {
    const query = (
      customQuestion ??
      question
    ).trim();
    if (documents.length > 1) {
  setDocumentError(
    "For reliable AI analysis, please analyze one PDF or image at a time. Remove the other files and try again."
  );
  return;
}

    if (
      !query ||
      isBusy
    ) {
      return;
    }

    const userMsg = {
      id: nextId(),
      role: "user",
      text: query,
      time: new Date(),
    };

    setMessages(
      (prev) => [
        ...prev,
        userMsg,
      ]
    );

    if (!customQuestion) {
      setQuestion("");

      resetTextareaHeight();
    }

    setLoading(true);

    try {
      const chatPayload =
        buildChatPayload(
          query
        );

      const res =
        await api.post(
          "/ai/chat",
          chatPayload
        );

      const responseText =
        res?.data?.response ??
        "I didn't get a response for that. Please try again.";

      const assistantId =
        nextId();

      setMessages(
        (prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            text: responseText,
            displayed: "",
            streaming: true,
            time: new Date(),
          },
        ]
      );

      setLoading(false);

      streamInto(
        assistantId,
        responseText
      );
    } catch (error) {
      console.error(
        "AI chat failed:",
        error
      );

      setLoading(false);

      setMessages(
        (prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            text:
              error?.response
                ?.data
                ?.detail ||
              "Sorry, I'm unable to connect to the AI service right now.",
            displayed: null,
            streaming: false,
            time: new Date(),
          },
        ]
      );
    }
  };

  /* ================================================================
     KEYBOARD
  ================================================================ */

  const handleKeyDown =
    (e) => {
      if (
        e.key ===
          "Enter" &&
        !e.shiftKey
      ) {
        e.preventDefault();

        askAI();
      }
    };

  /* ================================================================
     COPY
  ================================================================ */

  const handleCopy =
    async (
      id,
      text
    ) => {
      try {
        await navigator.clipboard.writeText(
          text
        );

        setCopiedId(id);

        setTimeout(() => {
          setCopiedId(
            (current) =>
              current === id
                ? null
                : current
          );
        }, 2000);
      } catch {
        // Clipboard unavailable
      }
    };

  /* ================================================================
     REGENERATE
  ================================================================ */

  const handleRegenerate =
    async (
      assistantId
    ) => {
      if (isBusy)
        return;

      const idx =
        messages.findIndex(
          (m) =>
            m.id ===
            assistantId
        );

      if (idx === -1)
        return;

      let userText =
        null;

      for (
        let i = idx - 1;
        i >= 0;
        i--
      ) {
        if (
          messages[i]
            .role ===
          "user"
        ) {
          userText =
            messages[i]
              .text;

          break;
        }
      }

      if (!userText)
        return;

      setRegeneratingId(
        assistantId
      );

      try {
        const chatPayload =
          buildChatPayload(
            userText
          );

        const res =
          await api.post(
            "/ai/chat",
            chatPayload
          );

        const responseText =
          res?.data?.response ??
          "I didn't get a response for that. Please try again.";

        setMessages(
          (prev) =>
            prev.map((m) =>
              m.id ===
              assistantId
                ? {
                    ...m,
                    text: responseText,
                    displayed: "",
                    streaming: true,
                    time: new Date(),
                  }
                : m
            )
        );

        setRegeneratingId(
          null
        );

        streamInto(
          assistantId,
          responseText
        );
      } catch (error) {
        console.error(
          "Regenerate failed:",
          error
        );

        setRegeneratingId(
          null
        );

        setMessages(
          (prev) =>
            prev.map((m) =>
              m.id ===
              assistantId
                ? {
                    ...m,
                    text:
                      "Sorry, I'm unable to connect to the AI service right now.",
                    displayed:
                      null,
                    streaming:
                      false,
                    time: new Date(),
                  }
                : m
            )
        );
      }
    };

  /* ================================================================
     CLEAR
  ================================================================ */

  const handleClear =
    () => {
      setMessages([
        WELCOME_MESSAGE,
      ]);

      setCopiedId(null);

      setRegeneratingId(
        null
      );

      setDocuments([]);

      setDocumentError(
        null
      );

      setQuestion("");

      resetTextareaHeight();

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    };

  /* ================================================================
     RENDER
  ================================================================ */

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blinkCursor {
          0%, 50% {
            opacity: 1;
          }

          51%, 100% {
            opacity: 0;
          }
        }

        @keyframes bounceDot {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }

          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fade-slide-in {
          animation: fadeSlideIn 0.35s ease-out both;
        }

        .typing-cursor {
          animation: blinkCursor 0.9s step-start infinite;
        }

        .thinking-dot {
          animation: bounceDot 1.3s infinite ease-in-out;
        }

        .chat-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(34, 211, 238, 0.25) transparent;
        }

        .chat-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .chat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.25);
          border-radius: 999px;
        }

        .chat-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.45);
        }

        .quick-prompts-scroll {
          scrollbar-width: none;
        }

        .quick-prompts-scroll::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 640px) {
          .chat-input-textarea {
            font-size: 16px !important;
          }
        }

        @media (max-width: 480px) {
          .chat-window {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>

      {/* ============================================================
          FLOATING BUTTON
      ============================================================ */}

      {!isOpen && (
        <button
          type="button"
          onClick={() =>
            setIsOpen(true)
          }
          className="
            fixed
            bottom-5
            right-5
            z-[9999]

            flex
            h-16
            w-16

            items-center
            justify-center

            rounded-full

            bg-gradient-to-br
            from-cyan-400
            to-blue-500

            shadow-2xl
            shadow-cyan-500/50

            transition-all
            duration-300

            hover:scale-110
            hover:shadow-cyan-400/60

            active:scale-95
          "
          style={{
            marginBottom:
              "env(safe-area-inset-bottom)",
          }}
          aria-label="Open AI assistant"
        >
          <Bot
            size={30}
            className="text-white"
          />
        </button>
      )}

      {/* ============================================================
          CHAT WINDOW
      ============================================================ */}

      {isOpen && (
        <div
          className="
            chat-window

            fixed
            z-[9999]

            top-14
            right-2
            bottom-2
            left-2

            w-[calc(100vw-1rem)]
            max-w-[430px]
            max-h-[calc(100dvh-1rem)]

            flex
            min-h-0
            min-w-0
            flex-col

            overflow-hidden

            rounded-2xl
            sm:rounded-3xl

            border
            border-cyan-500/20

            bg-slate-950/95
            backdrop-blur-2xl

            shadow-2xl
            shadow-cyan-500/20

            animate-fade-slide-in

            sm:inset-x-auto
            sm:top-auto
            sm:bottom-6
            sm:right-6

            sm:h-[min(700px,calc(100dvh-48px))]
            sm:w-[410px]

            lg:right-8
            lg:bottom-8
            lg:w-[430px]
          "
          style={{
            marginBottom:
              "env(safe-area-inset-bottom)",
          }}
        >
          {/* ======================================================
              HEADER
          ====================================================== */}

          <div
            className="
              flex
              shrink-0
              items-center
              justify-between
              gap-2

              border-b
              border-white/10

              bg-gradient-to-r
              from-cyan-500/15
              via-slate-900/40
              to-slate-900/40

              px-3
              py-3

              sm:px-5
              sm:py-3.5
            "
          >
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-gradient-to-br
                  from-cyan-400
                  to-blue-500
                  shadow-lg
                  shadow-cyan-500/40

                  sm:h-10
                  sm:w-10
                "
              >
                <Sparkles
                  className="text-white"
                  size={18}
                />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-white sm:text-base">
                  Healthcare AI Assistant
                </h2>

                <p className="flex items-center gap-1 text-[10px] text-emerald-400 sm:text-[11px]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={
                  handleClear
                }
                title="Clear Conversation"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-red-300"
              >
                <Trash2
                  size={17}
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  setIsOpen(
                    false
                  )
                }
                title="Close"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* ======================================================
              MESSAGE AREA
          ====================================================== */}

          <div
            className="
              chat-scroll

              flex-1
              min-h-0
              min-w-0

              overflow-x-hidden
              overflow-y-auto

              bg-gradient-to-b
              from-slate-950
              to-slate-900

              px-2.5
              py-3

              sm:px-4
              sm:py-4
            "
          >
            <div className="flex min-w-0 flex-col gap-3.5 sm:gap-4">
              {messages.map(
                (msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isRegenerating={
                      regeneratingId ===
                      msg.id
                    }
                    copied={
                      copiedId ===
                      msg.id
                    }
                    onCopy={
                      handleCopy
                    }
                    onRegenerate={
                      handleRegenerate
                    }
                  />
                )
              )}

              {loading && (
                <div className="flex animate-fade-slide-in justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-white/10 bg-slate-800/60 px-4 py-3 shadow-lg backdrop-blur-xl">
                    <ThinkingDots />
                  </div>
                </div>
              )}

              <div
                ref={
                  messagesEndRef
                }
              />
            </div>
          </div>

          {/* ======================================================
              QUICK PROMPTS
          ====================================================== */}

          <div
            className="
              shrink-0
              border-t
              border-white/10
              bg-slate-900/80

              px-3
              pb-2
              pt-2.5

              sm:px-4
              sm:pt-3
            "
          >
            <div
              className="
                quick-prompts-scroll
                flex
                gap-2
                overflow-x-auto
                overscroll-x-contain
                pb-0.5

                sm:flex-wrap
                sm:overflow-x-visible
              "
            >
              {QUICK_SUGGESTIONS.map(
                ({
                  text,
                  icon: Icon,
                }) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() =>
                      askAI(text)
                    }
                    disabled={
                      isBusy
                    }
                    className="
                      flex
                      shrink-0
                      items-center
                      gap-1.5

                      whitespace-nowrap

                      rounded-full
                      border
                      border-white/5

                      bg-slate-800/70

                      px-3
                      py-1.5

                      text-[11px]
                      text-cyan-300

                      transition-all
                      duration-300

                      hover:scale-[1.03]
                      hover:bg-cyan-500
                      hover:text-white

                      active:scale-95

                      disabled:cursor-not-allowed
                      disabled:opacity-40
                      disabled:hover:scale-100

                      sm:text-xs
                    "
                  >
                    <Icon
                      size={13}
                    />

                    {text}
                  </button>
                )
              )}
            </div>
          </div>

          {/* ======================================================
              INPUT
          ====================================================== */}

          <div
            className="
              shrink-0
              border-t
              border-white/10
              bg-slate-900/90

              px-2.5
              pb-2.5
              pt-2

              sm:px-4
              sm:pb-4
              sm:pt-3
            "
          >
            {/* Hidden input */}

            <input
              ref={
                fileInputRef
              }
              type="file"
              multiple
              accept="
                .pdf,
                .png,
                .jpg,
                .jpeg,
                application/pdf,
                image/png,
                image/jpeg
              "
              onChange={
                handleDocumentUpload
              }
              className="hidden"
            />

            {/* ====================================================
                DOCUMENT LIST
            ==================================================== */}

            {documents.length >
              0 && (
              <div className="mb-2 max-h-28 space-y-1.5 overflow-y-auto">
                {documents.map(
                  (document) => (
                    <DocumentCard
                      key={
                        document.id
                      }
                      document={
                        document
                      }
                      onRemove={
                        removeDocument
                      }
                      disabled={
                        isBusy
                      }
                    />
                  )
                )}
              </div>
            )}

            {/* ====================================================
                ADDITIONAL FILES
            ==================================================== */}

            {documents.length <
              MAX_FILES && (
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {documents.length ===
                  0
                    ? "Attach up to 3 reports or images"
                    : `${documents.length}/${MAX_FILES} files attached`}
                </span>

                {documents.length >
                  0 && (
                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={
                      isBusy
                    }
                    className="text-[10px] font-medium text-cyan-400 transition-colors hover:text-cyan-300 disabled:opacity-40"
                  >
                    + Add another
                  </button>
                )}
              </div>
            )}

            {/* ====================================================
                UPLOAD LOADING
            ==================================================== */}

            {documentUploading && (
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2">
                <Loader2
                  size={15}
                  className="shrink-0 animate-spin text-cyan-400"
                />

                <span className="text-xs text-slate-300">
                  Processing uploaded files...
                </span>
              </div>
            )}

            {/* ====================================================
                ERROR
            ==================================================== */}

            {documentError && (
              <div className="mb-2 flex min-w-0 items-center justify-between gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2">
                <span className="min-w-0 break-words text-xs text-red-300">
                  {documentError}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setDocumentError(
                      null
                    )
                  }
                  className="shrink-0 text-red-300 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* ====================================================
                INPUT ROW
            ==================================================== */}

            <div className="flex min-w-0 items-end gap-1.5 sm:gap-2">
              {/* ATTACH */}

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  isBusy ||
                  documents.length >=
                    MAX_FILES
                }
                className="
                  flex
                  h-11
                  w-11
                  shrink-0

                  items-center
                  justify-center

                  rounded-2xl

                  border
                  border-slate-700

                  bg-slate-800/80

                  transition-all
                  duration-300

                  hover:scale-105
                  hover:border-cyan-400/50
                  hover:bg-cyan-500/10

                  active:scale-90

                  disabled:cursor-not-allowed
                  disabled:opacity-40

                  sm:h-12
                  sm:w-12
                "
                aria-label="Attach documents"
                title="Upload up to 3 PDFs or images"
              >
                <Paperclip
                  size={18}
                  className="text-cyan-300"
                />
              </button>

              {/* TEXTAREA */}

              <textarea
                ref={
                  textareaRef
                }
                rows={1}
                value={
                  question
                }
                onChange={
                  handleQuestionChange
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder={
                  documents.length >
                  0
                    ? "Ask about these files..."
                    : "Ask about doctors, hospitals, follow-ups..."
                }
                className="
                  chat-input-textarea

                  min-w-0
                  flex-1

                  resize-none

                  rounded-2xl

                  border
                  border-slate-700

                  bg-slate-800/70

                  px-3.5
                  py-2.5

                  text-sm
                  text-white

                  outline-none

                  placeholder:text-slate-500

                  transition-colors

                  focus:border-cyan-400
                  focus:ring-1
                  focus:ring-cyan-400/40

                  sm:px-4
                  sm:py-3
                "
                style={{
                  maxHeight:
                    MAX_TEXTAREA_HEIGHT,
                }}
              />

              {/* SEND */}

              <button
                type="button"
                onClick={() =>
                  askAI()
                }
                disabled={
                  isBusy ||
                  !question.trim()
                }
                className="
                  flex
                  h-11
                  w-11
                  shrink-0

                  items-center
                  justify-center

                  rounded-2xl

                  bg-gradient-to-br
                  from-cyan-400
                  to-blue-500

                  shadow-lg
                  shadow-cyan-500/30

                  transition-all
                  duration-300

                  hover:scale-105
                  hover:from-cyan-300
                  hover:to-blue-400

                  active:scale-90

                  disabled:cursor-not-allowed
                  disabled:opacity-40

                  sm:h-12
                  sm:w-12
                "
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2
                    size={19}
                    className="animate-spin text-white"
                  />
                ) : (
                  <Send
                    size={19}
                    className="text-white"
                  />
                )}
              </button>
            </div>

            <p className="mt-2 text-center text-[9px] text-slate-600 sm:mt-2.5 sm:text-[10px]">
              Powered by LangGraph • Groq AI • FastAPI
            </p>
          </div>
        </div>
      )}
    </>
  );
}