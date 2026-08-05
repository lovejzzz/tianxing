"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent } from "react";
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
type Origin = { x: number; y: number };
type MessageBubble = {
  id: string;
  text: string;
  time: string;
  state: "sending" | "sent" | "error";
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

type WeatherData = {
  location: string;
  isDay: boolean;
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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const loadWeather = useCallback(async (latitude: number, longitude: number, location: string) => {
    setError("");
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(latitude));
      url.searchParams.set("longitude", String(longitude));
      url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day");
      url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
      url.searchParams.set("temperature_unit", "fahrenheit");
      url.searchParams.set("wind_speed_unit", "mph");
      url.searchParams.set("timezone", "auto");
      const response = await fetch(url);
      if (!response.ok) throw new Error("weather");
      const data = await response.json();
      setWeather({
        location,
        isDay: Boolean(data.current.is_day),
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
    <div
      className={`weather-app weather-code-${weather?.code ?? 0} ${weather?.isDay === false ? "weather-night" : "weather-day"}`}
      style={{ "--weather-rx": `${tilt.y}deg`, "--weather-ry": `${tilt.x}deg` } as CSSProperties}
      onPointerMove={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); setTilt({ x: ((event.clientX - bounds.left) / bounds.width - .5) * 9, y: -((event.clientY - bounds.top) / bounds.height - .5) * 7 }); }}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <WeatherScene code={weather?.code ?? 0} isDay={weather?.isDay ?? true} />
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

function WeatherScene({ code, isDay }: { code: number; isDay: boolean }) {
  const precipitation = code >= 51 && code <= 82;
  const snow = code >= 71 && code <= 77;
  const cloudy = code >= 1;
  return (
    <div className="weather-scene" aria-hidden="true">
      <div className="weather-atmosphere"><i /><i /><i /></div>
      <div className="weather-orb"><i className="weather-orb-glass" /><i className="weather-orb-land" /><span /></div>
      <i className={isDay ? "weather-sun" : "weather-moon"} />
      {cloudy && <><i className="weather-cloud weather-cloud-one" /><i className="weather-cloud weather-cloud-two" /></>}
      {precipitation && <div className={snow ? "weather-snow" : "weather-rain"}>{Array.from({ length: 16 }, (_, index) => <i key={index} style={{ "--drop": index } as CSSProperties} />)}</div>}
      {!isDay && <div className="weather-stars">{Array.from({ length: 10 }, (_, index) => <i key={index} style={{ "--star": index } as CSSProperties} />)}</div>}
      <span className="weather-haze" />
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
  const [draggingHand, setDraggingHand] = useState(false);
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
  const handAngle = seconds / 10;
  const setTimerFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (running) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height / 2);
    let angle = Math.atan2(dx, -dy) * 180 / Math.PI;
    if (angle <= 0) angle += 360;
    setSeconds(Math.max(30, Math.min(3600, Math.round((angle * 10) / 30) * 30)));
  };
  const toggleTimer = () => {
    if (seconds === 0) setSeconds(5 * 60);
    setRunning((value) => !value);
  };
  return (
    <div className="clock-app">
      {tab === "clock" ? (
        <div className="world-clock-panel">
          <div className="analog-clock"><i style={{ transform: `rotate(${minute}deg)` }} /><b style={{ transform: `rotate(${hour}deg)` }} /><em /></div>
          <strong>{time}</strong><span>New York</span>
        </div>
      ) : (
        <div className="timer-panel">
          <div className="stopwatch" aria-label={`Mechanical timer, ${timerText} remaining`}>
            <i className="stopwatch-loop" /><button className={`stopwatch-crown ${running ? "is-running" : ""}`} onClick={toggleTimer} aria-label={running ? "Stop timer" : "Start timer"} /><i className="stopwatch-pusher" />
            <div
              className={`stopwatch-face ${draggingHand ? "is-dragging" : ""}`}
              onPointerDown={(event) => { if (running) return; setDraggingHand(true); event.currentTarget.setPointerCapture(event.pointerId); setTimerFromPointer(event); }}
              onPointerMove={(event) => { if (draggingHand) setTimerFromPointer(event); }}
              onPointerUp={() => setDraggingHand(false)}
              onPointerCancel={() => setDraggingHand(false)}
            >
              <span className="dial-number dial-60">60</span><span className="dial-number dial-5">5</span><span className="dial-number dial-10">10</span><span className="dial-number dial-15">15</span><span className="dial-number dial-20">20</span><span className="dial-number dial-25">25</span><span className="dial-number dial-30">30</span><span className="dial-number dial-35">35</span><span className="dial-number dial-40">40</span><span className="dial-number dial-45">45</span><span className="dial-number dial-50">50</span><span className="dial-number dial-55">55</span>
              <i className="stopwatch-hand" style={{ transform: `rotate(${handAngle}deg)` }} /><i className="stopwatch-pin" />
              <span className="stopwatch-readout">{timerText}</span>
            </div>
          </div>
          <p className="timer-instruction">Drag the red hand to set · press the crown to {running ? "stop" : "start"}</p>
        </div>
      )}
      <nav className="clock-tabs"><button className={tab === "clock" ? "active" : ""} onClick={() => setTab("clock")}><i>◷</i>World Clock</button><button className={tab === "timer" ? "active" : ""} onClick={() => setTab("timer")}><i>◴</i>Timer</button></nav>
    </div>
  );
}

function NotesApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [ink, setInk] = useState("#263c8f");

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(bounds.width * ratio);
    canvas.height = Math.round(bounds.height * ratio);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    const saved = localStorage.getItem("tian-iphone-note-drawing");
    if (saved) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, bounds.width, bounds.height);
      image.src = saved;
    } else {
      drawSmiley(context, bounds.width, bounds.height);
    }
  }, [drawSmiley]);

  const drawAt = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    context.strokeStyle = ink;
    context.lineWidth = 3;
    if (!drawing.current) {
      drawing.current = true;
      context.beginPath();
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
      context.stroke();
    }
  };
  const finishDrawing = () => {
    drawing.current = false;
    try { if (canvasRef.current) localStorage.setItem("tian-iphone-note-drawing", canvasRef.current.toDataURL("image/png")); } catch { /* local drawing only */ }
  };
  const resetDrawing = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const bounds = canvas.getBoundingClientRect();
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawSmiley(context, bounds.width, bounds.height);
    finishDrawing();
  };

  return (
    <div className="notes-app">
      <textarea aria-label="A note from Tian Xing" defaultValue={"Happiness comes from\nsolving problems.\n\n— Mark Manson"} />
      <canvas ref={canvasRef} aria-label="Draw on this note" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); drawAt(event); }} onPointerMove={(event) => { if (drawing.current) drawAt(event); }} onPointerUp={finishDrawing} onPointerCancel={finishDrawing} />
      <div className="notes-drawing-tools" aria-label="Drawing colors">
        {["#263c8f", "#c52c31", "#27804a", "#191919"].map((color) => <button key={color} className={ink === color ? "active" : ""} style={{ background: color }} onClick={() => setInk(color)} aria-label={`Draw in ${color}`} />)}
        <button className="notes-redraw" onClick={resetDrawing} aria-label="Reset smiley drawing">☺</button>
      </div>
    </div>
  );
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
