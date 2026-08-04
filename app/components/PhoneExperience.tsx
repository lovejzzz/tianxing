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
  | "mail"
  | "music";

type HomeApp = {
  id: NativeApp | "folder";
  label: string;
  badge?: string;
};

const homeApps: HomeApp[] = [
  { id: "messages", label: "Messages", badge: "1" },
  { id: "calendar", label: "Calendar" },
  { id: "photos", label: "Photos" },
  { id: "camera", label: "Camera" },
  { id: "weather", label: "Weather" },
  { id: "clock", label: "Clock" },
  { id: "maps", label: "Maps" },
  { id: "notes", label: "Notes" },
  { id: "folder", label: "Selected Work" },
];

const dockApps: Array<{ id: NativeApp | "folder"; label: string }> = [
  { id: "phone", label: "Phone" },
  { id: "mail", label: "Mail" },
  { id: "folder", label: "Selected Work" },
  { id: "music", label: "Music" },
];

type Origin = { x: number; y: number };

export function PhoneExperience() {
  const [mode, setMode] = useState<"folder" | "home" | "native">("folder");
  const [activeApp, setActiveApp] = useState<NativeApp | null>(null);
  const [closing, setClosing] = useState(false);
  const [origin, setOrigin] = useState<Origin>({ x: 50, y: 58 });
  const [time, setTime] = useState("9:41 AM");
  const [calendarDay, setCalendarDay] = useState("1");
  const [cameraFlash, setCameraFlash] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const transitionTimer = useRef<number | null>(null);
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      setCalendarDay(String(now.getDate()));
    };
    update();
    const timer = window.setInterval(update, 30_000);
    return () => {
      window.clearInterval(timer);
      if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    };
  }, []);

  const rememberOrigin = (element?: HTMLElement | null) => {
    const screen = screenRef.current?.getBoundingClientRect();
    const icon = element?.getBoundingClientRect();
    if (!screen || !icon) return;
    setOrigin({
      x: ((icon.left + icon.width / 2 - screen.left) / screen.width) * 100,
      y: ((icon.top + icon.height / 2 - screen.top) / screen.height) * 100,
    });
  };

  const openApp = (id: NativeApp | "folder", element?: HTMLElement | null) => {
    rememberOrigin(element);
    setClosing(false);
    if (id === "folder") {
      setActiveApp(null);
      setMode("folder");
      return;
    }
    setActiveApp(id);
    setMode("native");
  };

  const goHome = () => {
    if (mode === "home" || closing) return;
    setClosing(true);
    transitionTimer.current = window.setTimeout(() => {
      setMode("home");
      setActiveApp(null);
      setClosing(false);
    }, 410);
  };

  return (
    <section className="device-stage" aria-label="Interactive iPhone portfolio">
      <div className="device" aria-hidden="true">
        <div className="device-button volume-up" />
        <div className="device-button volume-down" />
        <div className="device-button mute" />
      </div>

      <div className="phone" role="application" aria-label="Tian Xing's iPhone">
        <div className="phone-top">
          <span className="speaker" aria-hidden="true" />
          <span className="camera" aria-hidden="true" />
        </div>

        <div className={`screen phone-mode-${mode}`} ref={screenRef}>
          <StatusBar time={time} />

          <div className={`phone-home-layer ${mode === "home" ? "is-active" : "is-background"}`}>
            <HomeScreen
              calendarDay={calendarDay}
              onOpenApp={(id, element) => openApp(id, element)}
            />
          </div>

          {mode !== "home" && (
            <div
              className={`phone-app-layer ${closing ? "is-closing" : "is-opening"}`}
              style={{
                "--origin-x": `${origin.x}%`,
                "--origin-y": `${origin.y}%`,
              } as React.CSSProperties}
            >
              {mode === "folder" && <FolderView />}
              {mode === "native" && activeApp && (
                <NativeAppView
                  app={activeApp}
                  base={base}
                  time={time}
                  cameraFlash={cameraFlash}
                  onShutter={() => {
                    setCameraFlash(true);
                    window.setTimeout(() => setCameraFlash(false), 180);
                  }}
                />
              )}
            </div>
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

function FolderView() {
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
            style={{ "--delay": `${index * 38}ms` } as React.CSSProperties}
          >
            <AppIcon project={project} />
            <span className="app-name">{project.shortTitle}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function HomeScreen({ calendarDay, onOpenApp }: {
  calendarDay: string;
  onOpenApp: (id: NativeApp | "folder", element: HTMLElement) => void;
}) {
  return (
    <div className="iphone-desktop">
      <div className="system-page" aria-label="iPhone Home screen">
        {homeApps.map((app) => (
          <button
            className="system-app"
            key={app.id}
            onClick={(event) => onOpenApp(app.id, event.currentTarget)}
          >
            <SystemAppIcon id={app.id} calendarDay={calendarDay} />
            {app.badge && <b className="app-badge">{app.badge}</b>}
            <span>{app.label}</span>
          </button>
        ))}
      </div>

      <div className="desktop-dock" aria-label="Favorite apps">
        {dockApps.map((app) => (
          <button
            className="system-app dock-system-app"
            key={app.id}
            onClick={(event) => onOpenApp(app.id, event.currentTarget)}
            aria-label={app.label}
            title={app.label}
          >
            <SystemAppIcon id={app.id === "folder" ? "safari" : app.id} calendarDay={calendarDay} />
          </button>
        ))}
      </div>
    </div>
  );
}

function SystemAppIcon({ id, calendarDay }: {
  id: HomeApp["id"] | "safari";
  calendarDay: string;
}) {
  if (id === "folder") {
    return (
      <span className="system-app-icon sys-folder">
        <i>{projects.slice(0, 9).map((project) => <AppIcon project={project} key={project.slug} />)}</i>
      </span>
    );
  }
  const marks: Record<string, string> = {
    messages: "",
    calendar: calendarDay,
    photos: "",
    camera: "",
    weather: "",
    clock: "",
    maps: "",
    notes: "",
    phone: "☎",
    mail: "✉",
    safari: "✦",
    music: "♫",
  };
  const month = id === "calendar" ? new Date().toLocaleDateString([], { month: "short" }).toUpperCase() : undefined;
  return <span className={`system-app-icon sys-${id}`} data-month={month}><i>{marks[id] ?? ""}</i></span>;
}

function NativeAppView({ app, base, time, cameraFlash, onShutter }: {
  app: NativeApp;
  base: string;
  time: string;
  cameraFlash: boolean;
  onShutter: () => void;
}) {
  const titles: Record<NativeApp, string> = {
    messages: "Messages",
    calendar: "Calendar",
    photos: "Photos",
    camera: "Camera",
    weather: "Weather",
    clock: "Clock",
    maps: "Maps",
    notes: "Notes",
    phone: "Phone",
    mail: "Mail",
    music: "Music",
  };

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
        {app === "phone" && <ContactApp base={base} />}
        {app === "mail" && <MailApp />}
        {app === "music" && <MusicApp />}
      </div>
    </div>
  );
}

function MessagesApp() {
  return (
    <div className="messages-list">
      <Link className="message-row" href="/projects/edutool"><span className="message-avatar">ED</span><div><strong>EduTool</strong><p>The course map is ready. Open the project.</p></div><time>now</time></Link>
      <Link className="message-row" href="/projects/bebop-puzzle"><span className="message-avatar jazz-avatar">♪</span><div><strong>Bebop Puzzle</strong><p>Your next jazz phrase is ready to play.</p></div><time>4:04</time></Link>
      <Link className="message-row" href="/projects/start-where-you-are"><span className="message-avatar film-avatar">▶</span><div><strong>Here We Go Studio</strong><p>Start Where You Are is screening now.</p></div><time>3:19</time></Link>
    </div>
  );
}

function CalendarApp() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const dayCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= dayCount ? day : "";
  });
  const month = now.toLocaleDateString([], { month: "long", year: "numeric" }).toUpperCase();
  return <div className="calendar-app"><p>{month}</p><div className="calendar-week"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div className="calendar-days">{cells.map((day, index) => <span key={index} className={day === now.getDate() ? "today" : ""}>{day}</span>)}</div><strong>Selected Work · tian.fun</strong></div>;
}

