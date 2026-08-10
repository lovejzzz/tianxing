"use client";

import { useEffect, useMemo, useRef } from "react";

export type CinemaWeatherPlace = {
  name: string;
  country?: string;
  admin?: string;
  latitude: number;
  longitude: number;
};

type WeatherCinemaEngineProps = {
  code: number;
  isDay: boolean;
  place: CinemaWeatherPlace;
  updatedAt?: string;
  wind?: number;
  precipitation?: number;
  inspectionMs?: number | null;
};

type Point = { x: number; y: number };
type AlphaBounds = { x: number; y: number; width: number; height: number };
type WindowShape = "wide" | "triptych" | "arched" | "tall";
type RoomKind = "study" | "hotel" | "studio" | "cafe" | "observatory" | "penthouse";
type SkylineKind = "metropolis" | "heritage" | "waterfront";
type LandmarkKind = "empire" | "pearl" | "tokyo" | "eiffel" | "clock" | "bridge" | "needle" | "willis" | "burj" | "opera" | "cn" | "capitol" | "dome" | "petronas" | "marina" | "minaret" | "spire";

type SceneProfile = {
  seed: number;
  room: RoomKind;
  window: WindowShape;
  landmark: LandmarkKind;
  palette: [string, string, string, string];
};

type SkylinePreset = {
  kind: SkylineKind;
  focus: number;
  landmarkInPlate: boolean;
};

type SceneLighting = {
  skyTop: string;
  skyMiddle: string;
  skyBottom: string;
  sourceColor: string;
  bounceColor: string;
  worldExposure: number;
  roomExposure: number;
  beamStrength: number;
  ambientStrength: number;
  directStrength: number;
  roomShade: number;
  shadowStrength: number;
  hazeStrength: number;
  direction: number;
  flash: number;
};

type Particle = { x: number; y: number; z: number; speed: number; phase: number };
type RainParticle = Particle & { length: number; brightness: number; sway: number; width: number };
type GlassDroplet = {
  x: number;
  y: number;
  radius: number;
  rate: number;
  phase: number;
  hold: number;
  meander: number;
  trail: number;
  weight: number;
};

const TAU = Math.PI * 2;
const skylineBoundsCache = new Map<string, AlphaBounds>();

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let value = seed += 0x6d2b79f5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function fract(value: number) {
  return value - Math.floor(value);
}

function stickSlip(value: number, hold: number) {
  const cycle = Math.floor(value);
  const local = fract(value);
  const slide = local <= hold ? 0 : smoothstep(hold, 1, local);
  return cycle + slide;
}

function cityLandmark(place: CinemaWeatherPlace): LandmarkKind {
  const label = `${place.name} ${place.admin ?? ""} ${place.country ?? ""}`.toLowerCase();
  if (/new york|manhattan|brooklyn/.test(label)) return "empire";
  if (/shanghai/.test(label)) return "pearl";
  if (/tokyo|yokohama/.test(label)) return "tokyo";
  if (/paris/.test(label)) return "eiffel";
  if (/london/.test(label)) return "clock";
  if (/san francisco|oakland/.test(label)) return "bridge";
  if (/seattle/.test(label)) return "needle";
  if (/chicago/.test(label)) return "willis";
  if (/dubai|abu dhabi/.test(label)) return "burj";
  if (/sydney/.test(label)) return "opera";
  if (/toronto/.test(label)) return "cn";
  if (/washington|district of columbia/.test(label)) return "capitol";
  if (/rome|vatican|florence/.test(label)) return "dome";
  if (/kuala lumpur/.test(label)) return "petronas";
  if (/singapore/.test(label)) return "marina";
  if (/istanbul|ankara|cairo|casablanca/.test(label)) return "minaret";
  const longitudeBand = Math.floor((place.longitude + 180) / 24);
  const latitudeBand = Math.floor((place.latitude + 90) / 18);
  const fallback: LandmarkKind[] = ["spire", "dome", "needle", "bridge", "clock", "minaret"];
  return fallback[Math.abs(longitudeBand * 7 + latitudeBand * 11) % fallback.length];
}

function buildProfile(place: CinemaWeatherPlace): SceneProfile {
  const label = `${place.name}:${place.admin ?? ""}:${place.country ?? ""}:${place.latitude.toFixed(3)}:${place.longitude.toFixed(3)}`;
  const seed = hashString(label);
  const rooms: RoomKind[] = ["study", "hotel", "studio", "cafe", "observatory", "penthouse"];
  const windows: WindowShape[] = ["wide", "triptych", "arched", "tall"];
  const palettes: SceneProfile["palette"][] = [
    ["#09090d", "#25131b", "#8e3e38", "#d7a24b"],
    ["#080a0e", "#111d29", "#355567", "#d8a653"],
    ["#09080d", "#211628", "#62415f", "#c89c62"],
    ["#0b0908", "#2a1710", "#71402c", "#e0ac59"],
    ["#070b0c", "#10211e", "#31574d", "#d5b46a"],
  ];
  return {
    seed,
    room: rooms[seed % rooms.length],
    window: windows[(seed >>> 4) % windows.length],
    landmark: cityLandmark(place),
    palette: palettes[(seed >>> 8) % palettes.length],
  };
}

function roomAssetForProfile(profile: SceneProfile) {
  if (profile.room === "hotel" || profile.room === "penthouse") return "/media/weather/engine/room-hotel-v1.webp";
  if (profile.room === "observatory") return "/media/weather/engine/room-observatory-v1.webp";
  return "/media/weather/engine/room-studio-v1.webp";
}

function skylinePresetForPlace(place: CinemaWeatherPlace): SkylinePreset {
  const label = `${place.name} ${place.admin ?? ""} ${place.country ?? ""}`.toLowerCase();
  if (/new york|manhattan|brooklyn/.test(label)) return { kind: "metropolis", focus: .08, landmarkInPlate: true };
  if (/chicago/.test(label)) return { kind: "metropolis", focus: .23, landmarkInPlate: true };
  if (/shanghai/.test(label)) return { kind: "metropolis", focus: .61, landmarkInPlate: true };
  if (/toronto/.test(label)) return { kind: "metropolis", focus: .9, landmarkInPlate: true };
  if (/london/.test(label)) return { kind: "heritage", focus: .28, landmarkInPlate: true };
  if (/rome|vatican|florence/.test(label)) return { kind: "heritage", focus: .06, landmarkInPlate: true };
  if (/istanbul|ankara|cairo|casablanca/.test(label)) return { kind: "heritage", focus: .88, landmarkInPlate: true };
  if (/seattle/.test(label)) return { kind: "waterfront", focus: .15, landmarkInPlate: true };
  if (/dubai|abu dhabi/.test(label)) return { kind: "waterfront", focus: .57, landmarkInPlate: true };
  if (/singapore/.test(label)) return { kind: "waterfront", focus: .76, landmarkInPlate: false };
  if (/paris/.test(label)) return { kind: "heritage", focus: .52, landmarkInPlate: false };
  if (/san francisco|oakland/.test(label)) return { kind: "waterfront", focus: .31, landmarkInPlate: false };
  if (/sydney/.test(label)) return { kind: "waterfront", focus: .82, landmarkInPlate: false };
  if (/washington|district of columbia/.test(label)) return { kind: "heritage", focus: .43, landmarkInPlate: false };
  if (/tokyo|yokohama/.test(label)) return { kind: "waterfront", focus: .46, landmarkInPlate: false };
  if (/kuala lumpur/.test(label)) return { kind: "metropolis", focus: .66, landmarkInPlate: false };
  const coastal = Math.abs(place.longitude) % 2 > 1.15;
  const historic = Math.abs(place.latitude) > 36 && Math.abs(place.longitude) < 45;
  const seed = hashString(`${place.name}:${place.latitude}:${place.longitude}`);
  return {
    kind: historic ? "heritage" : coastal ? "waterfront" : "metropolis",
    focus: .12 + ((seed >>> 7) % 72) / 100,
    landmarkInPlate: false,
  };
}

