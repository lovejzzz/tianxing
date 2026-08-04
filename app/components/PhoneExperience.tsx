"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { projects } from "../projects";
import { AppIcon } from "./AppIcon";

type NativeApp =
  | "messages"
  | "calendar"
  | "photos"
  | "camera"
  | "weather"
  | "clock"
  | "maps"
  | "notes"
  | "phone"
  | "mail";

type HomeApp = {
  id: NativeApp | "folder" | "appstore" | "youtube" | "github" | "about";
  label: string;
  badge?: string;
};

const firstPage: HomeApp[] = [
  { id: "messages", label: "Messages", badge: "1" },
  { id: "calendar", label: "Calendar" },
  { id: "photos", label: "Photos" },
  { id: "camera", label: "Camera" },
  { id: "weather", label: "Weather" },
  { id: "clock", label: "Clock" },
  { id: "maps", label: "Maps" },
  { id: "notes", label: "Notes" },
  { id: "folder", label: "Selected Work" },
  { id: "appstore", label: "App Store" },
  { id: "youtube", label: "YouTube" },
  { id: "about", label: "About" },
];

const secondPage = projects.slice(0, 8);
const externalApps: Partial<Record<HomeApp["id"], string>> = {
  appstore: "https://apps.apple.com/us/app/surge-method/id6758555101",
  youtube: "https://www.youtube.com/@HereWeGoFilmStudio",
  github: "https://github.com/lovejzzz",
};

