"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, Heart, MessageCircle, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import styles from "./page.module.css";

const PROFILE_STORAGE_KEY = "live-forever-memory-space";
const MEMORIES_STORAGE_KEY = "live-forever-memory-items";
const CHAT_STORAGE_KEY = "live-forever-ai-memory-chat";
const INSUFFICIENT_MEMORY_REPLY = "I don't have enough saved memories to answer that yet. You can add more memories to their Memory Space.";
const EXAMPLE_PROMPTS = [
  "Tell me about our family.",
  "What memories have we saved?",
  "Tell me a story about them.",
];

const COMMON_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "can", "could", "did", "do", "does", "for", "from", "had", "has", "have", "he", "her", "here", "hers", "him", "his", "how", "i", "if", "in", "is", "it", "its", "me", "my", "of", "on", "or", "our", "ours", "please", "she", "so", "tell", "that", "the", "their", "them", "there", "they", "this", "to", "us", "was", "we", "were", "what", "when", "where", "which", "who", "why", "will", "with", "would", "you", "your",
]);

type MemoryProfile = {
  name: string;
  relationship: string;
  about: string;
  photo: string;
};

type SavedMemory = {
  id: string;
  type: string;
  title: string;
  details: string;
  mediaName: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

function isMemoryProfile(value: unknown): value is MemoryProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Record<string, unknown>;
  return typeof profile.name === "string" && typeof profile.relationship === "string";
}

function normalizeSavedMemory(value: unknown): SavedMemory | null {
  if (!value || typeof value !== "object") return null;
  const memory = value as Record<string, unknown>;
  const legacyTypes: Record<string, string> = {
    Photos: "Photo",
    Videos: "Video",
    Voice: "Voice",
    Stories: "Story",
    "Letters & Messages": "Letter / Message",
  };
  const type = typeof memory.type === "string"
    ? memory.type
    : typeof memory.category === "string" ? legacyTypes[memory.category] : undefined;

  if (typeof memory.title !== "string" || !type) return null;
  return {
    id: typeof memory.id === "string" ? memory.id : memory.title,
    type,
    title: memory.title,
    details: typeof memory.details === "string" ? memory.details : "",
    mediaName: typeof memory.mediaName === "string" ? memory.mediaName : "",
  };
}

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

function tokenize(text: string) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((word) => word.length > 2 && !COMMON_WORDS.has(word))
    .map((word) => word.length > 4 && word.endsWith("s") ? word.slice(0, -1) : word);
}

