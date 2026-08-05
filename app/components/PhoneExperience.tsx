"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
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

type BoothEffectId = "original" | "sepia" | "mono" | "pop" | "xray" | "glow";

const boothEffects: Array<{ id: BoothEffectId; label: string; filter: string }> = [
  { id: "original", label: "Original", filter: "saturate(.94) contrast(1.04)" },
  { id: "sepia", label: "Sepia", filter: "sepia(.72) saturate(.86) contrast(1.08)" },
  { id: "mono", label: "Mono", filter: "grayscale(1) contrast(1.22)" },
  { id: "pop", label: "Pop Art", filter: "saturate(2.15) contrast(1.38) brightness(1.05)" },
  { id: "xray", label: "X-Ray", filter: "grayscale(1) invert(1) contrast(1.5)" },
  { id: "glow", label: "Glow", filter: "saturate(1.15) contrast(1.04) brightness(1.12) blur(.35px)" },
];

const safariPortals = [
  { title: "Radio Garden", host: "radio.garden", description: "Spin the globe. Listen anywhere.", url: "https://radio.garden/", mark: "◉" },
  { title: "WindowSwap", host: "window-swap.com", description: "Borrow somebody else’s window for a while.", url: "https://www.window-swap.com/", mark: "▤" },
  { title: "A Picture from Space", host: "apod.nasa.gov", description: "One new window into the universe every day.", url: "https://apod.nasa.gov/apod/astropix.html", mark: "✦" },
  { title: "Public Domain Review", host: "publicdomainreview.org", description: "Beautiful oddities from art, film, and history.", url: "https://publicdomainreview.org/", mark: "∞" },
  { title: "Earth", host: "earth.nullschool.net", description: "Watch the planet breathe in real time.", url: "https://earth.nullschool.net/", mark: "≈" },
];

const homeApps: HomeApp[] = [
  { id: "messages", label: "Messages" },
  { id: "calendar", label: "Calendar" },
  { id: "photos", label: "Photos" },
  { id: "camera", label: "Camera" },
  { id: "weather", label: "Weather" },
  { id: "clock", label: "Clock" },
  { id: "notes", label: "Notes" },
  { id: "folder", label: "Fun" },
];

const dockApps: HomeApp[] = [
  { id: "phone", label: "Phone" },
  { id: "mail", label: "Mail" },
  { id: "safari", label: "Safari" },
  { id: "music", label: "Music" },
];

const PHOTO_STORAGE_KEY = "tian-iphone-camera-roll";
const PHOTO_HIDDEN_KEY = "tian-iphone-hidden-photos";
const MESSAGE_DRAFT_KEY = "tian-iphone-message-draft";
const MESSAGE_THREAD_KEY = "tian-iphone-message-thread";
const MESSAGE_ENDPOINT = "https://script.google.com/macros/s/AKfycbyXBqJ3mfDqYPFESbxJTi6TXbwpQIh_59aGxw-lP_lxn7EyTrFS2wSR0spqosGWDM1EbQ/exec";
const WEATHER_LOCATION_KEY = "tian-iphone-weather-location";
const WEATHER_UNIT_KEY = "tian-iphone-weather-unit";
const WEATHER_CACHE_KEY = "tian-iphone-weather-cache-v2";
const NOTES_STORAGE_KEY = "tian-iphone-notes-v2";
type Origin = { x: number; y: number };
type MessageBubble = {
  id: string;
  text: string;
  time: string;
  state: "sending" | "sent" | "error";
};
type NotePoint = { x: number; y: number };
type NoteStroke = { color: string; width: number; erase: boolean; points: NotePoint[] };
type NoteDocument = {
  id: string;
  text: string;
  updatedAt: string;
  strokes: NoteStroke[];
  doodleSeed: boolean;
  background?: string;
};

