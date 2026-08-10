"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FocusEvent as ReactFocusEvent, FormEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { projects } from "../projects";
import { portfolioPhotos } from "../photoManifest";
import { playSound, toggleRinger, useRinger } from "../sound";
import { AppIcon } from "./AppIcon";
import { Phone3DIntro } from "./Phone3DIntro";
import { WeatherCinemaEngine } from "./WeatherCinemaEngine";

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
  { title: "Radio Garden", host: "radio.garden", description: "Catch a live radio signal from somewhere you have never been.", url: "https://radio.garden/", mark: "◉", direction: "E", biome: "SOUND", bearing: 64, color: "#76dfc2" },
  { title: "WindowSwap", host: "window-swap.com", description: "Borrow a stranger’s window and stay for one quiet minute.", url: "https://www.window-swap.com/", mark: "▤", direction: "S", biome: "PEOPLE", bearing: 162, color: "#f2a769" },
  { title: "A Picture from Space", host: "apod.nasa.gov", description: "Bring back today’s photograph from beyond the atmosphere.", url: "https://apod.nasa.gov/apod/astropix.html", mark: "✦", direction: "N", biome: "COSMOS", bearing: 8, color: "#b9a7ff" },
  { title: "Public Domain Review", host: "publicdomainreview.org", description: "Excavate a beautiful oddity from art, film, or history.", url: "https://publicdomainreview.org/", mark: "∞", direction: "W", biome: "MEMORY", bearing: 278, color: "#f1d16f" },
  { title: "Earth", host: "earth.nullschool.net", description: "Watch the winds move and see the planet breathing in real time.", url: "https://earth.nullschool.net/", mark: "≈", direction: "NE", biome: "WEATHER", bearing: 38, color: "#65bdf0" },
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
const SAFARI_STAMPS_KEY = "tian-wild-web-stamps";
const WEATHER_LOCATION_KEY = "tian-iphone-weather-location";
const WEATHER_UNIT_KEY = "tian-iphone-weather-unit";
const WEATHER_CACHE_KEY = "tian-iphone-weather-cache-v2";
const NOTES_STORAGE_KEY = "tian-iphone-notes-v2";
const DRAGON_COLLECTION_KEY = "tian-iphone-dragon-codex-v1";
const DRAGON_KINDS = [
  { id: "moss", name: "Mossling", rarity: "COMMON", number: "001", element: "GROVE", heart: 84, spark: 61, lore: "Sleeps beneath old roots and wakes when rain touches stone." },
  { id: "ember", name: "Emberkin", rarity: "COMMON", number: "002", element: "FLAME", heart: 72, spark: 89, lore: "Its first sneeze can toast exactly one perfect marshmallow." },
  { id: "moon", name: "Moonwhisk", rarity: "RARE", number: "003", element: "DREAM", heart: 91, spark: 76, lore: "Collects unfinished dreams and returns them before sunrise." },
  { id: "storm", name: "Stormtail", rarity: "RARE", number: "004", element: "SKY", heart: 68, spark: 96, lore: "A tiny thunderstorm follows wherever its tail points." },
  { id: "crystal", name: "Starshard", rarity: "MYTHIC", number: "005", element: "STAR", heart: 99, spark: 99, lore: "Born once in a hundred rituals from a piece of fallen night." },
] as const;
const DRAGON_TRAITS = [
  { id: "brave", label: "BRAVE", heart: 5, spark: 2, greeting: "READY!", lore: "Runs toward thunder, then looks back to make sure you followed." },
  { id: "curious", label: "CURIOUS", heart: 2, spark: 5, greeting: "WHAT'S THAT?", lore: "Inspects every pebble twice and every mystery three times." },
  { id: "dreamy", label: "DREAMY", heart: 4, spark: 3, greeting: "I DREAMED OF YOU", lore: "Keeps a pocket of starlight for the quiet part of the day." },
  { id: "mischief", label: "MISCHIEF", heart: 1, spark: 7, greeting: "CATCH ME!", lore: "Can hide one sock, two keys, and itself before breakfast." },
  { id: "gentle", label: "GENTLE", heart: 7, spark: 1, greeting: "HI, FRIEND", lore: "Its warm little forehead makes difficult thoughts feel smaller." },
] as const;
const DRAGON_PATTERNS = ["stripe", "speckle", "crest", "glow"] as const;
type DragonKindId = (typeof DRAGON_KINDS)[number]["id"];
type DragonKind = (typeof DRAGON_KINDS)[number];
type DragonTraitId = (typeof DRAGON_TRAITS)[number]["id"];
type DragonPatternId = (typeof DRAGON_PATTERNS)[number];
type DragonCard = { id: string; kind: DragonKindId; hatchedAt: string; minutes: number; bond: number; trait: DragonTraitId; pattern: DragonPatternId; seed: number };
type DragonReaction = "happy" | "fire" | "spin" | "sleep" | null;
type DragonRarityOdds = { common: number; rare: number; mythic: number; charge: number; ritual: string };

function dragonRarityOdds(seconds: number): DragonRarityOdds {
  const charge = Math.max(0, Math.min(1, seconds / 3600));
  const mythic = .01 + .24 * Math.pow(charge, 1.7);
  const rare = .11 + .44 * Math.pow(charge, 1.05);
  const common = Math.max(0, 1 - rare - mythic);
  const ritual = charge >= .82 ? "CELESTIAL" : charge >= .58 ? "ANCIENT" : charge >= .32 ? "RESONANT" : charge >= .15 ? "AWAKENED" : "EMBER";
  return { common, rare, mythic, charge, ritual };
}

function chooseDragonKind(seconds: number, previous: DragonKindId): number {
  const odds = dragonRarityOdds(seconds);
  const roll = Math.random();
  const rarity = roll < odds.common ? "COMMON" : roll < odds.common + odds.rare ? "RARE" : "MYTHIC";
  const candidates = DRAGON_KINDS
    .map((kind, index) => ({ kind, index }))
    .filter(({ kind }) => kind.rarity === rarity);
  const freshCandidates = candidates.filter(({ kind }) => kind.id !== previous);
  const pool = freshCandidates.length > 0 ? freshCandidates : candidates;
  return pool[Math.floor(Math.random() * pool.length)].index;
}

function dragonHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return Math.abs(hash >>> 0);
}

function hydrateDragonCard(value: unknown): DragonCard | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<DragonCard>;
  if (typeof raw.id !== "string" || !DRAGON_KINDS.some((kind) => kind.id === raw.kind)) return null;
  const seed = typeof raw.seed === "number" ? raw.seed : dragonHash(raw.id);
  const trait = DRAGON_TRAITS.some((item) => item.id === raw.trait) ? raw.trait as DragonTraitId : DRAGON_TRAITS[seed % DRAGON_TRAITS.length].id;
  const pattern = DRAGON_PATTERNS.includes(raw.pattern as DragonPatternId) ? raw.pattern as DragonPatternId : DRAGON_PATTERNS[Math.floor(seed / 7) % DRAGON_PATTERNS.length];
  return {
    id: raw.id,
    kind: raw.kind as DragonKindId,
    hatchedAt: typeof raw.hatchedAt === "string" ? raw.hatchedAt : new Date().toISOString(),
    minutes: typeof raw.minutes === "number" ? raw.minutes : 5,
    bond: typeof raw.bond === "number" ? Math.max(1, Math.min(99, raw.bond)) : 1,
    trait,
    pattern,
    seed,
  };
}

function createDragonCard(kind: DragonKindId, minutes: number): DragonCard {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const seed = dragonHash(`${id}-${kind}-${minutes}`);
  return {
    id,
    kind,
    hatchedAt: new Date().toISOString(),
    minutes,
    bond: 1,
    trait: DRAGON_TRAITS[seed % DRAGON_TRAITS.length].id,
    pattern: DRAGON_PATTERNS[Math.floor(seed / 7) % DRAGON_PATTERNS.length],
    seed,
  };
}

function dragonTrait(card: DragonCard) {
  return DRAGON_TRAITS.find((trait) => trait.id === card.trait) ?? DRAGON_TRAITS[0];
}
type Origin = {
  x: number;
  y: number;
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  bodyScaleY: number;
};
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

// The 2010 keyboard clicked on every character, on Delete and on Return, and
// stayed quiet for modifiers and shortcuts.
function playKeyboardTick(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key.length === 1 || event.key === "Backspace" || event.key === "Delete" || event.key === "Enter") playSound("key");
}

