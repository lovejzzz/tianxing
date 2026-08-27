"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { playSound } from "../sound";

export function AboutExperience() {
  const [time, setTime] = useState("9:41 AM");
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="about-page">
      <div className="about-device">
        <div className="about-screen">
          <div className="about-status" aria-label={`Current time ${time}`}><span>●●●●○</span><span>{time}</span><span>100% ▰</span></div>
          <div className="about-nav"><Link href="/" onClick={() => playSound("close")}>‹ Projects</Link><strong>About</strong><span /></div>
          <section className="about-profile">
            <div className="coming-icon coming-photo"><img src={`${base}/media/about/tian-xing.jpg`} alt="Tian Xing" /></div>
            <p>VISUAL ARTIST · FILMMAKER · BUILDER</p>
            <h1>I make ideas real.</h1>
            <span>Products, games, films, and tools—designed and shipped end to end.</span>
            <small>New York · Open to thoughtful collaborations.</small>
            <div className="about-actions">
              <a href="mailto:xingpicture@gmail.com?subject=Hello%20Tian" onClick={() => playSound("send")}>Email me</a>
              <a href="https://github.com/lovejzzz" target="_blank" rel="noreferrer" onClick={() => playSound("open")}>GitHub ↗</a>
            </div>
            <Link className="about-work-link" href="/" onClick={() => playSound("close")}>View selected work</Link>
          </section>
        </div>
        <Link className="home-button about-home-button" href="/" onClick={() => playSound("close")} aria-label="Return to the iPhone Home screen"><span /></Link>
      </div>
    </main>
  );
}