export function PhoneExperience() {
  const [mode, setMode] = useState<"folder" | "home" | "native">("folder");
  const [activeApp, setActiveApp] = useState<NativeApp | null>(null);
  const [closing, setClosing] = useState(false);
  const [origin, setOrigin] = useState<Origin>({ x: 50, y: 58 });
  const [time, setTime] = useState("9:41 AM");
  const [calendarDay, setCalendarDay] = useState("1");
  const [calendarWeekday, setCalendarWeekday] = useState("Today");
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
    let mobileStartFrame = 0;
    if (window.matchMedia("(max-width: 560px)").matches) {
      mobileStartFrame = window.requestAnimationFrame(() => {
        setMode("home");
        setActiveApp(null);
      });
    }

    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      setCalendarDay(String(now.getDate()));
      setCalendarWeekday(now.toLocaleDateString([], { weekday: "long" }));
    };
    update();
    const timer = window.setInterval(update, 30_000);
    return () => {
      window.cancelAnimationFrame(mobileStartFrame);
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
            <HomeScreen calendarDay={calendarDay} calendarWeekday={calendarWeekday} onOpenApp={openApp} />
          </div>

          {mode !== "home" && (
            <div
              className={`phone-app-layer ${mode === "folder" ? "is-fun-app" : ""} ${closing ? "is-closing" : "is-opening"}`}
              style={{ "--origin-x": `${origin.x}%`, "--origin-y": `${origin.y}%` } as CSSProperties}
            >
              {mode === "folder" && <FolderView onGoHome={goHome} />}
              {mode === "native" && activeApp && (
                <NativeAppView
                  app={activeApp}
                  base={base}
                  time={time}
                  captures={captures}
                  onCapture={saveCapture}
                  onDeleteCapture={deleteCapture}
                  onOpenWork={() => openApp("folder")}
                  onGoHome={goHome}
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

function FolderView({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="folder-screen">
      <div className="fun-dolly" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="screen-titlebar work-titlebar">
        <span className="mini-mark">TX</span>
        <button className="mobile-home-nav" type="button" onClick={onGoHome}>Home</button>
        <strong>Fun</strong>
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

function HomeScreen({ calendarDay, calendarWeekday, onOpenApp }: {
  calendarDay: string;
  calendarWeekday: string;
  onOpenApp: (id: NativeApp | "folder", element?: HTMLElement | null) => void;
}) {
  return (
    <div className="iphone-desktop">
      <div className="system-page" aria-label="iPhone Home screen">
        {homeApps.map((app) => (
          <button className="system-app" key={app.id} onClick={(event) => onOpenApp(app.id, event.currentTarget)}>
            <SystemAppIcon id={app.id} calendarDay={calendarDay} calendarWeekday={calendarWeekday} />
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
            <SystemAppIcon id={app.id} calendarDay={calendarDay} calendarWeekday={calendarWeekday} />
          </button>
        ))}
      </div>
    </div>
  );
}

function SystemAppIcon({ id, calendarDay, calendarWeekday }: {
  id: HomeApp["id"];
  calendarDay: string;
  calendarWeekday: string;
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
    return (
      <span className="system-app-icon sys-authentic authentic-calendar">
        <img src={`${base}/media/ios4/icons/calendar.png`} alt="" aria-hidden="true" />
        <span className="calendar-weekday">{calendarWeekday}</span>
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

function NativeAppView({ app, base, time, captures, onCapture, onDeleteCapture, onOpenWork, onGoHome }: {
  app: NativeApp;
  base: string;
  time: string;
  captures: CapturedPhoto[];
  onCapture: (src: string) => void;
  onDeleteCapture: (id: string) => void;
  onOpenWork: () => void;
  onGoHome: () => void;
}) {
  const titles: Record<NativeApp, string> = {
    messages: "Tian",
    calendar: "Calendar",
    photos: "Photos",
    camera: "Photo Booth",
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
      <div className="native-titlebar">
        <button className="mobile-home-nav" type="button" onClick={onGoHome}>Home</button>
        <strong>{titles[app]}</strong>
      </div>
      <div className="native-content">
        {app === "messages" && <MessagesApp />}
        {app === "calendar" && <CalendarApp />}
        {app === "photos" && <PhotosApp base={base} captures={captures} onDeleteCapture={onDeleteCapture} />}
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
  const [message, setMessage] = useState(() => {
    if (typeof window === "undefined") return "";
    try { return window.localStorage.getItem(MESSAGE_DRAFT_KEY) ?? ""; } catch { return ""; }
  });
  const [thread, setThread] = useState<MessageBubble[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.sessionStorage.getItem(MESSAGE_THREAD_KEY);
      return saved ? JSON.parse(saved) as MessageBubble[] : [];
    } catch { return []; }
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      if (message) window.localStorage.setItem(MESSAGE_DRAFT_KEY, message);
      else window.localStorage.removeItem(MESSAGE_DRAFT_KEY);
    } catch { /* Draft persistence is optional in private browsing. */ }
    if (textareaRef.current) {
      textareaRef.current.style.height = "34px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 104)}px`;
    }
  }, [message]);

  useEffect(() => {
    try { window.sessionStorage.setItem(MESSAGE_THREAD_KEY, JSON.stringify(thread)); } catch { /* Session history remains in memory. */ }
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [thread]);

  const resizeComposer = (element: HTMLTextAreaElement) => {
    element.style.height = "34px";
    element.style.height = `${Math.min(element.scrollHeight, 104)}px`;
  };

  const retry = (bubble: MessageBubble) => {
    setThread((current) => current.filter((item) => item.id !== bubble.id));
    setMessage(bubble.text);
    setStatus("idle");
    window.requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      resizeComposer(textareaRef.current);
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage || status === "sending") return;
    const id = crypto.randomUUID();
    const bubble: MessageBubble = {
      id,
      text: cleanMessage,
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      state: "sending",
    };
    setThread((current) => [...current, bubble]);
    setMessage("");
    setStatus("sending");
    const form = new URLSearchParams();
    form.set("message", cleanMessage);
    form.set("website", "");
    form.set("site_key", "tian-heart-2026");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    try {
      await fetch(MESSAGE_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        cache: "no-store",
        keepalive: true,
        signal: controller.signal,
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: form.toString(),
      });
      setThread((current) => current.map((item) => item.id === id ? { ...item, state: "sent" } : item));
      setStatus("sent");
      textareaRef.current?.focus();
      window.setTimeout(() => setStatus("idle"), 2400);
    } catch {
      setThread((current) => current.map((item) => item.id === id ? { ...item, state: "error" } : item));
      setStatus("error");
    } finally {
      window.clearTimeout(timeout);
    }
  };
  return (
    <form className="message-compose" onSubmit={submit}>
      <div className="message-thread" ref={threadRef} aria-label="Conversation with Tian">
        <div className="message-intro">
          <i aria-hidden="true">TX</i>
          <strong>Tian Xing</strong>
          <span>Your message goes straight to my email.</span>
        </div>
        <p className="message-received">Hi—I’m Tian. Say something.</p>
        {thread.map((bubble) => (
          <div className={`message-outgoing message-${bubble.state}`} key={bubble.id}>
            <p>{bubble.text}</p>
            <span>
              {bubble.time} · {bubble.state === "sending" ? "Sending…" : bubble.state === "sent" ? "Sent" : "Not sent"}
            </span>
            {bubble.state === "error" && <button type="button" onClick={() => retry(bubble)}>Try Again</button>}
          </div>
        ))}
      </div>
      <div className="message-composer">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            resizeComposer(event.currentTarget);
            if (status === "error") setStatus("idle");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          required
          maxLength={1200}
          rows={1}
          enterKeyHint="send"
          placeholder="Message"
          aria-label="Message Tian"
        />
        <button type="submit" disabled={!message.trim() || status === "sending"} aria-label="Send message">Send</button>
      </div>
      <div className={`message-status status-${status}`} role="status" aria-live="polite">
        {status === "sending" ? "Sending…" : status === "sent" ? "Message sent." : status === "error" ? "No connection. Your message is safe above." : "No account needed · private to Tian"}
      </div>
    </form>
  );
}

type CalendarItem = { text: string; color: string };
type CalendarEvents = Record<string, CalendarItem[]>;

function CalendarApp() {
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today.getDate());
  const [events, setEvents] = useState<CalendarEvents>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = window.localStorage.getItem("tian-iphone-calendar");
      const parsed = stored ? JSON.parse(stored) as Record<string, Array<string | CalendarItem>> : {};
      return Object.fromEntries(Object.entries(parsed).map(([key, items]) => [key, items.map((item) => typeof item === "string" ? { text: item, color: "#df3d36" } : item)]));
    } catch {
      return {};
    }
  });
  const [draft, setDraft] = useState("");
  const [eventColor, setEventColor] = useState("#df3d36");

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
    const next = { ...events, [key]: [...(events[key] ?? []), { text: draft.trim(), color: eventColor }] };
    setEvents(next);
    setDraft("");
    try { localStorage.setItem("tian-iphone-calendar", JSON.stringify(next)); } catch { /* local-only calendar */ }
  };
  const deleteEvent = (index: number) => {
    const nextItems = (events[key] ?? []).filter((_, itemIndex) => itemIndex !== index);
    const next = { ...events, [key]: nextItems };
    setEvents(next);
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
        {(events[key] ?? []).map((item, index) => <p key={`${item.text}-${index}`}><i style={{ background: item.color }} /><span>{item.text}</span><button onClick={() => deleteEvent(index)} aria-label={`Delete ${item.text}`}>×</button></p>)}
        {!events[key]?.length && <p className="no-events">No events</p>}
        <div className="calendar-colors" aria-label="Event color">{["#df3d36", "#e0a52c", "#4e9d63", "#4c78a8"].map((color) => <button key={color} className={eventColor === color ? "active" : ""} style={{ background: color }} onClick={() => setEventColor(color)} aria-label={`Use ${color} event color`} />)}</div>
        <form onSubmit={addEvent}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Make a plan…" aria-label="Add event" /><button>Add</button></form>
      </section>
    </div>
  );
}

function PhotosApp({ base, captures, onDeleteCapture }: { base: string; captures: CapturedPhoto[]; onDeleteCapture: (id: string) => void }) {
  const [hiddenPhotos, setHiddenPhotos] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(PHOTO_HIDDEN_KEY) ?? "[]"); } catch { return []; }
  });
  const allPhotos = useMemo(() => [
    ...captures.map((photo) => ({ id: photo.id, src: photo.src, alt: `Camera photo taken ${new Date(photo.createdAt).toLocaleString()}`, captured: true })),
    ...portfolioPhotos.map((photo) => ({ ...photo, id: photo.src, src: `${base}${photo.src}`, captured: false })),
  ], [base, captures]);
  const photos = useMemo(() => allPhotos.filter((photo) => !hiddenPhotos.includes(photo.id)), [allPhotos, hiddenPhotos]);
  const [selected, setSelected] = useState(photos[0]?.id ?? "");
  const [viewing, setViewing] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const stripDrag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const selectedPhoto = photos.find((photo) => photo.id === selected) ?? photos[0];
  const selectedIndex = Math.max(0, photos.findIndex((photo) => photo.id === selectedPhoto?.id));

  const movePhoto = (direction: number) => {
    if (!photos.length) return;
    const next = (selectedIndex + direction + photos.length) % photos.length;
    setSelected(photos[next].id);
  };
  const deleteSelected = () => {
    if (!selectedPhoto) return;
    const nextPhoto = photos[selectedIndex + 1] ?? photos[selectedIndex - 1];
    if (selectedPhoto.captured) {
      onDeleteCapture(selectedPhoto.id);
    } else {
      const nextHidden = [...hiddenPhotos, selectedPhoto.id];
      setHiddenPhotos(nextHidden);
      try { localStorage.setItem(PHOTO_HIDDEN_KEY, JSON.stringify(nextHidden)); } catch { /* local album only */ }
    }
    if (nextPhoto) setSelected(nextPhoto.id); else setViewing(false);
  };
  const restorePhotos = () => {
    setHiddenPhotos([]);
    try { localStorage.removeItem(PHOTO_HIDDEN_KEY); } catch { /* local album only */ }
  };
  const startStripDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stripRef.current) return;
    stripDrag.current = { active: true, startX: event.clientX, startScroll: stripRef.current.scrollLeft, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveStripDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stripDrag.current.active || !stripRef.current) return;
    const delta = event.clientX - stripDrag.current.startX;
    if (Math.abs(delta) > 5) stripDrag.current.moved = true;
    stripRef.current.scrollLeft = stripDrag.current.startScroll - delta;
  };
  const endStripDrag = () => {
    stripDrag.current.active = false;
    window.setTimeout(() => { stripDrag.current.moved = false; }, 0);
  };

  return (
    <div className="photos-app">
      <div className="photo-album-bar"><strong>Camera Roll</strong>{hiddenPhotos.length > 0 && <button onClick={restorePhotos}>Restore {hiddenPhotos.length}</button>}<span>{photos.length} Photos</span></div>
      <div className="photo-grid">
        {photos.map((photo) => (
          <button key={photo.id} className={selected === photo.id ? "selected" : ""} onClick={() => { setSelected(photo.id); setViewing(true); }} aria-label={`View ${photo.alt}`}>
            <img src={photo.src} alt="" />{photo.captured && <i>NEW</i>}
          </button>
        ))}
      </div>
      {viewing && selectedPhoto && (
        <div className="photo-viewer" role="dialog" aria-modal="true" aria-label="Photo viewer">
          <div className="photo-viewer-bar">
            <button onClick={() => setViewing(false)}>Camera Roll</button>
            <strong>{selectedIndex + 1} of {photos.length}</strong>
            <button className="photo-trash" onClick={deleteSelected} aria-label="Delete this photo"><i />Trash</button>
          </div>
          <div className="photo-viewer-stage">
            <button onClick={() => movePhoto(-1)} aria-label="Previous photo">‹</button>
            <img src={selectedPhoto.src} alt={selectedPhoto.alt} />
            <button onClick={() => movePhoto(1)} aria-label="Next photo">›</button>
          </div>
          <div className="photo-viewer-strip" ref={stripRef} onPointerDown={startStripDrag} onPointerMove={moveStripDrag} onPointerUp={endStripDrag} onPointerCancel={endStripDrag}>
            {photos.map((photo) => <button key={photo.id} className={selectedPhoto.id === photo.id ? "selected" : ""} onClick={() => { if (!stripDrag.current.moved) setSelected(photo.id); }} aria-label={`View ${photo.alt}`}><img src={photo.src} alt="" /></button>)}
          </div>
        </div>
      )}
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
  const countdownTimer = useRef<number | null>(null);
  const [status, setStatus] = useState<"starting" | "ready" | "blocked">("starting");
  const [flash, setFlash] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [effect, setEffect] = useState<BoothEffectId>("original");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const latest = captures[0];
  const activeEffect = boothEffects.find((item) => item.id === effect) ?? boothEffects[0];

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
    const timer = window.setTimeout(() => { void startCamera("user"); }, 0);
    return () => {
      window.clearTimeout(timer);
      if (countdownTimer.current) window.clearInterval(countdownTimer.current);
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
    context.save();
    context.filter = activeEffect.filter;
    if (facing === "user") {
      context.translate(640, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, sx, sy, sw, sh, 0, 0, 640, 480);
    context.restore();
    const frame = context.getImageData(0, 0, 640, 480);
    for (let index = 0; index < frame.data.length; index += 4) {
      const pixel = index / 4;
      const x = pixel % 640;
      const y = Math.floor(pixel / 640);
      const dx = (x - 320) / 320;
      const dy = (y - 240) / 240;
      const vignette = 1 - Math.min(0.18, (dx * dx + dy * dy) * 0.09);
      const grain = Math.sin(pixel * 12.9898) * (effect === "mono" ? 5 : 2.4);
      frame.data[index] = Math.max(0, Math.min(255, (frame.data[index] + grain) * vignette));
      frame.data[index + 1] = Math.max(0, Math.min(255, (frame.data[index + 1] + grain * .6) * vignette));
      frame.data[index + 2] = Math.max(0, Math.min(255, (frame.data[index + 2] - grain * .2) * vignette));
    }
    context.putImageData(frame, 0, 0);
    const src = canvas.toDataURL("image/jpeg", 0.82);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 180);
    onCapture(src);
  };

  const beginCapture = () => {
    if (status !== "ready" || countdown !== null) return;
    let value = 3;
    setCountdown(value);
    countdownTimer.current = window.setInterval(() => {
      value -= 1;
      if (value <= 0) {
        if (countdownTimer.current) window.clearInterval(countdownTimer.current);
        countdownTimer.current = null;
        setCountdown(null);
        takePhoto();
      } else {
        setCountdown(value);
      }
    }, 700);
  };

  return (
    <div className="camera-app photobooth-app">
      <div className="camera-toolbar"><span>Effects</span><b>PHOTO BOOTH</b><button onClick={switchCamera} disabled={status !== "ready"} aria-label="Switch camera">↻</button></div>
      <div className="viewfinder booth-stage">
        <video ref={videoRef} muted playsInline aria-label="Live camera view" style={{ filter: activeEffect.filter, transform: facing === "user" ? "scaleX(-1)" : "none" }} />
        <div className="booth-curtain booth-curtain-left" aria-hidden="true" /><div className="booth-curtain booth-curtain-right" aria-hidden="true" />
        {countdown !== null && <strong className="booth-countdown">{countdown}</strong>}
        {status === "starting" && <p>Starting camera…</p>}
        {status === "blocked" && <div className="camera-permission"><strong>Photo Booth needs a camera</strong><span>Allow camera access, then make a portrait with a 2010-era effect.</span><button onClick={() => startCamera(facing)}>Try Again</button></div>}
        {flash && <i className="camera-flash" />}
      </div>
      <div className="booth-effects" aria-label="Photo Booth effects">
        {boothEffects.map((item) => <button key={item.id} className={effect === item.id ? "active" : ""} onClick={() => setEffect(item.id)} aria-pressed={effect === item.id}><i className={`effect-${item.id}`} /><span>{item.label}</span></button>)}
      </div>
      <div className="camera-controls">
        <button className="latest-shot" onClick={() => setReviewing(true)} disabled={!latest} aria-label={latest ? `Open latest photo. ${captures.length} photos in camera roll` : "Camera roll is empty"}>
          {latest && <img src={latest.src} alt="Latest capture" />}
        </button>
        <button className="shutter booth-shutter" onClick={beginCapture} disabled={status !== "ready" || countdown !== null} aria-label="Take Photo Booth photo"><span /></button>
        <span className="camera-mode">{activeEffect.label}</span>
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

type WeatherUnit = "fahrenheit" | "celsius";
type WeatherPlace = {
  name: string;
  country?: string;
  admin?: string;
  latitude: number;
  longitude: number;
};
type WeatherHour = { time: string; code: number; temperature: number; precipitation: number; isDay: boolean };
type WeatherDay = { date: string; day: string; code: number; high: number; low: number; precipitation: number; uv: number; sunrise: string; sunset: string };
type WeatherData = {
  place: WeatherPlace;
  isDay: boolean;
  updatedAt: string;
  timezone: string;
  temperature: number;
  apparent: number;
  humidity: number;
  wind: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  precipitation: number;
  code: number;
  high: number;
  low: number;
  hourly: WeatherHour[];
  daily: WeatherDay[];
};

const defaultWeatherPlace: WeatherPlace = { name: "New York", country: "United States", admin: "New York", latitude: 40.7128, longitude: -74.006 };

function WeatherApp() {
  const [place, setPlace] = useState<WeatherPlace>(() => {
    if (typeof window === "undefined") return defaultWeatherPlace;
    try { return JSON.parse(window.localStorage.getItem(WEATHER_LOCATION_KEY) ?? "null") ?? defaultWeatherPlace; } catch { return defaultWeatherPlace; }
  });
  const [unit, setUnit] = useState<WeatherUnit>(() => {
    if (typeof window === "undefined") return "fahrenheit";
    return window.localStorage.getItem(WEATHER_UNIT_KEY) === "celsius" ? "celsius" : "fahrenheit";
  });
  const [weather, setWeather] = useState<WeatherData | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = JSON.parse(window.localStorage.getItem(WEATHER_CACHE_KEY) ?? "null");
      return cached && Date.now() - cached.savedAt < 3_600_000 ? cached.weather : null;
    } catch { return null; }
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!weather);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WeatherPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const weatherRef = useRef(weather);

  useEffect(() => { weatherRef.current = weather; }, [weather]);

  const loadWeather = useCallback(async (nextPlace: WeatherPlace) => {
    setError("");
    setLoading(true);
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(nextPlace.latitude));
      url.searchParams.set("longitude", String(nextPlace.longitude));
      url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day,precipitation,pressure_msl,visibility");
      url.searchParams.set("hourly", "temperature_2m,weather_code,precipitation_probability,is_day");
      url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset");
      url.searchParams.set("temperature_unit", unit);
      url.searchParams.set("wind_speed_unit", unit === "fahrenheit" ? "mph" : "kmh");
      url.searchParams.set("precipitation_unit", unit === "fahrenheit" ? "inch" : "mm");
      url.searchParams.set("timezone", "auto");
      url.searchParams.set("forecast_days", "8");
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("weather");
      const data = await response.json();
      const currentHour = data.hourly.time.findIndex((time: string) => time >= data.current.time.slice(0, 13));
      const startHour = Math.max(0, currentHour);
      const nextWeather: WeatherData = {
        place: nextPlace,
        isDay: Boolean(data.current.is_day),
        updatedAt: data.current.time,
        timezone: data.timezone_abbreviation,
        temperature: data.current.temperature_2m,
        apparent: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        wind: data.current.wind_speed_10m,
        windDirection: data.current.wind_direction_10m,
        pressure: data.current.pressure_msl,
        visibility: data.current.visibility,
        precipitation: data.current.precipitation,
        code: data.current.weather_code,
        high: data.daily.temperature_2m_max[0],
        low: data.daily.temperature_2m_min[0],
        hourly: data.hourly.time.slice(startHour, startHour + 12).map((time: string, index: number) => ({
          time,
          code: data.hourly.weather_code[startHour + index],
          temperature: data.hourly.temperature_2m[startHour + index],
          precipitation: data.hourly.precipitation_probability[startHour + index] ?? 0,
          isDay: Boolean(data.hourly.is_day[startHour + index]),
        })),
        daily: data.daily.time.slice(0, 7).map((date: string, index: number) => ({
          date,
          day: index === 0 ? "Today" : new Date(`${date}T12:00:00`).toLocaleDateString([], { weekday: "short" }),
          code: data.daily.weather_code[index],
          high: data.daily.temperature_2m_max[index],
          low: data.daily.temperature_2m_min[index],
          precipitation: data.daily.precipitation_probability_max[index] ?? 0,
          uv: data.daily.uv_index_max[index] ?? 0,
          sunrise: data.daily.sunrise[index],
          sunset: data.daily.sunset[index],
        })),
      };
      setWeather(nextWeather);
      try { window.localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), weather: nextWeather })); } catch { /* Live weather still works without a cache. */ }
    } catch {
      setError(weatherRef.current ? "Couldn’t refresh. Showing the last forecast." : "Weather is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, [unit]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadWeather(place); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWeather, place]);

  useEffect(() => {
    try {
      window.localStorage.setItem(WEATHER_LOCATION_KEY, JSON.stringify(place));
      window.localStorage.setItem(WEATHER_UNIT_KEY, unit);
    } catch { /* Preferences are optional in private browsing. */ }
  }, [place, unit]);

  const searchLocations = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true);
    setError("");
    try {
      const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
      url.searchParams.set("name", query.trim());
      url.searchParams.set("count", "6");
      url.searchParams.set("language", "en");
      url.searchParams.set("format", "json");
      const response = await fetch(url);
      if (!response.ok) throw new Error("search");
      const data = await response.json();
      setResults((data.results ?? []).map((item: { name: string; country?: string; admin1?: string; latitude: number; longitude: number }) => ({
        name: item.name,
        country: item.country,
        admin: item.admin1,
        latitude: item.latitude,
        longitude: item.longitude,
      })));
      if (!data.results?.length) setError("No places found. Try a nearby city.");
    } catch {
      setError("City search is unavailable right now.");
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setError("Location is not available on this device."); return; }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPlace({ name: "My Location", latitude: position.coords.latitude, longitude: position.coords.longitude });
        setPickerOpen(false);
        setLocating(false);
      },
      () => { setError("Location permission was not granted."); setLocating(false); },
      { timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const changeUnit = (nextUnit: WeatherUnit) => {
    if (nextUnit === unit) return;
    setWeather(null);
    setUnit(nextUnit);
  };

  const today = weather?.daily[0];
  const peakRain = weather ? Math.max(...weather.hourly.map((hour) => hour.precipitation)) : 0;
  const theme = weatherTheme(weather?.code ?? 0, weather?.isDay ?? true);

  return (
    <div
      className={`weather-app ${theme} ${pickerOpen ? "weather-picker-open" : ""}`}
      style={{ "--weather-rx": `${tilt.y}deg`, "--weather-ry": `${tilt.x}deg` } as CSSProperties}
      onPointerMove={(event) => { if (event.pointerType === "touch") return; const bounds = event.currentTarget.getBoundingClientRect(); setTilt({ x: ((event.clientX - bounds.left) / bounds.width - .5) * 7, y: -((event.clientY - bounds.top) / bounds.height - .5) * 5 }); }}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      aria-busy={loading}
    >
      <WeatherScene code={weather?.code ?? 0} isDay={weather?.isDay ?? true} />
      <header className="weather-topbar">
        <button className="weather-place-button" onClick={() => setPickerOpen(true)} aria-label="Choose weather location">
          <strong>{weather?.place.name ?? place.name}</strong><span>{weather?.place.admin || weather?.place.country || "Live forecast"} ▾</span>
        </button>
        <div className="weather-actions">
          <button onClick={() => changeUnit(unit === "fahrenheit" ? "celsius" : "fahrenheit")} aria-label={`Switch to degrees ${unit === "fahrenheit" ? "Celsius" : "Fahrenheit"}`}>°{unit === "fahrenheit" ? "F" : "C"}</button>
          <button className={loading ? "is-loading" : ""} onClick={() => void loadWeather(place)} aria-label="Refresh weather">↻</button>
        </div>
      </header>

      <section className="weather-hero" aria-label="Current weather">
        <p>{weather ? weatherLabel(weather.code) : "Loading live conditions"}</p>
        <div className="weather-temperature"><i>{weatherSymbol(weather?.code ?? 0, weather?.isDay ?? true)}</i><strong>{weather ? Math.round(weather.temperature) : "—"}<sup>°</sup></strong></div>
        <span>{weather ? `Feels like ${Math.round(weather.apparent)}° · H:${Math.round(weather.high)}° L:${Math.round(weather.low)}°` : "Finding the sky above you…"}</span>
        {weather && <small>{peakRain >= 30 ? `Rain chance peaks at ${peakRain}% in the next 12 hours.` : weatherNarrative(weather.code, weather.isDay)}</small>}
      </section>

      <section className="weather-glass-card weather-hourly-card" aria-label="Hourly forecast">
        <header><strong>HOURLY</strong><span>{weather ? `Updated ${formatWeatherTime(weather.updatedAt)} ${weather.timezone}` : "Updating"}</span></header>
        <div className="weather-hourly" role="list">
          {weather?.hourly.map((hour, index) => (
            <div key={hour.time} role="listitem">
              <strong>{index === 0 ? "Now" : formatWeatherHour(hour.time)}</strong>
              <i>{weatherSymbol(hour.code, hour.isDay)}</i>
              <em>{hour.precipitation ? `${Math.round(hour.precipitation)}%` : ""}</em>
              <b>{Math.round(hour.temperature)}°</b>
            </div>
          )) ?? Array.from({ length: 6 }, (_, index) => <div className="weather-skeleton" key={index} />)}
        </div>
      </section>

      <section className="weather-glass-card weather-daily-card" aria-label="Seven day forecast">
        <header><strong>7-DAY FORECAST</strong></header>
        {weather?.daily.map((day) => (
          <div className="weather-day-row" key={day.date}>
            <strong>{day.day}</strong><i>{weatherSymbol(day.code, true)}</i><em>{day.precipitation ? `${Math.round(day.precipitation)}%` : ""}</em>
            <span>{Math.round(day.low)}°</span><div><i style={{ "--low": `${Math.min(80, Math.max(4, day.low - weather.low + 8))}%`, "--high": `${Math.min(96, Math.max(22, day.high - weather.low + 38))}%` } as CSSProperties} /></div><b>{Math.round(day.high)}°</b>
          </div>
        ))}
      </section>

      <section className="weather-metrics" aria-label="Weather details">
        <article><span>PRECIPITATION</span><strong>{weather ? `${Math.round(weather.precipitation * (unit === "fahrenheit" ? 100 : 10)) / (unit === "fahrenheit" ? 100 : 10)} ${unit === "fahrenheit" ? "in" : "mm"}` : "—"}</strong><small>Right now</small></article>
        <article><span>HUMIDITY</span><strong>{weather ? `${Math.round(weather.humidity)}%` : "—"}</strong><small>{weather && weather.humidity > 70 ? "Air feels humid" : "Comfortable"}</small></article>
        <article><span>WIND</span><strong>{weather ? `${windCompass(weather.windDirection)} ${Math.round(weather.wind)}` : "—"}</strong><small>{unit === "fahrenheit" ? "mph" : "km/h"}</small></article>
        <article><span>VISIBILITY</span><strong>{weather ? formatVisibility(weather.visibility, unit) : "—"}</strong><small>{weather && weather.visibility > (unit === "fahrenheit" ? 32808 : 10000) ? "Perfectly clear" : "Reduced"}</small></article>
        <article><span>PRESSURE</span><strong>{weather ? `${Math.round(weather.pressure)}` : "—"}</strong><small>hPa</small></article>
        <article><span>UV INDEX</span><strong>{today ? `${Math.round(today.uv)}` : "—"}</strong><small>{today ? uvLabel(today.uv) : ""}</small></article>
        <article className="weather-sun-card"><span>SUNRISE & SUNSET</span><div><i /><b /></div><strong>{today ? `${formatWeatherTime(today.sunrise)} — ${formatWeatherTime(today.sunset)}` : "—"}</strong></article>
      </section>

      {error && <div className="weather-error" role="status">{error}</div>}
      <footer className="weather-credit">Forecast by Open-Meteo</footer>

      {pickerOpen && (
        <div className="weather-picker" role="dialog" aria-modal="true" aria-label="Choose a city">
          <header><button onClick={() => setPickerOpen(false)}>Cancel</button><strong>Choose a City</strong><span /></header>
          <form onSubmit={searchLocations}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="City or postal code" aria-label="Search city" autoFocus /><button disabled={searching || query.trim().length < 2}>{searching ? "…" : "Search"}</button></form>
          <button className="weather-current-location" onClick={useCurrentLocation} disabled={locating}><i>◎</i><span><strong>{locating ? "Finding you…" : "My Location"}</strong><small>Use this device’s location</small></span></button>
          <div className="weather-search-results">
            {results.map((result) => <button key={`${result.latitude}-${result.longitude}`} onClick={() => { setPlace(result); setPickerOpen(false); setQuery(""); setResults([]); }}><span><strong>{result.name}</strong><small>{[result.admin, result.country].filter(Boolean).join(", ")}</small></span><i>›</i></button>)}
          </div>
          {error && <p>{error}</p>}
        </div>
      )}
    </div>
  );
}