function skylineAssetForPreset(preset: SkylinePreset) {
  return `/media/weather/engine/skyline/${preset.kind}-v2.webp`;
}

function measureAlphaBounds(image: HTMLImageElement): AlphaBounds {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const fallback = { x: 0, y: 0, width, height };
  if (!width || !height) return fallback;

  const cacheKey = image.currentSrc || image.src;
  const cached = skylineBoundsCache.get(cacheKey);
  if (cached) return cached;

  const buffer = document.createElement("canvas");
  // Silhouette analysis does not need full-resolution pixels. Sampling the
  // longest side at 512px keeps a city change comfortably below a frame on
  // mobile while remaining sub-pixel accurate at the rendered phone size.
  const sampleScale = Math.min(1, 512 / Math.max(width, height));
  const sampleWidth = Math.max(1, Math.round(width * sampleScale));
  const sampleHeight = Math.max(1, Math.round(height * sampleScale));
  buffer.width = sampleWidth;
  buffer.height = sampleHeight;
  const context = buffer.getContext("2d", { willReadFrequently: true });
  if (!context) return fallback;

  try {
    context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
    const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
    let left = sampleWidth;
    let top = sampleHeight;
    let right = -1;
    let bottom = -1;
    // A small threshold ignores the soft transparent fringe generated around
    // the cutout while retaining antennae and other fine skyline details.
    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 0; x < sampleWidth; x += 1) {
        if (pixels[(y * sampleWidth + x) * 4 + 3] <= 18) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
    if (right < left || bottom < top) return fallback;
    const measured = {
      x: Math.max(0, Math.floor(left / sampleScale)),
      y: Math.max(0, Math.floor(top / sampleScale)),
      width: Math.min(width, Math.ceil((right - left + 1) / sampleScale)),
      height: Math.min(height, Math.ceil((bottom - top + 1) / sampleScale)),
    };
    skylineBoundsCache.set(cacheKey, measured);
    return measured;
  } catch {
    return fallback;
  }
}

function weatherKind(code: number) {
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51) return "rain";
  if (code >= 2) return "cloud";
  return "clear";
}

function localHour(updatedAt: string | undefined, isDay: boolean) {
  const match = updatedAt?.match(/T(\d{2}):(\d{2})/);
  if (match) return Number(match[1]) + Number(match[2]) / 60;
  return isDay ? 14 : 22;
}

function sceneLighting(kind: string, isDay: boolean, hour: number, ambient: number, flash: number): SceneLighting {
  const goldenHour = isDay && (hour < 8.2 || hour > 16.7);
  const storm = kind === "storm" || kind === "rain";
  const overcast = storm || kind === "cloud" || kind === "fog" || kind === "snow";
  const direction = clamp((hour - 6) / 12, 0, 1) * 2 - 1;
  const lightningLift = flash * .72;
  const worldExposure = clamp((isDay ? .72 + ambient * .32 : .42) + lightningLift, .34, 1.35);
  const daylightRoomExposure = kind === "clear" ? .72 + ambient * .58
    : kind === "cloud" ? .5 + ambient * .24
      : kind === "fog" || kind === "snow" ? .54 + ambient * .26
        : kind === "rain" ? .45 + ambient * .22
          : .42 + ambient * .18;
  const roomExposure = clamp((isDay ? daylightRoomExposure : .5) + flash * .38, .38, 1.35);

  if (flash > .035) {
    return {
      skyTop: "#7888a5", skyMiddle: "#46556f", skyBottom: "#293245",
      sourceColor: "186,207,255", bounceColor: "117,147,211",
      worldExposure, roomExposure, beamStrength: .24 + flash * .72,
      ambientStrength: .28 + flash * .42, directStrength: .38 + flash * .58, roomShade: .06,
      shadowStrength: .2 + flash * .3, hazeStrength: .1 + flash * .18,
      direction, flash,
    };
  }
  if (!isDay) {
    return {
      skyTop: storm ? "#080b14" : "#060a16", skyMiddle: storm ? "#121826" : "#15182a", skyBottom: "#211b27",
      sourceColor: storm ? "102,126,158" : "111,135,177", bounceColor: "42,54,82",
      worldExposure, roomExposure, beamStrength: storm ? .055 : .075,
      ambientStrength: storm ? .035 : .055, directStrength: .008, roomShade: storm ? .36 : .3,
      shadowStrength: .1, hazeStrength: overcast ? .18 : .07,
      direction, flash,
    };
  }
  if (kind === "fog" || kind === "snow") {
    return {
      skyTop: "#9a9895", skyMiddle: "#6f747b", skyBottom: "#454a52",
      sourceColor: "203,205,199", bounceColor: "145,151,156",
      worldExposure, roomExposure, beamStrength: .18,
      ambientStrength: .2, directStrength: .025, roomShade: kind === "fog" ? .14 : .17,
      shadowStrength: .08, hazeStrength: kind === "fog" ? .4 : .25,
      direction, flash,
    };
  }
  if (storm) {
    return {
      skyTop: "#202a38", skyMiddle: "#303746", skyBottom: "#242633",
      sourceColor: "139,157,176", bounceColor: "77,89,107",
      worldExposure, roomExposure, beamStrength: kind === "storm" ? .055 : .07,
      ambientStrength: kind === "storm" ? .045 : .065, directStrength: .012, roomShade: kind === "storm" ? .38 : .32,
      shadowStrength: .1, hazeStrength: .24,
      direction, flash,
    };
  }
  if (kind === "cloud") {
    return {
      skyTop: "#64717c", skyMiddle: "#46535f", skyBottom: "#313842",
      sourceColor: "184,192,198", bounceColor: "101,111,121",
      worldExposure, roomExposure, beamStrength: .085,
      ambientStrength: .12, directStrength: .025, roomShade: .23,
      shadowStrength: .07, hazeStrength: .16,
      direction, flash,
    };
  }
  return {
    skyTop: goldenHour ? "#b46146" : "#58758b",
    skyMiddle: goldenHour ? "#74434c" : "#38546b",
    skyBottom: goldenHour ? "#29283a" : "#222c3b",
    sourceColor: goldenHour ? "250,172,88" : "244,218,171",
    bounceColor: goldenHour ? "172,83,47" : "113,137,148",
    worldExposure, roomExposure, beamStrength: goldenHour ? .46 : .36,
    ambientStrength: goldenHour ? .38 : .34, directStrength: goldenHour ? .78 : .68, roomShade: .015,
    shadowStrength: goldenHour ? .25 : .17, hazeStrength: .06,
    direction, flash,
  };
}

function pathPolygon(context: CanvasRenderingContext2D, points: Point[]) {
  context.beginPath();
  points.forEach((point, index) => index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y));
  context.closePath();
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function windowPath(context: CanvasRenderingContext2D, shape: WindowShape, x: number, y: number, width: number, height: number) {
  if (shape === "arched") {
    context.beginPath();
    context.moveTo(x, y + height);
    context.lineTo(x, y + width * .34);
    context.bezierCurveTo(x, y - 2, x + width, y - 2, x + width, y + width * .34);
    context.lineTo(x + width, y + height);
    context.closePath();
    return;
  }
  roundedRect(context, x, y, width, height, shape === "wide" ? 5 : 3);
}

