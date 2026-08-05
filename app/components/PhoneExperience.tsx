"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { projects } from "../projects";
import { portfolioPhotos } from "../photoManifest";
import { AppIcon } from "./AppIcon";

type NativeApp =
  | "messages"
  | "calendar"
  | "photos"
  | "camera"
  | "weather"
  | "clock"
  | "notes"
  | "phone"
  | "mail"
  | "safari"
  | "music";

type HomeApp = {
  id: NativeApp | "folder";
  label: string;
};

type CapturedPhoto = {
  id: string;
  src: string;
  createdAt: string;
};

const homeApps: HomeApp[] = [
  { id: "messages", label: "Messages" },
  { id: "calendar", label: "Calendar" },
  { id: "photos", label: "Photos" },
  { id: "camera", label: "Camera" },
  { id: "weather", label: "Weather" },
  { id: "clock", label: "Clock" },
  { id: "notes", label: "Notes" },
  { id: "folder", label: "Selected Work" },
];

const dockApps: HomeApp[] = [
  { id: "phone", label: "Phone" },
  { id: "mail", label: "Mail" },
  { id: "safari", label: "Safari" },
  { id: "music", label: "Music" },
];

const PHOTO_STORAGE_KEY = "tian-iphone-camera-roll";
type Origin = { x: number; y: number };

