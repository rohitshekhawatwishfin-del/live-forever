"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Mic,
  Phone,
  ShieldCheck,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";
import styles from "./page.module.css";

const STORAGE_KEY = "live-forever-memory-space";
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

type MemorySpace = {
  name: string;
  relationship: Relationship;
  about: string;
  photo: string;
  createdAt: string;
};

const spaceSections = [
  { title: "Photos", detail: "Keep the moments you want to see again.", icon: ImageIcon },
  { title: "Videos", detail: "Save the moving, laughing, everyday moments.", icon: Video },
  { title: "Voice", detail: "A place for familiar words and expressions.", icon: Mic },
  { title: "Stories", detail: "Collect the stories only they could tell.", icon: BookOpen },
  { title: "Chat", detail: "A future experience grounded in chosen memories.", icon: MessageCircle },
  { title: "Voice Call", detail: "A voice experience for a later chapter.", icon: Phone },
  { title: "Video Presence", detail: "A carefully disclosed digital presence.", icon: Sparkles },
];

function isMemorySpace(value: unknown): value is MemorySpace {
  if (!value || typeof value !== "object") return false;

  const memory = value as Partial<MemorySpace>;
  return (
    typeof memory.name === "string" &&
    RELATIONSHIPS.includes(memory.relationship as Relationship) &&
    typeof memory.about === "string" &&
    typeof memory.photo === "string" &&
    typeof memory.createdAt === "string"
  );
}