function drawAtmosphereBands(context: CanvasRenderingContext2D, box: { x: number; y: number; w: number; h: number }, kind: string, elapsed: number, wind: number) {
  if (kind === "clear") return;
  const strength = kind === "storm" ? .32 : kind === "rain" ? .22 : kind === "fog" ? .17 : .13;
  const travel = ((elapsed * Math.max(.0018, Math.abs(wind) * .00055)) % (box.w * 1.8)) - box.w * .45;
  context.save();
  context.globalCompositeOperation = "screen";
  for (let layer = 0; layer < 3; layer += 1) {
    const y = box.y + box.h * (.12 + layer * .14);
    const drift = travel * (.28 + layer * .18) * (wind < 0 ? -1 : 1);
    const band = context.createLinearGradient(box.x + drift, y, box.x + box.w + drift, y + 34);
    band.addColorStop(0, "rgba(0,0,0,0)");
    band.addColorStop(.18, `rgba(118,126,143,${strength * (.52 + layer * .12)})`);
    band.addColorStop(.52, `rgba(151,157,169,${strength * (.8 - layer * .08)})`);
    band.addColorStop(.83, `rgba(96,105,122,${strength * .42})`);
    band.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = band;
    context.beginPath();
    context.moveTo(box.x - box.w * .4, y + 13);
    context.bezierCurveTo(box.x + box.w * .02 + drift, y - 9, box.x + box.w * .28 + drift, y + 19, box.x + box.w * .48 + drift, y + 3);
    context.bezierCurveTo(box.x + box.w * .7 + drift, y - 12, box.x + box.w * .92 + drift, y + 20, box.x + box.w * 1.4, y + 5);
    context.lineTo(box.x + box.w * 1.4, y + 42);
    context.lineTo(box.x - box.w * .4, y + 42);
    context.closePath();
    context.fill();
  }
  context.restore();
}

function drawSkylinePlate(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  source: AlphaBounds,
  box: { x: number; y: number; w: number; h: number },
  horizon: number,
  focus: number,
  lighting: SceneLighting,
) {
  const plateWidth = box.w * 1.78;
  const plateHeight = plateWidth / (source.width / source.height);
  const plateX = box.x + (box.w - plateWidth) * clamp(focus);
  const plateY = horizon - plateHeight;

  context.save();
  context.globalAlpha = .9;
  context.filter = `brightness(${lighting.worldExposure}) saturate(${.66 + lighting.worldExposure * .18}) contrast(1.08)`;
  context.drawImage(
    image,
    source.x, source.y, source.width, source.height,
    plateX, plateY, plateWidth, plateHeight,
  );
  context.restore();
}

function drawWorldSurface(
  context: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
  horizon: number,
  preset: SkylinePreset,
  lighting: SceneLighting,
  elapsed: number,
  seed: number,
) {
  const bottom = box.y + box.h + 24;
  const depth = Math.max(1, bottom - horizon);
  context.save();

  if (preset.kind === "waterfront") {
    const water = context.createLinearGradient(0, horizon, 0, bottom);
    water.addColorStop(0, `rgba(${lighting.bounceColor},${.26 + lighting.flash * .22})`);
    water.addColorStop(.22, "rgba(18,28,40,.92)");
    water.addColorStop(1, "rgba(3,7,12,.98)");
    context.fillStyle = water;
    context.fillRect(box.x - 24, horizon, box.w + 48, depth);

    const random = mulberry32(seed ^ 0x4a91);
    context.lineCap = "round";
    for (let index = 0; index < 22; index += 1) {
      const progress = (index + .7) / 22;
      const y = horizon + progress * depth;
      const drift = Math.sin(elapsed * .00038 + index * 1.7) * (2 + progress * 4);
      const x = box.x + random() * box.w + drift;
      const length = 5 + random() * (11 + progress * 25);
      context.globalAlpha = .05 + (1 - progress) * .1;
      context.strokeStyle = index % 4 === 0
        ? `rgba(226,171,82,${.25 + lighting.flash * .28})`
        : `rgba(${lighting.sourceColor},${.2 + lighting.flash * .2})`;
      context.lineWidth = .5 + progress * .8;
      context.beginPath();
      context.moveTo(x - length * .5, y);
      context.lineTo(x + length * .5, y);
      context.stroke();
    }
  } else {
    const ground = context.createLinearGradient(0, horizon - 2, 0, bottom);
    ground.addColorStop(0, preset.kind === "heritage" ? "rgba(15,16,22,.96)" : "rgba(13,18,25,.96)");
    ground.addColorStop(.48, "rgba(8,10,15,.98)");
    ground.addColorStop(1, "rgba(3,4,7,1)");
    context.fillStyle = ground;
    context.fillRect(box.x - 24, horizon - 1, box.w + 48, depth + 1);

    // A low foreground roof line gives the city a physical continuation below
    // the skyline instead of allowing the sky gradient to read as a flat block.
    const random = mulberry32(seed ^ 0x7823);
    context.fillStyle = "rgba(2,3,6,.82)";
    let x = box.x - 18;
    while (x < box.x + box.w + 18) {
      const width = 18 + random() * 34;
      const rise = 7 + random() * 17;
      context.fillRect(x, horizon + 4 - rise * .12, width, rise);
      if (random() > .48) {
        context.fillStyle = `rgba(224,166,76,${.055 + lighting.flash * .08})`;
        context.fillRect(x + width * .28, horizon + 8, 1.2, 1.6);
        context.fillStyle = "rgba(2,3,6,.82)";
      }
      x += width + 2 + random() * 5;
    }
  }
  context.restore();
}

function drawLandmark(context: CanvasRenderingContext2D, kind: LandmarkKind, x: number, base: number, scale: number, glow: number) {
  context.save();
  context.translate(x, base);
  context.scale(scale, scale);
  context.fillStyle = "#05070b";
  context.strokeStyle = `rgba(226,167,72,${.2 + glow * .45})`;
  context.lineWidth = 1.2;
  if (kind === "eiffel") {
    pathPolygon(context, [{ x: -22, y: 0 }, { x: -7, y: -82 }, { x: -2, y: -106 }, { x: 2, y: -106 }, { x: 7, y: -82 }, { x: 22, y: 0 }, { x: 12, y: 0 }, { x: 5, y: -44 }, { x: -5, y: -44 }, { x: -12, y: 0 }]);
    context.fill(); context.stroke();
    context.fillRect(-17, -19, 34, 3); context.fillRect(-11, -48, 22, 2);
  } else if (kind === "pearl") {
    context.fillRect(-5, -94, 10, 94);
    [-76, -49].forEach((y, index) => { context.beginPath(); context.arc(0, y, index ? 10 : 13, 0, TAU); context.fill(); context.stroke(); });
    context.fillRect(-1, -118, 2, 24);
  } else if (kind === "tokyo") {
    pathPolygon(context, [{ x: -19, y: 0 }, { x: -8, y: -82 }, { x: -3, y: -82 }, { x: -1, y: -116 }, { x: 1, y: -116 }, { x: 3, y: -82 }, { x: 8, y: -82 }, { x: 19, y: 0 }]);
    context.fill(); context.stroke(); context.fillRect(-14, -23, 28, 3); context.fillRect(-9, -56, 18, 3);
  } else if (kind === "clock") {
    context.fillRect(-13, -86, 26, 86); pathPolygon(context, [{ x: -16, y: -86 }, { x: 0, y: -107 }, { x: 16, y: -86 }]); context.fill();
    context.beginPath(); context.arc(0, -70, 7, 0, TAU); context.stroke(); context.fillRect(-1, -124, 2, 17);
  } else if (kind === "bridge") {
    context.fillRect(-50, -10, 100, 5); context.fillRect(-34, -62, 7, 62); context.fillRect(28, -62, 7, 62);
    context.beginPath(); context.moveTo(-48, -17); context.bezierCurveTo(-28, -42, 28, -42, 48, -17); context.stroke();
    for (let bx = -44; bx <= 44; bx += 8) { context.beginPath(); context.moveTo(bx, -15); context.lineTo(bx, -29 - Math.cos(bx / 44 * Math.PI) * 10); context.stroke(); }
  } else if (kind === "opera") {
    [-26, -8, 11, 29].forEach((ox, index) => { context.beginPath(); context.moveTo(ox - 14, 0); context.quadraticCurveTo(ox + (index % 2 ? 7 : -7), -42 - index * 3, ox + 14, 0); context.fill(); context.stroke(); });
  } else if (kind === "capitol" || kind === "dome") {
    context.fillRect(-32, -27, 64, 27); context.beginPath(); context.arc(0, -28, kind === "capitol" ? 20 : 27, Math.PI, TAU); context.fill(); context.stroke();
    context.fillRect(-2, -59, 4, 12); context.fillRect(-26, -34, 52, 4);
  } else if (kind === "petronas") {
    [-15, 15].forEach((ox) => { context.fillRect(ox - 8, -83, 16, 83); pathPolygon(context, [{ x: ox - 7, y: -83 }, { x: ox, y: -111 }, { x: ox + 7, y: -83 }]); context.fill(); context.stroke(); });
    context.fillRect(-15, -50, 30, 5);
  } else if (kind === "marina") {
    [-24, 0, 24].forEach((ox) => context.fillRect(ox - 7, -57, 14, 57));
    roundedRect(context, -37, -68, 74, 13, 6); context.fill(); context.stroke();
  } else if (kind === "minaret") {
    context.fillRect(-25, -42, 50, 42); context.beginPath(); context.arc(0, -42, 25, Math.PI, TAU); context.fill();
    [-34, 34].forEach((ox) => { context.fillRect(ox - 3, -70, 6, 70); pathPolygon(context, [{ x: ox - 5, y: -70 }, { x: ox, y: -86 }, { x: ox + 5, y: -70 }]); context.fill(); });
  } else if (kind === "willis") {
    context.fillRect(-18, -87, 36, 87); context.fillRect(-12, -104, 10, 104); context.fillRect(3, -97, 9, 97); context.fillRect(-8, -122, 1, 20); context.fillRect(8, -115, 1, 20);
  } else {
    const tall = kind === "burj" ? 137 : kind === "cn" ? 119 : kind === "needle" ? 99 : kind === "empire" ? 108 : 91;
    pathPolygon(context, [{ x: -17, y: 0 }, { x: -13, y: -tall * .6 }, { x: -7, y: -tall * .73 }, { x: -4, y: -tall * .88 }, { x: -1, y: -tall }, { x: 1, y: -tall }, { x: 4, y: -tall * .88 }, { x: 7, y: -tall * .73 }, { x: 13, y: -tall * .6 }, { x: 17, y: 0 }]);
    context.fill(); context.stroke();
    if (kind === "needle" || kind === "cn") { context.beginPath(); context.ellipse(0, -tall * .68, 17, 5, 0, 0, TAU); context.fill(); context.stroke(); }
  }
  context.restore();
}

