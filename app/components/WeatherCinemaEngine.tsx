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
  tilt?: { x: number; y: number };
  inspectionMs?: number | null;
};

type Point = { x: number; y: number };
type WindowShape = "wide" | "triptych" | "arched" | "tall";
type RoomKind = "study" | "hotel" | "studio" | "cafe" | "observatory" | "penthouse";
type LandmarkKind = "empire" | "pearl" | "tokyo" | "eiffel" | "clock" | "bridge" | "needle" | "willis" | "burj" | "opera" | "cn" | "capitol" | "dome" | "petronas" | "marina" | "minaret" | "spire";

type SceneProfile = {
  seed: number;
  room: RoomKind;
  window: WindowShape;
  landmark: LandmarkKind;
  palette: [string, string, string, string];
  skylineDensity: number;
};

type Particle = { x: number; y: number; z: number; speed: number; phase: number };

const TAU = Math.PI * 2;

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
    skylineDensity: 18 + (seed % 9),
  };
}

function roomAssetForProfile(profile: SceneProfile) {
  if (profile.room === "hotel" || profile.room === "penthouse") return "/media/weather/engine/room-hotel-v1.webp";
  if (profile.room === "observatory") return "/media/weather/engine/room-observatory-v1.webp";
  return "/media/weather/engine/room-studio-v1.webp";
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

function drawCloud(context: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
  context.fillStyle = color;
  context.beginPath();
  context.ellipse(x, y, 32 * scale, 10 * scale, 0, 0, TAU);
  context.ellipse(x - 18 * scale, y + 2 * scale, 25 * scale, 8 * scale, 0, 0, TAU);
  context.ellipse(x + 23 * scale, y + 1 * scale, 28 * scale, 9 * scale, 0, 0, TAU);
  context.fill();
}

function drawBuilding(context: CanvasRenderingContext2D, x: number, base: number, width: number, height: number, depth: number, rand: () => number, lit: number) {
  const top = base - height;
  context.fillStyle = depth > .65 ? "#07090d" : depth > .35 ? "#0d1118" : "#171a22";
  context.fillRect(x, top, width, height);
  context.fillStyle = `rgba(191,143,69,${.06 + depth * .13})`;
  context.fillRect(x, top, 1, height);
  if (rand() > .48) {
    context.fillStyle = "#07090d";
    context.beginPath();
    context.moveTo(x + width * .2, top);
    context.lineTo(x + width * .5, top - Math.min(15, height * .16));
    context.lineTo(x + width * .8, top);
    context.fill();
  }
  const cell = Math.max(3, Math.floor(width / 4));
  for (let wy = top + 8; wy < base - 5; wy += 8) {
    for (let wx = x + 3; wx < x + width - 2; wx += cell) {
      const on = rand() < lit * (.45 + depth * .4);
      context.fillStyle = on ? `rgba(238,185,90,${.35 + depth * .48})` : "rgba(10,13,18,.68)";
      context.fillRect(wx, wy, depth > .65 ? 1.5 : 1, 2);
    }
  }
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

function drawRoomOverlay(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number, profile: SceneProfile, ambient: number, flash: number) {
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
  context.save();
  if ((profile.seed >>> 12) % 2 === 1) {
    context.translate(width, 0);
    context.scale(-1, 1);
    drawX = width - drawX - drawWidth;
  }
  context.filter = `brightness(${.68 + ambient * .37 + flash * .2}) saturate(${.76 + ambient * .18}) contrast(1.06)`;
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  context.restore();
}

function drawInteriorLightResponse(context: CanvasRenderingContext2D, width: number, height: number, flash: number, ambient: number, hour: number, profile: SceneProfile) {
  const light = clamp(ambient * .36 + flash * .92);
  if (light <= .015) return;
  const angle = Math.sin(((hour - 6) / 12) * Math.PI);
  const originX = width * (.32 + (profile.seed % 31) / 100);
  context.save();
  context.globalCompositeOperation = "screen";
  const wash = context.createLinearGradient(originX, height * .28, width * (.42 + angle * .25), height);
  wash.addColorStop(0, `rgba(${flash > .05 ? "178,202,255" : "218,157,81"},${light * .34})`);
  wash.addColorStop(.54, `rgba(${flash > .05 ? "144,174,235" : "176,99,47"},${light * .14})`);
  wash.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = wash;
  pathPolygon(context, [
    { x: width * .23, y: height * .21 },
    { x: width * .75, y: height * .2 },
    { x: width * (.89 + angle * .1), y: height },
    { x: width * (.05 + angle * .16), y: height },
  ]);
  context.fill();
  context.restore();

  context.save();
  context.globalCompositeOperation = "multiply";
  context.fillStyle = `rgba(3,4,8,${.08 + light * .23})`;
  const skew = angle * 52;
  for (let index = 0; index < 3; index += 1) {
    pathPolygon(context, [
      { x: width * (.3 + index * .2), y: height * .2 },
      { x: width * (.32 + index * .2), y: height * .2 },
      { x: width * (.35 + index * .2) + skew, y: height },
      { x: width * (.29 + index * .2) + skew, y: height },
    ]);
    context.fill();
  }
  context.restore();
}

function drawWeather(context: CanvasRenderingContext2D, xOffset: number, yOffset: number, width: number, height: number, kind: string, particles: Particle[], elapsed: number, wind: number, flash: number) {
  context.save();
  context.translate(xOffset, yOffset);
  if (kind === "rain" || kind === "storm") {
    const intensity = kind === "storm" ? 1 : .68;
    context.lineWidth = 1;
    particles.forEach((particle, index) => {
      const y = ((particle.y + elapsed * particle.speed * intensity) % 1.15) * height - 12;
      const x = ((particle.x + elapsed * wind * .0009 * particle.z) % 1.12) * width - 8;
      context.strokeStyle = `rgba(174,201,218,${.18 + particle.z * .58})`;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 4 + wind * .05, y + 13 + particle.z * 9);
      context.stroke();
      if (index % 8 === 0 && y > height * .85) {
        context.strokeStyle = `rgba(183,208,220,${.1 + particle.z * .18})`;
        context.beginPath(); context.ellipse(x, height * .94, 3 + particle.z * 3, 1.2, 0, 0, TAU); context.stroke();
      }
    });
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
  if (flash > .01) {
    context.fillStyle = `rgba(199,216,255,${flash * .32})`;
    context.fillRect(0, 0, width, height);
  }
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

export function WeatherCinemaEngine({ code, isDay, place, updatedAt, wind = 4, precipitation = 0, tilt = { x: 0, y: 0 }, inspectionMs = null }: WeatherCinemaEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tiltRef = useRef(tilt);
  const profile = useMemo(() => buildProfile(place), [place]);
  const kind = weatherKind(code);

  useEffect(() => { tiltRef.current = tilt; }, [tilt]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;
    let frame = 0;
    let width = 320;
    let height = 430;
    let previous = 0;
    let elapsed = 0;
    let disposed = false;
    let started = false;
    const rand = mulberry32(profile.seed ^ 0x9e3779b9);
    const particles = Array.from({ length: kind === "storm" ? 120 : 82 }, () => ({ x: rand(), y: rand(), z: .2 + rand() * .8, speed: .00008 + rand() * .00016, phase: rand() * TAU }));
    const roomImage = new Image();
    roomImage.decoding = "async";
    roomImage.src = roomAssetForProfile(profile);

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

      if (!artReady) drawRoom(context, baseW, baseH, profile, windowBox, ambient, flash, hour);

      context.save();
      if (artReady) context.rect(0, 0, baseW, baseH);
      else windowPath(context, profile.window, windowBox.x, windowBox.y, windowBox.w, windowBox.h);
      context.clip();
      const liveTilt = tiltRef.current;
      context.translate(liveTilt.x * -1.5, liveTilt.y * -.5);

      const sky = context.createLinearGradient(0, windowBox.y, 0, windowBox.y + windowBox.h);
      if (!isDay) {
        sky.addColorStop(0, flash ? "#70809b" : "#070b17"); sky.addColorStop(.54, flash ? "#38445b" : "#17192a"); sky.addColorStop(1, "#15131e");
      } else if (kind === "storm" || kind === "rain") {
        sky.addColorStop(0, flash ? "#9aacc2" : "#1d2735"); sky.addColorStop(.52, "#303746"); sky.addColorStop(1, "#242633");
      } else if (kind === "snow" || kind === "fog") {
        sky.addColorStop(0, "#8e8b8a"); sky.addColorStop(.55, "#626873"); sky.addColorStop(1, "#353b46");
      } else {
        sky.addColorStop(0, hour < 8 || hour > 17 ? "#a95c49" : "#526d82"); sky.addColorStop(.55, hour < 8 || hour > 17 ? "#66404d" : "#314b63"); sky.addColorStop(1, "#21283a");
      }
      context.fillStyle = sky; context.fillRect(windowBox.x - 20, windowBox.y - 20, windowBox.w + 40, windowBox.h + 40);

      if (!isDay) {
        const starRand = mulberry32(profile.seed + 12);
        context.fillStyle = "rgba(244,223,171,.72)";
        for (let index = 0; index < 38; index += 1) { const px = windowBox.x + starRand() * windowBox.w; const py = windowBox.y + starRand() * windowBox.h * .52; context.fillRect(px, py, starRand() > .8 ? 1.2 : .6, .6); }
      }

      if (kind !== "clear") {
        const speed = presentationTime * .005 * Math.max(1, Math.abs(wind) * .25);
        drawCloud(context, windowBox.x + ((speed + profile.seed) % (windowBox.w + 150)) - 75, windowBox.y + 54, 1.25, kind === "storm" ? "rgba(9,12,20,.82)" : "rgba(38,42,50,.62)");
        drawCloud(context, windowBox.x + ((speed * .62 + 110) % (windowBox.w + 170)) - 85, windowBox.y + 91, .88, "rgba(47,50,59,.45)");
      }

      const cityRand = mulberry32(profile.seed + 71);
      const horizon = windowBox.y + windowBox.h * .86;
      for (let layer = 0; layer < 3; layer += 1) {
        const depth = layer / 2;
        let x = windowBox.x - 18 + liveTilt.x * (depth + .2) * 1.4;
        const density = profile.skylineDensity - layer * 3;
        for (let index = 0; index < density; index += 1) {
          const bw = 8 + cityRand() * (13 + layer * 2);
          const bh = 28 + cityRand() * (74 + layer * 23);
          drawBuilding(context, x, horizon + layer * 8, bw, bh, depth, cityRand, isDay ? .12 : .78);
          x += bw + 1 + cityRand() * 2;
        }
      }
      drawLandmark(context, profile.landmark, windowBox.x + windowBox.w * (.42 + ((profile.seed % 17) - 8) * .009) + liveTilt.x * 2.4, horizon + 6, .88, isDay ? .2 : .82);

      if (profile.landmark === "bridge" || profile.landmark === "opera" || profile.landmark === "marina") {
        const water = context.createLinearGradient(0, horizon, 0, windowBox.y + windowBox.h);
        water.addColorStop(0, "rgba(25,32,43,.75)"); water.addColorStop(1, "rgba(5,8,13,.94)");
        context.fillStyle = water; context.fillRect(windowBox.x - 10, horizon + 5, windowBox.w + 20, windowBox.h);
        context.strokeStyle = `rgba(221,169,78,${isDay ? .08 : .24})`;
        for (let index = 0; index < 8; index += 1) { const wy = horizon + 11 + index * 8; context.beginPath(); context.moveTo(windowBox.x + cityRand() * 60, wy); context.lineTo(windowBox.x + windowBox.w - cityRand() * 45, wy); context.stroke(); }
      }

      drawWeather(context, windowBox.x - 12, windowBox.y - 9, windowBox.w + 24, windowBox.h + 18, kind, particles, presentationTime, wind, flash);
      context.restore();

      if (!artReady) drawWindowFrame(context, profile, windowBox, flash);

      if (artReady) {
        drawRoomOverlay(context, roomImage, baseW, baseH, profile, ambient, flash);
        drawInteriorLightResponse(context, baseW, baseH, flash, ambient, hour, profile);
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
    roomImage.decode().then(begin).catch(() => {
      if (roomImage.complete) begin();
    });

    return () => {
      disposed = true;
      window.clearTimeout(fallback);
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [code, inspectionMs, isDay, kind, place, precipitation, profile, updatedAt, wind]);

  return <canvas ref={canvasRef} className="weather-cinema-canvas" aria-hidden="true" />;
}