export function PhoneExperience() {
  const phoneProductRef = useRef<HTMLDivElement>(null);
  const [ringerHud, setRingerHud] = useState(false);
  const ringerHudTimer = useRef<number | null>(null);
  const silenced = useRinger();
  const [mode, setMode] = useState<"folder" | "home" | "native">("folder");
  const [immersive, setImmersive] = useState(false);
  const [immersiveShift, setImmersiveShift] = useState(0);
  const [activeApp, setActiveApp] = useState<NativeApp | null>(null);
  const [closing, setClosing] = useState(false);
  const [origin, setOrigin] = useState<Origin>({ x: 50, y: 58, left: 134, top: 260, width: 64, height: 64, scaleX: .16, scaleY: .09, bodyScaleY: .1 });
  const [launchFromIcon, setLaunchFromIcon] = useState(false);
  const [homePressed, setHomePressed] = useState(false);
  const homePressedRef = useRef(false);
  const [motionInspectionMs, setMotionInspectionMs] = useState<number | null>(null);
  const [arrivalInspectionMs, setArrivalInspectionMs] = useState<number | null>(null);
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
  const deviceStageRef = useRef<HTMLElement>(null);
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

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const params = new URLSearchParams(window.location.search);
    const funValue = params.get("funFrame");
    const arrivalValue = params.get("arrivalFrame");
    const weatherValue = params.get("weatherTest");
    const timer = window.setTimeout(() => {
      if (weatherValue !== null) {
        setMode("native");
        setActiveApp("weather");
      }
      if (funValue !== null) {
        const requestedFrame = Number(funValue);
        if (Number.isFinite(requestedFrame)) setMotionInspectionMs(Math.max(0, Math.min(1100, requestedFrame)));
      }
      if (arrivalValue !== null) {
        const requestedFrame = Number(arrivalValue);
        if (Number.isFinite(requestedFrame)) setArrivalInspectionMs(Math.max(0, Math.min(3000, requestedFrame)));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const motionProgress = (motionInspectionMs ?? 0) / 1100;

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
    const screenElement = screenRef.current;
    const homeLayer = screenElement?.querySelector<HTMLElement>(".phone-home-layer");
    const screen = screenElement?.getBoundingClientRect();
    const layer = homeLayer?.getBoundingClientRect();
    const iconTarget = element?.querySelector<HTMLElement>(".system-app-icon") ?? element;
    const icon = iconTarget?.getBoundingClientRect();
    if (!screenElement || !screen || !homeLayer || !layer || !iconTarget || !icon) return false;

    // The desktop phone is slightly scaled to sit at the same physical glass
    // depth as the Three.js model. Viewport pixels therefore cannot be fed
    // straight back into the app layer: doing so applies that scale twice and
    // makes Home collapse toward a false, oversized target. Convert the
    // measured visual rectangle back into the layer's own CSS-pixel space.
    const layerWidth = Math.max(1, homeLayer.clientWidth);
    const layerHeight = Math.max(1, homeLayer.clientHeight);
    const scaleX = layerWidth / Math.max(1, layer.width);
    const scaleY = layerHeight / Math.max(1, layer.height);
    // Read the icon's layout box, not its pressed visual box. iOS compresses
    // an icon under the finger; getBoundingClientRect() includes that temporary
    // scale and used to move the Fun portal a few pixels down and right before
    // it opened. The transformed centre is stable, while offsetWidth/Height
    // preserve the real shared-element size.
    const width = iconTarget.offsetWidth;
    const height = iconTarget.offsetHeight;
    const centreX = (icon.left + icon.width / 2 - layer.left) * scaleX;
    const centreY = (icon.top + icon.height / 2 - layer.top) * scaleY;
    const left = centreX - width / 2;
    const top = centreY - height / 2;
    setOrigin({
      x: ((left + width / 2) / layerWidth) * 100,
      y: ((top + height / 2) / layerHeight) * 100,
      left,
      top,
      width,
      height,
      scaleX: width / layerWidth,
      scaleY: height / layerHeight,
      bodyScaleY: height / Math.max(1, layerHeight - 49),
    });
    return true;
  };

  // Flipping the switch shows the same brief translucent card iOS raised over
  // whatever was on screen, so the state change is felt as well as heard.
  const flipRinger = () => {
    toggleRinger();
    setRingerHud(true);
    if (ringerHudTimer.current) window.clearTimeout(ringerHudTimer.current);
    ringerHudTimer.current = window.setTimeout(() => setRingerHud(false), 1300);
  };

  useEffect(() => () => {
    if (ringerHudTimer.current) window.clearTimeout(ringerHudTimer.current);
  }, []);

  const openApp = (id: NativeApp | "folder", element?: HTMLElement | null) => {
    const fromIcon = rememberOrigin(element);
    playSound("open");
    setLaunchFromIcon(Boolean(fromIcon));
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
    playSound("close");
    const shouldReturnToFunIcon = mode === "folder" && !launchFromIcon;
    if (shouldReturnToFunIcon) {
      const funIcon = screenRef.current?.querySelector<HTMLElement>('.phone-home-layer [data-app-id="folder"]');
      if (funIcon && rememberOrigin(funIcon)) setLaunchFromIcon(true);
    }
    if (!immersive) {
      const stage = deviceStageRef.current;
      const before = stage?.getBoundingClientRect();
      const phone = stage?.querySelector<HTMLElement>(".phone")?.getBoundingClientRect();
      if (before) {
        setImmersiveShift(window.innerWidth / 2 - (before.left + before.width / 2));
      }
      if (phone) {
        window.dispatchEvent(new CustomEvent("tian:immersive-home", {
          detail: { phoneLeft: phone.left, phoneWidth: phone.width, delay: 0, duration: 1080 },
        }));
      }
      setImmersive(true);
    }
    setClosing(true);
    transitionTimer.current = window.setTimeout(() => {
      setMode("home");
      setActiveApp(null);
      setClosing(false);
      setLaunchFromIcon(false);
    }, mode === "folder" && (launchFromIcon || shouldReturnToFunIcon) ? 760 : 390);
  };

  const setPhysicalHomePressed = (pressed: boolean) => {
    if (homePressedRef.current === pressed) return;
    homePressedRef.current = pressed;
    if (pressed) playSound("home");
    setHomePressed(pressed);
    window.dispatchEvent(new CustomEvent("tian:home-button", { detail: { pressed } }));
  };

  return (
    <section
      ref={deviceStageRef}
      className={`device-stage ${immersive ? "is-immersive" : ""} ${arrivalInspectionMs !== null ? "is-mobile-arrival-inspection" : ""}`}
      style={{
        "--immersive-shift": `${immersiveShift}px`,
        "--mobile-arrival-inspection-offset": `${-(arrivalInspectionMs ?? 0)}ms`,
      } as CSSProperties}
      aria-label="Interactive iPhone portfolio"
    >
      <Phone3DIntro productRef={phoneProductRef} />
      <div className="phone-product" ref={phoneProductRef}>
        <div className="phone-back" aria-hidden="true">
          <span className="back-camera" />
          <span className="back-flash" />
        </div>

        <div className="device">
          <div className="device-button volume-up" aria-hidden="true" />
          <div className="device-button volume-down" aria-hidden="true" />
          <button
            type="button"
            className={`device-button mute ringer-switch ${silenced ? "is-silent" : ""}`}
            onClick={flipRinger}
            aria-pressed={silenced}
            title={silenced ? "Ringer off — turn interface sounds on" : "Ringer on — silence interface sounds"}
          >
            <span className="ringer-switch-label">{silenced ? "Turn interface sounds on" : "Silence interface sounds"}</span>
          </button>
        </div>

        <div className="phone" role="application" aria-label="Tian Xing's iPhone">
          <div className="phone-top">
            <span className="speaker" aria-hidden="true" />
            <span className="camera" aria-hidden="true" />
          </div>

          <div
            className={`screen phone-mode-${mode} ${motionInspectionMs !== null ? "is-fun-motion-inspection" : ""}`}
            ref={screenRef}
            style={motionInspectionMs === null ? undefined : {
              "--fun-inspection-offset": `${-motionInspectionMs}ms`,
              "--fun-home-scale": 1 + motionProgress * .055,
              "--fun-home-opacity": 1 - motionProgress * .42,
              "--fun-home-brightness": 1 - motionProgress * .38,
              "--fun-home-saturation": 1 - motionProgress * .2,
            } as CSSProperties}
          >
            <StatusBar time={time} silenced={silenced} onFlipRinger={flipRinger} />
            {ringerHud && (
              <div className={`ringer-hud ${silenced ? "is-silent" : ""}`} role="status" aria-live="polite">
                <RingerBell silenced={silenced} />
                <span>{silenced ? "Silent" : "Ringer"}</span>
              </div>
            )}
            <div className={`phone-home-layer ${mode === "home" || closing ? "is-active" : "is-background"} ${mode === "folder" && launchFromIcon ? "is-fun-background" : ""}`}>
              <HomeScreen calendarDay={calendarDay} calendarWeekday={calendarWeekday} onOpenApp={openApp} />
            </div>

            {mode !== "home" && (
              <div
                className={`phone-app-layer ${mode === "folder" ? "is-fun-app" : ""} ${launchFromIcon ? "is-from-icon" : ""} ${closing ? "is-closing" : "is-opening"}`}
                style={{
                  "--origin-x": `${origin.x}%`,
                  "--origin-y": `${origin.y}%`,
                  "--launch-x": `${origin.left}px`,
                  "--launch-y": `${origin.top}px`,
                  "--launch-width": `${origin.width}px`,
                  "--launch-height": `${origin.height}px`,
                  "--launch-scale-x": origin.scaleX,
                  "--launch-scale-y": origin.scaleY,
                  "--launch-body-scale-y": origin.bodyScaleY,
                } as CSSProperties}
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
                    onGoHome={goHome}
                  />
                )}
              </div>
            )}
          </div>

          <button
            className={`home-button ${homePressed ? "is-pressed" : ""}`}
            onPointerDown={() => setPhysicalHomePressed(true)}
            onPointerUp={() => setPhysicalHomePressed(false)}
            onPointerCancel={() => setPhysicalHomePressed(false)}
            onPointerLeave={() => setPhysicalHomePressed(false)}
            onBlur={() => setPhysicalHomePressed(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") setPhysicalHomePressed(true);
            }}
            onKeyUp={(event) => {
              if (event.key === "Enter" || event.key === " ") setPhysicalHomePressed(false);
            }}
            onClick={goHome}
            aria-label="Go to iPhone Home screen"
          >
            <span />
          </button>
        </div>
      </div>
    </section>
  );
}

function StatusBar({ time, silenced, onFlipRinger }: { time: string; silenced: boolean; onFlipRinger: () => void }) {
  return (
    <div className="status-bar" aria-label={`Current time ${time}`}>
      <span className="signal" aria-hidden="true"><i /><i /><i /><i /><i /></span>
      <span className="status-time">{time}</span>
      <span className="status-right">
        {/* iOS 4 posted a struck bell in the status bar whenever the ringer was
            off. Here it is also the control, since the steel band's switch is
            not on screen at phone widths. */}
        <button
          type="button"
          className={`status-ringer ${silenced ? "is-silent" : ""}`}
          onClick={onFlipRinger}
          aria-pressed={silenced}
          aria-label={silenced ? "Interface sounds are off. Turn them on." : "Interface sounds are on. Turn them off."}
          title={silenced ? "Interface sounds off" : "Interface sounds on"}
        >
          <RingerBell silenced={silenced} />
        </button>
        <span className="battery" aria-hidden="true"><b>100%</b><i /></span>
      </span>
    </div>
  );
}