function drawRoom(context: CanvasRenderingContext2D, width: number, height: number, profile: SceneProfile, windowBox: { x: number; y: number; w: number; h: number }, ambient: number, flash: number, hour: number) {
  const [ink, accent, mid, gold] = profile.palette;
  const wall = context.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, flash > 0 ? "#263142" : accent);
  wall.addColorStop(.58, ink);
  wall.addColorStop(1, "#030304");
  context.fillStyle = wall;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = .18 + ambient * .16;
  context.fillStyle = mid;
  for (let x = 8; x < width; x += 18) context.fillRect(x, 0, 1, height * .63);
  context.globalAlpha = 1;

  const floorY = height * .72;
  const floor = context.createLinearGradient(0, floorY, 0, height);
  floor.addColorStop(0, "#171112");
  floor.addColorStop(1, "#050506");
  context.fillStyle = floor;
  context.fillRect(0, floorY, width, height - floorY);
  context.strokeStyle = "rgba(171,116,57,.12)";
  for (let y = floorY + 10; y < height; y += 15) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }

  const lightStrength = clamp((ambient * .34) + flash * .9);
  const sunDirection = Math.sin(((hour - 6) / 12) * Math.PI);
  context.save();
  context.globalCompositeOperation = "screen";
  const cast = 52 + sunDirection * 68;
  const beam = context.createLinearGradient(windowBox.x, windowBox.y + windowBox.h, windowBox.x + cast, height);
  beam.addColorStop(0, `rgba(${flash ? "190,211,255" : "210,148,73"},${lightStrength * .5})`);
  beam.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = beam;
  pathPolygon(context, [
    { x: windowBox.x + 4, y: windowBox.y + windowBox.h },
    { x: windowBox.x + windowBox.w - 4, y: windowBox.y + windowBox.h },
    { x: windowBox.x + windowBox.w + cast, y: height },
    { x: windowBox.x - cast * .25, y: height },
  ]);
  context.fill();
  context.restore();

  context.save();
  context.globalAlpha = .22 + flash * .36;
  context.fillStyle = flash ? "#b8c8ee" : gold;
  const gridX = windowBox.x + windowBox.w * .5;
  context.translate(cast * .24, 0);
  context.fillRect(gridX - 2, floorY - 2, 4, height - floorY + 2);
  context.fillRect(windowBox.x, floorY + 31, windowBox.w + cast * .7, 3);
  context.restore();

  context.fillStyle = "#080708";
  if (profile.room === "study" || profile.room === "studio") {
    context.fillRect(-12, height - 87, width * .63, 42);
    context.fillStyle = "#53351e"; context.fillRect(-12, height - 88, width * .63, 3);
    context.fillStyle = "#0a0909"; context.fillRect(width * .47, height - 94, 52, 94);
  } else if (profile.room === "cafe") {
    context.beginPath(); context.ellipse(width * .51, height - 58, 58, 12, 0, 0, TAU); context.fill();
    context.fillRect(width * .5 - 5, height - 57, 10, 57);
  } else if (profile.room === "observatory") {
    context.strokeStyle = "#15131b"; context.lineWidth = 9;
    context.beginPath(); context.ellipse(width * .26, height - 88, 57, 15, -.35, 0, TAU); context.stroke();
    context.fillStyle = "#0a090d"; context.fillRect(width * .25, height - 92, 9, 92);
  } else {
    context.fillStyle = "#090708"; context.fillRect(width * .58, height - 78, width * .45, 78);
    context.fillStyle = "#251315"; roundedRect(context, width * .61, height - 98, width * .34, 53, 8); context.fill();
  }

  context.save();
  context.globalCompositeOperation = "screen";
  context.fillStyle = `rgba(218,166,86,${.08 + ambient * .17 + flash * .23})`;
  context.beginPath(); context.ellipse(width * .84, height * .36, 46, 78, -.15, 0, TAU); context.fill();
  context.restore();
}

function drawWindowFrame(context: CanvasRenderingContext2D, profile: SceneProfile, box: { x: number; y: number; w: number; h: number }, flash: number) {
  context.save();
  context.strokeStyle = flash > .1 ? "#66788f" : "#171318";
  context.lineWidth = 8;
  windowPath(context, profile.window, box.x, box.y, box.w, box.h);
  context.stroke();
  context.strokeStyle = "rgba(214,164,91,.25)";
  context.lineWidth = 1;
  windowPath(context, profile.window, box.x + 4, box.y + 4, box.w - 8, box.h - 8);
  context.stroke();
  context.fillStyle = flash > .1 ? "rgba(31,40,54,.8)" : "#0b0a0d";
  if (profile.window === "triptych" || profile.window === "wide") {
    context.fillRect(box.x + box.w / 3 - 2, box.y, 4, box.h);
    context.fillRect(box.x + box.w * 2 / 3 - 2, box.y, 4, box.h);
  } else {
    context.fillRect(box.x + box.w / 2 - 2, box.y, 4, box.h);
  }
  context.fillRect(box.x, box.y + box.h * .58 - 2, box.w, 4);
  context.restore();
}

function roomCoverGeometry(image: HTMLImageElement, width: number, height: number) {
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  let drawX = 0;
  let drawY = 0;
  if (sourceRatio > targetRatio) {
    drawHeight = height;
    drawWidth = height * sourceRatio;
    drawX = (width - drawWidth) * .5;
  } else {
    drawWidth = width;
    drawHeight = width / sourceRatio;
    drawY = (height - drawHeight) * .5;
  }
  return { drawX, drawY, drawWidth, drawHeight };
}

function drawRoomImage(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number, profile: SceneProfile, filter = "none") {
  const geometry = roomCoverGeometry(image, width, height);
  let drawX = geometry.drawX;
  const { drawY, drawWidth, drawHeight } = geometry;
  context.save();
  if ((profile.seed >>> 12) % 2 === 1) {
    context.translate(width, 0);
    context.scale(-1, 1);
    drawX = width - drawX - drawWidth;
  }
  context.filter = filter;
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  context.restore();
}

