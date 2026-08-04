import Link from "next/link";
import type { CSSProperties } from "react";
import { projects } from "./projects";
import { AppIcon } from "./components/AppIcon";

export default function Home() {
  return (
    <main className="home-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="home-intro" aria-labelledby="portfolio-title">
        <p className="edition-label">Portfolio · Edition 01</p>
        <h1 id="portfolio-title">
          Tian Xing<span>makes things.</span>
        </h1>
        <p className="intro-copy">
          Software, games, cinema, music tools, and experiments—nine projects
          made with equal parts systems thinking and play.
        </p>
        <div className="intro-rule">
          <span>Selected work</span>
          <span>2017—2026</span>
        </div>
        <p className="hint-copy">Choose an icon to open a project.</p>
      </section>

      <section className="device-stage" aria-label="Selected projects">
        <div className="device" aria-hidden="true">
          <div className="device-button volume-up" />
          <div className="device-button volume-down" />
          <div className="device-button mute" />
        </div>

        <div className="phone" role="group" aria-label="Tian Xing portfolio">
          <div className="phone-top">
            <span className="speaker" aria-hidden="true" />
            <span className="camera" aria-hidden="true" />
          </div>

          <div className="screen">
            <div className="status-bar" aria-hidden="true">
              <span className="signal">●●●●○</span>
              <span>9:41 AM</span>
              <span className="battery">100% ▰</span>
            </div>

            <div className="screen-titlebar">
              <span className="mini-mark">TX</span>
              <div>
                <strong>Selected Work</strong>
                <small>Nine things I care about</small>
              </div>
              <span className="edition-pill">01</span>
            </div>

            <nav className="app-grid" aria-label="Project apps">
              {projects.map((project, index) => (
                <Link
                  className="app-link"
                  href={`/projects/${project.slug}`}
                  key={project.slug}
                  style={{ "--delay": `${index * 55}ms` } as CSSProperties}
                >
                  <AppIcon project={project} />
                  <span className="app-name">{project.shortTitle}</span>
                </Link>
              ))}
            </nav>

            <div className="page-dots" aria-hidden="true">
              <span className="active" />
              <span />
            </div>

            <div className="phone-dock">
              <Link className="dock-link" href="/about" aria-label="About Tian Xing">
                <span className="about-icon"><i>TX</i></span>
                <span>About</span>
              </Link>
              <a className="dock-link" href="https://github.com/lovejzzz" target="_blank" rel="noreferrer" aria-label="Tian Xing on GitHub">
                <span className="github-icon"><i>GH</i></span>
                <span>GitHub</span>
              </a>
            </div>
          </div>

          <div className="home-button" aria-hidden="true"><span /></div>
        </div>
      </section>

      <footer className="home-footer">
        <span>New York</span>
        <span>Designed &amp; built by Tian Xing</span>
      </footer>
    </main>
  );
}
