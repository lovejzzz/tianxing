"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";

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
          <div className="about-nav"><Link href="/">‹ Projects</Link><strong>About</strong><span /></div>
          <section>
            <div className="coming-icon coming-photo"><img src={`${base}/media/about/tian-xing-iphone4.jpg`} alt="Tian Xing photographed on an iPhone 4" /></div>
            <p>PROFILE UPDATE</p>
            <h1>Coming Soon</h1>
            <span>The story is still being written.</span>
            <Link href="/">Return to Selected Work</Link>
          </section>
        </div>
        <Link className="home-button about-home-button" href="/" aria-label="Return to the iPhone Home screen"><span /></Link>
      </div>
    </main>
  );
}