function drawRoomOverlay(context: CanvasRenderingContext2D, roomContext: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number, profile: SceneProfile, lighting: SceneLighting) {
  roomContext.save();
  roomContext.clearRect(0, 0, width, height);
  drawRoomImage(roomContext, image, width, height, profile, `brightness(${lighting.roomExposure}) saturate(${.58 + lighting.worldExposure * .16}) contrast(1.1)`);
  roomContext.globalCompositeOperation = "source-atop";
  roomContext.fillStyle = `rgba(4,7,13,${lighting.roomShade})`;
  roomContext.fillRect(0, 0, width, height);
  const ambientWash = roomContext.createRadialGradient(
    width * (.5 - lighting.direction * .08), height * .18, 6,
    width * (.5 - lighting.direction * .04), height * .36, width * .74,
  );
  ambientWash.addColorStop(0, `rgba(${lighting.sourceColor},${lighting.ambientStrength * .34})`);
  ambientWash.addColorStop(.48, `rgba(${lighting.bounceColor},${lighting.ambientStrength * .16})`);
  ambientWash.addColorStop(1, `rgba(${lighting.bounceColor},0)`);
  roomContext.fillStyle = ambientWash;
  roomContext.fillRect(0, 0, width, height);
  const directionalWash = roomContext.createLinearGradient(
    width * (.42 - lighting.direction * .18), height * .04,
    width * (.58 + lighting.direction * .24), height,
  );
  directionalWash.addColorStop(0, `rgba(${lighting.sourceColor},${lighting.directStrength * .28})`);
  directionalWash.addColorStop(.44, `rgba(${lighting.sourceColor},${lighting.directStrength * .11})`);
  directionalWash.addColorStop(1, `rgba(${lighting.bounceColor},0)`);
  roomContext.fillStyle = directionalWash;
  roomContext.fillRect(0, 0, width, height);
  roomContext.restore();
  context.drawImage(roomContext.canvas, 0, 0);
}

function prepareApertureMask(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number, profile: SceneProfile) {
  context.save();
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = "destination-out";
  drawRoomImage(context, image, width, height, profile);
  context.restore();
}

function drawInteriorLightField(
  context: CanvasRenderingContext2D,
  lightContext: CanvasRenderingContext2D,
  aperture: HTMLCanvasElement,
  roomImage: HTMLImageElement,
  width: number,
  height: number,
  profile: SceneProfile,
  lighting: SceneLighting,
) {
  const travelX = lighting.direction * 52;
  const travelY = 122;
  lightContext.save();
  lightContext.clearRect(0, 0, width, height);
  lightContext.globalCompositeOperation = "lighter";
  if (lighting.directStrength > .01) {
    const directScale = 1.08 + lighting.directStrength * .16;
    const directWidth = width * directScale;
    const directHeight = height * (1.08 + lighting.directStrength * .25);
    lightContext.globalAlpha = .08 + lighting.directStrength * .56;
    lightContext.filter = `blur(${lighting.flash > .05 ? .7 : lighting.directStrength > .2 ? 1.4 : 3.2}px)`;
    lightContext.drawImage(
      aperture,
      travelX * .82 - (directWidth - width) * .5,
      travelY * .72 - (directHeight - height) * .18,
      directWidth,
      directHeight,
    );
  }
  lightContext.filter = `blur(${lighting.flash > .05 ? 2.5 : 7}px)`;
  for (let step = 0; step < 18; step += 1) {
    const progress = step / 17;
    lightContext.globalAlpha = (1 - progress) * (.014 + lighting.beamStrength * .2);
    const scale = 1 + progress * .26;
    const drawWidth = width * scale;
    const drawHeight = height * scale;
    lightContext.drawImage(
      aperture,
      travelX * progress - (drawWidth - width) * .5,
      travelY * progress - (drawHeight - height) * .22,
      drawWidth,
      drawHeight,
    );
  }
  lightContext.filter = "none";
  lightContext.globalCompositeOperation = "source-in";
  const beam = lightContext.createLinearGradient(width * .5, height * .16, width * (.5 + lighting.direction * .24), height);
  beam.addColorStop(0, `rgba(${lighting.sourceColor},${.58 + lighting.flash * .28})`);
  beam.addColorStop(.58, `rgba(${lighting.bounceColor},${.32 + lighting.flash * .2})`);
  beam.addColorStop(1, `rgba(${lighting.bounceColor},0)`);
  lightContext.fillStyle = beam;
  lightContext.fillRect(0, 0, width, height);
  lightContext.globalCompositeOperation = "screen";
  const bounce = lightContext.createRadialGradient(
    width * (.5 - lighting.direction * .08), height * .28, 8,
    width * (.5 - lighting.direction * .08), height * .34, width * .82,
  );
  bounce.addColorStop(0, `rgba(${lighting.sourceColor},${.035 + lighting.ambientStrength * .34})`);
  bounce.addColorStop(.38, `rgba(${lighting.bounceColor},${.018 + lighting.ambientStrength * .18})`);
  bounce.addColorStop(1, `rgba(${lighting.bounceColor},0)`);
  lightContext.fillStyle = bounce;
  lightContext.fillRect(0, 0, width, height);
  lightContext.globalCompositeOperation = "destination-in";
  drawRoomImage(lightContext, roomImage, width, height, profile);
  lightContext.restore();

  context.save();
  context.globalCompositeOperation = "screen";
  context.globalAlpha = .58 + lighting.directStrength * .42 + lighting.flash * .18;
  context.drawImage(lightContext.canvas, 0, 0);
  context.restore();

  // Unlit surfaces become the shadow field naturally: the projected aperture
  // only adds light where the room's real opening can see the sky.
}

function drawGlassResponse(context: CanvasRenderingContext2D, glassContext: CanvasRenderingContext2D, aperture: HTMLCanvasElement, width: number, height: number, lighting: SceneLighting, elapsed: number) {
  glassContext.save();
  glassContext.clearRect(0, 0, width, height);
  glassContext.drawImage(aperture, 0, 0);
  glassContext.globalCompositeOperation = "source-in";
  const reflection = glassContext.createLinearGradient(-40 + (elapsed * .004) % (width + 80), 0, width + (elapsed * .004) % (width + 80), height);
  reflection.addColorStop(0, "rgba(255,255,255,0)");
  reflection.addColorStop(.42, `rgba(${lighting.sourceColor},${.025 + lighting.hazeStrength * .06})`);
  reflection.addColorStop(.5, `rgba(${lighting.sourceColor},${.11 + lighting.flash * .16})`);
  reflection.addColorStop(.54, `rgba(${lighting.sourceColor},0)`);
  reflection.addColorStop(1, "rgba(255,255,255,0)");
  glassContext.fillStyle = reflection;
  glassContext.fillRect(0, 0, width, height);
  glassContext.restore();

  context.save();
  context.globalCompositeOperation = "screen";
  context.globalAlpha = .72;
  context.drawImage(glassContext.canvas, 0, 0);
  context.restore();
}

