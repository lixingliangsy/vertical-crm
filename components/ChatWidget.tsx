"use client";

import { useEffect, useRef, useState } from "react";

interface Citation {
  id: string;
  title: string;
  source: string;
}
interface ChatMsg {
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
  escalated?: boolean;
}

interface ChatWidgetProps {
  embed?: boolean;
  
  productName?: string;
  
  title?: string;
  
  greeting?: string;
  
  sessionKeyPrefix?: string;
  
  brandColor?: string;
}

const DEFAULT_BRAND = "#2563EB";
const DEFAULT_ORANGE = "#EA580C";

export default function ChatWidget({
  embed = false,
  productName = "Support",
  title,
  greeting,
  sessionKeyPrefix = "support",
  brandColor = DEFAULT_BRAND,
}: ChatWidgetProps) {
  const headerTitle = title || `${productName} AI Assistant`;
  const defaultGreeting = `Hi, I'm ${productName}'s AI assistant. Ask me about the product, pricing, payments, your account, or the market-access scan — and type "human" if you'd like to talk to a person.`;
  const SESSION_KEY = `${sessionKeyPrefix}_chat_session`;

  const [open, setOpen] = useState(embed);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: greeting || defaultGreeting,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sid = "";
    try {
      sid = localStorage.getItem(SESSION_KEY) || "";
    } catch {}
    if (!sid) {
      sid = "c_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      try {
        localStorage.setItem(SESSION_KEY, sid);
      } catch {}
    }
    setSessionId(sid);
  }, [SESSION_KEY]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: ChatMsg = { role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      const data = await res.json();
      if (data?.sessionId) {
        setSessionId(data.sessionId);
        try {
          localStorage.setItem(SESSION_KEY, data.sessionId);
        } catch {}
      }
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: `(Service temporarily unavailable (${data?.code || res.status}). Please try again later, or type "human" to reach a person.)` },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: data.answer || "(No response)",
            citations: data.citations || [],
            escalated: !!data.escalated,
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "(Network error) Check your connection, or type \"human\" to reach a person." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const panel = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: embed ? "100%" : 360,
        height: embed ? "100%" : 520,
        maxHeight: embed ? "100%" : "80vh",
        background: "#fff",
        borderRadius: embed ? 0 : 12,
        boxShadow: embed ? "none" : "0 12px 40px rgba(15,23,42,.18)",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <div
        style={{
          background: brandColor,
          color: "#fff",
          padding: "12px 16px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 99, background: "#34d399" }} />
        {headerTitle}
        {!embed && (
          <button
            onClick={() => setOpen(false)}
            style={{ marginLeft: "auto", background: "transparent", border: 0, color: "#fff", fontSize: 18, cursor: "pointer", lineHeight: 1 }}
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, background: "#f8fafc" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div
              style={{
                maxWidth: "82%",
                background: m.role === "user" ? brandColor : "#fff",
                color: m.role === "user" ? "#fff" : "#0f172a",
                border: m.role === "user" ? "none" : "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "8px 12px",
                fontSize: 14,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
              {m.citations && m.citations.length > 0 && (
                <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {m.citations.map((c) => (
                    <span
                      key={c.id}
                      title={c.source}
                      style={{ fontSize: 11, background: "#eef2ff", color: brandColor, borderRadius: 6, padding: "2px 6px" }}
                    >
                      {c.title}
                    </span>
                  ))}
                </div>
              )}
              {m.escalated && (
                <div style={{ marginTop: 6, fontSize: 12, color: DEFAULT_ORANGE }}>
                  ⚠️ We've connected you with a human agent. We'll follow up by email.
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 13, color: "#64748b" }}>Assistant is typing…</div>}
      </div>

      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #e2e8f0", background: "#fff" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          placeholder="Type your question… (Enter to send)"
          style={{ flex: 1, resize: "none", border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px", fontSize: 14, fontFamily: "inherit" }}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{ background: DEFAULT_ORANGE, color: "#fff", border: 0, borderRadius: 8, padding: "0 16px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
        >
          Send
        </button>
      </div>
    </div>
  );

  if (embed) return <div style={{ width: "100%", height: "100%" }}>{panel}</div>;

  return (
    <>
      {open && (
        <div style={{ position: "fixed", right: 20, bottom: 88, zIndex: 9999 }}>{panel}</div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI assistant"
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: brandColor,
          color: "#fff",
          border: 0,
          fontSize: 24,
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(37,99,235,.4)",
        }}
      >
        💬
      </button>
    </>
  );
}