function WeatherScene({ code, isDay }: { code: number; isDay: boolean }) {
  const precipitation = code >= 51;
  const snow = (code >= 71 && code <= 77) || code === 85 || code === 86;
  const cloudy = code >= 1;
  const thunder = code >= 95;
  return (
    <div className="weather-scene" aria-hidden="true">
      <div className="weather-atmosphere"><i /><i /><i /></div>
      <div className="weather-horizon"><i /><i /><span /></div>
      <i className={isDay ? "weather-sun" : "weather-moon"} />
      {cloudy && <><i className="weather-cloud weather-cloud-one" /><i className="weather-cloud weather-cloud-two" /></>}
      {precipitation && <div className={snow ? "weather-snow" : "weather-rain"}>{Array.from({ length: 26 }, (_, index) => <i key={index} style={{ "--drop": index } as CSSProperties} />)}</div>}
      {thunder && <i className="weather-lightning" />}
      {!isDay && <div className="weather-stars">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--star": index } as CSSProperties} />)}</div>}
      <span className="weather-haze" />
    </div>
  );
}

function weatherLabel(code: number) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 48) return "Foggy";
  if (code === 71 || code === 73 || code === 75 || code === 77) return "Snow";
  if (code === 85 || code === 86) return "Snow Showers";
  if (code <= 67) return "Rain";
  if (code <= 82) return "Rain Showers";
  return "Thunderstorms";
}