export default function CreateMemorySpace() {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<Relationship | "">("");
  const [about, setAbout] = useState("");
  const [photo, setPhoto] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [createdMemory, setCreatedMemory] = useState<MemorySpace | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isMemorySpace(parsed)) {
          setCreatedMemory(parsed);
        } else {
          setSubmitError("We couldn't read the saved memory space. You can create it again below.");
        }
      }
    } catch {
      setSubmitError("We couldn't read saved data in this browser. You can still create a memory space.");
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setPhotoError("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Choose an image file to use as the profile photo.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Choose an image smaller than 2 MB to save it in this browser.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPhoto(reader.result);
    };
    reader.onerror = () => setPhotoError("That image couldn't be opened. Please try another one.");
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    if (!name.trim()) {
      setSubmitError("Please enter their name.");
      return;
    }
    if (!relationship) {
      setSubmitError("Please choose your relationship.");
      return;
    }

    const memory: MemorySpace = {
      name: name.trim(),
      relationship,
      about: about.trim(),
      photo,
      createdAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
      setCreatedMemory(memory);
    } catch {
      setSubmitError("This browser couldn't save the memory space. Try a smaller photo or free some browser storage.");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/" aria-label="Live Forever home">
          <img src="/logo.png" alt="Live Forever" />
        </Link>
        <Link className={styles.backLink} href="/">
          <ArrowLeft size={17} aria-hidden="true" />
          <span>Back to home</span>
        </Link>
      </header>

      {!storageLoaded ? (
        <div className={styles.loading} role="status">Opening your memory space...</div>
      ) : createdMemory ? (
        <section className={styles.confirmation} aria-labelledby="confirmation-title">
          <div className={styles.confirmationHeading}>
            <span className={styles.eyebrow}>A PLACE FOR THEIR STORY</span>
            <div className={styles.successMark}><Heart size={22} fill="currentColor" aria-hidden="true" /></div>
            <h1 id="confirmation-title">Memory Space Created</h1>
            <p>Your space for remembering, sharing and keeping their story close is ready.</p>
          </div>

          <article className={styles.profile}>
            <div className={styles.avatar}>
              {createdMemory.photo ? (
                <img src={createdMemory.photo} alt={`${createdMemory.name}'s profile`} />
              ) : (
                <Heart size={34} aria-hidden="true" />
              )}
            </div>
            <div className={styles.profileCopy}>
              <span className={styles.profileLabel}>YOUR MEMORY SPACE</span>
              <h2>{createdMemory.name}</h2>
              <p>{createdMemory.relationship}</p>
            </div>
            <span className={styles.savedBadge}><ShieldCheck size={16} /> Saved on this device</span>
            {createdMemory.about && <p className={styles.aboutText}>{createdMemory.about}</p>}
          </article>
          <Link className={styles.openMemoryLink} href="/memory">
            Open Memory Space
            <ArrowRight size={17} aria-hidden="true" />
          </Link>

          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>KEEP WHAT MATTERS</span>
              <h2>Make room for every kind of memory.</h2>
            </div>
            <span className={styles.localNote}>Your space is private to this browser.</span>
          </div>
          <div className={styles.sectionGrid}>
            {spaceSections.map(({ title, detail, icon: Icon }) => (
              <article className={styles.sectionTile} key={title}>
                <div className={styles.sectionIcon}><Icon size={21} aria-hidden="true" /></div>
                <div className={styles.tileCopy}>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </div>
                <span className={styles.comingSoon}>COMING SOON</span>
              </article>
            ))}
          </div>

          <div className={styles.disclosures}>
            <p><ShieldCheck size={18} aria-hidden="true" /> Your memories are private and under your control.</p>
            <p><Sparkles size={18} aria-hidden="true" /> AI experiences are digital representations created from the memories and information you choose to provide.</p>
          </div>
          <Link className={styles.homeLink} href="/">Return to Live Forever</Link>
        </section>
      ) : (
        <div className={styles.content}>
          <div className={styles.pageHeading}>
            <span className={styles.eyebrow}>MEMORIES, KEPT WITH CARE</span>
            <h1>Create a Memory Space</h1>
            <p>Begin with the details that feel right. You can add more memories over time.</p>
          </div>

          <div className={styles.formLayout}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formIntro}>
                <span className={styles.step}>01 <span>·</span> THE PERSON</span>
                <h2>Who would you like to remember?</h2>
              </div>

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label htmlFor="loved-one-name">Loved One Name <span aria-hidden="true">*</span></label>
                  <input
                    id="loved-one-name"
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Papa, Maa, Dada Ji"
                    autoComplete="off"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="relationship">Relationship <span aria-hidden="true">*</span></label>
                  <select
                    id="relationship"
                    name="relationship"
                    value={relationship}
                    onChange={(event) => setRelationship(event.target.value as Relationship | "")}
                    required
                  >
                    <option value="" disabled>Choose a relationship</option>
                    {RELATIONSHIPS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="profile-photo">Profile Photo <span className={styles.optional}>OPTIONAL</span></label>
                <div className={styles.photoPicker}>
                  <div className={styles.photoPreview}>
                    {photo ? <img src={photo} alt="Selected profile preview" /> : <ImageIcon size={25} aria-hidden="true" />}
                  </div>
                  <div className={styles.photoCopy}>
                    <strong>{photo ? "Photo ready" : "Add a photo that feels like them"}</strong>
                    <span>JPG, PNG or another image format · up to 2 MB</span>
                  </div>
                  <label className={styles.uploadButton} htmlFor="profile-photo">
                    <Upload size={16} aria-hidden="true" />
                    {photo ? "Change photo" : "Choose photo"}
                  </label>
                  <input
                    className={styles.fileInput}
                    id="profile-photo"
                    name="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    aria-describedby={photoError ? "photo-error" : undefined}
                  />
                </div>
                {photoError && <p className={styles.fieldError} id="photo-error" role="alert">{photoError}</p>}
              </div>

              <div className={styles.field}>
                <label htmlFor="about-them">About Them <span className={styles.optional}>OPTIONAL</span></label>
                <textarea
                  id="about-them"
                  name="about"
                  value={about}
                  onChange={(event) => setAbout(event.target.value)}
                  placeholder="A little about their memories, personality, favourite things..."
                  rows={5}
                  maxLength={1200}
                />
                <span className={styles.characterCount}>{about.length}/1200</span>
              </div>

              {submitError && <p className={styles.formError} role="alert">{submitError}</p>}
              <button className={styles.submitButton} type="submit">
                Create Memory Space
                <span aria-hidden="true">→</span>
              </button>
              <p className={styles.formFootnote}>Your details stay in this browser for now. You are in control of what you add.</p>
            </form>

            <aside className={styles.sidePanel}>
              <div className={styles.sideMark}><Heart size={24} fill="currentColor" aria-hidden="true" /></div>
              <span className={styles.sideEyebrow}>A SPACE THAT'S YOURS</span>
              <h2>Every story begins with a name.</h2>
              <p>Gather the little details, the big stories, and the moments you want to keep close.</p>
              <div className={styles.sideRule} />
              <div className={styles.privacyNote}>
                <ShieldCheck size={19} aria-hidden="true" />
                <p>Your memories are private and under your control.</p>
              </div>
              <div className={styles.aiNote}>
                <Sparkles size={18} aria-hidden="true" />
                <p>AI experiences are digital representations created from the memories and information you choose to provide.</p>
              </div>
            </aside>
          </div>
          <footer className={styles.footer}>LIVE FOREVER <span>·</span> Built around memories, care and connection.</footer>
        </div>
      )}
    </main>
  );
}