function createMemoryResponse(question: string, profile: MemoryProfile, memories: SavedMemory[]) {
  const normalizedQuestion = question.toLowerCase();
  const aboutIntent = /\b(about|family|personality|like|who)\b/.test(normalizedQuestion) ||
    (/\bfavou?rite\b/.test(normalizedQuestion) && /\b(things|food|music|songs?|hobbies?)\b/.test(normalizedQuestion));
  const allMemoriesIntent = /\b(memories|memory|saved|save|remember|remembered|kept|letters|messages)\b/.test(normalizedQuestion);
  const storyIntent = /\bstor(y|ies)\b/.test(normalizedQuestion);
  const questionWords = new Set(tokenize(question));

  const matchingMemories = memories.filter((memory) => {
    if (storyIntent) return memory.type === "Story";
    if (allMemoriesIntent || aboutIntent) return true;
    const searchableText = `${memory.title} ${memory.details} ${memory.mediaName} ${memory.type}`;
    return tokenize(searchableText).some((word) => questionWords.has(word));
  });

  const aboutMatches = Boolean(profile.about.trim()) && (
    aboutIntent || tokenize(profile.about).some((word) => questionWords.has(word))
  );
  const hasUsefulInfo = aboutMatches || matchingMemories.length > 0;
  if (!hasUsefulInfo) return INSUFFICIENT_MEMORY_REPLY;

  const evidence: string[] = [];
  if (aboutMatches) evidence.push(`About ${profile.name}: ${profile.about.trim()}`);
  matchingMemories.forEach((memory) => {
    const label = memory.type === "Letter / Message" ? "Letter or message" : memory.type;
    const details = memory.details.trim();
    evidence.push(details ? `${label}: “${memory.title}” — ${details}` : `${label} saved: “${memory.title}”.`);
  });

  return `Here is what I can find in the memories and information you shared about ${profile.name}:\n\n${evidence.join("\n\n")}\n\nThis response is based only on those saved details. It is not a message from ${profile.name}.`;
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
  const [profile, setProfile] = useState<MemoryProfile | null>(null);
  const [memories, setMemories] = useState<SavedMemory[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState("");
  const endOfChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        const parsed: unknown = JSON.parse(storedProfile);
        if (isMemoryProfile(parsed)) {
          setProfile({
            name: parsed.name,
            relationship: parsed.relationship,
            about: typeof parsed.about === "string" ? parsed.about : "",
            photo: typeof parsed.photo === "string" ? parsed.photo : "",
          });
        }
      }
    } catch {
      setStorageError("Profile details could not be read from this browser.");
    }

    try {
      const storedMemories = window.localStorage.getItem(MEMORIES_STORAGE_KEY);
      if (storedMemories) {
        const parsed: unknown = JSON.parse(storedMemories);
        if (Array.isArray(parsed)) setMemories(parsed.map(normalizeSavedMemory).filter((memory): memory is SavedMemory => memory !== null));
      }
    } catch {
      setStorageError("Saved memories could not be read. The chat can only use information that is available here.");
    }

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
  }, [messages, loading]);

  function sendMessage(text: string) {
    const question = text.trim();
    if (!question || !profile) return;

    const nextMessages = [
      ...messages,
      createMessage("user", question),
      createMessage("assistant", createMemoryResponse(question, profile, memories)),
    ];
    setMessages(nextMessages);
    setDraft("");
    setStorageError("");

    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(nextMessages));
    } catch {
      setStorageError("This browser could not save the chat history. Your new messages are visible for this session.");
    }
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
        <Link className={styles.backLink} href="/memory"><ArrowLeft size={16} /> Back to Memory</Link>
      </header>

      <div className={styles.chatShell}>
        {profile ? (
          <>
            <section className={styles.chatHeader}>
              <div className={styles.profileAvatar}>
                {profile.photo ? <img src={profile.photo} alt={`${profile.name}'s profile`} /> : <Heart size={26} aria-hidden="true" />}
              </div>
              <div className={styles.profileText}>
                <span className={styles.eyebrow}>LIVE FOREVER</span>
                <h1>{profile.name}</h1>
                <p>{profile.relationship} <span className={styles.onlineDot} /> AI Memory Chat</p>
              </div>
              <div className={styles.chatHeaderActions}>
                <span className={styles.chatStatus}><span /> Memory-based responses</span>
                <button className={styles.clearButton} type="button" onClick={clearChat} disabled={!messages.length}>
                  <Trash2 size={15} /> Clear Chat
                </button>
              </div>
            </section>

            <section className={styles.disclosure} aria-label="AI disclosure">
              <Sparkles size={17} aria-hidden="true" />
              <p>This is an AI-generated digital representation based on the memories and information you provide. It is not the actual person.</p>
            </section>

            <section className={styles.conversation} aria-label="AI Memory Chat conversation">
              <div className={styles.conversationTopline}>
                <div><MessageCircle size={17} /><span>AI Memory Chat</span></div>
                <span className={styles.localBadge}><ShieldCheck size={13} /> Private on this device</span>
              </div>

              <div className={styles.messageList} role="log" aria-live="polite" aria-relevant="additions text">
                {!messages.length ? (
                  <div className={styles.emptyChat}>
                    <div className={styles.emptyMark}><Heart size={23} /></div>
                    <h2>Where would you like to begin?</h2>
                    <p>Ask about the information and memories saved in this space.</p>
                    <div className={styles.promptList}>
                      {EXAMPLE_PROMPTS.map((prompt) => (
                        <button className={styles.promptButton} key={prompt} type="button" onClick={() => sendMessage(prompt)}>
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
                          <span className={styles.messageAuthor}>{message.role === "user" ? "You" : "AI Memory"}</span>
                          <p>{message.text}</p>
                          <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                        </div>
                        {message.role === "user" && <span className={styles.userAvatar}>You</span>}
                      </article>
                    ))}
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
                  placeholder="Ask about the saved memories..."
                  rows={1}
                  maxLength={1000}
                />
                <button className={styles.sendButton} type="submit" disabled={!draft.trim()} aria-label="Send message" title="Send message">
                  <ArrowUp size={19} aria-hidden="true" />
                </button>
              </form>
              <p className={styles.composerHint}>Enter to send <span>·</span> Shift + Enter for a new line</p>
            </section>

            <footer className={styles.privacyFooter}><ShieldCheck size={16} /> Your memories are private and under your control.</footer>
          </>
        ) : (
          <section className={styles.noProfile}>
            <div className={styles.emptyMark}><Heart size={23} /></div>
            <span className={styles.eyebrow}>AI MEMORY CHAT</span>
            <h1>Create a Memory Space first.</h1>
            <p>{storageError || "The chat uses information saved in your Memory Space. Create one to begin."}</p>
            <div className={styles.noProfileActions}>
              <Link className={styles.primaryLink} href="/create">Create Memory Space</Link>
              <Link className={styles.secondaryLink} href="/memory">Back to Memory</Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}