function weatherSymbol(code: number, isDay = true) {
  if (code === 0) return isDay ? "☀" : "☾";
  if (code <= 3) return isDay ? "☁" : "☁";
  if (code <= 48) return "≋";
  if (code <= 67) return "☂";
  if (code <= 77) return "✻";
  if (code <= 82) return "☂";
  if (code === 85 || code === 86) return "✻";
  return "ϟ";
}

function weatherTheme(code: number, isDay: boolean) {
  const time = isDay ? "weather-day" : "weather-night";
  if (code >= 95) return `${time} weather-stormy`;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return `${time} weather-snowy`;
  if (code >= 51) return `${time} weather-rainy`;
  if (code === 45 || code === 48) return `${time} weather-foggy`;
  if (code >= 2) return `${time} weather-cloudy`;
  return `${time} weather-clear`;
}

function weatherNarrative(code: number, isDay: boolean) {
  if (code === 0) return isDay ? "Clear skies for the next few hours." : "A clear, quiet night ahead.";
  if (code <= 3) return "Clouds drifting through, with calm conditions.";
  if (code <= 48) return "Low visibility—take it easy out there.";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "Snow is shaping the hours ahead.";
  if (code <= 67 || code <= 82) return "Keep an umbrella close.";
  return "Storm cells are nearby. Stay aware.";
}

