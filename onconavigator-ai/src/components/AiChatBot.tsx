import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Trash2, 
  ArrowRight,
  ShieldAlert,
  User,
  ExternalLink
} from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
  timestamp: string;
}

const PRESET_QUESTIONS = [
  { text: "What are the USPSTF lung screening requirements?", category: "Lung" },
  { text: "How should I monitor moles using the ABCDE method?", category: "Skin" },
  { text: "Explain how chemotherapy differs from immunotherapy.", category: "Science" },
  { text: "What tests do doctors order for potential brain lesions?", category: "Brain" },
  { text: "How are elevated leukocytes interpreted on a CBC?", category: "Lab" }
];

export function AiChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: "Hello! I am your OncoNavigator Q&A Assistant. Ask me any educational or general questions regarding clinical cancer screening standards, oncology terminology, or lab/imaging guidelines. \n\n*Reminder: I am an educational resource, not a medical diagnostic engine. Please always consult standard board-certified oncologists or healthcare providers for diagnostic determinations.*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    setErrorText(null);
    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);

    try {
      // Reconstruct payload with history excluding initial message
      const historyPayload = messages
        .slice(1) // exclude first welcome greeting
        .map((msg) => ({
          role: msg.role,
          content: msg.content
        }));

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload
        })
      });

      if (!response.ok) {
        throw new Error("Chat assistant server is updating. Please try again.");
      }

      const data = await response.json();
      
      const botMessage: Message = {
        role: "model",
        content: data.text || "I was unable to retrieve a response at this moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error("Failed to query Gemini chat endpoint:", err);
      setErrorText("Our educational channel is busy. Please try sending your question again.");
    } finally {
      setIsSending(false);
    }
  };

  const clearChatHistory = () => {
    if (window.confirm("Are you sure you want to clear this Q&A conversation thread?")) {
      setMessages([
        {
          role: "model",
          content: "Hello! I am your OncoNavigator Q&A Assistant. Ask me any educational or general questions regarding clinical cancer screening standards, oncology terminology, or lab/imaging guidelines. \n\n*Reminder: I am an educational resource, not a medical diagnostic engine. Please always consult standard board-certified oncologists or healthcare providers for diagnostic determinations.*",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setErrorText(null);
    }
  };

  // Turn basic markdown formatting into simple paragraph splits
  const formatMsgContent = (text: string) => {
    return text.split("\n").map((line, lineIdx) => {
      let content = line;
      let isBullet = false;

      // Handle raw bullet formatting
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        content = line.replace(/^[\-*]\s+/, "");
        isBullet = true;
      }

      // Handle basic inline bold markers **bold**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(
          <strong key={match.index} className="font-semibold text-slate-900">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const finalizedLine = parts.length > 0 ? parts : content;

      if (isBullet) {
        return (
          <li key={lineIdx} className="ml-5 list-disc text-xs leading-relaxed text-slate-700 my-1">
            {lineIdx === 0 && line.trim() === "" ? <br /> : finalizedLine}
          </li>
        );
      } else {
        return (
          <p key={lineIdx} className="text-xs leading-relaxed text-slate-700 min-h-[0.5rem]">
            {finalizedLine}
          </p>
        );
      }
    });
  };

  return (
    <div id="qa-chatbot-container" className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs max-w-2xl mx-auto flex flex-col h-[580px] font-sans">
      
      {/* Bot Chat Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white text-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-serif text-sm font-bold">
            O
          </div>
          <div>
            <h3 className="text-sm font-serif italic text-slate-900 font-semibold flex items-center gap-1.5">
              Educational Q&A Assistant
              <Sparkles className="h-3 w-3 text-amber-500" />
            </h3>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 block leading-tight font-mono">Powered by Gemini 3.5</span>
          </div>
        </div>
        
        {messages.length > 1 && (
          <button 
            id="clear-chat-btn"
            onClick={clearChatHistory}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition cursor-pointer"
            title="Clear Chat Conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Safety Notice Banner */}
      <div id="safety-notice-banner" className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-start gap-2 text-[10px] text-slate-500 shrink-0">
        <ShieldAlert className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Notice:</strong> This assistant is an informational simulator. Answers are general oncology clinical guidelines and not diagnostic assessments.
        </p>
      </div>

      {/* Messages Feed Viewport */}
      <div id="chat-messages-viewport" className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF9F6]/30">
        
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar block */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
              msg.role === "user" 
                ? "bg-slate-100 text-slate-600 border-slate-200" 
                : "bg-blue-50 text-blue-600 border-blue-100 font-serif text-xs font-bold"
            }`}>
              {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : "O"}
            </div>

            {/* Bubble block */}
            <div className={`max-w-[80%] rounded-2xl p-3.5 space-y-1.5 text-left border ${
              msg.role === "user"
                ? "bg-slate-900 border-slate-950 text-white rounded-tr-none shadow-2xs"
                : "bg-white border-slate-100 text-slate-800 rounded-tl-none"
            }`}>
              
              {/* Message Content formatted */}
              <div className={`space-y-1.5 ${msg.role === "user" ? "text-slate-100" : "text-slate-850"}`}>
                {msg.role === "user" ? (
                  <p className="text-xs leading-relaxed">{msg.content}</p>
                ) : (
                  formatMsgContent(msg.content)
                )}
              </div>

              {/* Timestamp block */}
              <span className={`block text-[9px] text-right mt-1 ${
                msg.role === "user" ? "text-slate-400" : "text-slate-400"
              }`}>
                {msg.timestamp}
              </span>

            </div>
          </div>
        ))}

        {/* Loading placeholder block */}
        {isSending && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-serif text-xs font-bold shrink-0">
              O
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3.5 space-y-1 max-w-[80%]">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[9px] text-slate-400 font-mono italic block">Formulating guidelines...</span>
            </div>
          </div>
        )}

        {errorText && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs text-center max-w-sm mx-auto">
            {errorText}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset guidelines questions footer rail */}
      {messages.length === 1 && (
        <div id="preset-questions-rail" className="p-3 bg-slate-50 border-t border-slate-100 shrink-0 space-y-1.5 text-left">
          <span className="block text-[9px] font-bold text-slate-405 uppercase tracking-wider">
            Explore Oncology Guidelines Terminology
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUESTIONS.map((question, qIdx) => (
              <button
                key={qIdx}
                onClick={() => handleSendMessage(question.text)}
                type="button"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-full text-[10px] text-slate-650 transition cursor-pointer"
              >
                <span>{question.text}</span>
                <span className="text-[8px] uppercase tracking-wider bg-blue-50 text-blue-600 font-mono px-1 rounded border border-blue-100/60 font-semibold">{question.category}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message input block */}
      <form 
        id="chat-message-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
        className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
      >
        <input 
          id="chat-input-field"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about clinical guidelines, ABCDE signs, or cancer terminology..."
          className="flex-1 text-xs p-3 bg-slate-50 border border-slate-200/70 rounded-full focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 transition placeholder-slate-400 text-slate-800"
          disabled={isSending}
        />
        <button 
          id="chat-send-btn"
          type="submit"
          disabled={!inputValue.trim() || isSending}
          className={`p-3 rounded-full flex items-center justify-center transition border ${
            inputValue.trim() && !isSending
              ? "bg-slate-900 border-slate-950 text-white hover:bg-slate-800 shadow-2xs hover:shadow-sm"
              : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>

    </div>
  );
}
