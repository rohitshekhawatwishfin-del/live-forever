"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, Heart, MessageCircle, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import styles from "./page.module.css";
import { ChatMessage, localConversationProvider } from "./chat-engine";

const CHAT_STORAGE_KEY = "live-forever-ai-memory-chat";
const EXAMPLE_PROMPTS = [
  "Kaise ho?",
  "Aaj aapse baat karne ka mann hua.",
  "Mujhe aapki yaad aa rahi hai.",
  "Mujhe koi purani baat sunao.",
];

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.text === "string" &&
    typeof message.createdAt === "string"
  );
}

function formatTime(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? ""
    : new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(parsed);
}

function createMessage(role: ChatMessage["role"], text: string): ChatMessage {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
    createdAt: new Date().toISOString(),
  };
}

export default function MemoryChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [storageError, setStorageError] = useState("");
  const endOfChatRef = useRef<HTMLDivElement>(null);
  const responseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const storedMessages = window.localStorage.getItem(CHAT_STORAGE_KEY);
      if (storedMessages) {
        const parsed: unknown = JSON.parse(storedMessages);
        if (Array.isArray(parsed)) setMessages(parsed.filter(isChatMessage));
      }
    } catch {
      setStorageError("Chat history could not be read from this browser.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, isTyping]);

  useEffect(() => () => {
    if (responseTimerRef.current !== null) window.clearTimeout(responseTimerRef.current);
  }, []);

  function sendMessage(text: string) {
    const question = text.trim();
    if (!question || isTyping) return;

    const nextMessages = [...messages, createMessage("user", question)];
    setMessages(nextMessages);
    setDraft("");
    setStorageError("");
    setIsTyping(true);

    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(nextMessages));
    } catch {
      setStorageError("This browser could not save the chat. Your messages will remain visible for this session.");
    }

    responseTimerRef.current = window.setTimeout(() => {
      void localConversationProvider.respond(question, messages).then((reply) => {
        const completedMessages = [...nextMessages, createMessage("assistant", reply)];
        setMessages(completedMessages);
        try {
          window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(completedMessages));
        } catch {
          setStorageError("This browser could not save the reply. It will remain visible for this session.");
        }
      }).catch(() => {
        const completedMessages = [...nextMessages, createMessage("assistant", "I’m here with you. Would you like to try sending that again?")];
        setMessages(completedMessages);
      }).finally(() => {
        responseTimerRef.current = null;
        setIsTyping(false);
      });
    }, 650);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(draft);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(draft);
    }
  }

  function clearChat() {
    if (!window.confirm("Clear all chat messages saved in this browser? This cannot be undone.")) return;
    if (responseTimerRef.current !== null) window.clearTimeout(responseTimerRef.current);
    responseTimerRef.current = null;
    setIsTyping(false);
    try {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
      setMessages([]);
      setStorageError("");
    } catch {
      setStorageError("Chat history could not be cleared from this browser.");
    }
  }

  if (loading) {
    return <main className={styles.page}><div className={styles.loading} role="status">Opening your memory chat...</div></main>;
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/" aria-label="Live Forever home"><img src="/logo.png" alt="Live Forever" /></Link>
        <Link className={styles.backLink} href="/"><ArrowLeft size={16} /> Back to Live Forever</Link>
      </header>

      <div className={styles.chatShell}>
        <section className={styles.chatHeader}>
          <div className={styles.profileAvatar}><MessageCircle size={25} aria-hidden="true" /></div>
          <div className={styles.profileText}>
            <span className={styles.eyebrow}>LIVE FOREVER</span>
            <h1>A space for connection</h1>
            <p><span className={styles.onlineDot} /> A gentle conversation, at your pace</p>
          </div>
          <div className={styles.chatHeaderActions}>
            <span className={styles.chatStatus}><span /> Here with you</span>
            <button className={styles.clearButton} type="button" onClick={clearChat} disabled={!messages.length && !isTyping}>
              <Trash2 size={15} /> Clear Chat
            </button>
          </div>
        </section>

        <section className={styles.disclosure} aria-label="AI disclosure">
          <Sparkles size={17} aria-hidden="true" />
          <p>AI-generated digital presence — created to preserve memories and connection. You are speaking with AI, not the person themselves.</p>
        </section>

        <section className={styles.conversation} aria-label="Conversation">
          <div className={styles.conversationTopline}>
            <div><MessageCircle size={17} /><span>Conversation</span></div>
            <span className={styles.localBadge}><ShieldCheck size={13} /> Saved on this device</span>
          </div>

          <div className={styles.messageList} role="log" aria-live="polite" aria-busy={isTyping} aria-relevant="additions text">
            {!messages.length ? (
              <div className={styles.emptyChat}>
                <div className={styles.emptyMark}><Heart size={23} /></div>
                <h2>Where would you like to begin?</h2>
                <p>Take your time. I’m here to talk.</p>
                <div className={styles.promptList}>
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <button className={styles.promptButton} key={prompt} type="button" onClick={() => sendMessage(prompt)} disabled={isTyping}>
                      <span>{prompt}</span><ArrowUp size={14} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.messages}>
                {messages.map((message) => (
                  <article className={`${styles.messageRow} ${message.role === "user" ? styles.userRow : styles.assistantRow}`} key={message.id}>
                    {message.role === "assistant" && (
                      <span className={styles.messageAvatar}><Sparkles size={14} aria-hidden="true" /></span>
                    )}
                    <div className={`${styles.messageBubble} ${message.role === "user" ? styles.userBubble : styles.assistantBubble}`}>
                      <span className={styles.messageAuthor}>{message.role === "user" ? "You" : "Live Forever AI"}</span>
                      <p>{message.text}</p>
                      <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                    </div>
                    {message.role === "user" && <span className={styles.userAvatar}>You</span>}
                  </article>
                ))}
                {isTyping && (
                  <div className={`${styles.messageRow} ${styles.assistantRow}`} role="status" aria-label="AI is typing">
                    <span className={styles.messageAvatar}><Sparkles size={14} aria-hidden="true" /></span>
                    <div className={`${styles.messageBubble} ${styles.assistantBubble} ${styles.typingBubble}`}>
                      <span className={styles.messageAuthor}>Live Forever AI</span>
                      <span className={styles.typingDots}><i /><i /><i /></span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={endOfChatRef} />
          </div>

          {storageError && <p className={styles.storageNotice} role="status">{storageError}</p>}
          <form className={styles.composer} onSubmit={handleSubmit}>
            <label className={styles.srOnly} htmlFor="chat-message">Message</label>
            <textarea
              id="chat-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Apne mann ki baat likhein..."
              rows={1}
              maxLength={1000}
              disabled={isTyping}
            />
            <button className={styles.sendButton} type="submit" disabled={!draft.trim() || isTyping} aria-label="Send message" title="Send message">
              <ArrowUp size={19} aria-hidden="true" />
            </button>
          </form>
          <p className={styles.composerHint}>Enter to send <span>·</span> Shift + Enter for a new line</p>
        </section>

        <footer className={styles.privacyFooter}><ShieldCheck size={16} /> Your conversation stays in this browser.</footer>
      </div>
    </main>
  );
}