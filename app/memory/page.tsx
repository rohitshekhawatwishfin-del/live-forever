"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock3,
  Heart,
  Image as ImageIcon,
  Mail,
  MessageCircle,
  Mic,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import styles from "./page.module.css";

const PROFILE_STORAGE_KEY = "live-forever-memory-space";
const MEMORIES_STORAGE_KEY = "live-forever-memory-items";
const RELATIONSHIPS = [
  "Father",
  "Mother",
  "Grandfather",
  "Grandmother",
  "Partner",
  "Sibling",
  "Friend",
  "Other family member",
] as const;

type Relationship = (typeof RELATIONSHIPS)[number];
type MemoryType = "Photo" | "Video" | "Voice" | "Story" | "Letter / Message";
type MemorySpace = {
  name: string;
  relationship: Relationship;
  about: string;
  photo: string;
  createdAt: string;
};

const CATEGORIES = [
  { name: "Photos", detail: "A moment worth keeping.", icon: ImageIcon },
  { name: "Videos", detail: "Little scenes from a life together.", icon: Video },
  { name: "Voice", detail: "Words and sounds you remember.", icon: Mic },
  { name: "Stories", detail: "The stories that make them, them.", icon: BookOpen },
  { name: "Letters & Messages", detail: "Words you want close at hand.", icon: Mail },
] as const;

type MemoryCategory = (typeof CATEGORIES)[number]["name"];
type MemoryEntry = {
  id: string;
  category: MemoryCategory;
  type?: MemoryType;
  title: string;
  details: string;
  createdAt: string;
  mediaData?: string;
  mediaName?: string;
  mediaMime?: string;
};

const MEMORY_TYPES: MemoryType[] = ["Photo", "Video", "Voice", "Story", "Letter / Message"];
const CATEGORY_FOR_TYPE: Record<MemoryType, MemoryCategory> = {
  Photo: "Photos",
  Video: "Videos",
  Voice: "Voice",
  Story: "Stories",
  "Letter / Message": "Letters & Messages",
};
const LEGACY_TYPE_FOR_CATEGORY: Record<MemoryCategory, MemoryType> = {
  Photos: "Photo",
  Videos: "Video",
  Voice: "Voice",
  Stories: "Story",
  "Letters & Messages": "Letter / Message",
};

const FUTURE_FEATURES = [
  { title: "AI Memory Chat", detail: "Explore chosen stories through a clearly identified digital experience.", icon: MessageCircle },
  { title: "Voice Call", detail: "A future voice experience shaped by approved memories.", icon: Phone },
  { title: "Video Presence", detail: "A future visual experience, always disclosed as digital.", icon: Sparkles },
];

function isMemorySpace(value: unknown): value is MemorySpace {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<MemorySpace>;
  return (
    typeof profile.name === "string" &&
    RELATIONSHIPS.includes(profile.relationship as Relationship) &&
    typeof profile.about === "string" &&
    typeof profile.photo === "string" &&
    typeof profile.createdAt === "string"
  );
}

function normalizeMemory(value: unknown): MemoryEntry | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Record<string, unknown>;
  const legacyCategory = typeof entry.category === "string" && entry.category in LEGACY_TYPE_FOR_CATEGORY
    ? entry.category as MemoryCategory
    : null;
  const type = MEMORY_TYPES.includes(entry.type as MemoryType)
    ? entry.type as MemoryType
    : legacyCategory ? LEGACY_TYPE_FOR_CATEGORY[legacyCategory] : null;

  if (!type || typeof entry.id !== "string" || typeof entry.title !== "string" || typeof entry.createdAt !== "string") {
    return null;
  }

  return {
    id: entry.id,
    type,
    category: CATEGORY_FOR_TYPE[type],
    title: entry.title,
    details: typeof entry.details === "string" ? entry.details : "",
    createdAt: entry.createdAt,
    ...(typeof entry.mediaData === "string" ? { mediaData: entry.mediaData } : {}),
    ...(typeof entry.mediaName === "string" ? { mediaName: entry.mediaName } : {}),
    ...(typeof entry.mediaMime === "string" ? { mediaMime: entry.mediaMime } : {}),
  };
}

