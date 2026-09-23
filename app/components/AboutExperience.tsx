"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { playSound } from "../sound";

// About opens on the same iPhone as the home page, as the Contacts "Info"
// card iOS 4 showed for a person: photo, name, grouped fields, action buttons.
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
      <div className="ambient ambient-one" />
      <section className="device-stage about-stage" aria-label="About Tian Xing">
        <div className="phone-product">
          <div className="device" aria-hidden="true">
            <div className="device-button volume-up" />
            <div className="device-button volume-down" />
            <div className="device-button mute" />
          </div>
          <div className="phone">
            <div className="phone-top">
              <span className="speaker" aria-hidden="true" />
              <span className="camera" aria-hidden="true" />
            </div>
            <div className="screen about-screen">
              <div className="status-bar" aria-label={`Current time ${time}`}>
                <span className="signal" aria-hidden="true"><i /><i /><i /><i /><i /></span>
                <span className="status-time">{time}</span>
                <span className="status-right"><span className="battery" aria-hidden="true"><b>100%</b><i /></span></span>
              </div>
              <div className="about-titlebar">
                <Link className="about-back" href="/" onClick={() => playSound("close")}>Home</Link>
                <strong>Info</strong>
              </div>

              <div className="about-card">
                <header className="about-card-head">
                  <img src={`${base}/media/about/tian-xing.jpg`} alt="Tian Xing" width={72} height={72} />
                  <div>
                    <h1>Tian Xing</h1>
                    <p>Visual artist · filmmaker · builder</p>
                  </div>
                </header>

                <dl className="about-group">
                  <div>
                    <dt>email</dt>
                    <dd><a href="mailto:xingpicture@gmail.com?subject=Hello%20Tian" onClick={() => playSound("send")}>xingpicture@gmail.com</a></dd>
                  </div>
                  <div>
                    <dt>github</dt>
                    <dd><a href="https://github.com/lovejzzz" target="_blank" rel="noreferrer" onClick={() => playSound("open")}>github.com/lovejzzz</a></dd>
                  </div>
                  <div>
                    <dt>home</dt>
                    <dd>New York</dd>
                  </div>
                </dl>

                <dl className="about-group about-notes">
                  <div>
                    <dt>notes</dt>
                    <dd>
                      <strong>I make ideas real.</strong>
                      <span>Products, games, films, and tools—designed and shipped end to end. Open to thoughtful collaborations.</span>
                    </dd>
                  </div>
                </dl>

                <div className="about-buttons">
                  <a href="mailto:xingpicture@gmail.com?subject=Hello%20Tian" onClick={() => playSound("send")}>Send Email</a>
                  <Link href="/" onClick={() => playSound("close")}>Selected Work</Link>
                </div>
              </div>
            </div>
            <Link className="home-button" href="/" onClick={() => playSound("close")} aria-label="Return to the iPhone Home screen"><span /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