function drawUnifiedGrade(context: CanvasRenderingContext2D, width: number, height: number, lighting: SceneLighting) {
  context.save();
  context.globalCompositeOperation = "soft-light";
  const grade = context.createLinearGradient(0, 0, width, height);
  grade.addColorStop(0, `rgba(${lighting.sourceColor},${.06 + lighting.flash * .08})`);
  grade.addColorStop(.55, "rgba(20,24,33,.08)");
  grade.addColorStop(1, `rgba(${lighting.bounceColor},.12)`);
  context.fillStyle = grade;
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = "multiply";
  context.fillStyle = `rgba(5,7,12,${.035 + lighting.hazeStrength * .08 + lighting.shadowStrength * .05})`;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function drawRainField(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  kind: string,
  particles: RainParticle[],
  elapsed: number,
  wind: number,
  lighting: SceneLighting,
) {
  const intensity = kind === "storm" ? 1 : .82;
  const exposure = clamp(.42 + lighting.worldExposure * .36 + lighting.flash * .82, .36, 1);
  const gust = .9 + Math.sin(elapsed * .00031) * .055 + Math.sin(elapsed * .00079 + 1.4) * .035;
  const slant = clamp(wind * .022, -.36, .36);

  // Most distant rain is read as participating atmosphere, not as a wall of
  // white lines. Soft, independently moving shafts give the skyline depth.
  context.save();
  context.globalCompositeOperation = "source-over";
  context.filter = "blur(5px)";
  for (let index = 0; index < 7; index += 1) {
    const lane = fract(index * .618 + elapsed * (.0000015 + index * .00000012));
    const laneX = (lane * 1.22 - .11) * width;
    const shaft = context.createLinearGradient(laneX - width * .12, 0, laneX + width * .12, height);
    shaft.addColorStop(0, `rgba(${lighting.sourceColor},0)`);
    shaft.addColorStop(.38, `rgba(${lighting.sourceColor},${(.021 + index % 3 * .005) * intensity * exposure})`);
    shaft.addColorStop(.72, `rgba(${lighting.sourceColor},${.04 * intensity * exposure})`);
    shaft.addColorStop(1, `rgba(${lighting.sourceColor},0)`);
    context.fillStyle = shaft;
    context.fillRect(laneX - width * .11, -18, width * .22, height + 36);
  }
  context.restore();

  // A photographed streak has a soft head and tail because exposure integrates
  // a moving, oscillating drop. Each depth band therefore gets its own length,
  // focus, opacity and shutter smear instead of sharing one graphic line style.
  for (let layer = 0; layer < 4; layer += 1) {
    const minDepth = layer / 4;
    const maxDepth = (layer + 1) / 4;
    context.save();
    context.lineCap = "round";
    context.filter = layer === 0 ? "blur(1.4px)" : layer === 1 ? "blur(.72px)" : layer === 2 ? "blur(.25px)" : "blur(.12px)";
    particles.forEach((particle) => {
      if (particle.z < minDepth || particle.z >= maxDepth) return;
      const depth = .12 + particle.z * .88;
      const travel = elapsed * particle.speed * intensity * (.48 + depth * .7) * gust;
      const y = fract(particle.y + travel) * (height + 26) - 13;
      const drift = elapsed * wind * .0000065 * depth;
      const sway = Math.sin(elapsed * .00052 + particle.phase) * particle.sway * (1 - depth) * 2.2;
      const x = fract(particle.x + drift) * (width + 22) - 11 + sway;
      const length = particle.length * (.48 + depth * 1.08) * (kind === "storm" ? 1.08 : .86);
      const dx = slant * length + Math.sin(particle.phase + elapsed * .00034) * .24;
      const alpha = (.082 + depth * .46) * particle.brightness * intensity * exposure;
      const lineWidth = particle.width * (.42 + depth * .74);
      const streak = context.createLinearGradient(x, y, x + dx, y + length);
      streak.addColorStop(0, `rgba(${lighting.sourceColor},0)`);
      streak.addColorStop(.18, `rgba(${lighting.sourceColor},${alpha * .38})`);
      streak.addColorStop(.47, `rgba(${lighting.sourceColor},${alpha})`);
      streak.addColorStop(.82, `rgba(${lighting.sourceColor},${alpha * .52})`);
      streak.addColorStop(1, `rgba(${lighting.sourceColor},0)`);

      // A restrained dark lobe makes drops remain legible against a bright sky;
      // the offset bright lobe catches room, sky and lightning illumination.
      context.globalCompositeOperation = "source-over";
      context.strokeStyle = `rgba(3,6,10,${alpha * .22})`;
      context.lineWidth = lineWidth * 1.22;
      context.beginPath();
      context.moveTo(x - .24, y);
      context.quadraticCurveTo(x + dx * .38, y + length * .48, x + dx - .18, y + length);
      context.stroke();
      context.globalCompositeOperation = "screen";
      context.strokeStyle = streak;
      context.lineWidth = lineWidth;
      context.beginPath();
      context.moveTo(x + .18, y);
      context.quadraticCurveTo(x + dx * .42, y + length * .49, x + dx + .16, y + length);
      context.stroke();
    });
    context.restore();
  }
}

function drawWeather(context: CanvasRenderingContext2D, xOffset: number, yOffset: number, width: number, height: number, kind: string, particles: RainParticle[], elapsed: number, wind: number, lighting: SceneLighting) {
  context.save();
  context.translate(xOffset, yOffset);
  if (kind === "rain" || kind === "storm") {
    drawRainField(context, width, height, kind, particles, elapsed, wind, lighting);
  } else if (kind === "snow") {
    particles.forEach((particle) => {
      const y = ((particle.y + elapsed * particle.speed * .18) % 1.08) * height - 4;
      const x = ((particle.x + Math.sin(elapsed * .001 + particle.phase) * .05 * particle.z) % 1.05) * width;
      context.fillStyle = `rgba(237,235,225,${.25 + particle.z * .62})`;
      context.beginPath(); context.arc(x, y, .7 + particle.z * 1.7, 0, TAU); context.fill();
    });
  }
  if (kind === "fog") {
    for (let index = 0; index < 4; index += 1) {
      const y = height * (.25 + index * .19);
      const x = Math.sin(elapsed * .00012 + index * 1.7) * width * .14;
      const fog = context.createRadialGradient(width * .5 + x, y, 5, width * .5 + x, y, width * .72);
      fog.addColorStop(0, `rgba(181,184,181,${.15 - index * .017})`); fog.addColorStop(1, "rgba(140,145,145,0)");
      context.fillStyle = fog; context.fillRect(0, y - 50, width, 100);
    }
  }
  if (lighting.flash > .01) {
    context.fillStyle = `rgba(199,216,255,${lighting.flash * .32})`;
    context.fillRect(0, 0, width, height);
  }
  context.restore();
}

function drawWindowRain(
  context: CanvasRenderingContext2D,
  rainContext: CanvasRenderingContext2D,
  aperture: HTMLCanvasElement,
  scene: HTMLCanvasElement,
  width: number,
  height: number,
  kind: string,
  droplets: GlassDroplet[],
  elapsed: number,
  wind: number,
  lighting: SceneLighting,
) {
  if (kind !== "rain" && kind !== "storm") return;
  rainContext.save();
  rainContext.clearRect(0, 0, width, height);
  const lightResponse = clamp(.46 + lighting.worldExposure * .38 + lighting.flash * .94, .38, 1);
  const trickleRate = kind === "storm" ? 1.2 : .84;
  const windLean = clamp(wind * .018, -.3, .3);

  droplets.forEach((drop, index) => {
    const raw = elapsed * drop.rate * trickleRate + drop.phase;
    const stepped = stickSlip(raw, drop.hold);
    const path = drop.y + stepped * (.11 + drop.weight * .08);
    const y = fract(path) * (height + 18) - 9;
    const wander = Math.sin(stepped * 2.7 + drop.phase * TAU) * drop.meander
      + Math.sin(stepped * 5.1 + drop.x * 9) * drop.meander * .34;
    const x = drop.x * width + wander + windLean * drop.weight * 4;
    const radius = drop.radius * (.82 + Math.sin(drop.phase * 8.3) * .08);
    const verticalRadius = radius * (1.12 + drop.weight * .42);
    const local = fract(raw);
    const sliding = local > drop.hold;
    const slideEnergy = sliding ? smoothstep(drop.hold, Math.min(.98, drop.hold + .22), local) : 0;
    const trailLength = drop.trail * (.32 + slideEnergy * .68);

    rainContext.save();
    rainContext.lineCap = "round";
    if (trailLength > 1.1) {
      const trailGradient = rainContext.createLinearGradient(x, y - trailLength, x, y);
      trailGradient.addColorStop(0, "rgba(4,8,12,0)");
      trailGradient.addColorStop(.6, `rgba(4,8,12,${.045 + drop.weight * .035})`);
      trailGradient.addColorStop(1, `rgba(4,8,12,${.085 + drop.weight * .055})`);
      rainContext.strokeStyle = trailGradient;
      rainContext.lineWidth = Math.max(.45, radius * .7);
      rainContext.beginPath();
      rainContext.moveTo(x - wander * .12, y - trailLength);
      rainContext.bezierCurveTo(
        x + drop.meander * .45,
        y - trailLength * .68,
        x - drop.meander * .3,
        y - trailLength * .22,
        x,
        y,
      );
      rainContext.stroke();
      rainContext.globalCompositeOperation = "screen";
      rainContext.strokeStyle = `rgba(${lighting.sourceColor},${(.055 + slideEnergy * .07) * lightResponse})`;
      rainContext.lineWidth = Math.max(.22, radius * .2);
      rainContext.beginPath();
      rainContext.moveTo(x + .45, y - trailLength * .92);
      rainContext.bezierCurveTo(
        x + drop.meander * .45 + .35,
        y - trailLength * .66,
        x - drop.meander * .3 + .5,
        y - trailLength * .2,
        x + .38,
        y,
      );
      rainContext.stroke();
      rainContext.globalCompositeOperation = "source-over";
    }

    // Refract a slightly displaced, magnified patch of the actual skyline.
    // The droplet is therefore never a pasted white dot: it contains the same
    // city, exposure and lightning as the view behind it.
    rainContext.beginPath();
    rainContext.ellipse(x, y, radius, verticalRadius, windLean * .08, 0, TAU);
    rainContext.clip();
    const sampleRadius = Math.max(1.2, radius * 1.8);
    rainContext.globalAlpha = .78;
    rainContext.drawImage(
      scene,
      clamp(x - sampleRadius + wander * .18, 0, width - sampleRadius * 2),
      clamp(y - sampleRadius - radius * .4, 0, height - sampleRadius * 2),
      sampleRadius * 2,
      sampleRadius * 2,
      x - radius * 1.08,
      y - verticalRadius * 1.05,
      radius * 2.16,
      verticalRadius * 2.1,
    );
    rainContext.globalAlpha = 1;
    const body = rainContext.createLinearGradient(x - radius, y, x + radius, y + verticalRadius);
    body.addColorStop(0, `rgba(2,5,9,${.18 + drop.weight * .04})`);
    body.addColorStop(.46, "rgba(8,14,20,.015)");
    body.addColorStop(.78, `rgba(${lighting.sourceColor},${.065 * lightResponse})`);
    body.addColorStop(1, `rgba(${lighting.sourceColor},${.2 * lightResponse})`);
    rainContext.fillStyle = body;
    rainContext.fillRect(x - radius, y - verticalRadius, radius * 2, verticalRadius * 2);
    rainContext.restore();

    rainContext.save();
    rainContext.strokeStyle = `rgba(1,4,8,${.24 + drop.weight * .13})`;
    rainContext.lineWidth = Math.max(.3, radius * .28);
    rainContext.beginPath();
    rainContext.ellipse(x, y, radius * .98, verticalRadius * .98, windLean * .08, 0, TAU);
    rainContext.stroke();
    rainContext.globalCompositeOperation = "screen";
    rainContext.strokeStyle = `rgba(${lighting.sourceColor},${(.31 + drop.weight * .2 + lighting.flash * .26) * lightResponse})`;
    rainContext.lineWidth = Math.max(.28, radius * .24);
    rainContext.beginPath();
    rainContext.ellipse(x - radius * .08, y - verticalRadius * .04, radius * .82, verticalRadius * .84, windLean * .08, Math.PI * 1.08, Math.PI * 1.76);
    rainContext.stroke();
    rainContext.restore();

    if (index % 5 === 0) {
      rainContext.fillStyle = `rgba(${lighting.sourceColor},${(.035 + drop.weight * .035) * lightResponse})`;
      rainContext.beginPath();
      rainContext.arc(x + radius * 1.7, y - verticalRadius * 1.2, Math.max(.22, radius * .18), 0, TAU);
      rainContext.fill();
    }
  });

  // Edge condensation is deliberately subtle and static. It gives the moving
  // beads a wet surface to belong to without clouding the city view.
  const moisture = rainContext.createRadialGradient(width * .5, height * .45, width * .16, width * .5, height * .45, width * .68);
  moisture.addColorStop(0, "rgba(185,205,218,0)");
  moisture.addColorStop(.72, `rgba(${lighting.sourceColor},${.009 * lightResponse})`);
  moisture.addColorStop(1, `rgba(${lighting.sourceColor},${.026 * lightResponse})`);
  rainContext.fillStyle = moisture;
  rainContext.fillRect(0, 0, width, height);

  rainContext.globalCompositeOperation = "destination-in";
  rainContext.drawImage(aperture, 0, 0);
  rainContext.restore();

  context.save();
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = .94;
  context.drawImage(rainContext.canvas, 0, 0);
  context.restore();
}

function drawFilmFinish(context: CanvasRenderingContext2D, width: number, height: number, elapsed: number, profile: SceneProfile) {
  context.save();
  context.globalCompositeOperation = "soft-light";
  context.globalAlpha = .038;
  const rand = mulberry32(profile.seed + Math.floor(elapsed / 180));
  context.fillStyle = "#f5ddb6";
  for (let index = 0; index < 220; index += 1) context.fillRect(rand() * width, rand() * height, rand() > .9 ? 1.1 : .5, .5);
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  const vignette = context.createRadialGradient(width * .5, height * .43, width * .12, width * .5, height * .5, width * .72);
  vignette.addColorStop(0, "rgba(0,0,0,0)"); vignette.addColorStop(1, "rgba(0,0,0,.58)");
  context.fillStyle = vignette; context.fillRect(0, 0, width, height);
  context.restore();
}

export function WeatherCinemaEngine({ code, isDay, place, updatedAt, wind = 4, precipitation = 0, inspectionMs = null }: WeatherCinemaEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const profile = useMemo(() => buildProfile(place), [place]);
  const skylinePreset = useMemo(() => skylinePresetForPlace(place), [place]);
  const kind = weatherKind(code);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;
    const apertureCanvas = document.createElement("canvas");
    const apertureContext = apertureCanvas.getContext("2d");
    const roomCanvas = document.createElement("canvas");
    const roomContext = roomCanvas.getContext("2d");
    const lightCanvas = document.createElement("canvas");
    const lightContext = lightCanvas.getContext("2d");
    const glassCanvas = document.createElement("canvas");
    const glassContext = glassCanvas.getContext("2d");
    const sceneCanvas = document.createElement("canvas");
    const sceneContext = sceneCanvas.getContext("2d");
    if (!apertureContext || !roomContext || !lightContext || !glassContext || !sceneContext) return;
    [apertureCanvas, roomCanvas, lightCanvas, glassCanvas, sceneCanvas].forEach((buffer) => {
      buffer.width = 320;
      buffer.height = 430;
    });
    let frame = 0;
    let width = 320;
    let height = 430;
    let previous = 0;
    let elapsed = 0;
    let disposed = false;
    let started = false;
    let aperturePrepared = false;
    let skylineBounds: AlphaBounds | null = null;
    const rand = mulberry32(profile.seed ^ 0x9e3779b9);
    const particles: RainParticle[] = Array.from({ length: kind === "storm" ? 188 : 138 }, () => {
      const z = Math.pow(rand(), .78);
      return {
        x: rand(),
        y: rand(),
        z,
        speed: .000042 + rand() * .000092,
        phase: rand() * TAU,
        length: 3.2 + rand() * 7.8 + z * 4.6,
        brightness: .44 + rand() * .66,
        sway: .22 + rand() * .74,
        width: .42 + rand() * .56,
      };
    });
    const droplets: GlassDroplet[] = Array.from({ length: kind === "storm" ? 76 : 58 }, () => {
      const weight = Math.pow(rand(), 1.08);
      return {
        x: .055 + rand() * .89,
        y: rand(),
        radius: .62 + weight * 3.45,
        rate: .000038 + weight * .000074 + rand() * .000018,
        phase: rand() * 8,
        hold: .56 + rand() * .34,
        meander: .35 + rand() * 2.5,
        trail: 2 + weight * 24,
        weight,
      };
    });
    const roomImage = new Image();
    roomImage.decoding = "async";
    roomImage.src = roomAssetForProfile(profile);
    const skylineImage = new Image();
    skylineImage.decoding = "async";
    skylineImage.src = skylineAssetForPreset(skylinePreset);

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const render = (now: number) => {
      const delta = previous ? Math.min(40, now - previous) : 16;
      previous = now;
      elapsed += delta;
      const presentationTime = inspectionMs ?? elapsed;
      const hour = localHour(updatedAt, isDay);
      const daylight = isDay ? clamp(Math.sin(((hour - 5.5) / 13) * Math.PI), .08, 1) : .035;
      const stormCycle = kind === "storm" ? presentationTime % 7300 : 0;
      const flashRaw = kind === "storm"
        ? Math.max(
          1 - Math.abs(stormCycle - 5660) / 72,
          (1 - Math.abs(stormCycle - 5840) / 115) * .66,
          (1 - Math.abs(stormCycle - 6120) / 85) * .42,
        )
        : 0;
      const flash = smoothstep(0, 1, clamp(flashRaw));
      const cloudDim = kind === "clear" ? 1 : kind === "cloud" ? .76 : kind === "snow" ? .68 : .47;
      const ambient = daylight * cloudDim;
      const lighting = sceneLighting(kind, isDay, hour, ambient, flash);
      const baseW = 320;
      const baseH = 430;
      const sx = width / baseW;
      const sy = height / baseH;
      context.save();
      context.setTransform(canvas.width / baseW, 0, 0, canvas.height / baseH, 0, 0);
      context.clearRect(0, 0, baseW, baseH);
      const artReady = roomImage.complete && roomImage.naturalWidth > 0;
      const fallbackWindow = profile.window === "wide" ? { x: 30, y: 55, w: 260, h: 247 }
        : profile.window === "triptych" ? { x: 41, y: 48, w: 238, h: 258 }
          : profile.window === "tall" ? { x: 75, y: 42, w: 170, h: 278 }
            : { x: 49, y: 39, w: 222, h: 274 };
      // Generated interiors are transparent at their windows. Rendering a larger
      // world plate behind them lets the art itself become the matte, so there is
      // never a second, mismatched synthetic window frame underneath it.
      const windowBox = artReady ? { x: -22, y: -14, w: 364, h: 334 } : fallbackWindow;

      if (artReady && !aperturePrepared) {
        prepareApertureMask(apertureContext, roomImage, baseW, baseH, profile);
        aperturePrepared = true;
      }

      if (!artReady) drawRoom(context, baseW, baseH, profile, windowBox, ambient, flash, hour);

      context.save();
      if (artReady) context.rect(0, 0, baseW, baseH);
      else windowPath(context, profile.window, windowBox.x, windowBox.y, windowBox.w, windowBox.h);
      context.clip();

      // The camera is intentionally locked. Depth comes from fixed layer
      // composition and weather-driven light, never from pointer movement.

      const sky = context.createLinearGradient(0, windowBox.y, 0, windowBox.y + windowBox.h);
      sky.addColorStop(0, lighting.skyTop);
      sky.addColorStop(.54, lighting.skyMiddle);
      sky.addColorStop(1, lighting.skyBottom);
      context.fillStyle = sky; context.fillRect(windowBox.x - 20, windowBox.y - 20, windowBox.w + 40, windowBox.h + 40);

      if (!isDay) {
        const starRand = mulberry32(profile.seed + 12);
        context.fillStyle = "rgba(244,223,171,.72)";
        for (let index = 0; index < 38; index += 1) { const px = windowBox.x + starRand() * windowBox.w; const py = windowBox.y + starRand() * windowBox.h * .52; context.fillRect(px, py, starRand() > .8 ? 1.2 : .6, .6); }
      }

      const horizon = windowBox.y + windowBox.h * .86;
      drawAtmosphereBands(context, windowBox, kind, presentationTime, wind);

      // The world continues below the buildings. Keeping this as a distinct
      // depth layer lets water, rooftops and lightning share the same exposure
      // curve as the skyline instead of leaving an unmotivated patch of sky.
      drawWorldSurface(context, windowBox, horizon + 6, skylinePreset, lighting, presentationTime, profile.seed);

      const skylineReady = skylineImage.complete && skylineImage.naturalWidth > 0;
      if (!skylinePreset.landmarkInPlate) {
        drawLandmark(context, profile.landmark, windowBox.x + windowBox.w * (.48 + ((profile.seed % 17) - 8) * .006), horizon + 5, .68, isDay ? .11 : .48);
      }
      if (skylineReady) {
        skylineBounds ??= measureAlphaBounds(skylineImage);
        drawSkylinePlate(context, skylineImage, skylineBounds, windowBox, horizon + 6, skylinePreset.focus, lighting);
      }

      drawWeather(context, windowBox.x - 12, windowBox.y - 9, windowBox.w + 24, windowBox.h + 18, kind, particles, presentationTime, wind, lighting);
      context.restore();

      // Freeze the exact exterior plate before the room and glass are laid on
      // top. Wet-glass droplets sample this plate for local refraction, so the
      // city never disconnects from the water optically.
      sceneContext.clearRect(0, 0, baseW, baseH);
      sceneContext.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, baseW, baseH);

      if (!artReady) drawWindowFrame(context, profile, windowBox, flash);

      if (artReady) {
        drawRoomOverlay(context, roomContext, roomImage, baseW, baseH, profile, lighting);
        if (aperturePrepared) {
          drawInteriorLightField(context, lightContext, apertureCanvas, roomImage, baseW, baseH, profile, lighting);
          drawGlassResponse(context, glassContext, apertureCanvas, baseW, baseH, lighting, presentationTime);
          drawWindowRain(context, glassContext, apertureCanvas, sceneCanvas, baseW, baseH, kind, droplets, presentationTime, wind, lighting);
        }
      }

      if (!artReady) {
        context.save();
        windowPath(context, profile.window, windowBox.x + 3, windowBox.y + 3, windowBox.w - 6, windowBox.h - 6);
        context.clip();
        const reflection = context.createLinearGradient(windowBox.x, windowBox.y, windowBox.x + windowBox.w, windowBox.y + windowBox.h);
        reflection.addColorStop(0, "rgba(255,236,196,.09)"); reflection.addColorStop(.32, "rgba(255,255,255,0)"); reflection.addColorStop(.68, "rgba(226,194,145,.04)"); reflection.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = reflection; context.fillRect(windowBox.x, windowBox.y, windowBox.w, windowBox.h);
        context.restore();
      }

      drawUnifiedGrade(context, baseW, baseH, lighting);
      drawFilmFinish(context, baseW, baseH, presentationTime, profile);
      context.restore();
      void sx; void sy; void precipitation;
      // Inspection mode freezes the presentation clock, not the render loop;
      // keeping the loop alive guarantees a ResizeObserver pass can never
      // leave a freshly resized canvas blank during frame-by-frame QA.
      frame = window.requestAnimationFrame(render);
    };

    const begin = () => {
      if (disposed || started) return;
      started = true;
      canvas.dataset.ready = "true";
      frame = window.requestAnimationFrame(render);
    };
    const fallback = window.setTimeout(begin, 1800);
    Promise.allSettled([roomImage.decode(), skylineImage.decode()]).then(begin);

    return () => {
      disposed = true;
      window.clearTimeout(fallback);
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [code, inspectionMs, isDay, kind, place, precipitation, profile, skylinePreset, updatedAt, wind]);

  return <canvas ref={canvasRef} className="weather-cinema-canvas" data-weather-kind={kind} aria-hidden="true" />;
}