function isMediaMemory(type: MemoryType) {
  return type === "Photo" || type === "Video" || type === "Voice";
}

function isTextMemory(type: MemoryType) {
  return type === "Story" || type === "Letter / Message";
}

function formatDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "Recently added"
    : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

export default function MemoryDashboard() {
  const [profile, setProfile] = useState<MemorySpace | null>(null);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingError, setSavingError] = useState("");
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftRelationship, setDraftRelationship] = useState<Relationship | "">("");
  const [draftAbout, setDraftAbout] = useState("");
  const [draftPhoto, setDraftPhoto] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [category, setCategory] = useState<MemoryCategory>("Photos");
  const [memoryType, setMemoryType] = useState<MemoryType>("Photo");
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryDetails, setMemoryDetails] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<{ data: string; name: string; mime: string } | null>(null);
  const [mediaError, setMediaError] = useState("");
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    try {
      const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        const parsedProfile: unknown = JSON.parse(storedProfile);
        if (isMemorySpace(parsedProfile)) {
          setProfile(parsedProfile);
          setDraftName(parsedProfile.name);
          setDraftRelationship(parsedProfile.relationship);
          setDraftAbout(parsedProfile.about);
          setDraftPhoto(parsedProfile.photo);
        } else {
          setLoadError("The saved profile could not be read. Please return to setup and create it again.");
        }
      }

      const storedMemories = window.localStorage.getItem(MEMORIES_STORAGE_KEY);
      if (storedMemories) {
        const parsedMemories: unknown = JSON.parse(storedMemories);
        if (Array.isArray(parsedMemories)) {
          setMemories(parsedMemories.map(normalizeMemory).filter((memory): memory is MemoryEntry => memory !== null));
        } else {
          setPageError("Saved memories were in an unexpected format. You can still add new memories.");
        }
      }
    } catch {
      setPageError("Saved memories could not be read. You can still add new memories.");
    } finally {
      setLoading(false);
    }
  }, []);

  const photoCount = memories.filter((memory) => memory.category === "Photos").length;
  const videoCount = memories.filter((memory) => memory.category === "Videos").length;
  const storyCount = memories.filter((memory) => memory.category === "Stories").length;
  const voiceCount = memories.filter((memory) => memory.category === "Voice").length;

  function beginEditingProfile() {
    if (!profile) return;
    setDraftName(profile.name);
    setDraftRelationship(profile.relationship);
    setDraftAbout(profile.about);
    setDraftPhoto(profile.photo);
    setPhotoError("");
    setSavingError("");
    setIsEditingProfile(true);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setPhotoError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Choose an image file for the profile photo.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Choose an image smaller than 2 MB to save it in this browser.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setDraftPhoto(reader.result);
    };
    reader.onerror = () => setPhotoError("That image could not be opened. Please try another one.");
    reader.readAsDataURL(file);
  }

  function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setSavingError("");

    if (!draftName.trim() || !draftRelationship) {
      setSavingError("Add a name and relationship before saving.");
      return;
    }

    const updatedProfile: MemorySpace = {
      ...profile,
      name: draftName.trim(),
      relationship: draftRelationship,
      about: draftAbout.trim(),
      photo: draftPhoto,
    };

    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setIsEditingProfile(false);
    } catch {
      setSavingError("This browser could not save the profile. Try a smaller photo or free some browser storage.");
    }
  }

  function openMemoryModal(type: MemoryType = "Photo") {
    setMemoryType(type);
    setCategory(CATEGORY_FOR_TYPE[type]);
    setMemoryTitle("");
    setMemoryDetails("");
    setSelectedMedia(null);
    setMediaError("");
    setSavingError("");
    setIsAddingMemory(true);
  }

  function handleMediaChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setMediaError("");
    if (!file) return;

    const expectedType = memoryType === "Photo" ? "image/" : memoryType === "Video" ? "video/" : "audio/";
    if (!file.type.startsWith(expectedType)) {
      setMediaError(`Choose a ${memoryType.toLowerCase()} file to continue.`);
      event.currentTarget.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMediaError("Choose a file smaller than 2 MB to save it in this browser.");
      event.currentTarget.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedMedia({ data: reader.result, name: file.name, mime: file.type });
      }
    };
    reader.onerror = () => setMediaError("That file could not be opened. Please try another one.");
    reader.readAsDataURL(file);
  }

  function handleMemorySave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingError("");

    if (isMediaMemory(memoryType) && !selectedMedia) {
      setMediaError(`Choose a ${memoryType.toLowerCase()} file before saving.`);
      return;
    }
    if (isTextMemory(memoryType) && !memoryDetails.trim()) {
      setSavingError("Add the story or message before saving.");
      return;
    }

    const fallbackTitle = selectedMedia?.name.replace(/\.[^.]+$/, "") || memoryType;
    const entry: MemoryEntry = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      category: CATEGORY_FOR_TYPE[memoryType],
      type: memoryType,
      title: memoryTitle.trim() || fallbackTitle,
      details: memoryDetails.trim(),
      createdAt: new Date().toISOString(),
      ...(selectedMedia ? {
        mediaData: selectedMedia.data,
        mediaName: selectedMedia.name,
        mediaMime: selectedMedia.mime,
      } : {}),
    };
    const updatedMemories = [entry, ...memories];

    try {
      window.localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(updatedMemories));
      setMemories(updatedMemories);
      setMemoryTitle("");
      setMemoryDetails("");
      setSelectedMedia(null);
      setIsAddingMemory(false);
    } catch {
      setSavingError("This browser could not save the memory. Try a smaller file or free some browser storage.");
    }
  }

  function handleMemoryDelete(id: string) {
    setPageError("");
    const updatedMemories = memories.filter((memory) => memory.id !== id);
    try {
      window.localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(updatedMemories));
      setMemories(updatedMemories);
    } catch {
      setPageError("This memory could not be deleted from browser storage. Please try again.");
    }
  }

  if (loading) {
    return <main className={styles.page}><div className={styles.loading} role="status">Opening your memory space...</div></main>;
  }

  if (!profile) {
    return (
      <main className={styles.page}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/" aria-label="Live Forever home"><img src="/logo.png" alt="Live Forever" /></Link>
          <Link className={styles.backLink} href="/"><ArrowLeft size={17} /> Back to home</Link>
        </header>
        <section className={styles.emptyState}>
          <div className={styles.emptyIcon}><Heart size={27} /></div>
          <span className={styles.eyebrow}>YOUR MEMORY SPACE</span>
          <h1>Start with someone you love.</h1>
          <p>{loadError || "Create a Memory Space first, then come back here to gather their stories and moments."}</p>
          <Link className={styles.primaryAction} href="/create">Create Memory Space <ArrowRight size={17} /></Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/" aria-label="Live Forever home"><img src="/logo.png" alt="Live Forever" /></Link>
        <div className={styles.topbarActions}>
          <div className={styles.headerProfile}>
            <div className={styles.headerAvatar}>
              {profile.photo ? <img src={profile.photo} alt="" /> : <Heart size={18} aria-hidden="true" />}
            </div>
            <div className={styles.headerIdentity}><strong>{profile.name}</strong><span>{profile.relationship}</span></div>
          </div>
          <button className={styles.headerEditButton} type="button" onClick={beginEditingProfile}><Pencil size={14} /> Edit Memory Space</button>
          <Link className={styles.backLink} href="/"><ArrowLeft size={16} /> Back to Home</Link>
        </div>
      </header>

      <div className={styles.dashboard}>
        <div className={styles.pageIntro}>
          <div>
            <span className={styles.eyebrow}>YOUR FAMILY MEMORY SPACE</span>
            <h1>A life, remembered together.</h1>
          </div>
          <button className={styles.addButton} type="button" onClick={() => { setSavingError(""); setIsAddingMemory(true); }}>
            <Plus size={18} /> Add Memory
          </button>
        </div>

        <section className={styles.profileHero} aria-labelledby="profile-name">
          <div className={styles.heroPhoto}>
            {profile.photo ? <img src={profile.photo} alt={`${profile.name}'s profile`} /> : <Heart size={48} aria-hidden="true" />}
          </div>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>A PLACE FOR THEIR STORY</span>
            <h1 id="profile-name">{profile.name}</h1>
            <span className={styles.heroRelationship}>{profile.relationship}</span>
            <div className={styles.heroAbout}>
              <strong>ABOUT THEM</strong>
              <p>{profile.about || "Add a few details about their personality, favourite things, or the memories you want to keep close."}</p>
            </div>
            <div className={styles.heroActions}>
              <button className={styles.addButton} type="button" onClick={() => openMemoryModal()}><Plus size={18} /> Add Memory</button>
              <button className={styles.editButton} type="button" onClick={beginEditingProfile}><Pencil size={15} /> Edit Profile</button>
            </div>
          </div>
        </section>

        {pageError && <p className={styles.pageError} role="alert">{pageError}</p>}

        <section className={styles.overview} aria-labelledby="overview-title">
          <div className={styles.sectionTopline}>
            <div>
              <span className={styles.eyebrow}>A LITTLE OF EVERYTHING</span>
              <h2 id="overview-title">Memory overview</h2>
            </div>
            <span className={styles.totalLabel}>{memories.length} {memories.length === 1 ? "memory" : "memories"} so far</span>
          </div>
          <div className={styles.statsGrid}>
            <article className={`${styles.statCard} ${styles.totalStat}`}>
              <span className={styles.statIcon}><Heart size={19} /></span>
              <span className={styles.statLabel}>Total Memories</span>
              <strong>{memories.length}</strong>
              <span className={styles.statHint}>Every story, in one place</span>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statIcon}><ImageIcon size={19} /></span>
              <span className={styles.statLabel}>Photos</span>
              <strong>{photoCount}</strong>
              <span className={styles.statHint}>Moments in pictures</span>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statIcon}><Video size={19} /></span>
              <span className={styles.statLabel}>Videos</span>
              <strong>{videoCount}</strong>
              <span className={styles.statHint}>Life in motion</span>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statIcon}><BookOpen size={19} /></span>
              <span className={styles.statLabel}>Stories</span>
              <strong>{storyCount}</strong>
              <span className={styles.statHint}>Words worth passing on</span>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statIcon}><Mic size={19} /></span>
              <span className={styles.statLabel}>Voice Memories</span>
              <strong>{voiceCount}</strong>
              <span className={styles.statHint}>A voice you know by heart</span>
            </article>
          </div>
        </section>

        <section className={styles.memoriesSection} aria-labelledby="categories-title">
          <div className={styles.sectionTopline}>
            <div><span className={styles.eyebrow}>COLLECT WHAT MATTERS</span><h2 id="categories-title">Every kind of memory</h2></div>
            <button className={styles.prominentAddButton} type="button" onClick={() => openMemoryModal()}><Plus size={18} /> Add Memory</button>
          </div>
          <div className={styles.memorySectionsGrid}>
            {CATEGORIES.map(({ name, detail, icon: Icon }) => {
              const entries = memories.filter((memory) => memory.category === name);
              const type = LEGACY_TYPE_FOR_CATEGORY[name];
              const title = name === "Voice" ? "Voice Memories" : name;
              return (
                <section className={styles.memorySection} key={name} aria-label={title}>
                  <div className={styles.memorySectionHeader}>
                    <span className={styles.memorySectionIcon}><Icon size={20} aria-hidden="true" /></span>
                    <div className={styles.memorySectionCopy}><h3>{title}</h3><p>{detail}</p></div>
                    <button className={styles.sectionAddButton} type="button" onClick={() => openMemoryModal(type)}><Plus size={15} /> Add</button>
                  </div>
                  {entries.length ? (
                    <div className={styles.memoryGrid}>
                      {entries.map((memory) => {
                        const entryType = memory.type ?? type;
                        return (
                          <article className={styles.memoryCard} key={memory.id}>
                            {memory.mediaData && entryType === "Photo" && <img className={styles.memoryMedia} src={memory.mediaData} alt={memory.title} />}
                            {memory.mediaData && entryType === "Video" && <video className={styles.memoryMedia} src={memory.mediaData} controls preload="metadata" aria-label={memory.title} />}
                            {memory.mediaData && entryType === "Voice" && <div className={styles.audioWrap}><Mic size={20} /><audio src={memory.mediaData} controls preload="metadata" aria-label={memory.title} /></div>}
                            <div className={styles.memoryCardBody}>
                              <div className={styles.memoryCardTitle}><h4>{memory.title}</h4><button className={styles.deleteButton} type="button" aria-label={`Delete ${memory.title}`} title="Delete memory" onClick={() => handleMemoryDelete(memory.id)}><Trash2 size={16} /></button></div>
                              {memory.details && <p className={styles.memoryDetails}>{memory.details}</p>}
                              {memory.mediaName && <span className={styles.fileName}>{memory.mediaName}</span>}
                              <time className={styles.memoryDate} dateTime={memory.createdAt}><Clock3 size={13} /> {formatDate(memory.createdAt)}</time>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.sectionEmpty}>
                      <span className={styles.emptySectionIcon}><Icon size={19} aria-hidden="true" /></span>
                      <div><strong>No {title.toLowerCase()} yet</strong><p>{detail} Add one whenever you feel ready.</p></div>
                      <button type="button" onClick={() => openMemoryModal(type)}>Add <ArrowRight size={14} /></button>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </section>

        <section className={styles.futureSection} aria-labelledby="future-title">
          <div className={styles.sectionTopline}>
            <div>
              <span className={styles.eyebrow}>LOOKING AHEAD</span>
              <h2 id="future-title">More ways to feel close</h2>
            </div>
            <span className={styles.futureTag}>FUTURE FEATURES</span>
          </div>
          <div className={styles.futureGrid}>
            {FUTURE_FEATURES.map(({ title, detail, icon: Icon }) => {
              const content = (
                <>
                  <span className={styles.futureIcon}><Icon size={20} /></span>
                  <div><h3>{title}</h3><p>{detail}</p></div>
                  <span className={styles.comingSoon}>COMING SOON</span>
                </>
              );
              return title === "AI Memory Chat" ? (
                <Link className={`${styles.futureCard} ${styles.chatFeature}`} href="/chat" key={title}>
                  {content}
                </Link>
              ) : (
                <article className={styles.futureCard} key={title}>{content}</article>
              );
            })}
          </div>
          <p className={styles.aiDisclosure}><Sparkles size={15} /> AI experiences are digital representations created from the memories and information you choose to provide.</p>
        </section>

        <footer className={styles.footer}>
          <p><ShieldCheck size={17} /> Your memories are private and under your control.</p>
          <span>LIVE FOREVER <i>·</i> Built around memories, care and connection.</span>
        </footer>
      </div>

      {isAddingMemory && (
        <div className={styles.modalBackdrop}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="add-memory-title">
            <div className={styles.modalHeader}>
              <div><span className={styles.eyebrow}>KEEP THIS MOMENT</span><h2 id="add-memory-title">Add a Memory</h2></div>
              <button className={styles.closeButton} type="button" aria-label="Close" onClick={() => { setIsAddingMemory(false); setSavingError(""); }}><X size={19} /></button>
            </div>
            <p className={styles.modalIntro}>Choose a type, then save it privately in this browser.</p>
            <form onSubmit={handleMemorySave}>
              <label className={styles.modalLabel} htmlFor="memory-type">Memory Type</label>
              <select
                id="memory-type"
                className={styles.modalControl}
                value={memoryType}
                onChange={(event) => {
                  const nextType = event.target.value as MemoryType;
                  setMemoryType(nextType);
                  setCategory(CATEGORY_FOR_TYPE[nextType]);
                  setMemoryTitle("");
                  setMemoryDetails("");
                  setSelectedMedia(null);
                  setMediaError("");
                }}
              >
                {MEMORY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>

              {isMediaMemory(memoryType) && (
                <div className={styles.uploadField}>
                  <label className={styles.modalLabel} htmlFor="memory-file">{memoryType} upload</label>
                  <label className={styles.uploadDropzone} htmlFor="memory-file">
                    <span className={styles.uploadIcon}><Upload size={19} /></span>
                    <strong>{selectedMedia?.name || `Choose a ${memoryType.toLowerCase()} file`}</strong>
                    <span>{memoryType === "Photo" ? "Image" : memoryType === "Video" ? "Video" : "Audio"} files · up to 2 MB</span>
                    <input
                      id="memory-file"
                      type="file"
                      accept={memoryType === "Photo" ? "image/*" : memoryType === "Video" ? "video/*" : "audio/*"}
                      required={!selectedMedia}
                      onChange={handleMediaChange}
                    />
                  </label>
                  {mediaError && <p className={styles.modalError} role="alert">{mediaError}</p>}
                  {selectedMedia && memoryType === "Photo" && <img className={styles.uploadPreview} src={selectedMedia.data} alt="Selected photo preview" />}
                  {selectedMedia && memoryType === "Video" && <video className={styles.uploadPreview} src={selectedMedia.data} controls preload="metadata" />}
                  {selectedMedia && memoryType === "Voice" && <audio className={styles.uploadAudioPreview} src={selectedMedia.data} controls />}
                </div>
              )}

              <label className={styles.modalLabel} htmlFor="memory-title">Title {isMediaMemory(memoryType) && <span>OPTIONAL</span>}</label>
              <input
                id="memory-title"
                className={styles.modalControl}
                value={memoryTitle}
                onChange={(event) => setMemoryTitle(event.target.value)}
                placeholder={memoryType === "Story" ? "A story they always told" : memoryType === "Letter / Message" ? "A note from home" : "Give this memory a name"}
                maxLength={100}
                required={isTextMemory(memoryType)}
              />
              {isTextMemory(memoryType) && (
                <>
                  <label className={styles.modalLabel} htmlFor="memory-details">{memoryType === "Story" ? "Story" : "Letter / Message"}</label>
                  <textarea
                    id="memory-details"
                    className={styles.modalControl}
                    value={memoryDetails}
                    onChange={(event) => setMemoryDetails(event.target.value)}
                    placeholder={memoryType === "Story" ? "Write down the story in your own words..." : "Add the message or letter text..."}
                    rows={5}
                    maxLength={5000}
                    required
                  />
                </>
              )}
              {savingError && <p className={styles.modalError} role="alert">{savingError}</p>}
              <div className={styles.modalActions}>
                <button className={styles.cancelButton} type="button" onClick={() => { setIsAddingMemory(false); setSavingError(""); }}>Cancel</button>
                <button className={styles.primaryAction} type="submit">Save Memory <ArrowRight size={16} /></button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isEditingProfile && (
        <div className={styles.modalBackdrop}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
            <div className={styles.modalHeader}>
              <div><span className={styles.eyebrow}>YOUR MEMORY SPACE</span><h2 id="edit-profile-title">Edit details</h2></div>
              <button className={styles.closeButton} type="button" aria-label="Close" onClick={() => { setIsEditingProfile(false); setSavingError(""); }}><X size={19} /></button>
            </div>
            <form onSubmit={handleProfileSave}>
              <label className={styles.modalLabel} htmlFor="edit-name">Loved One Name</label>
              <input id="edit-name" className={styles.modalControl} value={draftName} onChange={(event) => setDraftName(event.target.value)} maxLength={100} required />
              <label className={styles.modalLabel} htmlFor="edit-relationship">Relationship</label>
              <select id="edit-relationship" className={styles.modalControl} value={draftRelationship} onChange={(event) => setDraftRelationship(event.target.value as Relationship)} required>
                {RELATIONSHIPS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <label className={styles.modalLabel} htmlFor="edit-photo">Profile Photo <span>OPTIONAL</span></label>
              <input id="edit-photo" className={styles.modalControl} type="file" accept="image/*" onChange={handlePhotoChange} />
              {photoError && <p className={styles.modalError} role="alert">{photoError}</p>}
              <label className={styles.modalLabel} htmlFor="edit-about">About Them <span>OPTIONAL</span></label>
              <textarea id="edit-about" className={styles.modalControl} value={draftAbout} onChange={(event) => setDraftAbout(event.target.value)} rows={4} maxLength={1200} />
              {savingError && <p className={styles.modalError} role="alert">{savingError}</p>}
              <div className={styles.modalActions}>
                <button className={styles.cancelButton} type="button" onClick={() => { setIsEditingProfile(false); setSavingError(""); }}>Cancel</button>
                <button className={styles.primaryAction} type="submit">Save Changes <ArrowRight size={16} /></button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}