function PhotosApp({ base }: { base: string }) {
  const photos = [
    { src: "/media/about/tian-xing-photobooth.png", alt: "Tian Xing in a 2010 Photo Booth portrait" },
    { src: "/media/film/5279-projection-hi.jpg", alt: "5279 film emulation projection" },
    { src: "/media/projects/start-where-you-are.jpg", alt: "Start Where You Are film still" },
    { src: "/media/film/5279-scan-hi.jpg", alt: "5279 film emulation scan" },
    { src: "/media/projects/bebop-live.png", alt: "Bebop Puzzle" },
  ];
  const [selected, setSelected] = useState(0);
  return (
    <div className="photos-app">
      <div className="photo-feature"><img src={`${base}${photos[selected].src}`} alt={photos[selected].alt} /><span>Camera Roll</span></div>
      <div className="photo-grid">
        {photos.map((photo, index) => <button key={photo.src} className={selected === index ? "selected" : ""} onClick={() => setSelected(index)} aria-label={`View ${photo.alt}`}><img src={`${base}${photo.src}`} alt="" /></button>)}
      </div>
    </div>
  );
}

function CameraApp({ base, flash, onShutter }: { base: string; flash: boolean; onShutter: () => void }) {
  return <div className="camera-app"><div className="viewfinder"><img src={`${base}/media/about/tian-xing-photobooth.png`} alt="Tian Xing in the camera viewfinder" />{flash && <i />}</div><button onClick={onShutter} aria-label="Take photo"><span /></button></div>;
}