export function PhoneExperience() {
  const [mode, setMode] = useState<"folder" | "home" | "native">("folder");
  const [activeApp, setActiveApp] = useState<NativeApp | null>(null);
  const [page, setPage] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [time, setTime] = useState("9:41 AM");
  const [cameraFlash, setCameraFlash] = useState(false);
  const drag = useRef({ startX: 0, lastX: 0, active: false, moved: false });
  const suppressClickUntil = useRef(0);
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const openHomeApp = (app: HomeApp) => {
    if (Date.now() < suppressClickUntil.current) return;
    if (app.id === "folder") {
      setMode("folder");
      return;
    }
    if (app.id === "about") {
      setActiveApp("photos");
      setMode("native");
      return;
    }
    if (externalApps[app.id]) {
      window.open(externalApps[app.id], "_blank", "noopener,noreferrer");
      return;
    }
    setActiveApp(app.id as NativeApp);
    setMode("native");
  };

  const goHome = () => {
    if (mode === "home") setPage(0);
    setMode("home");
    setActiveApp(null);
    setDragX(0);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { startX: event.clientX, lastX: event.clientX, active: true, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const delta = event.clientX - drag.current.startX;
    drag.current.lastX = event.clientX;
    if (Math.abs(delta) > 6) drag.current.moved = true;
    const atEdge = (page === 0 && delta > 0) || (page === 1 && delta < 0);
    setDragX(atEdge ? delta * 0.22 : delta);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const delta = event.clientX - drag.current.startX;
    if (drag.current.moved) suppressClickUntil.current = Date.now() + 180;
    if (delta < -48 && page === 0) setPage(1);
    if (delta > 48 && page === 1) setPage(0);
    drag.current.active = false;
    setDragX(0);
  };

  return (
    <section className="device-stage" aria-label="Interactive iPhone portfolio">
      <div className="device" aria-hidden="true">
        <div className="device-button volume-up" />
        <div className="device-button volume-down" />
        <div className="device-button mute" />
      </div>

      <div className="phone" role="application" aria-label="Tian Xing's iPhone portfolio">
        <div className="phone-top">
          <span className="speaker" aria-hidden="true" />
          <span className="camera" aria-hidden="true" />
        </div>

        <div className={`screen phone-mode-${mode}`}>
          <StatusBar time={time} />

          {mode === "folder" && (
            <FolderView base={base} />
          )}

          {mode === "home" && (
            <HomeScreen
              base={base}
              page={page}
              dragX={dragX}
              onPageChange={setPage}
              onOpenApp={openHomeApp}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onOpenNative={(app) => { setActiveApp(app); setMode("native"); }}
              onOpenFolder={() => setMode("folder")}
              onLinkClick={(event) => {
                if (Date.now() < suppressClickUntil.current) event.preventDefault();
              }}
            />
          )}

          {mode === "native" && activeApp && (
            <NativeAppView app={activeApp} base={base} time={time} cameraFlash={cameraFlash} onShutter={() => {
              setCameraFlash(true);
              window.setTimeout(() => setCameraFlash(false), 180);
            }} />
          )}
        </div>

        <button className="home-button" onClick={goHome} aria-label="Go to iPhone Home screen">
          <span />
        </button>
      </div>
    </section>
  );
}

function StatusBar({ time }: { time: string }) {
  return (
    <div className="status-bar" aria-label={`Current time ${time}`}>
      <span className="signal" aria-hidden="true">●●●●○</span>
      <span>{time}</span>
      <span className="battery" aria-hidden="true">100% ▰</span>
    </div>
  );
}

function FolderView({ base }: { base: string }) {
  return (
    <div className="folder-screen">
      <div className="screen-titlebar">
        <span className="mini-mark">TX</span>
        <div><strong>Selected Work</strong></div>
        <span className="edition-pill">01</span>
      </div>

      <nav className="app-grid" aria-label="Selected projects">
        {projects.map((project, index) => (
          <Link
            className="app-link"
            href={`/projects/${project.slug}`}
            key={project.slug}
            style={{ "--delay": `${index * 55}ms` } as React.CSSProperties}
          >
            <AppIcon project={project} />
            <span className="app-name">{project.shortTitle}</span>
          </Link>
        ))}
      </nav>

      <div className="folder-caption">Press Home to close the folder</div>

      <div className="phone-dock">
        <Link className="dock-link" href="/about" aria-label="About Tian Xing">
          <span className="about-photo-icon"><img src={`${base}/media/about/tian-xing.jpg`} alt="" /></span>
          <span>About</span>
        </Link>
        <a className="dock-link" href="https://github.com/lovejzzz" target="_blank" rel="noreferrer" aria-label="Tian Xing on GitHub">
          <span className="github-icon"><i>GH</i></span>
          <span>GitHub</span>
        </a>
      </div>
    </div>
  );
}

type HomeScreenProps = {
  base: string;
  page: number;
  dragX: number;
  onPageChange: (page: number) => void;
  onOpenApp: (app: HomeApp) => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onOpenNative: (app: NativeApp) => void;
  onOpenFolder: () => void;
  onLinkClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

function HomeScreen({ base, page, dragX, onPageChange, onOpenApp, onPointerDown, onPointerMove, onPointerUp, onOpenNative, onOpenFolder, onLinkClick }: HomeScreenProps) {
  return (
    <div className="iphone-desktop">
      <div
        className={`home-pages-viewport ${dragX ? "is-dragging" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") onPageChange(1);
          if (event.key === "ArrowLeft") onPageChange(0);
        }}
        tabIndex={0}
        aria-label="iPhone Home screen. Drag or use arrow keys to change page."
      >
        <div className="home-pages" style={{ transform: `translateX(calc(-${page * 50}% + ${dragX}px))` }}>
          <div className="home-page system-page">
            {firstPage.map((app) => (
              <button className="system-app" key={app.id} onClick={() => onOpenApp(app)}>
                <SystemAppIcon id={app.id} base={base} />
                {app.badge && <b className="app-badge">{app.badge}</b>}
                <span>{app.label}</span>
              </button>
            ))}
          </div>
          <div className="home-page creator-page">
            {secondPage.map((project) => (
              <Link className="system-app" href={`/projects/${project.slug}`} key={project.slug} onClick={onLinkClick}>
                <AppIcon project={project} />
                <span>{project.shortTitle}</span>
              </Link>
            ))}
            <button className="system-app" onClick={() => onOpenApp({ id: "github", label: "GitHub" })}>
              <SystemAppIcon id="github" base={base} /><span>GitHub</span>
            </button>
            <Link className="system-app" href="/about" onClick={onLinkClick}>
              <SystemAppIcon id="about" base={base} /><span>About</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="home-page-controls" role="group" aria-label="Home screen pages">
        {[0, 1].map((pageNumber) => (
          <button key={pageNumber} className={page === pageNumber ? "active" : ""} onClick={() => onPageChange(pageNumber)} aria-label={`Go to page ${pageNumber + 1}`} aria-current={page === pageNumber ? "page" : undefined}><span /></button>
        ))}
      </div>

      <div className="desktop-dock">
        <button className="system-app dock-system-app" onClick={() => onOpenNative("phone")}><SystemAppIcon id="phone" base={base} /><span>Phone</span></button>
        <button className="system-app dock-system-app" onClick={() => onOpenNative("mail")}><SystemAppIcon id="mail" base={base} /><span>Mail</span></button>
        <button className="system-app dock-system-app" onClick={onOpenFolder}><SystemAppIcon id="safari" base={base} /><span>Portfolio</span></button>
        <a className="system-app dock-system-app" href="https://lovejzzz.github.io/Slotronome/" target="_blank" rel="noreferrer"><SystemAppIcon id="ipod" base={base} /><span>iPod</span></a>
      </div>
    </div>
  );
}

function SystemAppIcon({ id, base }: { id: HomeApp["id"] | "phone" | "mail" | "safari" | "ipod"; base: string }) {
  if (id === "about") return <span className="system-app-icon sys-about"><img src={`${base}/media/about/tian-xing.jpg`} alt="" /></span>;
  if (id === "folder") return (
    <span className="system-app-icon sys-folder"><i>{projects.slice(0, 9).map((project) => <AppIcon project={project} key={project.slug} />)}</i></span>
  );
  const marks: Record<string, string> = {
    messages: "●", calendar: "4", photos: "✿", camera: "", weather: "☀", clock: "", maps: "⌖", notes: "", appstore: "A", youtube: "▶", github: "GH", phone: "☎", mail: "✉", safari: "✦", ipod: "♫",
  };
  return <span className={`system-app-icon sys-${id}`}><i>{marks[id] ?? "•"}</i></span>;
}

function NativeAppView({ app, base, time, cameraFlash, onShutter }: { app: NativeApp; base: string; time: string; cameraFlash: boolean; onShutter: () => void }) {
  const titles: Record<NativeApp, string> = { messages: "Messages", calendar: "Calendar", photos: "Photos", camera: "Camera", weather: "Weather", clock: "Clock", maps: "Maps", notes: "Notes", phone: "Phone", mail: "Mail" };
  return (
    <div className={`native-app native-${app}`}>
      <div className="native-titlebar"><strong>{titles[app]}</strong></div>
      <div className="native-content">
        {app === "messages" && <MessagesApp />}
        {app === "calendar" && <CalendarApp />}
        {app === "photos" && <PhotosApp base={base} />}
        {app === "camera" && <CameraApp base={base} flash={cameraFlash} onShutter={onShutter} />}
        {app === "weather" && <WeatherApp />}
        {app === "clock" && <ClockApp time={time} />}
        {app === "maps" && <MapsApp />}
        {app === "notes" && <NotesApp />}
        {app === "phone" && <ContactApp />}
        {app === "mail" && <MailApp />}
      </div>
      <p className="native-home-hint">Press the Home button to close</p>
    </div>
  );
}

function MessagesApp() { return <div className="messages-list"><div className="message-row"><span className="message-avatar">TX</span><div><strong>Selected Work</strong><p>Nine projects. One tiny phone. Thanks for visiting.</p></div><time>now</time></div><div className="message-row"><span className="message-avatar jazz-avatar">♪</span><div><strong>Bebop Puzzle</strong><p>Your next phrase is ready to play.</p></div><time>4:04</time></div></div>; }
function CalendarApp() { const days = Array.from({ length: 35 }, (_, index) => index < 5 ? "" : index - 4); return <div className="calendar-app"><p>AUGUST 2026</p><div className="calendar-week"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div className="calendar-days">{days.map((day, index) => <span key={index} className={day === 4 ? "today" : ""}>{day}</span>)}</div><strong>Selected Work is live.</strong></div>; }
function PhotosApp({ base }: { base: string }) { const photos = ["/media/about/tian-xing.jpg", "/media/projects/edutool-live.png", "/media/projects/bebop-live.png", "/media/projects/quicky-live.png", "/media/projects/5279-live.png", "/media/projects/start-where-you-are.jpg"]; return <div className="photos-app"><div className="photo-feature"><img src={`${base}${photos[0]}`} alt="Tian Xing" /><span>About · Coming Soon</span></div><div className="photo-grid">{photos.slice(1).map((src) => <img key={src} src={`${base}${src}`} alt="Project thumbnail" />)}</div></div>; }
function CameraApp({ base, flash, onShutter }: { base: string; flash: boolean; onShutter: () => void }) { return <div className="camera-app"><div className="viewfinder"><img src={`${base}/media/about/tian-xing.jpg`} alt="Tian Xing in the camera viewfinder" />{flash && <i />}</div><button onClick={onShutter} aria-label="Take photo"><span /></button></div>; }
function WeatherApp() { return <div className="weather-app"><p>NEW YORK</p><strong>78°</strong><span>Clear ideas</span><div><i>NOW<br /><b>78°</b></i><i>6 PM<br /><b>76°</b></i><i>9 PM<br /><b>71°</b></i></div><small>Perfect weather to ship something.</small></div>; }
function ClockApp({ time }: { time: string }) { return <div className="clock-app"><div className="analog-clock"><i /><b /></div><strong>{time}</strong><span>New York</span></div>; }
function MapsApp() { return <div className="maps-app"><div className="map-road road-one" /><div className="map-road road-two" /><div className="map-road road-three" /><span className="map-pin">TX</span><strong>NEW YORK</strong><small>You are here, making things.</small></div>; }
function NotesApp() { return <div className="notes-app"><textarea aria-label="A note from Tian Xing" defaultValue={"Ship the work.\n\nStay curious about systems, images, sound, games, and the strange places where they overlap.\n\n— Tian"} /></div>; }
function ContactApp() { return <div className="contact-app"><div className="contact-monogram">TX</div><h2>Tian Xing</h2><p>Designer · filmmaker · builder</p><a href="https://github.com/lovejzzz" target="_blank" rel="noreferrer">GitHub</a><a href="https://www.youtube.com/@HereWeGoFilmStudio" target="_blank" rel="noreferrer">YouTube</a></div>; }
function MailApp() { return <div className="mail-app"><p>INBOX</p><article><strong>From: Tian Xing</strong><time>Today</time><h2>Thanks for stopping by.</h2><span>The best way to reach the work is through GitHub or the project links throughout the portfolio.</span><a href="https://github.com/lovejzzz" target="_blank" rel="noreferrer">Open GitHub ↗</a></article></div>; }