function formatWeatherHour(value: string) {
  const hour = Number(value.slice(11, 13));
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return `${hour % 12} ${hour < 12 ? "AM" : "PM"}`;
}

function formatWeatherTime(value: string) {
  if (!value || !value.includes("T")) return "—";
  return formatWeatherHour(value);
}

function windCompass(degrees: number) {
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(degrees / 45) % 8];
}

function formatVisibility(value: number, unit: WeatherUnit) {
  return unit === "fahrenheit" ? `${Math.round(value / 528) / 10} mi` : `${Math.round(value / 100) / 10} km`;
}

function uvLabel(value: number) {
  if (value < 3) return "Low";
  if (value < 6) return "Moderate";
  if (value < 8) return "High";
  return "Very high";
}

function ClockApp({ time }: { time: string }) {
  const [tab, setTab] = useState<"clock" | "timer">("clock");
  const [seconds, setSeconds] = useState(5 * 60);
  const [lastSetSeconds, setLastSetSeconds] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const [draggingHand, setDraggingHand] = useState(false);
  const [finished, setFinished] = useState(false);
  const endTimeRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const lastHapticMinute = useRef(5);
  const now = new Date();
  const minute = now.getMinutes() * 6;
  const hour = (now.getHours() % 12) * 30 + now.getMinutes() / 2;

  const playTone = useCallback((frequency: number, duration: number, delay = 0, volume = .035) => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = audioRef.current ?? new AudioContextClass();
      audioRef.current = context;
      void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + delay;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + .02);
    } catch { /* Sound is an enhancement; the timer remains fully visual. */ }
  }, []);

  const ringTimer = useCallback(() => {
    playTone(880, .28, 0, .055);
    playTone(660, .28, .32, .05);
    playTone(880, .42, .64, .06);
    navigator.vibrate?.([120, 70, 120, 70, 180]);
  }, [playTone]);

  useEffect(() => {
    if (!running) return;
    const update = () => {
      if (endTimeRef.current === null) return;
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setSeconds((value) => value === remaining ? value : remaining);
      if (remaining === 0) {
        endTimeRef.current = null;
        setRunning(false);
        setFinished(true);
        ringTimer();
      }
    };
    update();
    const timer = window.setInterval(update, 125);
    return () => window.clearInterval(timer);
  }, [ringTimer, running]);

  const timerText = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const handAngle = seconds / 10;
  const secondHandAngle = -(lastSetSeconds - seconds) * 6;
  const timerState = finished ? "TIME" : running ? "RUNNING" : seconds < lastSetSeconds ? "PAUSED" : "READY";
  const applyTimerSeconds = (nextSeconds: number, haptic = false) => {
    const next = Math.max(30, Math.min(3600, Math.round(nextSeconds / 30) * 30));
    setSeconds(next);
    setLastSetSeconds(next);
    setFinished(false);
    if (haptic) {
      const nextMinute = Math.ceil(next / 60);
      if (nextMinute !== lastHapticMinute.current) navigator.vibrate?.(5);
      lastHapticMinute.current = nextMinute;
    }
  };
  const setTimerFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (running) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height / 2);
    let angle = Math.atan2(dx, -dy) * 180 / Math.PI;
    if (angle <= 0) angle += 360;
    applyTimerSeconds(angle * 10, true);
  };
  const toggleTimer = () => {
    playTone(430, .045, 0, .025);
    navigator.vibrate?.(8);
    setFinished(false);
    if (running) {
      if (endTimeRef.current !== null) setSeconds(Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000)));
      endTimeRef.current = null;
      setRunning(false);
      return;
    }
    const duration = seconds > 0 ? seconds : lastSetSeconds;
    if (seconds === 0) setSeconds(duration);
    endTimeRef.current = Date.now() + duration * 1000;
    setRunning(true);
  };
  const resetTimer = () => {
    endTimeRef.current = null;
    setRunning(false);
    setFinished(false);
    setSeconds(lastSetSeconds);
    playTone(310, .055, 0, .022);
    navigator.vibrate?.(10);
  };
  const adjustTimerFromKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (running) return;
    const changes: Record<string, number> = { ArrowUp: 30, ArrowRight: 30, ArrowDown: -30, ArrowLeft: -30, PageUp: 300, PageDown: -300 };
    if (event.key === "Home") { event.preventDefault(); applyTimerSeconds(30); return; }
    if (event.key === "End") { event.preventDefault(); applyTimerSeconds(3600); return; }
    if (changes[event.key]) { event.preventDefault(); applyTimerSeconds(seconds + changes[event.key]); }
  };
  return (
    <div className="clock-app">
      {tab === "clock" ? (
        <div className="world-clock-panel">
          <div className="analog-clock"><i style={{ transform: `rotate(${minute}deg)` }} /><b style={{ transform: `rotate(${hour}deg)` }} /><em /></div>
          <strong>{time}</strong><span>New York</span>
        </div>
      ) : (
        <div className={`timer-panel timer-mechanical timer-${timerState.toLowerCase()}`}>
          <div className={`stopwatch ${running ? "is-ticking" : ""} ${finished ? "is-finished" : ""}`} aria-label={`Mechanical timer, ${timerText} remaining`}>
            <i className="stopwatch-loop" />
            <button className={`stopwatch-crown ${running ? "is-running" : ""}`} onClick={toggleTimer} aria-label={running ? "Stop timer" : "Start timer"} />
            <button className="stopwatch-pusher" onClick={resetTimer} aria-label="Reset timer to the last setting" />
            <div
              className={`stopwatch-face ${draggingHand ? "is-dragging" : ""}`}
              onPointerDown={(event) => { if (running) return; setDraggingHand(true); event.currentTarget.setPointerCapture(event.pointerId); setTimerFromPointer(event); }}
              onPointerMove={(event) => { if (draggingHand) setTimerFromPointer(event); }}
              onPointerUp={() => setDraggingHand(false)}
              onPointerCancel={() => setDraggingHand(false)}
              onLostPointerCapture={() => setDraggingHand(false)}
              onKeyDown={adjustTimerFromKeyboard}
              role="slider"
              tabIndex={0}
              aria-label="Timer hand"
              aria-valuemin={.5}
              aria-valuemax={60}
              aria-valuenow={Math.round(seconds / 30) / 2}
              aria-valuetext={timerText}
              style={{ "--timer-progress": `${(seconds / Math.max(1, lastSetSeconds)) * 360}deg` } as CSSProperties}
            >
              <span className="dial-number dial-60">60</span><span className="dial-number dial-5">5</span><span className="dial-number dial-10">10</span><span className="dial-number dial-15">15</span><span className="dial-number dial-20">20</span><span className="dial-number dial-25">25</span><span className="dial-number dial-30">30</span><span className="dial-number dial-35">35</span><span className="dial-number dial-40">40</span><span className="dial-number dial-45">45</span><span className="dial-number dial-50">50</span><span className="dial-number dial-55">55</span>
              <span className="stopwatch-brand">TIAN<br /><b>MECHANICAL</b></span>
              <span className="stopwatch-subdial"><i style={{ transform: `rotate(${secondHandAngle}deg)` }} /><b>30</b><em>15</em><strong>45</strong></span>
              <i className="stopwatch-hand" style={{ transform: `rotate(${handAngle}deg)` }} /><i className="stopwatch-pin" />
              <span className="stopwatch-readout">{timerText}</span>
              <span className={`stopwatch-state state-${timerState.toLowerCase()}`}>{timerState}</span>
            </div>
          </div>
          <p className="timer-instruction">{finished ? "Time’s up · press the crown to run it again" : running ? "Press the crown to pause · side pusher resets" : "Drag the red hand to set · press the crown to start"}</p>
          <p className="timer-live" role="status" aria-live="assertive">{finished ? "Timer complete" : ""}</p>
        </div>
      )}
      <nav className="clock-tabs"><button className={tab === "clock" ? "active" : ""} onClick={() => setTab("clock")}><i>◷</i>World Clock</button><button className={tab === "timer" ? "active" : ""} onClick={() => setTab("timer")}><i>◴</i>Timer</button></nav>
    </div>
  );
}

function NotesApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStroke = useRef<NoteStroke | null>(null);
  const canvasSize = useRef({ width: 1, height: 1 });
  const [notes, setNotes] = useState<NoteDocument[]>(() => {
    if (typeof window === "undefined") return [createWelcomeNote()];
    try {
      const saved = JSON.parse(window.localStorage.getItem(NOTES_STORAGE_KEY) ?? "null");
      if (Array.isArray(saved) && saved.length) return saved;
      const legacyDrawing = window.localStorage.getItem("tian-iphone-note-drawing") ?? undefined;
      return [createWelcomeNote(legacyDrawing)];
    } catch { return [createWelcomeNote()]; }
  });
  const [activeNoteId, setActiveNoteId] = useState(() => notes[0].id);
  const [view, setView] = useState<"editor" | "list">("editor");
  const [mode, setMode] = useState<"write" | "draw">("write");
  const [search, setSearch] = useState("");
  const [ink, setInk] = useState("#263c8f");
  const [brushSize, setBrushSize] = useState(3);
  const [eraser, setEraser] = useState(false);
  const [redoStrokes, setRedoStrokes] = useState<NoteStroke[]>([]);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const activeNote = notes.find((note) => note.id === activeNoteId) ?? notes[0];

  useEffect(() => {
    const statusTimer = window.setTimeout(() => setSaveStatus("Saving…"), 0);
    const timer = window.setTimeout(() => {
      try { window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes)); } catch { /* Notes remain available for this session. */ }
      setSaveStatus("Saved");
    }, 320);
    return () => { window.clearTimeout(statusTimer); window.clearTimeout(timer); };
  }, [notes]);

  const drawSmiley = useCallback((context: CanvasRenderingContext2D, width: number, height: number) => {
    context.strokeStyle = "#263c8f";
    context.fillStyle = "#263c8f";
    context.lineWidth = 3;
    context.lineCap = "round";
    context.beginPath();
    context.arc(width * .73, height * .46, Math.min(width, height) * .19, -.1, Math.PI * 2 + .08);
    context.stroke();
    context.beginPath();
    context.arc(width * .67, height * .41, 2.4, 0, Math.PI * 2);
    context.arc(width * .79, height * .40, 2.4, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(width * .73, height * .47, Math.min(width, height) * .105, .15, Math.PI - .08);
    context.stroke();
    context.save();
    context.translate(width * .14, height * .73);
    context.rotate(-.08);
    context.font = '18px "Marker Felt", "Bradley Hand", cursive';
    context.fillText("have fun!", 0, 0);
    context.restore();
  }, []);

  const paintStroke = useCallback((context: CanvasRenderingContext2D, stroke: NoteStroke, fromIndex = 1) => {
    const width = canvasSize.current.width;
    const height = canvasSize.current.height;
    if (stroke.points.length < 2) return;
    context.save();
    context.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.width;
    context.lineCap = "round";
    context.lineJoin = "round";
    const start = Math.max(1, fromIndex);
    context.beginPath();
    context.moveTo(stroke.points[start - 1].x * width, stroke.points[start - 1].y * height);
    for (let index = start; index < stroke.points.length; index += 1) context.lineTo(stroke.points[index].x * width, stroke.points[index].y * height);
    context.stroke();
    context.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== "draw" || !activeNote) return;
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(bounds.width * ratio);
    canvas.height = Math.round(bounds.height * ratio);
    canvasSize.current = { width: bounds.width, height: bounds.height };
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    if (activeNote.doodleSeed) drawSmiley(context, bounds.width, bounds.height);
    activeNote.strokes.forEach((stroke) => paintStroke(context, stroke));
  }, [activeNote, drawSmiley, mode, paintStroke]);

  const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>): NotePoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const bounds = canvas.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)), y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)) };
  };

  const beginStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    activeStroke.current = { color: ink, width: eraser ? Math.max(10, brushSize * 3) : brushSize, erase: eraser, points: [point, { ...point, x: Math.min(1, point.x + .0001) }] };
    const context = canvasRef.current?.getContext("2d");
    if (context) paintStroke(context, activeStroke.current);
  };

  const continueStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const stroke = activeStroke.current;
    const context = canvasRef.current?.getContext("2d");
    if (!stroke || !context) return;
    const point = pointFromEvent(event);
    const previous = stroke.points[stroke.points.length - 1];
    if (Math.hypot(point.x - previous.x, point.y - previous.y) < .003) return;
    stroke.points.push(point);
    paintStroke(context, stroke, stroke.points.length - 1);
  };

  const finishStroke = () => {
    const stroke = activeStroke.current;
    activeStroke.current = null;
    if (!stroke || stroke.points.length < 2 || !activeNote) return;
    setNotes((current) => current.map((note) => note.id === activeNote.id ? { ...note, strokes: [...note.strokes, stroke], updatedAt: new Date().toISOString() } : note));
    setRedoStrokes([]);
  };

  const updateActiveText = (text: string) => {
    setNotes((current) => current.map((note) => note.id === activeNote.id ? { ...note, text, updatedAt: new Date().toISOString() } : note));
  };

  const createNote = () => {
    const note = createBlankNote();
    setNotes((current) => [note, ...current]);
    setActiveNoteId(note.id);
    setView("editor");
    setMode("write");
    setRedoStrokes([]);
  };

  const deleteNote = (id: string) => {
    const remaining = notes.filter((note) => note.id !== id);
    const next = remaining.length ? remaining : [createBlankNote()];
    setNotes(next);
    if (id === activeNoteId) setActiveNoteId(next[0].id);
    setRedoStrokes([]);
  };

  const undoDrawing = () => {
    if (!activeNote?.strokes.length) return;
    const removed = activeNote.strokes[activeNote.strokes.length - 1];
    setNotes((current) => current.map((note) => note.id === activeNote.id ? { ...note, strokes: note.strokes.slice(0, -1), updatedAt: new Date().toISOString() } : note));
    setRedoStrokes((current) => [...current, removed]);
  };

  const redoDrawing = () => {
    const stroke = redoStrokes[redoStrokes.length - 1];
    if (!stroke || !activeNote) return;
    setNotes((current) => current.map((note) => note.id === activeNote.id ? { ...note, strokes: [...note.strokes, stroke], updatedAt: new Date().toISOString() } : note));
    setRedoStrokes((current) => current.slice(0, -1));
  };

  const clearDrawing = () => {
    if (!activeNote) return;
    setNotes((current) => current.map((note) => note.id === activeNote.id ? { ...note, strokes: [], doodleSeed: false, background: undefined, updatedAt: new Date().toISOString() } : note));
    setRedoStrokes([]);
  };

  const copyNote = async () => {
    try { await navigator.clipboard.writeText(activeNote.text); setSaveStatus("Copied"); window.setTimeout(() => setSaveStatus("Saved"), 1400); } catch { setSaveStatus("Copy failed"); }
  };

  const filteredNotes = notes.filter((note) => note.text.toLowerCase().includes(search.trim().toLowerCase()));
  const characterCount = activeNote?.text.length ?? 0;

  return (
    <div className="notes-app notes-studio">
      {view === "list" ? (
        <div className="notes-list-view">
          <header><strong>Notes</strong><button onClick={createNote} aria-label="Create a new note">＋</button></header>
          <div className="notes-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes" aria-label="Search notes" /></div>
          <div className="notes-list" role="list">
            {filteredNotes.map((note) => (
              <div className="notes-list-row" role="listitem" key={note.id}>
                <button className="notes-open" onClick={() => { setActiveNoteId(note.id); setView("editor"); setRedoStrokes([]); }}>
                  <strong>{noteTitle(note)}</strong><span>{notePreview(note)}</span><time dateTime={note.updatedAt}>{formatNoteDate(note.updatedAt)}</time>
                </button>
                <button className="notes-delete-row" onClick={() => deleteNote(note.id)} aria-label={`Delete ${noteTitle(note)}`}>×</button>
              </div>
            ))}
            {!filteredNotes.length && <p className="notes-empty">No notes found.</p>}
          </div>
          <footer>{notes.length} {notes.length === 1 ? "note" : "notes"} · stored on this device</footer>
        </div>
      ) : (
        <div className={`notes-editor notes-mode-${mode}`}>
          <header className="notes-editor-bar">
            <button onClick={() => setView("list")} aria-label="Back to all notes">‹ Notes</button>
            <span>{saveStatus}</span>
            <button onClick={createNote} aria-label="Create a new note">＋</button>
          </header>
          <div className="notes-paper">
            {mode === "write" ? (
              <textarea aria-label="Edit note" value={activeNote.text} onChange={(event) => updateActiveText(event.target.value)} placeholder="Start writing…" />
            ) : (
              <div className="notes-canvas-wrap">
                {activeNote.background && <img src={activeNote.background} alt="Earlier saved sketch" />}
                <canvas ref={canvasRef} aria-label="Draw on this note" onPointerDown={beginStroke} onPointerMove={continueStroke} onPointerUp={finishStroke} onPointerCancel={finishStroke} />
                {!activeNote.strokes.length && !activeNote.doodleSeed && !activeNote.background && <span>Draw anything.</span>}
              </div>
            )}
          </div>
          <div className="notes-meta"><span>{mode === "write" ? `${characterCount} characters` : `${activeNote.strokes.length} strokes`}</span><time dateTime={activeNote.updatedAt}>{formatNoteDate(activeNote.updatedAt)}</time></div>
          <div className="notes-toolbar" aria-label="Note tools">
            <button className={mode === "write" ? "active" : ""} onClick={() => setMode("write")} aria-label="Write text"><b>Aa</b><span>Write</span></button>
            <button className={mode === "draw" ? "active" : ""} onClick={() => setMode("draw")} aria-label="Draw"><b>✎</b><span>Draw</span></button>
            {mode === "write" ? (
              <><button onClick={copyNote} aria-label="Copy note"><b>⧉</b><span>Copy</span></button><button onClick={() => deleteNote(activeNote.id)} aria-label="Delete note"><b>⌫</b><span>Delete</span></button></>
            ) : (
              <>
                {["#263c8f", "#c52c31", "#27804a", "#191919"].map((color) => <button key={color} className={`notes-ink ${ink === color && !eraser ? "active" : ""}`} onClick={() => { setInk(color); setEraser(false); }} aria-label={`Draw in ${noteColorName(color)}`}><i style={{ background: color }} /></button>)}
                <button className={eraser ? "active" : ""} onClick={() => setEraser((value) => !value)} aria-label="Toggle eraser"><b>▱</b></button>
                <button onClick={() => setBrushSize((value) => value >= 7 ? 2 : value + 2)} aria-label={`Brush size ${brushSize}`}><i className="notes-brush-size" style={{ width: brushSize + 4, height: brushSize + 4 }} /></button>
                <button onClick={undoDrawing} disabled={!activeNote.strokes.length} aria-label="Undo drawing"><b>↶</b></button>
                <button onClick={redoDrawing} disabled={!redoStrokes.length} aria-label="Redo drawing"><b>↷</b></button>
                <button onClick={clearDrawing} aria-label="Clear drawing"><b>×</b></button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function createWelcomeNote(background?: string): NoteDocument {
  return { id: "welcome-note", text: "Happiness comes from\nsolving problems.\n\n— Mark Manson", updatedAt: new Date().toISOString(), strokes: [], doodleSeed: !background, background };
}

function createBlankNote(): NoteDocument {
  return { id: crypto.randomUUID(), text: "", updatedAt: new Date().toISOString(), strokes: [], doodleSeed: false };
}

function noteTitle(note: NoteDocument) {
  return note.text.split("\n").map((line) => line.trim()).find(Boolean) ?? "New Note";
}

function notePreview(note: NoteDocument) {
  const lines = note.text.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.slice(1).join(" ") || (note.strokes.length || note.doodleSeed || note.background ? "Sketch" : "No additional text");
}

function formatNoteDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function noteColorName(color: string) {
  return ({ "#263c8f": "blue", "#c52c31": "red", "#27804a": "green", "#191919": "black" } as Record<string, string>)[color] ?? color;
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
  const [portalIndex, setPortalIndex] = useState(0);
  const portal = safariPortals[portalIndex];
  const shufflePortal = () => setPortalIndex((current) => {
    const jump = 1 + Math.floor(Math.random() * (safariPortals.length - 1));
    return (current + jump) % safariPortals.length;
  });
  return (
    <div className="safari-app">
      <div className="safari-address"><span>https://</span><b>somewhere.good</b><button onClick={shufflePortal} aria-label="Shuffle destination">↻</button></div>
      <section className="safari-home">
        <div className="safari-portal">
          <small>TIAN’S INTERNET</small><i>{portal.mark}</i><h2>{portal.title}</h2><p>{portal.description}</p>
          <a href={portal.url} target="_blank" rel="noreferrer">Take me there <b>→</b></a>
          <button onClick={shufflePortal}>Surprise me again</button>
        </div>
        <h2>Keep close</h2>
        <button onClick={onOpenWork}><i className="bookmark-work">TX</i><span><b>Fun</b>Nine projects</span><em>›</em></button>
        <a href="https://xingpicture.myportfolio.com" target="_blank" rel="noreferrer"><i className="bookmark-photo">▣</i><span><b>Photo</b>xingpicture.myportfolio.com</span><em>›</em></a>
      </section>
      <nav><span>‹</span><span>›</span><button onClick={shufflePortal} aria-label="New surprise">＋</button><span>▤</span></nav>
    </div>
  );
}

function MusicApp() {
  return <div className="music-app"><iframe data-testid="spotify-embed" title="The Jazz I Love 2022 Spotify playlist" src="https://open.spotify.com/embed/playlist/6hYj1RoYJ85hj8c1kaDFJ2?utm_source=generator&amp;theme=0" width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" /><a href="https://open.spotify.com/playlist/6hYj1RoYJ85hj8c1kaDFJ2" target="_blank" rel="noreferrer">Open The Jazz I Love [2022] in Spotify</a></div>;
}