export function PhoneExperience() {
  const [mode, setMode] = useState<"folder" | "home" | "native">("folder");
  const [activeApp, setActiveApp] = useState<NativeApp | null>(null);
  const [closing, setClosing] = useState(false);
  const [origin, setOrigin] = useState<Origin>({ x: 50, y: 58 });
  const [time, setTime] = useState("9:41 AM");
  const [calendarDay, setCalendarDay] = useState("1");
  const [captures, setCaptures] = useState<CapturedPhoto[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(PHOTO_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
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

  const saveCapture = (src: string) => {
    setCaptures((current) => {
      const next = [{ id: crypto.randomUUID(), src, createdAt: new Date().toISOString() }, ...current].slice(0, 12);
      try {
        window.localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Large camera rolls may exceed private-browser storage; the session copy remains available.
      }
      return next;
    });
  };

  const deleteCapture = (id: string) => {
    setCaptures((current) => {
      const next = current.filter((photo) => photo.id !== id);
      try {
        window.localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // The in-memory camera roll still reflects the deletion for this session.
      }
      return next;
    });
  };

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
    }, 390);
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
            <HomeScreen calendarDay={calendarDay} onOpenApp={openApp} />
          </div>

          {mode !== "home" && (
            <div
              className={`phone-app-layer ${closing ? "is-closing" : "is-opening"}`}
              style={{ "--origin-x": `${origin.x}%`, "--origin-y": `${origin.y}%` } as CSSProperties}
            >
              {mode === "folder" && <FolderView />}
              {mode === "native" && activeApp && (
                <NativeAppView
                  app={activeApp}
                  base={base}
                  time={time}
                  captures={captures}
                  onCapture={saveCapture}
                  onDeleteCapture={deleteCapture}
                  onOpenWork={() => openApp("folder")}
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
      <span className="signal" aria-hidden="true"><i /><i /><i /><i /><i /></span>
      <span>{time}</span>
      <span className="battery" aria-hidden="true"><b>100%</b><i /></span>
    </div>
  );
}

function FolderView() {
  return (
    <div className="folder-screen">
      <div className="screen-titlebar work-titlebar">
        <span className="mini-mark">TX</span>
        <strong>Selected Work</strong>
      </div>

      <nav className="app-grid" aria-label="Selected projects">
        {projects.map((project, index) => (
          <Link
            className="app-link"
            href={`/projects/${project.slug}`}
            key={project.slug}
            style={{ "--delay": `${index * 32}ms` } as CSSProperties}
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
  onOpenApp: (id: NativeApp | "folder", element?: HTMLElement | null) => void;
}) {
  return (
    <div className="iphone-desktop">
      <div className="system-page" aria-label="iPhone Home screen">
        {homeApps.map((app) => (
          <button className="system-app" key={app.id} onClick={(event) => onOpenApp(app.id, event.currentTarget)}>
            <SystemAppIcon id={app.id} calendarDay={calendarDay} />
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
            <SystemAppIcon id={app.id} calendarDay={calendarDay} />
          </button>
        ))}
      </div>
    </div>
  );
}

function SystemAppIcon({ id, calendarDay }: {
  id: HomeApp["id"];
  calendarDay: string;
}) {
  if (id === "folder") {
    return (
      <span className="system-app-icon sys-folder">
        <i>{projects.slice(0, 9).map((project) => <AppIcon project={project} key={project.slug} />)}</i>
      </span>
    );
  }
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const icon = id === "music" ? "music" : id;
  if (id === "calendar") {
    const weekday = new Date().toLocaleDateString([], { weekday: "long" });
    return (
      <span className="system-app-icon sys-authentic authentic-calendar">
        <img src={`${base}/media/ios4/icons/calendar.png`} alt="" aria-hidden="true" />
        <span className="calendar-weekday">{weekday}</span>
        <span className="calendar-icon-day">{calendarDay}</span>
      </span>
    );
  }
  return (
    <span className={`system-app-icon sys-authentic sys-${id}`}>
      <img src={`${base}/media/ios4/icons/${icon}.png`} alt="" aria-hidden="true" />
    </span>
  );
}

function NativeAppView({ app, base, time, captures, onCapture, onDeleteCapture, onOpenWork }: {
  app: NativeApp;
  base: string;
  time: string;
  captures: CapturedPhoto[];
  onCapture: (src: string) => void;
  onDeleteCapture: (id: string) => void;
  onOpenWork: () => void;
}) {
  const titles: Record<NativeApp, string> = {
    messages: "New Message",
    calendar: "Calendar",
    photos: "Photos",
    camera: "Camera",
    weather: "Weather",
    clock: "Clock",
    notes: "Notes",
    phone: "Tian Xing",
    mail: "Contact",
    safari: "Safari",
    music: "Music",
  };

  return (
    <div className={`native-app native-${app}`}>
      <div className="native-titlebar"><strong>{titles[app]}</strong></div>
      <div className="native-content">
        {app === "messages" && <MessagesApp />}
        {app === "calendar" && <CalendarApp />}
        {app === "photos" && <PhotosApp base={base} captures={captures} />}
        {app === "camera" && <CameraApp captures={captures} onCapture={onCapture} onDeleteCapture={onDeleteCapture} />}
        {app === "weather" && <WeatherApp />}
        {app === "clock" && <ClockApp time={time} />}
        {app === "notes" && <NotesApp />}
        {app === "phone" && <ContactApp base={base} />}
        {app === "mail" && <MailApp />}
        {app === "safari" && <SafariApp onOpenWork={onOpenWork} />}
        {app === "music" && <MusicApp />}
      </div>
    </div>
  );
}

function MessagesApp() {
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "Portfolio visitor");
    const email = String(form.get("email") ?? "");
    const message = String(form.get("message") ?? "");
    const subject = encodeURIComponent(`Message from ${name} via tian.fun`);
    const body = encodeURIComponent(`${message}\n\nReply to: ${email}`);
    setSent(true);
    window.location.href = `mailto:xingpicture@gmail.com?subject=${subject}&body=${body}`;
  };
  return (
    <form className="message-compose" onSubmit={submit}>
      <div className="compose-recipient"><span>To:</span><b>Tian Xing</b></div>
      <label><span>Your name</span><input name="name" required autoComplete="name" /></label>
      <label><span>Your email</span><input name="email" required type="email" autoComplete="email" /></label>
      <label className="message-body"><span>Message</span><textarea name="message" required placeholder="Say hello…" /></label>
      <button type="submit">Send</button>
      <small>{sent ? "Your mail app is ready—press Send there to finish." : "This opens your email app with the message addressed to Tian."}</small>
    </form>
  );
}

type CalendarEvents = Record<string, string[]>;

function CalendarApp() {
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today.getDate());
  const [events, setEvents] = useState<CalendarEvents>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = window.localStorage.getItem("tian-iphone-calendar");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [draft, setDraft] = useState("");

  const firstDay = month.getDay();
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= dayCount ? day : 0;
  });
  const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(selected).padStart(2, "0")}`;
  const monthTitle = month.toLocaleDateString([], { month: "long", year: "numeric" });
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();

  const moveMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelected(1);
  };
  const addEvent = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    const next = { ...events, [key]: [...(events[key] ?? []), draft.trim()] };
    setEvents(next);
    setDraft("");
    try { localStorage.setItem("tian-iphone-calendar", JSON.stringify(next)); } catch { /* local-only calendar */ }
  };

  return (
    <div className="calendar-app">
      <div className="calendar-toolbar">
        <button onClick={() => moveMonth(-1)} aria-label="Previous month">‹</button>
        <strong>{monthTitle}</strong>
        <button onClick={() => moveMonth(1)} aria-label="Next month">›</button>
      </div>
      <div className="calendar-week"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
      <div className="calendar-days">
        {cells.map((day, index) => (
          <button
            key={index}
            disabled={!day}
            className={`${day === selected ? "selected" : ""} ${isCurrentMonth && day === today.getDate() ? "today" : ""}`}
            onClick={() => day && setSelected(day)}
          >
            {day || ""}{day && events[`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`]?.length ? <i /> : null}
          </button>
        ))}
      </div>
      <section className="calendar-agenda">
        <h3>{new Date(month.getFullYear(), month.getMonth(), selected).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</h3>
        {(events[key] ?? []).map((item, index) => <p key={`${item}-${index}`}><i />{item}</p>)}
        {!events[key]?.length && <p className="no-events">No events</p>}
        <form onSubmit={addEvent}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add an event" aria-label="Add event" /><button>Add</button></form>
      </section>
    </div>
  );
}

function PhotosApp({ base, captures }: { base: string; captures: CapturedPhoto[] }) {
  const photos = useMemo(() => [
    ...captures.map((photo) => ({ id: photo.id, src: photo.src, alt: `Camera photo taken ${new Date(photo.createdAt).toLocaleString()}`, captured: true })),
    ...portfolioPhotos.map((photo) => ({ ...photo, id: photo.src, src: `${base}${photo.src}`, captured: false })),
  ], [base, captures]);
  const [selected, setSelected] = useState(photos[0]?.id ?? "");
  const selectedPhoto = photos.find((photo) => photo.id === selected) ?? photos[0];

  return (
    <div className="photos-app">
      {selectedPhoto && <div className="photo-feature"><img src={selectedPhoto.src} alt={selectedPhoto.alt} /><span>{selectedPhoto.captured ? "Camera Roll" : "Tian Xing · Portfolio"}</span></div>}
      <div className="photo-album-bar"><strong>Camera Roll</strong><span>{photos.length} Photos</span></div>
      <div className="photo-grid">
        {photos.map((photo) => (
          <button key={photo.id} className={selected === photo.id ? "selected" : ""} onClick={() => setSelected(photo.id)} aria-label={`View ${photo.alt}`}>
            <img src={photo.src} alt="" />{photo.captured && <i>NEW</i>}
          </button>
        ))}
      </div>
    </div>
  );
}

function CameraApp({ captures, onCapture, onDeleteCapture }: {
  captures: CapturedPhoto[];
  onCapture: (src: string) => void;
  onDeleteCapture: (id: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"starting" | "ready" | "blocked">("starting");
  const [flash, setFlash] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [reviewing, setReviewing] = useState(false);
  const latest = captures[0];

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (nextFacing: "user" | "environment") => {
    stopCamera();
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: nextFacing }, width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("ready");
    } catch {
      setStatus("blocked");
    }
  }, [stopCamera]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void startCamera("environment"); }, 0);
    return () => {
      window.clearTimeout(timer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const switchCamera = () => {
    const next = facing === "environment" ? "user" : "environment";
    setFacing(next);
    startCamera(next);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    const sourceRatio = video.videoWidth / video.videoHeight;
    const targetRatio = 4 / 3;
    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
    if (sourceRatio > targetRatio) {
      sw = video.videoHeight * targetRatio;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / targetRatio;
      sy = (video.videoHeight - sh) / 2;
    }
    context.drawImage(video, sx, sy, sw, sh, 0, 0, 640, 480);
    const frame = context.getImageData(0, 0, 640, 480);
    for (let index = 0; index < frame.data.length; index += 4) {
      const pixel = index / 4;
      const x = pixel % 640;
      const y = Math.floor(pixel / 640);
      const dx = (x - 320) / 320;
      const dy = (y - 240) / 240;
      const vignette = 1 - Math.min(0.18, (dx * dx + dy * dy) * 0.09);
      const grain = Math.sin(pixel * 12.9898) * 3.2;
      frame.data[index] = Math.max(0, Math.min(255, (((frame.data[index] - 128) * 1.08 + 128) * 1.035 + grain) * vignette));
      frame.data[index + 1] = Math.max(0, Math.min(255, (((frame.data[index + 1] - 128) * 1.06 + 128) + grain * 0.45) * vignette));
      frame.data[index + 2] = Math.max(0, Math.min(255, (((frame.data[index + 2] - 128) * 1.08 + 128) * 0.94 - grain * 0.2) * vignette));
    }
    context.putImageData(frame, 0, 0);
    const src = canvas.toDataURL("image/jpeg", 0.82);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 180);
    onCapture(src);
  };

  return (
    <div className="camera-app">
      <div className="camera-toolbar"><button onClick={switchCamera} disabled={status !== "ready"} aria-label="Switch camera">↻</button><span>HDR Off</span><b>AUTO</b></div>
      <div className="viewfinder">
        <video ref={videoRef} muted playsInline aria-label="Live camera view" />
        <div className="camera-grid-lines" aria-hidden="true" />
        {status === "starting" && <p>Starting camera…</p>}
        {status === "blocked" && <div className="camera-permission"><strong>Camera Access</strong><span>Allow camera access to take an iPhone 4-style photo.</span><button onClick={() => startCamera(facing)}>Try Again</button></div>}
        {flash && <i className="camera-flash" />}
      </div>
      <div className="camera-controls">
        <button className="latest-shot" onClick={() => setReviewing(true)} disabled={!latest} aria-label={latest ? `Open latest photo. ${captures.length} photos in camera roll` : "Camera roll is empty"}>
          {latest && <img src={latest.src} alt="Latest capture" />}
        </button>
        <button className="shutter" onClick={takePhoto} disabled={status !== "ready"} aria-label="Take photo"><span /></button>
        <span className="camera-mode">PHOTO</span>
      </div>
      {reviewing && latest && (
        <div className="camera-review" role="dialog" aria-modal="true" aria-label="Latest camera photo">
          <div className="camera-review-toolbar">
            <button onClick={() => setReviewing(false)}>Camera</button>
            <strong>Camera Roll</strong>
            <span>1 of {captures.length}</span>
          </div>
          <div className="camera-review-photo"><img src={latest.src} alt={`Photo taken ${new Date(latest.createdAt).toLocaleString()}`} /></div>
          <div className="camera-review-actions">
            <time dateTime={latest.createdAt}>{new Date(latest.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
            <button onClick={() => { onDeleteCapture(latest.id); setReviewing(false); }} aria-label="Delete latest photo">Delete Photo</button>
          </div>
        </div>
      )}
    </div>
  );
}

type WeatherData = {
  location: string;
  temperature: number;
  apparent: number;
  humidity: number;
  wind: number;
  code: number;
  high: number;
  low: number;
  daily: Array<{ day: string; code: number; high: number; low: number }>;
};

function WeatherApp() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState("");

  const loadWeather = useCallback(async (latitude: number, longitude: number, location: string) => {
    setError("");
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(latitude));
      url.searchParams.set("longitude", String(longitude));
      url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m");
      url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
      url.searchParams.set("temperature_unit", "fahrenheit");
      url.searchParams.set("wind_speed_unit", "mph");
      url.searchParams.set("timezone", "auto");
      const response = await fetch(url);
      if (!response.ok) throw new Error("weather");
      const data = await response.json();
      setWeather({
        location,
        temperature: data.current.temperature_2m,
        apparent: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        wind: data.current.wind_speed_10m,
        code: data.current.weather_code,
        high: data.daily.temperature_2m_max[0],
        low: data.daily.temperature_2m_min[0],
        daily: data.daily.time.slice(1, 6).map((date: string, index: number) => ({
          day: new Date(`${date}T12:00:00`).toLocaleDateString([], { weekday: "short" }),
          code: data.daily.weather_code[index + 1],
          high: data.daily.temperature_2m_max[index + 1],
          low: data.daily.temperature_2m_min[index + 1],
        })),
      });
    } catch {
      setError("Weather is temporarily unavailable.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadWeather(40.7128, -74.0060, "New York"); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWeather]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => loadWeather(position.coords.latitude, position.coords.longitude, "Current Location"),
      () => setError("Location permission was not granted."),
      { timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <div className={`weather-app weather-code-${weather?.code ?? 0}`}>
      <button className="weather-location" onClick={useCurrentLocation}>◎ Use My Location</button>
      <p>{weather?.location ?? "Updating"}</p>
      <div className="weather-now"><i>{weatherSymbol(weather?.code ?? 0)}</i><strong>{weather ? `${Math.round(weather.temperature)}°` : "—"}</strong></div>
      <span>{weather ? weatherLabel(weather.code) : "Loading live conditions"}</span>
      {weather && <b>H:{Math.round(weather.high)}° &nbsp; L:{Math.round(weather.low)}°</b>}
      <div className="weather-details">
        <i>FEELS LIKE<br /><b>{weather ? `${Math.round(weather.apparent)}°` : "—"}</b></i>
        <i>HUMIDITY<br /><b>{weather ? `${Math.round(weather.humidity)}%` : "—"}</b></i>
        <i>WIND<br /><b>{weather ? `${Math.round(weather.wind)} mph` : "—"}</b></i>
      </div>
      <div className="weather-forecast">
        {weather?.daily.map((day) => <i key={day.day}><strong>{day.day}</strong><em>{weatherSymbol(day.code)}</em><b>{Math.round(day.high)}°</b><span>{Math.round(day.low)}°</span></i>)}
      </div>
      {error && <small>{error}</small>}
    </div>
  );
}

function weatherLabel(code: number) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain Showers";
  return "Thunderstorms";
}

function weatherSymbol(code: number) {
  if (code === 0) return "☀";
  if (code <= 3) return "☁";
  if (code <= 48) return "≋";
  if (code <= 67) return "☂";
  if (code <= 77) return "✻";
  if (code <= 82) return "☂";
  return "ϟ";
}

function ClockApp({ time }: { time: string }) {
  const [tab, setTab] = useState<"clock" | "timer">("clock");
  const [seconds, setSeconds] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const now = new Date();
  const minute = now.getMinutes() * 6;
  const hour = (now.getHours() % 12) * 30 + now.getMinutes() / 2;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const timerText = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <div className="clock-app">
      {tab === "clock" ? (
        <div className="world-clock-panel">
          <div className="analog-clock"><i style={{ transform: `rotate(${minute}deg)` }} /><b style={{ transform: `rotate(${hour}deg)` }} /><em /></div>
          <strong>{time}</strong><span>New York</span>
        </div>
      ) : (
        <div className="timer-panel">
          <p>TIMER</p><strong>{timerText}</strong>
          <input type="range" min="60" max="3600" step="60" value={seconds || 60} disabled={running} onChange={(event) => setSeconds(Number(event.target.value))} aria-label="Timer duration" />
          <span>{Math.max(1, Math.round(seconds / 60))} minutes</span>
          <div><button onClick={() => setRunning((value) => !value)}>{running ? "Pause" : "Start"}</button><button onClick={() => { setRunning(false); setSeconds(5 * 60); }}>Reset</button></div>
        </div>
      )}
      <nav className="clock-tabs"><button className={tab === "clock" ? "active" : ""} onClick={() => setTab("clock")}><i>◷</i>World Clock</button><button className={tab === "timer" ? "active" : ""} onClick={() => setTab("timer")}><i>◴</i>Timer</button></nav>
    </div>
  );
}

function NotesApp() {
  return <div className="notes-app"><textarea aria-label="A note from Tian Xing" defaultValue={"Happiness comes from\nsolving problems.\n\n— Mark Manson"} /></div>;
}

function ContactApp({ base }: { base: string }) {
  return (
    <div className="contact-app">
      <img className="contact-photo" src={`${base}/media/about/tian-xing-iphone4.jpg`} alt="Tian Xing" />
      <h2>Tian Xing</h2><p>Visual artist · filmmaker · builder</p>
      <a href="https://xingpicture.myportfolio.com" target="_blank" rel="noreferrer"><b>Photo</b><span>xingpicture.myportfolio.com</span></a>
      <a href="https://github.com/lovejzzz" target="_blank" rel="noreferrer"><b>GitHub</b><span>lovejzzz</span></a>
      <a href="https://www.youtube.com/@HereWeGoFilmStudio" target="_blank" rel="noreferrer"><b>Film Studio</b><span>Here We Go</span></a>
    </div>
  );
}

function MailApp() {
  return (
    <div className="mail-app contact-mail-app">
      <div className="mail-paper">
        <span className="mail-stamp">TX</span>
        <p>CONTACT CARD</p><h2>Tian Xing</h2><small>New York · available for thoughtful collaborations</small>
        <a className="contact-line" href="mailto:xingpicture@gmail.com"><i className="mail-mini-icon">✉</i><span><b>Email</b>xingpicture@gmail.com</span><em>›</em></a>
        <a className="contact-line" href="https://www.instagram.com/xing_tian_lifeitself/" target="_blank" rel="noreferrer"><i className="instagram-icon"><b /></i><span><b>Instagram</b>@xing_tian_lifeitself</span><em>›</em></a>
        <a className="compose-mail-button" href="mailto:xingpicture@gmail.com?subject=Hello%20Tian">Compose Email</a>
      </div>
    </div>
  );
}

function SafariApp({ onOpenWork }: { onOpenWork: () => void }) {
  return (
    <div className="safari-app">
      <div className="safari-address"><span>https://</span><b>tian.fun</b><i>↻</i></div>
      <section><h2>Bookmarks</h2>
        <button onClick={onOpenWork}><i className="bookmark-work">TX</i><span><b>Selected Work</b>Nine projects</span><em>›</em></button>
        <a href="https://xingpicture.myportfolio.com" target="_blank" rel="noreferrer"><i className="bookmark-photo">▣</i><span><b>Photo</b>xingpicture.myportfolio.com</span><em>›</em></a>
        <a href="https://github.com/lovejzzz" target="_blank" rel="noreferrer"><i className="bookmark-github">GH</i><span><b>GitHub</b>lovejzzz</span><em>›</em></a>
      </section>
      <nav><span>‹</span><span>›</span><span>＋</span><span>▤</span></nav>
    </div>
  );
}

function MusicApp() {
  return <div className="music-app"><iframe data-testid="spotify-embed" title="The Jazz I Love 2022 Spotify playlist" src="https://open.spotify.com/embed/playlist/6hYj1RoYJ85hj8c1kaDFJ2?utm_source=generator&amp;theme=0" width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" /><a href="https://open.spotify.com/playlist/6hYj1RoYJ85hj8c1kaDFJ2" target="_blank" rel="noreferrer">Open The Jazz I Love [2022] in Spotify</a></div>;
}