type WeatherData = { temperature: number; wind: number; code: number };

function WeatherApp() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph", { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setWeather({ temperature: data.current.temperature_2m, wind: data.current.wind_speed_10m, code: data.current.weather_code }))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  const description = weather ? weatherLabel(weather.code) : "Updating weather";
  return <div className="weather-app"><p>NEW YORK</p><strong>{weather ? `${Math.round(weather.temperature)}°` : "—"}</strong><span>{description}</span><div><i>NOW<br /><b>{weather ? `${Math.round(weather.temperature)}°` : "—"}</b></i><i>WIND<br /><b>{weather ? `${Math.round(weather.wind)} mph` : "—"}</b></i><i>LOCAL<br /><b>NYC</b></i></div><small>Live conditions from Open-Meteo</small></div>;
}

function weatherLabel(code: number) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  return "Thunderstorms";
}

function ClockApp({ time }: { time: string }) {
  const now = new Date();
  const minute = now.getMinutes() * 6;
  const hour = (now.getHours() % 12) * 30 + now.getMinutes() / 2;
  return <div className="clock-app"><div className="analog-clock"><i style={{ transform: `rotate(${minute}deg)` }} /><b style={{ transform: `rotate(${hour}deg)` }} /></div><strong>{time}</strong><span>New York</span></div>;
}

function MapsApp() {
  return <div className="maps-app"><iframe title="Map of New York" src="https://www.openstreetmap.org/export/embed.html?bbox=-74.029%2C40.698%2C-73.982%2C40.728&amp;layer=mapnik&amp;marker=40.7128%2C-74.0060" /><a href="https://www.openstreetmap.org/?mlat=40.7128&amp;mlon=-74.0060#map=14/40.7128/-74.0060" target="_blank" rel="noreferrer">Open New York map</a></div>;
}

function NotesApp() {
  return <div className="notes-app"><textarea aria-label="A note from Tian Xing" defaultValue={"This iPhone is my brain.\n\nSoftware, images, sound, cinema, games—and the strange places where they overlap.\n\nKeep making. Keep looking.\n\n— Tian"} /></div>;
}

function ContactApp({ base }: { base: string }) {
  return <div className="contact-app"><img className="contact-photo" src={`${base}/media/about/tian-xing-photobooth.png`} alt="Tian Xing" /><h2>Tian Xing</h2><p>Designer · filmmaker · builder</p><a href="https://tian.fun" target="_blank" rel="noreferrer">tian.fun</a><a href="https://github.com/lovejzzz" target="_blank" rel="noreferrer">GitHub</a><a href="https://www.youtube.com/@HereWeGoFilmStudio" target="_blank" rel="noreferrer">Film Studio</a></div>;
}

function MailApp() {
  return <div className="mail-app"><p>INBOX</p><Link href="/projects/surge-method"><article><strong>Surge Method</strong><time>Today</time><h2>Push. Recover. Come back stronger.</h2><span>Open the App Store project and see the complete product story.</span></article></Link><Link href="/projects/quicky-resume"><article><strong>Quicky Resume</strong><time>Yesterday</time><h2>Your next resume is ready.</h2><span>Open the working resume builder.</span></article></Link></div>;
}

function MusicApp() {
  return <div className="music-app"><iframe data-testid="spotify-embed" title="The Jazz I Love 2022 Spotify playlist" src="https://open.spotify.com/embed/playlist/6hYj1RoYJ85hj8c1kaDFJ2?utm_source=generator&amp;theme=0" width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" /><a href="https://open.spotify.com/playlist/6hYj1RoYJ85hj8c1kaDFJ2" target="_blank" rel="noreferrer">Open The Jazz I Love [2022] in Spotify</a></div>;
}