function RingerBell({ silenced }: { silenced: boolean }) {
  return (
    <svg className="ringer-bell" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3.4c-3 0-5 2.1-5 5.1 0 3.6-.7 5-1.8 6.1-.5.5-.2 1.4.6 1.4h12.4c.8 0 1.1-.9.6-1.4-1.1-1.1-1.8-2.5-1.8-6.1 0-3-2-5.1-5-5.1Z" />
      <path d="M10.1 18.1a2 2 0 0 0 3.8 0Z" />
      {silenced && <path className="ringer-bell-slash" d="M4.4 3.9 20.1 19.6" />}
    </svg>
  );
}

function FolderView({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="folder-screen">
      <div className="fun-icon-shell" aria-hidden="true">
        <span className="system-app-icon sys-folder fun-portal-icon"><FunShelf compact /></span>
      </div>
      <div className="fun-dolly" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="folder-content">
        <div className="screen-titlebar work-titlebar">
          <button className="mobile-home-nav" type="button" onClick={onGoHome}>Home</button>
          <strong>Fun</strong>
        </div>

        <div className="folder-portal-body">
          <nav className="app-grid" aria-label="Selected projects">
            {projects.map((project, index) => (
              <Link
                className="app-link"
                href={`/projects/${project.slug}`}
                key={project.slug}
                onClick={() => playSound("open")}
                style={{ "--delay": `${index * 24}ms` } as CSSProperties}
              >
                <AppIcon project={project} />
                <span className="app-name">{project.shortTitle}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

function FunShelf({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`fun-shelf ${compact ? "is-compact" : ""}`}>
      {projects.slice(0, 9).map((project) => (
        <img src={`/art/work-icons/${project.slug}.png`} alt="" draggable={false} key={project.slug} />
      ))}
    </span>
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
          <button className="system-app" data-app-id={app.id} key={app.id} onClick={(event) => onOpenApp(app.id, event.currentTarget)}>
            <SystemAppIcon id={app.id} calendarDay={calendarDay} calendarWeekday={calendarWeekday} />
            <span className="system-app-label">{app.label}</span>
          </button>
        ))}
      </div>

      <div className="desktop-dock" aria-label="Favorite apps">
        {dockApps.map((app) => (
          <button
            className="system-app dock-system-app"
            data-app-id={app.id}
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
        <FunShelf compact />
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

function NativeAppView({ app, base, time, captures, onCapture, onDeleteCapture, onGoHome }: {
  app: NativeApp;
  base: string;
  time: string;
  captures: CapturedPhoto[];
  onCapture: (src: string) => void;
  onDeleteCapture: (id: string) => void;
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
        {app === "safari" && <SafariApp />}
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
    playSound("tock");
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
    playSound("send");
    const form = new URLSearchParams();
    form.set("message", cleanMessage);
    form.set("website", "");
    form.set("site_key", "tian-heart-2026");
    form.set("sent_at", new Date().toISOString());
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
      // This is delivery confirmation, not a new incoming message; a quiet
      // tactile pop avoids falsely suggesting that Tian has already replied.
      playSound("pop");
      textareaRef.current?.focus();
      window.setTimeout(() => setStatus("idle"), 2400);
    } catch {
      setThread((current) => current.map((item) => item.id === id ? { ...item, state: "error" } : item));
      setStatus("error");
      playSound("alert");
    } finally {
      window.clearTimeout(timeout);
    }
  };
  return (
    <form className="message-compose" onSubmit={submit}>
      <div className="message-thread" ref={threadRef} aria-label="Conversation with Tian">
        <div className="message-intro">
          <img src="/media/about/tian-xing-iphone4.jpg" alt="" aria-hidden="true" />
          <strong>Tian Xing</strong>
          <span>Your message goes straight to my email.</span>
        </div>
        <p className="message-received">Hi, I’m Tian. Nice to meet you.</p>
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
            playKeyboardTick(event);
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
    playSound("swipe");
    setMonth(next);
    setSelected(1);
  };
  const addEvent = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    const next = { ...events, [key]: [...(events[key] ?? []), { text: draft.trim(), color: eventColor }] };
    setEvents(next);
    setDraft("");
    playSound("pop");
    try { localStorage.setItem("tian-iphone-calendar", JSON.stringify(next)); } catch { /* local-only calendar */ }
  };
  const deleteEvent = (index: number) => {
    const nextItems = (events[key] ?? []).filter((_, itemIndex) => itemIndex !== index);
    const next = { ...events, [key]: nextItems };
    setEvents(next);
    playSound("trash");
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
            onClick={() => { if (!day) return; playSound("tock"); setSelected(day); }}
          >
            {day || ""}{day && events[`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`]?.length ? <i /> : null}
          </button>
        ))}
      </div>
      <section className="calendar-agenda">
        <h3>{new Date(month.getFullYear(), month.getMonth(), selected).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</h3>
        {(events[key] ?? []).map((item, index) => <p key={`${item.text}-${index}`}><i style={{ background: item.color }} /><span>{item.text}</span><button onClick={() => deleteEvent(index)} aria-label={`Delete ${item.text}`}>×</button></p>)}
        {!events[key]?.length && <p className="no-events">No events</p>}
        <div className="calendar-colors" aria-label="Event color">{["#df3d36", "#e0a52c", "#4e9d63", "#4c78a8"].map((color) => <button key={color} className={eventColor === color ? "active" : ""} style={{ background: color }} onClick={() => { playSound("tap"); setEventColor(color); }} aria-label={`Use ${color} event color`} />)}</div>
        <form onSubmit={addEvent}><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={playKeyboardTick} placeholder="Make a plan…" aria-label="Add event" /><button>Add</button></form>
      </section>
    </div>
  );
}

function PhotosApp({ base, captures, onDeleteCapture }: { base: string; captures: CapturedPhoto[]; onDeleteCapture: (id: string) => void }) {
  const [hiddenPhotos, setHiddenPhotos] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(PHOTO_HIDDEN_KEY) ?? "[]"); } catch { return []; }
  });
  const allPhotos = useMemo(() => {
    const cameraPhotos = captures.map((photo) => ({ id: photo.id, src: photo.src, alt: `Camera photo taken ${new Date(photo.createdAt).toLocaleString()}`, captured: true }));
    const seenPortfolioSources = new Set<string>();
    const libraryPhotos = portfolioPhotos
      .filter((photo) => {
        if (seenPortfolioSources.has(photo.src)) return false;
        seenPortfolioSources.add(photo.src);
        return true;
      })
      .map((photo) => ({ ...photo, id: photo.src, src: `${base}${photo.src}`, captured: false }));
    return [...cameraPhotos, ...libraryPhotos];
  }, [base, captures]);
  const photos = useMemo(() => allPhotos.filter((photo) => !hiddenPhotos.includes(photo.id)), [allPhotos, hiddenPhotos]);
  const [selected, setSelected] = useState(photos[0]?.id ?? "");
  const [viewing, setViewing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [notice, setNotice] = useState("");
  const [stageOffset, setStageOffset] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const confirmDeleteRef = useRef<HTMLButtonElement>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const noticeTimer = useRef<number | null>(null);
  const stripDrag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const stageDrag = useRef({ active: false, startX: 0, moved: false });
  const selectedPhoto = photos.find((photo) => photo.id === selected) ?? photos[0];
  const selectedIndex = Math.max(0, photos.findIndex((photo) => photo.id === selectedPhoto?.id));

  useEffect(() => () => {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
  }, []);

  useEffect(() => {
    if (!viewing) return;
    const frame = window.requestAnimationFrame(() => viewerRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [viewing]);

  useEffect(() => {
    if (!viewing || !stripRef.current) return;
    const thumbnail = stripRef.current.children[selectedIndex] as HTMLElement | undefined;
    thumbnail?.scrollIntoView({ behavior: stripDrag.current.active ? "auto" : "smooth", inline: "center", block: "nearest" });
  }, [selectedIndex, viewing]);

  useEffect(() => {
    if (!confirmingDelete) return;
    const frame = window.requestAnimationFrame(() => cancelDeleteRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [confirmingDelete]);

  const showNotice = (message: string) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2600);
  };
  const movePhoto = (direction: number) => {
    if (!photos.length) return;
    const next = (selectedIndex + direction + photos.length) % photos.length;
    playSound("swipe");
    setSelected(photos[next].id);
    setConfirmingDelete(false);
    setStageOffset(0);
  };
  const deleteSelected = () => {
    if (!selectedPhoto) return;
    const nextPhoto = photos[selectedIndex + 1] ?? photos[selectedIndex - 1];
    if (selectedPhoto.captured) {
      onDeleteCapture(selectedPhoto.id);
    } else {
      const nextHidden = Array.from(new Set([...hiddenPhotos, selectedPhoto.id]));
      setHiddenPhotos(nextHidden);
      try { localStorage.setItem(PHOTO_HIDDEN_KEY, JSON.stringify(nextHidden)); } catch { /* local album only */ }
    }
    setConfirmingDelete(false);
    if (nextPhoto) setSelected(nextPhoto.id); else setViewing(false);
    showNotice(selectedPhoto.captured ? "Photo deleted from this device." : "Moved to Recently Deleted.");
    playSound("trash");
    navigator.vibrate?.(16);
  };
  const restorePhotos = () => {
    setHiddenPhotos([]);
    try { localStorage.removeItem(PHOTO_HIDDEN_KEY); } catch { /* local album only */ }
    showNotice(`${hiddenPhotos.length} ${hiddenPhotos.length === 1 ? "photo" : "photos"} restored.`);
    playSound("restore");
  };
  const closeViewer = () => {
    playSound("close");
    setConfirmingDelete(false);
    setStageOffset(0);
    setViewing(false);
  };
  const choosePhoto = (id: string) => {
    setSelected(id);
    setConfirmingDelete(false);
    setStageOffset(0);
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
  const startStageDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    stageDrag.current = { active: true, startX: event.clientX, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveStageDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stageDrag.current.active) return;
    const delta = Math.max(-86, Math.min(86, event.clientX - stageDrag.current.startX));
    if (Math.abs(delta) > 5) stageDrag.current.moved = true;
    setStageOffset(delta);
  };
  const endStageDrag = () => {
    if (!stageDrag.current.active) return;
    const delta = stageOffset;
    stageDrag.current.active = false;
    if (Math.abs(delta) > 42) movePhoto(delta < 0 ? 1 : -1);
    setStageOffset(0);
  };
  const handleViewerKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (confirmingDelete) setConfirmingDelete(false); else closeViewer();
      return;
    }
    if (!confirmingDelete && event.key === "ArrowLeft") { event.preventDefault(); movePhoto(-1); }
    if (!confirmingDelete && event.key === "ArrowRight") { event.preventDefault(); movePhoto(1); }
    if ((event.key === "Backspace" || event.key === "Delete") && !confirmingDelete) { event.preventDefault(); setConfirmingDelete(true); }
  };
  const handleDeleteDialogKey = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setConfirmingDelete(false); return; }
    if (event.key !== "Tab") return;
    event.preventDefault();
    event.stopPropagation();
    const buttons = [confirmDeleteRef.current, cancelDeleteRef.current].filter(Boolean) as HTMLButtonElement[];
    const currentIndex = Math.max(0, buttons.indexOf(document.activeElement as HTMLButtonElement));
    buttons[(currentIndex + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus();
  };

  return (
    <div className="photos-app photos-library">
      <header className="photo-album-bar">
        <span><small>ALBUM</small><strong>Camera Roll</strong></span>
        <b>{photos.length}</b>
      </header>
      {photos.length ? (
        <>
          <div className="photo-section-label"><strong>All Photos</strong><span>Tap to view · drag the filmstrip</span></div>
          <div className="photo-grid" role="group" aria-label="Camera Roll photos">
            {photos.map((photo, index) => (
              <button key={photo.id} onClick={() => { playSound("open"); choosePhoto(photo.id); setViewing(true); }} aria-label={`View photo ${index + 1}: ${photo.alt}`}>
                <img src={photo.src} alt="" loading={index > 7 ? "lazy" : "eager"} draggable={false} />
                {photo.captured && <i aria-hidden="true"><b /></i>}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="photo-empty"><i>▧</i><strong>No Photos</strong><span>Your Photo Booth pictures will appear here.</span>{hiddenPhotos.length > 0 && <button onClick={restorePhotos}>Restore Photos</button>}</div>
      )}
      {hiddenPhotos.length > 0 && photos.length > 0 && (
        <section className="photo-recently-deleted">
          <i>⌫</i><span><strong>Recently Deleted</strong><small>{hiddenPhotos.length} recoverable {hiddenPhotos.length === 1 ? "photo" : "photos"}</small></span><button onClick={restorePhotos}>Restore All</button>
        </section>
      )}
      {notice && <p className="photo-notice" role="status" aria-live="polite">{notice}</p>}
      {viewing && selectedPhoto && (
        <div className="photo-viewer" ref={viewerRef} role="dialog" aria-modal="true" aria-label="Photo viewer" tabIndex={-1} onKeyDown={handleViewerKey}>
          <div className="photo-viewer-bar">
            <button className="photo-back" onClick={closeViewer}><i>‹</i>Camera Roll</button>
            <span><strong>{selectedIndex + 1} of {photos.length}</strong><small>{selectedPhoto.captured ? "Photo Booth" : "Tian Xing"}</small></span>
            <button className="photo-trash" onClick={() => { playSound("tock"); setConfirmingDelete(true); }} aria-label="Delete this photo"><i /><span>Delete</span></button>
          </div>
          <div className={`photo-viewer-stage ${stageOffset ? "is-dragging" : ""}`} onPointerDown={startStageDrag} onPointerMove={moveStageDrag} onPointerUp={endStageDrag} onPointerCancel={endStageDrag} onLostPointerCapture={endStageDrag}>
            <button className="photo-step photo-step-previous" onClick={() => movePhoto(-1)} aria-label="Previous photo">‹</button>
            <figure style={{ "--photo-drag-x": `${stageOffset}px` } as CSSProperties}>
              <img src={selectedPhoto.src} alt={selectedPhoto.alt} draggable={false} />
              <figcaption>{selectedPhoto.alt}</figcaption>
            </figure>
            <button className="photo-step photo-step-next" onClick={() => movePhoto(1)} aria-label="Next photo">›</button>
          </div>
          <div className="photo-viewer-strip" ref={stripRef} onPointerDown={startStripDrag} onPointerMove={moveStripDrag} onPointerUp={endStripDrag} onPointerCancel={endStripDrag} onLostPointerCapture={endStripDrag} aria-label="Draggable photo filmstrip">
            {photos.map((photo, index) => <button key={photo.id} data-photo-index={index} className={selectedPhoto.id === photo.id ? "selected" : ""} onClick={() => { if (stripDrag.current.moved) return; playSound("tap"); choosePhoto(photo.id); }} aria-label={`View photo ${index + 1}: ${photo.alt}`}><img src={photo.src} alt="" draggable={false} /></button>)}
          </div>
          {confirmingDelete && (
            <div className="photo-delete-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) setConfirmingDelete(false); }}>
              <section className="photo-delete-alert" role="alertdialog" aria-modal="true" aria-labelledby="delete-photo-title" aria-describedby="delete-photo-message" onKeyDown={handleDeleteDialogKey}>
                <img src={selectedPhoto.src} alt="" />
                <h2 id="delete-photo-title">Delete Photo?</h2>
                <p id="delete-photo-message">{selectedPhoto.captured ? "This Photo Booth picture will be permanently removed from this device." : "This photo will move to Recently Deleted, where you can restore it later."}</p>
                <div><button ref={confirmDeleteRef} className="confirm-photo-delete" onClick={deleteSelected}>Delete Photo</button><button ref={cancelDeleteRef} onClick={() => { playSound("tock"); setConfirmingDelete(false); }}>Cancel</button></div>
              </section>
            </div>
          )}
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
    playSound("tock");
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
    playSound("shutter");
    setFlash(true);
    window.setTimeout(() => setFlash(false), 180);
    onCapture(src);
  };

  const beginCapture = () => {
    if (status !== "ready" || countdown !== null) return;
    let value = 3;
    setCountdown(value);
    playSound("beep");
    countdownTimer.current = window.setInterval(() => {
      value -= 1;
      if (value <= 0) {
        if (countdownTimer.current) window.clearInterval(countdownTimer.current);
        countdownTimer.current = null;
        setCountdown(null);
        takePhoto();
      } else {
        setCountdown(value);
        playSound("beep");
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
        {status === "blocked" && <div className="camera-permission"><strong>Photo Booth needs a camera</strong><span>Allow camera access, then make a portrait with a 2010-era effect.</span><button onClick={() => { playSound("tock"); void startCamera(facing); }}>Try Again</button></div>}
        {flash && <i className="camera-flash" />}
      </div>
      <div className="booth-effects" aria-label="Photo Booth effects">
        {boothEffects.map((item) => <button key={item.id} className={effect === item.id ? "active" : ""} onClick={() => { playSound("tap"); setEffect(item.id); }} aria-pressed={effect === item.id}><i className={`effect-${item.id}`} /><span>{item.label}</span></button>)}
      </div>
      <div className="camera-controls">
        <button className="latest-shot" onClick={() => { playSound("open"); setReviewing(true); }} disabled={!latest} aria-label={latest ? `Open latest photo. ${captures.length} photos in camera roll` : "Camera roll is empty"}>
          {latest && <img src={latest.src} alt="Latest capture" />}
        </button>
        <button className="shutter booth-shutter" onClick={beginCapture} disabled={status !== "ready" || countdown !== null} aria-label="Take Photo Booth photo"><span /></button>
        <span className="camera-mode">{activeEffect.label}</span>
      </div>
      {reviewing && latest && (
        <div className="camera-review" role="dialog" aria-modal="true" aria-label="Latest camera photo">
          <div className="camera-review-toolbar">
            <button onClick={() => { playSound("close"); setReviewing(false); }}>Camera</button>
            <strong>Camera Roll</strong>
            <span>1 of {captures.length}</span>
          </div>
          <div className="camera-review-photo"><img src={latest.src} alt={`Photo taken ${new Date(latest.createdAt).toLocaleString()}`} /></div>
          <div className="camera-review-actions">
            <time dateTime={latest.createdAt}>{new Date(latest.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
            <button onClick={() => { playSound("trash"); onDeleteCapture(latest.id); setReviewing(false); }} aria-label="Delete latest photo">Delete Photo</button>
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
const featuredWeatherPlaces: Array<WeatherPlace & { glow: string }> = [
  { ...defaultWeatherPlace, glow: "rgba(218,157,73,.3)" },
  { name: "Shanghai", country: "China", admin: "Shanghai", latitude: 31.2304, longitude: 121.4737, glow: "rgba(74,184,202,.28)" },
  { name: "Paris", country: "France", admin: "Île-de-France", latitude: 48.8566, longitude: 2.3522, glow: "rgba(204,119,111,.28)" },
  { name: "Tokyo", country: "Japan", admin: "Tokyo", latitude: 35.6762, longitude: 139.6503, glow: "rgba(186,105,160,.3)" },
  { name: "London", country: "United Kingdom", admin: "England", latitude: 51.5072, longitude: -.1276, glow: "rgba(121,151,177,.3)" },
  { name: "Sydney", country: "Australia", admin: "New South Wales", latitude: -33.8688, longitude: 151.2093, glow: "rgba(74,170,178,.28)" },
  { name: "Dubai", country: "United Arab Emirates", admin: "Dubai", latitude: 25.2048, longitude: 55.2708, glow: "rgba(223,168,75,.3)" },
  { name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198, glow: "rgba(75,164,121,.28)" },
];

function WeatherApp() {
  const [place, setPlace] = useState<WeatherPlace>(() => {
    if (typeof window === "undefined") return defaultWeatherPlace;
    try { return JSON.parse(window.localStorage.getItem(WEATHER_LOCATION_KEY) ?? "null") ?? defaultWeatherPlace; } catch { return defaultWeatherPlace; }
  });
  const [unit] = useState<WeatherUnit>(() => {
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
  const [cinemaPreview, setCinemaPreview] = useState<{ code: number; isDay: boolean; updatedAt?: string; inspectionMs?: number | null; place?: WeatherPlace } | null>(null);
  const weatherRef = useRef(weather);

  useEffect(() => { weatherRef.current = weather; }, [weather]);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("weatherTest");
    if (!requested) return;
    const testCodes: Record<string, number> = { clear: 0, cloud: 3, fog: 45, rain: 63, snow: 73, storm: 95 };
    const numericCode = Number(requested);
    const code = Number.isFinite(numericCode) ? numericCode : testCodes[requested.toLowerCase()];
    if (!Number.isFinite(code)) return;
    const hour = Math.max(0, Math.min(23, Number(params.get("weatherHour") ?? 22)));
    const frameValue = params.get("weatherFrame");
    const inspectionMs = frameValue === null ? null : Math.max(0, Number(frameValue) || 0);
    const testPlaces: Record<string, WeatherPlace> = {
      "new-york": defaultWeatherPlace,
      shanghai: { name: "Shanghai", country: "China", latitude: 31.2304, longitude: 121.4737 },
      paris: { name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522 },
      london: { name: "London", country: "United Kingdom", latitude: 51.5072, longitude: -.1276 },
      seattle: { name: "Seattle", country: "United States", latitude: 47.6062, longitude: -122.3321 },
      dubai: { name: "Dubai", country: "United Arab Emirates", latitude: 25.2048, longitude: 55.2708 },
      sydney: { name: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093 },
      rome: { name: "Rome", country: "Italy", latitude: 41.9028, longitude: 12.4964 },
      singapore: { name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198 },
      istanbul: { name: "Istanbul", country: "Türkiye", latitude: 41.0082, longitude: 28.9784 },
    };
    const previewPlace = testPlaces[(params.get("weatherCity") ?? "").toLowerCase()];
    const timer = window.setTimeout(() => {
      setCinemaPreview({ code, isDay: hour >= 6 && hour < 19, updatedAt: `2026-08-09T${String(hour).padStart(2, "0")}:00`, inspectionMs, place: previewPlace });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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
    playSound("tap");
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
      if (!data.results?.length) {
        setError("No places found. Try a nearby city.");
        playSound("alert");
      }
    } catch {
      setError("City search is unavailable right now.");
      playSound("alert");
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = () => {
    playSound("tap");
    if (!navigator.geolocation) { setError("Location is not available on this device."); playSound("alert"); return; }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPlace({ name: "My Location", latitude: position.coords.latitude, longitude: position.coords.longitude });
        setPickerOpen(false);
        setLocating(false);
        playSound("pop");
      },
      () => { setError("Location permission was not granted."); setLocating(false); playSound("alert"); },
      { timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const chooseWeatherPlace = (nextPlace: WeatherPlace) => {
    playSound("pop");
    setPlace(nextPlace);
    setPickerOpen(false);
    setQuery("");
    setResults([]);
    setError("");
  };

  const theme = weatherTheme(weather?.code ?? 0, weather?.isDay ?? true);

  return (
    <div
      className={`weather-app weather-cinematic ${theme} ${pickerOpen ? "weather-picker-open" : ""}`}
      aria-busy={loading}
    >
      <div className="weather-scene weather-engine-stage" aria-hidden="true">
        <WeatherCinemaEngine
          code={cinemaPreview?.code ?? weather?.code ?? 0}
          isDay={cinemaPreview?.isDay ?? weather?.isDay ?? true}
          place={cinemaPreview?.place ?? weather?.place ?? place}
          updatedAt={cinemaPreview?.updatedAt ?? weather?.updatedAt}
          wind={weather?.wind}
          precipitation={weather?.precipitation}
          inspectionMs={cinemaPreview?.inspectionMs}
        />
      </div>
      <button className="weather-city-chip" onClick={() => { playSound("open"); setPickerOpen(true); }} aria-label="Choose weather location">
        <span><strong>{weather?.place.name ?? place.name}</strong><small>{weather ? `${weatherLabel(weather.code)} · Open-Meteo` : "Finding the sky…"}</small></span>
        <b>{loading && !weather ? "…" : `${Math.round(weather?.temperature ?? 0)}°`}</b><i>⌄</i>
      </button>
      {error && <div className="weather-error weather-error-minimal" role="status">{error}</div>}

      {pickerOpen && (
        <div className="weather-picker" role="dialog" aria-modal="true" aria-label="Choose a city">
          <header><button onClick={() => { playSound("close"); setPickerOpen(false); }}>Cancel</button><strong>City</strong><span /></header>
          <form onSubmit={searchLocations}><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={playKeyboardTick} placeholder="City or postal code" aria-label="Search city" autoFocus /><button disabled={searching || query.trim().length < 2}>{searching ? "…" : "Search"}</button></form>
          <button className="weather-current-location" onClick={useCurrentLocation} disabled={locating}><i>◎</i><span><strong>{locating ? "Finding you…" : "My Location"}</strong><small>Use this device’s location</small></span></button>
          <div className="weather-search-results">
            {results.map((result) => <button key={`${result.latitude}-${result.longitude}`} onClick={() => chooseWeatherPlace(result)}><span><strong>{result.name}</strong><small>{[result.admin, result.country].filter(Boolean).join(", ")}</small></span><i>›</i></button>)}
          </div>
          {results.length === 0 && (
            <section className="weather-featured-cities" aria-label="Featured city scenes">
              <header><strong>Featured Cities</strong><small>Eight cinematic windows</small></header>
              <div className="weather-featured-grid">
                {featuredWeatherPlaces.map((featured, index) => (
                  <button
                    key={featured.name}
                    className="weather-featured-city"
                    style={{ "--city-glow": featured.glow } as CSSProperties}
                    onClick={() => chooseWeatherPlace(featured)}
                    aria-label={`Show ${featured.name} weather`}
                  >
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <span><strong>{featured.name}</strong><small>{featured.country}</small></span>
                    <i aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          )}
          {error && <p>{error}</p>}
        </div>
      )}
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

function weatherTheme(code: number, isDay: boolean) {
  const time = isDay ? "weather-day" : "weather-night";
  if (code >= 95) return `${time} weather-stormy`;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return `${time} weather-snowy`;
  if (code >= 51) return `${time} weather-rainy`;
  if (code === 45 || code === 48) return `${time} weather-foggy`;
  if (code >= 2) return `${time} weather-cloudy`;
  return `${time} weather-clear`;
}

function DragonSprite({ reaction = null, card = false, pattern }: { reaction?: DragonReaction; card?: boolean; pattern?: DragonPatternId }) {
  return (
    <span className={`baby-dragon ${card ? "card-dragon" : ""} ${pattern ? `dragon-pattern-${pattern}` : ""} ${reaction ? `dragon-reaction-${reaction}` : ""}`} aria-hidden="true">
      <i className="dragon-tail" /><i className="dragon-wing wing-left" /><i className="dragon-wing wing-right" />
      <i className="dragon-body" />
      <i className="dragon-head"><b className="dragon-horn horn-left" /><b className="dragon-horn horn-right" /><b className="dragon-eye eye-left" /><b className="dragon-eye eye-right" /><b className="dragon-snout" /></i>
      <i className="dragon-spark spark-one" /><i className="dragon-spark spark-two" /><i className="dragon-spark spark-three" />
      {reaction && <b className="dragon-reaction-mark">{reaction === "happy" ? "♥" : reaction === "fire" ? "✦" : reaction === "spin" ? "!" : "z"}</b>}
    </span>
  );
}

function ClockApp({ time }: { time: string }) {
  const [tab, setTab] = useState<"clock" | "timer">("clock");
  const [seconds, setSeconds] = useState(5 * 60);
  const [lastSetSeconds, setLastSetSeconds] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const [draggingHand, setDraggingHand] = useState(false);
  const [finished, setFinished] = useState(false);
  const [dragonKind, setDragonKind] = useState(0);
  const [dragonView, setDragonView] = useState<"ritual" | "codex">("ritual");
  const [dragonReaction, setDragonReaction] = useState<DragonReaction>(null);
  const [dragonMessage, setDragonMessage] = useState("");
  const [dragonCombo, setDragonCombo] = useState(0);
  const [dragonCollection, setDragonCollection] = useState<DragonCard[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = JSON.parse(window.localStorage.getItem(DRAGON_COLLECTION_KEY) ?? "[]");
      return Array.isArray(saved) ? saved.map(hydrateDragonCard).filter((card): card is DragonCard => card !== null) : [];
    }
    catch { return []; }
  });
  const [activeDragonId, setActiveDragonId] = useState<string | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const lastHapticMinute = useRef(5);
  const dragonKindRef = useRef(0);
  const reactionTimerRef = useRef<number | null>(null);
  const lastDragonTapRef = useRef(0);
  const cardGlareTimerRef = useRef<number | null>(null);
  const codexTrackRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const minute = now.getMinutes() * 6;
  const hour = (now.getHours() % 12) * 30 + now.getMinutes() / 2;
  const activeDragon = dragonCollection.find((card) => card.id === activeDragonId) ?? dragonCollection[0] ?? null;
  const activeTrait = activeDragon ? dragonTrait(activeDragon) : null;
  const activeKind = activeDragon ? DRAGON_KINDS.find((kind) => kind.id === activeDragon.kind) ?? DRAGON_KINDS[dragonKind] : DRAGON_KINDS[dragonKind];
  const undiscoveredKinds = DRAGON_KINDS.filter((kind) => !dragonCollection.some((card) => card.kind === kind.id));
  const codexEntries: Array<{ card: DragonCard | null; kind: DragonKind }> = [
    ...dragonCollection.map((card) => ({ card, kind: DRAGON_KINDS.find((kind) => kind.id === card.kind) ?? DRAGON_KINDS[0] })),
    ...undiscoveredKinds.map((kind) => ({ card: null, kind })),
  ];
  const rarityOdds = dragonRarityOdds(lastSetSeconds);
  const rarePercent = Math.round(rarityOdds.rare * 100);
  const mythicPercent = Math.round(rarityOdds.mythic * 100);
  const rarityPercent = {
    common: 100 - rarePercent - mythicPercent,
    rare: rarePercent,
    mythic: mythicPercent,
  };

  const ringTimer = useCallback(() => {
    playSound("chime");
    navigator.vibrate?.([120, 70, 120, 70, 180]);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DRAGON_COLLECTION_KEY, JSON.stringify(dragonCollection));
  }, [dragonCollection]);

  useEffect(() => () => {
    if (reactionTimerRef.current !== null) window.clearTimeout(reactionTimerRef.current);
    if (cardGlareTimerRef.current !== null) window.clearTimeout(cardGlareTimerRef.current);
  }, []);

  useEffect(() => {
    if (!running) return;
    const update = () => {
      if (endTimeRef.current === null) return;
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setSeconds((value) => value === remaining ? value : remaining);
      // The last five seconds count themselves down, the way a mechanical
      // kitchen timer gets louder as it runs out.
      if (remaining > 0 && remaining <= 5 && remaining !== lastTickRef.current) {
        lastTickRef.current = remaining;
        playSound("tick");
      }
      if (remaining === 0) {
        endTimeRef.current = null;
        setRunning(false);
        const next = chooseDragonKind(lastSetSeconds, DRAGON_KINDS[dragonKindRef.current].id);
        dragonKindRef.current = next;
        setDragonKind(next);
        setDragonReaction(null);
        setDragonCombo(0);
        const hatchling = createDragonCard(DRAGON_KINDS[next].id, Math.max(.5, lastSetSeconds / 60));
        setActiveDragonId(hatchling.id);
        setDragonMessage(dragonTrait(hatchling).greeting);
        setDragonCollection((cards) => [hatchling, ...cards].slice(0, 60));
        setFinished(true);
        ringTimer();
        playSound("sparkle");
      }
    };
    update();
    const timer = window.setInterval(update, 125);
    return () => window.clearInterval(timer);
  }, [lastSetSeconds, ringTimer, running]);

  const timerText = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const handAngle = seconds / 10;
  const timerState = finished ? "TIME" : running ? "RUNNING" : seconds < lastSetSeconds ? "PAUSED" : "READY";
  const timerProgress = Math.max(0, Math.min(1, 1 - seconds / Math.max(1, lastSetSeconds)));
  const eggStage = finished ? 4 : timerProgress > .82 ? 3 : timerProgress > .5 ? 2 : timerProgress > .18 ? 1 : 0;
  const applyTimerSeconds = (nextSeconds: number, haptic = false) => {
    const next = Math.max(30, Math.min(3600, Math.round(nextSeconds / 30) * 30));
    setSeconds(next);
    setLastSetSeconds(next);
    setFinished(false);
    if (haptic) {
      const nextMinute = Math.ceil(next / 60);
      // One detent per minute, so dragging the pin feels like a notched dial.
      if (nextMinute !== lastHapticMinute.current) {
        navigator.vibrate?.(5);
        playSound("tick");
      }
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
    playSound(running ? "tock" : "charge");
    navigator.vibrate?.(8);
    setFinished(false);
    lastTickRef.current = 0;
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
    lastTickRef.current = 0;
    playSound("tock");
    navigator.vibrate?.(10);
  };
  const interactDragon = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX ? (event.clientX - bounds.left) / bounds.width : .5;
    const y = event.clientY ? (event.clientY - bounds.top) / bounds.height : .35;
    const now = Date.now();
    const nextCombo = now - lastDragonTapRef.current < 1100 ? Math.min(5, dragonCombo + 1) : 1;
    lastDragonTapRef.current = now;

    let next: Exclude<DragonReaction, null> = "happy";
    let message = "PURRR!";
    if (y < .46) {
      next = "happy";
      message = nextCombo > 2 ? "BEST FRIEND!" : "PURRR!";
    } else if (x > .58) {
      next = "fire";
      message = nextCombo > 2 ? "BIG SPARK!" : "ACHOO!";
    } else if (x < .42) {
      next = "spin";
      message = nextCombo > 2 ? "AGAIN!" : "WHEEE!";
    } else {
      next = nextCombo >= 4 ? "spin" : "happy";
      message = nextCombo >= 4 ? "ZOOM!" : "HEHE!";
    }

    const bondGain = nextCombo === 3 ? 1 : nextCombo === 5 ? 2 : 0;
    if (bondGain > 0) message = `${message}  BOND +${bondGain}`;

    if (reactionTimerRef.current !== null) window.clearTimeout(reactionTimerRef.current);
    setDragonReaction(next);
    setDragonMessage(message);
    setDragonCombo(nextCombo);
    if (bondGain > 0 && activeDragon) {
      setDragonCollection((cards) => cards.map((card) => card.id === activeDragon.id ? { ...card, bond: Math.min(99, card.bond + bondGain) } : card));
    }
    playSound(next === "fire" ? "spark" : next === "spin" ? "zoom" : "purr");
    navigator.vibrate?.(next === "fire" ? [20, 20, 35] : 12);
    reactionTimerRef.current = window.setTimeout(() => {
      setDragonReaction(null);
      setDragonMessage("");
      setDragonCombo(0);
    }, 1450);
  };
  const watchDragon = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!finished || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - .5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - .42) * 2));
    event.currentTarget.style.setProperty("--dragon-look-x", `${(x * 2.2).toFixed(1)}px`);
    event.currentTarget.style.setProperty("--dragon-look-y", `${(y * 1.7).toFixed(1)}px`);
  };
  const restDragonGaze = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty("--dragon-look-x", "0px");
    event.currentTarget.style.setProperty("--dragon-look-y", "0px");
  };
  const openDragonCodex = () => {
    playSound("swipe");
    setDragonView("codex");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const track = codexTrackRef.current;
      const card = activeDragonId
        ? track?.querySelector<HTMLElement>(`[data-dragon-id="${activeDragonId}"]`)
        : track?.querySelector<HTMLElement>("[data-dragon-id]");
      if (!track || !card) return;
      track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2, behavior: "smooth" });
    }));
  };
  const visitDragon = (card: DragonCard) => {
    const kindIndex = DRAGON_KINDS.findIndex((kind) => kind.id === card.kind);
    setActiveDragonId(card.id);
    setDragonKind(Math.max(0, kindIndex));
    dragonKindRef.current = Math.max(0, kindIndex);
    setSeconds(0);
    setFinished(true);
    setDragonReaction("happy");
    setDragonMessage(dragonTrait(card).greeting);
    setDragonCombo(0);
    setDragonView("ritual");
    playSound("pop");
    navigator.vibrate?.(12);
    if (reactionTimerRef.current !== null) window.clearTimeout(reactionTimerRef.current);
    reactionTimerRef.current = window.setTimeout(() => {
      setDragonReaction(null);
      setDragonMessage("");
    }, 1500);
  };
  const moveDragonCard = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    const tiltX = (0.5 - y) * 9;
    const tiltY = (x - 0.5) * 11;
    const lightAngle = Math.atan2(y - 0.5, x - 0.5) * 180 / Math.PI + 90;

    card.style.setProperty("--card-rx", `${tiltX.toFixed(2)}deg`);
    card.style.setProperty("--card-ry", `${tiltY.toFixed(2)}deg`);
    card.style.setProperty("--card-light-x", `${(x * 100).toFixed(1)}%`);
    card.style.setProperty("--card-light-y", `${(y * 100).toFixed(1)}%`);
    card.style.setProperty("--card-light-angle", `${lightAngle.toFixed(1)}deg`);
    card.style.setProperty("--card-glare", "1");

    if (cardGlareTimerRef.current !== null) window.clearTimeout(cardGlareTimerRef.current);
    cardGlareTimerRef.current = window.setTimeout(() => {
      card.style.setProperty("--card-glare", "0");
      cardGlareTimerRef.current = null;
    }, 150);
  };
  const restDragonCard = (event: ReactPointerEvent<HTMLElement> | ReactFocusEvent<HTMLElement>) => {
    if (cardGlareTimerRef.current !== null) {
      window.clearTimeout(cardGlareTimerRef.current);
      cardGlareTimerRef.current = null;
    }
    const card = event.currentTarget;
    card.style.setProperty("--card-rx", "0deg");
    card.style.setProperty("--card-ry", "0deg");
    card.style.setProperty("--card-light-x", "50%");
    card.style.setProperty("--card-light-y", "42%");
    card.style.setProperty("--card-glare", "0");
  };
  const adjustTimerFromKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (running) return;
    const changes: Record<string, number> = { ArrowUp: 30, ArrowRight: 30, ArrowDown: -30, ArrowLeft: -30, PageUp: 300, PageDown: -300 };
    if (event.key === "Home") { event.preventDefault(); applyTimerSeconds(30, true); return; }
    if (event.key === "End") { event.preventDefault(); applyTimerSeconds(3600, true); return; }
    if (changes[event.key]) { event.preventDefault(); applyTimerSeconds(seconds + changes[event.key], true); }
  };
  return (
    <div className="clock-app">
      {tab === "clock" ? (
        <div className="world-clock-panel">
          <div className="analog-clock"><i style={{ transform: `rotate(${minute}deg)` }} /><b style={{ transform: `rotate(${hour}deg)` }} /><em /></div>
          <strong>{time}</strong><span>New York</span>
        </div>
      ) : (
        <div
          className={`timer-panel timer-mechanical dragon-timer timer-${timerState.toLowerCase()} egg-stage-${eggStage} dragon-variant-${activeKind.id} ${finished && activeDragon ? `dragon-pattern-${activeDragon.pattern}` : ""} ${dragonView === "codex" ? "codex-open" : ""}`}
          style={{ "--egg-progress": timerProgress, "--ritual-charge": rarityOdds.charge, "--dial-angle": `${handAngle}deg`, "--dragon-hue": `${activeDragon ? (activeDragon.seed % 19) - 9 : 0}deg` } as CSSProperties}
        >
          {dragonView === "codex" ? (
            <section className="dragon-codex" aria-label="Dragon card collection">
              <header><button onClick={() => { playSound("close"); setDragonView("ritual"); }}>‹ EGG</button><div><strong>DRAGON CODEX</strong><span>{dragonCollection.length} HATCHED</span></div><i>✦</i></header>
              <div ref={codexTrackRef} className="dragon-card-track">
                {codexEntries.map(({ card, kind }) => {
                  const locked = card === null;
                  const trait = card ? dragonTrait(card) : null;
                  const hue = card ? (card.seed % 19) - 9 : 0;
                  const heart = card ? Math.min(99, kind.heart + trait!.heart + Math.floor(card.bond / 10)) : kind.heart;
                  const spark = card ? Math.min(99, kind.spark + trait!.spark + Math.floor(card.minutes / 10)) : kind.spark;
                  return (
                    <article
                      data-dragon-kind={kind.id}
                      data-dragon-id={card?.id}
                      key={card?.id ?? `locked-${kind.id}`}
                      className={`dragon-card dragon-variant-${kind.id} ${card ? `dragon-pattern-${card.pattern}` : ""} rarity-${kind.rarity.toLowerCase()} ${locked ? "is-undiscovered" : ""} ${card?.id === activeDragon?.id ? "is-active-dragon" : ""}`}
                      style={{ "--dragon-hue": `${hue}deg` } as CSSProperties}
                      onPointerMove={moveDragonCard}
                      onPointerLeave={restDragonCard}
                      onBlur={restDragonCard}
                      onClick={() => card && visitDragon(card)}
                      onKeyDown={(event) => {
                        if (!card || (event.key !== "Enter" && event.key !== " ")) return;
                        event.preventDefault();
                        visitDragon(card);
                      }}
                      tabIndex={0}
                      role={card ? "button" : undefined}
                      aria-label={`${locked ? "Undiscovered" : `Visit ${kind.name}, ${trait!.label.toLowerCase()} personality,`} ${kind.rarity} ${kind.element.toLowerCase()} dragon card`}
                    >
                      <div className="dragon-card-foil" /><div className="dragon-card-grain" />
                      <header><span>{kind.element} · {trait?.label ?? "UNKNOWN"}</span><b>№ {card ? String(card.seed % 1000).padStart(3, "0") : kind.number}</b></header>
                      <div className="dragon-card-art"><i className="card-moon" /><DragonSprite card pattern={card?.pattern} /><b>{locked ? "?" : `${Math.round(card.minutes)}m`}</b></div>
                      <div className="dragon-card-name"><strong>{locked ? "UNDISCOVERED" : kind.name}</strong><span>{kind.rarity}</span></div>
                      <div className="dragon-card-stats"><span>HEART <b>{heart}</b></span><i /><span>SPARK <b>{spark}</b></span></div>
                      <p>{trait?.lore ?? kind.lore}</p>
                      <footer><span>{card ? `HATCHED ${new Date(card.hatchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}` : "COMPLETE A TIMER TO MEET"}</span><b>{card ? `BOND ${card.bond}` : "LOCKED"}</b></footer>
                    </article>
                  );
                })}
              </div>
              <p>Swipe the cards · tap a hatchling to visit · focus time shapes its spark</p>
            </section>
          ) : (
            <>
              <div className="dragon-chamber" aria-label={`Dragon egg timer, ${timerText} remaining`}>
                <button className="dragon-codex-button" onClick={openDragonCodex} aria-label="Open dragon card collection"><i>▤</i><b>{dragonCollection.length}</b></button>
                <div className="dragon-sky" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
                <button
                  className={`dragon-egg-button ${running ? "is-incubating" : ""} ${finished ? "is-hatched" : ""}`}
                  onClick={(event) => finished ? interactDragon(event) : toggleTimer()}
                  onPointerMove={watchDragon}
                  onPointerLeave={restDragonGaze}
                  aria-label={finished ? `Play with ${activeKind.name}` : running ? "Pause dragon egg timer" : "Start dragon egg timer"}
                >
                  <span className="egg-creature">
                    <span className="egg-aura" /><span className="egg-shadow" />
                    <span className="dragon-egg"><i className="egg-facet egg-facet-one" /><i className="egg-facet egg-facet-two" /><i className="egg-facet egg-facet-three" /><i className="egg-rune">◇</i><i className="egg-crack crack-one" /><i className="egg-crack crack-two" /><i className="egg-crack crack-three" /></span>
                    <span className="egg-shell egg-shell-left" /><span className="egg-shell egg-shell-right" />
                    <DragonSprite reaction={dragonReaction} pattern={activeDragon?.pattern} />
                    {finished && dragonMessage && <span className="dragon-dialogue" aria-hidden="true">{dragonMessage}</span>}
                  </span>
                </button>
                {finished && (
                  <div className="dragon-bond-chip" aria-hidden="true">
                    <span>BOND</span><i><b style={{ width: `${activeDragon?.bond ?? 1}%` }} /></i><strong>{activeDragon?.bond ?? 1}</strong>
                    {dragonCombo > 1 && <em>×{dragonCombo}</em>}
                  </div>
                )}
                {!finished && (
                  <div className="dragon-rarity-forecast" aria-label={`Ritual power ${rarityOdds.ritual}. Common chance ${rarityPercent.common} percent, rare chance ${rarityPercent.rare} percent, mythic chance ${rarityPercent.mythic} percent.`}>
                    <span>RITUAL POWER</span><strong>{rarityOdds.ritual}</strong>
                    <i aria-hidden="true"><b className="chance-common" style={{ width: `${rarityPercent.common}%` }} /><b className="chance-rare" style={{ width: `${rarityPercent.rare}%` }} /><b className="chance-mythic" style={{ width: `${rarityPercent.mythic}%` }} /></i>
                    <small aria-hidden="true"><b>C {rarityPercent.common}</b><b>R {rarityPercent.rare}</b><b>M {rarityPercent.mythic}</b></small>
                  </div>
                )}
                <div className="dragon-time-readout" aria-hidden="true"><span>{timerText}</span><b>{finished ? `${activeKind.name} · ${activeTrait?.label ?? activeKind.rarity}` : running ? "INCUBATING" : timerState}</b></div>
              </div>
              <div className="stone-dial-wrap">
                <div className={`stone-dial ${draggingHand ? "is-dragging" : ""}`} onPointerDown={(event) => { if (running) return; setDraggingHand(true); event.currentTarget.setPointerCapture(event.pointerId); setTimerFromPointer(event); }} onPointerMove={(event) => { if (draggingHand) setTimerFromPointer(event); }} onPointerUp={() => setDraggingHand(false)} onPointerCancel={() => setDraggingHand(false)} onLostPointerCapture={() => setDraggingHand(false)} onKeyDown={adjustTimerFromKeyboard} role="slider" tabIndex={0} aria-label="Ancient stone timer dial" aria-valuemin={.5} aria-valuemax={60} aria-valuenow={Math.round(seconds / 30) / 2} aria-valuetext={timerText}>
                  <i className="stone-ring ring-outer" /><i className="stone-ring ring-inner" /><i className="stone-rune rune-north">ᛉ</i><i className="stone-rune rune-east">ᚱ</i><i className="stone-rune rune-south">ᛟ</i><i className="stone-rune rune-west">ᚲ</i><span className="stone-number stone-zero">60</span><span className="stone-number stone-fifteen">15</span><span className="stone-number stone-thirty">30</span><span className="stone-number stone-fortyfive">45</span><i className="stone-dial-hand"><b /></i><span className="stone-center"><i>✦</i><b>MIN</b></span>
                </div>
                <button className="stone-reset" onClick={resetTimer} aria-label="Reset timer"><i>↺</i><span>RESET</span></button>
              </div>
              <p className="timer-instruction">{finished ? "Pet the head · tap either side · reach ×3 to earn Bond" : running ? `${rarityPercent.rare + rarityPercent.mythic}% rare-or-better · tap the egg to pause` : "Drag the amber pin · more focus awakens rarer eggs"}</p>
            </>
          )}
          <p className="timer-live" role="status" aria-live="assertive">{finished ? dragonMessage ? `${activeKind.name}: ${dragonMessage}` : `${activeKind.name} has hatched` : ""}</p>
        </div>
      )}
      <nav className="clock-tabs"><button className={tab === "clock" ? "active" : ""} onClick={() => { playSound("tock"); setTab("clock"); }}><i>◷</i>World Clock</button><button className={tab === "timer" ? "active" : ""} onClick={() => { playSound("tock"); setTab("timer"); }}><i>◴</i>Timer</button></nav>
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
    playSound("pop");
    setNotes((current) => [note, ...current]);
    setActiveNoteId(note.id);
    setView("editor");
    setMode("write");
    setRedoStrokes([]);
  };

  const deleteNote = (id: string) => {
    const remaining = notes.filter((note) => note.id !== id);
    const next = remaining.length ? remaining : [createBlankNote()];
    playSound("trash");
    setNotes(next);
    if (id === activeNoteId) setActiveNoteId(next[0].id);
    setRedoStrokes([]);
  };

  const undoDrawing = () => {
    if (!activeNote?.strokes.length) return;
    playSound("tap");
    const removed = activeNote.strokes[activeNote.strokes.length - 1];
    setNotes((current) => current.map((note) => note.id === activeNote.id ? { ...note, strokes: note.strokes.slice(0, -1), updatedAt: new Date().toISOString() } : note));
    setRedoStrokes((current) => [...current, removed]);
  };

  const redoDrawing = () => {
    const stroke = redoStrokes[redoStrokes.length - 1];
    if (!stroke || !activeNote) return;
    playSound("tap");
    setNotes((current) => current.map((note) => note.id === activeNote.id ? { ...note, strokes: [...note.strokes, stroke], updatedAt: new Date().toISOString() } : note));
    setRedoStrokes((current) => current.slice(0, -1));
  };

  const clearDrawing = () => {
    if (!activeNote) return;
    playSound("trash");
    setNotes((current) => current.map((note) => note.id === activeNote.id ? { ...note, strokes: [], doodleSeed: false, background: undefined, updatedAt: new Date().toISOString() } : note));
    setRedoStrokes([]);
  };

  const copyNote = async () => {
    try { await navigator.clipboard.writeText(activeNote.text); playSound("pop"); setSaveStatus("Copied"); window.setTimeout(() => setSaveStatus("Saved"), 1400); } catch { playSound("alert"); setSaveStatus("Copy failed"); }
  };

  const filteredNotes = notes.filter((note) => note.text.toLowerCase().includes(search.trim().toLowerCase()));
  const characterCount = activeNote?.text.length ?? 0;

  return (
    <div className="notes-app notes-studio">
      {view === "list" ? (
        <div className="notes-list-view">
          <header><strong>Notes</strong><button onClick={createNote} aria-label="Create a new note">＋</button></header>
          <div className="notes-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={playKeyboardTick} placeholder="Search notes" aria-label="Search notes" /></div>
          <div className="notes-list" role="list">
            {filteredNotes.map((note) => (
              <div className="notes-list-row" role="listitem" key={note.id}>
                <button className="notes-open" onClick={() => { playSound("open"); setActiveNoteId(note.id); setView("editor"); setRedoStrokes([]); }}>
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
            <button onClick={() => { playSound("close"); setView("list"); }} aria-label="Back to all notes">‹ Notes</button>
            <span>{saveStatus}</span>
            <button onClick={createNote} aria-label="Create a new note">＋</button>
          </header>
          <div className="notes-paper">
            {mode === "write" ? (
              <textarea aria-label="Edit note" value={activeNote.text} onChange={(event) => updateActiveText(event.target.value)} onKeyDown={playKeyboardTick} placeholder="Start writing…" />
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
            <button className={mode === "write" ? "active" : ""} onClick={() => { playSound("tock"); setMode("write"); }} aria-label="Write text"><b>Aa</b><span>Write</span></button>
            <button className={mode === "draw" ? "active" : ""} onClick={() => { playSound("tock"); setMode("draw"); }} aria-label="Draw"><b>✎</b><span>Draw</span></button>
            {mode === "write" ? (
              <><button onClick={copyNote} aria-label="Copy note"><b>⧉</b><span>Copy</span></button><button onClick={() => deleteNote(activeNote.id)} aria-label="Delete note"><b>⌫</b><span>Delete</span></button></>
            ) : (
              <>
                {["#263c8f", "#c52c31", "#27804a", "#191919"].map((color) => <button key={color} className={`notes-ink ${ink === color && !eraser ? "active" : ""}`} onClick={() => { playSound("tap"); setInk(color); setEraser(false); }} aria-label={`Draw in ${noteColorName(color)}`}><i style={{ background: color }} /></button>)}
                <button className={eraser ? "active" : ""} onClick={() => { playSound("tock"); setEraser((value) => !value); }} aria-label="Toggle eraser"><b>▱</b></button>
                <button onClick={() => { playSound("tap"); setBrushSize((value) => value >= 7 ? 2 : value + 2); }} aria-label={`Brush size ${brushSize}`}><i className="notes-brush-size" style={{ width: brushSize + 4, height: brushSize + 4 }} /></button>
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
      <a href="https://xingpicture.myportfolio.com" target="_blank" rel="noreferrer" onClick={() => playSound("open")}><b>Photo</b><span>xingpicture.myportfolio.com</span></a>
      <a href="https://github.com/lovejzzz" target="_blank" rel="noreferrer" onClick={() => playSound("open")}><b>GitHub</b><span>lovejzzz</span></a>
      <a href="https://www.youtube.com/@HereWeGoFilmStudio" target="_blank" rel="noreferrer" onClick={() => playSound("open")}><b>Film Studio</b><span>Here We Go</span></a>
    </div>
  );
}

function MailApp() {
  return (
    <div className="mail-app contact-mail-app">
      <div className="mail-paper">
        <img className="mail-stamp" src="/media/about/tian-xing-iphone4.jpg" alt="" aria-hidden="true" />
        <p>CONTACT CARD</p><h2>Tian Xing</h2><small>New York · available for thoughtful collaborations</small>
        <a className="contact-line" href="mailto:xingpicture@gmail.com" onClick={() => playSound("open")}><i className="mail-mini-icon">✉</i><span><b>Email</b>xingpicture@gmail.com</span><em>›</em></a>
        <a className="contact-line" href="https://www.instagram.com/xing_tian_lifeitself/" target="_blank" rel="noreferrer" onClick={() => playSound("open")}><i className="instagram-icon"><b /></i><span><b>Instagram</b>@xing_tian_lifeitself</span><em>›</em></a>
        <a className="compose-mail-button" href="mailto:xingpicture@gmail.com?subject=Hello%20Tian" onClick={() => playSound("send")}>Compose Email</a>
      </div>
    </div>
  );
}

function SafariApp() {
  const [portalIndex, setPortalIndex] = useState(0);
  const [visited, setVisited] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = JSON.parse(window.localStorage.getItem(SAFARI_STAMPS_KEY) ?? "[]");
      return Array.isArray(saved)
        ? saved.filter((value) => Number.isInteger(value) && value >= 0 && value < safariPortals.length)
        : [];
    } catch {
      return [];
    }
  });
  const [travelling, setTravelling] = useState(false);
  const [needleTurn, setNeedleTurn] = useState(safariPortals[0].bearing);
  const travelTimer = useRef<number | null>(null);
  const portal = safariPortals[portalIndex];
  const expeditionComplete = visited.length === safariPortals.length;

  useEffect(() => {
    return () => {
      if (travelTimer.current !== null) window.clearTimeout(travelTimer.current);
    };
  }, []);

  const visitPortal = (index: number) => {
    setPortalIndex(index);
    setVisited((current) => {
      if (current.includes(index)) {
        playSound("pop");
        return current;
      }
      playSound("stamp");
      const next = [...current, index];
      try { window.localStorage.setItem(SAFARI_STAMPS_KEY, JSON.stringify(next)); } catch { /* keep the session copy */ }
      return next;
    });
  };

  const startExpedition = () => {
    if (travelling) return;
    playSound("whoosh");
    if ("vibrate" in navigator) navigator.vibrate(12);
    const undiscovered = safariPortals.map((_, index) => index).filter((index) => !visited.includes(index));
    const pool = undiscovered.length ? undiscovered : safariPortals.map((_, index) => index).filter((index) => index !== portalIndex);
    const nextIndex = pool[Math.floor(Math.random() * pool.length)] ?? portalIndex;
    const next = safariPortals[nextIndex];
    setTravelling(true);
    setNeedleTurn((current) => current + 720 + ((next.bearing - current) % 360 + 360) % 360);
    if (travelTimer.current !== null) window.clearTimeout(travelTimer.current);
    travelTimer.current = window.setTimeout(() => {
      visitPortal(nextIndex);
      setTravelling(false);
      travelTimer.current = null;
    }, 780);
  };

  const resetExpedition = () => {
    if (travelling) return;
    playSound("trash");
    setVisited([]);
    try { window.localStorage.removeItem(SAFARI_STAMPS_KEY); } catch { /* reset the session copy */ }
  };

  return (
    <div className="safari-app">
      <div className="safari-address"><span>tian://</span><b>wild-web/field-guide</b><button onClick={resetExpedition} aria-label="Reset expedition">×</button></div>
      <section className={`safari-expedition ${travelling ? "is-travelling" : ""} ${expeditionComplete ? "is-complete" : ""}`}>
        <header className="safari-expedition-head">
          <span><small>{expeditionComplete ? "FIELD GUIDE COMPLETE" : "INTERNET SAFARI"}</small><strong>THE WILD WEB</strong></span>
          <b>{visited.length}/{safariPortals.length}<small>{expeditionComplete ? " MASTERED" : " FOUND"}</small></b>
        </header>

        <div className="safari-compass-field">
          <div className="safari-starfield" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={index} />)}</div>
          <i className="safari-orbit orbit-one" aria-hidden="true" />
          <i className="safari-orbit orbit-two" aria-hidden="true" />
          <i className="safari-scan-sweep" aria-hidden="true" />
          <button
            className="safari-compass"
            onClick={startExpedition}
            aria-label={travelling ? "Searching the wild web" : "Spin compass to find a destination"}
            disabled={travelling}
            style={{ "--needle-turn": `${needleTurn}deg`, "--map-degrees": `${visited.length * 72}deg` } as CSSProperties}
          >
            <i className="safari-compass-glass" aria-hidden="true" />
            <i className="safari-compass-rose" aria-hidden="true" />
            <span className="compass-n">N</span><span className="compass-e">E</span><span className="compass-s">S</span><span className="compass-w">W</span>
            <i className="safari-needle"><b /></i><em>{travelling ? "SCANNING" : "HUNT"}</em>
          </button>

          <article className="safari-discovery" key={portal.host} style={{ "--portal-color": portal.color } as CSSProperties}>
            <span className="discovery-mark">{portal.mark}</span>
            <div><small>{portal.direction} · {portal.biome}</small><h2>{travelling ? "Following a signal…" : portal.title}</h2><p>{travelling ? "Keep the compass steady." : portal.description}</p></div>
            <a href={portal.url} target="_blank" rel="noreferrer" onClick={() => playSound("open")} aria-label={`Open ${portal.title}`}><b>OPEN</b><span>↗</span></a>
          </article>
        </div>

        <div className="safari-passport" aria-label={`${visited.length} destinations discovered`}>
          {safariPortals.map((destination, index) => (
            <button
              className={visited.includes(index) ? "is-stamped" : ""}
              key={destination.host}
              onClick={() => { if (!visited.includes(index)) return; playSound("tock"); setPortalIndex(index); }}
              aria-label={visited.includes(index) ? `Review ${destination.title}` : "Undiscovered destination"}
            >
              <i style={{ "--stamp-color": destination.color } as CSSProperties}>{visited.includes(index) ? destination.mark : "?"}</i>
              <span>{visited.includes(index) ? destination.biome : "UNKNOWN"}</span>
            </button>
          ))}
        </div>

      </section>
      <nav><span>‹</span><span>›</span><button onClick={startExpedition} aria-label="Start a new expedition">⌖</button><span>▤</span></nav>
    </div>
  );
}

function MusicApp() {
  return <div className="music-app"><iframe data-testid="spotify-embed" title="The Jazz I Love 2022 Spotify playlist" src="https://open.spotify.com/embed/playlist/6hYj1RoYJ85hj8c1kaDFJ2?utm_source=generator&amp;theme=0" width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" /><a href="https://open.spotify.com/playlist/6hYj1RoYJ85hj8c1kaDFJ2" target="_blank" rel="noreferrer">Open The Jazz I Love [2022] in Spotify</a></div>;
}
