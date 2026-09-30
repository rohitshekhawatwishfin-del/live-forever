"use client";

import { Heart, MessageCircle, Mic, Video, Image as ImageIcon, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

const memories = [
  { title: "Family Moments", text: "Photos, videos and special moments together.", icon: ImageIcon },
  { title: "Their Stories", text: "Keep stories, letters, messages and memories safe.", icon: Heart },
  { title: "Talk & Connect", text: "A future AI experience built from approved memories.", icon: MessageCircle },
];

export default function Home() {
  return (
    <main>
      <nav className="nav">
        <div className="brand">
          <img className="brand-logo" src="/logo.png" alt="Live Forever" />
        </div>
        <Link
          className="nav-btn"
          href="/create"
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
        >
          Get Started
        </Link>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">MEMORIES • STORIES • CONNECTION</span>
          <h1>Keep the people you love<br /><span>close to your heart.</span></h1>
          <p>
            Live Forever is a digital memory space where families can preserve
            photos, videos, voices, stories and special moments — creating a
            meaningful digital presence for generations.
          </p>
          <div className="actions">
            <Link className="primary" href="/create" style={{ textDecoration: "none" }}>
              Create Memory Space <ArrowRight size={18} />
            </Link>
            <button className="secondary">Explore how it works</button>
          </div>
          <div className="trust"><ShieldCheck size={18} /> Privacy and family consent are at the heart of Live Forever.</div>
        </div>

        <div className="hero-card">
          <div className="orb orb1" />
          <div className="orb orb2" />
          <div className="memory-card">
            <div className="memory-icon">∞</div>
            <div className="memory-title">A memory that stays.</div>
            <div className="memory-text">Your moments, stories and voice — preserved with care.</div>
            <div className="mini-row">
              <div><ImageIcon size={16} /> Photos</div>
              <div><Mic size={16} /> Voice</div>
              <div><MessageCircle size={16} /> Chat</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">THE LIVE FOREVER EXPERIENCE</span>
          <h2>More than a memory box.</h2>
          <p>Start with memories today. Build a deeper digital connection over time.</p>
        </div>
        <div className="cards">
          {memories.map(({ title, text, icon: Icon }) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon"><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="coming">MVP FOUNDATION</span>
            </article>
          ))}
        </div>
      </section>

      <section className="presence">
        <div>
          <span className="eyebrow">OUR FUTURE</span>
          <h2>Chat. Voice. Video presence.</h2>
          <p>
            With the right permissions and approved memories, Live Forever can
            evolve into a digital AI experience that reflects the person’s
            stories, expressions and way of communicating.
          </p>
        </div>
        <div className="presence-actions">
          <div><MessageCircle /> Chat</div>
          <div><Mic /> Voice Call</div>
          <div><Video /> Video Presence</div>
        </div>
      </section>

      <footer>
        <div><strong>LIVE FOREVER</strong> · Built around memories, care and connection.</div>
        <div>AI-generated experiences will always be clearly identified as digital representations.</div>
      </footer>
    </main>
  );
}
