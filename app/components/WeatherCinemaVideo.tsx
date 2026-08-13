"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WeatherCinemaEngine } from "./WeatherCinemaEngine";
import { weatherCinemaAsset } from "../data/weatherCinema";

type WeatherPlace = { name: string; country?: string; latitude: number; longitude: number };

type WeatherCinemaVideoProps = {
  code: number;
  isDay: boolean;
  place: WeatherPlace;
  updatedAt?: string;
  wind?: number;
  precipitation?: number;
  inspectionMs?: number | null;
};

const CROSSFADE_MS = 350;

export function WeatherCinemaVideo({ code, isDay, place, updatedAt, wind = 4, precipitation = 0, inspectionMs = null }: WeatherCinemaVideoProps) {
  const asset = useMemo(() => weatherCinemaAsset(place.name, place.country, code, isDay), [place.name, place.country, code, isDay]);
  const [unavailableVideo, setUnavailableVideo] = useState<string | null>(null);
  const videoUnavailable = Boolean(asset?.video && unavailableVideo === asset.video);

  if (!asset?.video || videoUnavailable) {
    return (
      <div
        className="weather-cinema-fallback"
        data-weather-renderer="procedural"
        data-weather-fallback={asset ? (videoUnavailable ? "video-error" : "curated-video-pending") : "global-city"}
      >
        <WeatherCinemaEngine code={code} isDay={isDay} place={place} updatedAt={updatedAt} wind={wind} precipitation={precipitation} inspectionMs={inspectionMs} />
      </div>
    );
  }

  return <WeatherCinemaLoop key={asset.video} video={asset.video} poster={asset.poster} weather={asset.weather} light={asset.light} onUnavailable={() => setUnavailableVideo(asset.video)} />;
}

function WeatherCinemaLoop({ video, poster, weather, light, onUnavailable }: { video: string; poster?: string; weather: string; light: string; onUnavailable: () => void }) {
  const firstRef = useRef<HTMLVideoElement>(null);
  const secondRef = useRef<HTMLVideoElement>(null);
  const refs = [firstRef, secondRef];
  const [active, setActive] = useState<0 | 1>(0);
  const activeRef = useRef<0 | 1>(0);
  const [crossfading, setCrossfading] = useState(false);
  const [ready, setReady] = useState(false);
  const transitionRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const failedLayersRef = useRef(new Set<number>());

  useEffect(() => {
    const restart = (element: HTMLVideoElement | null) => {
      if (!element) return;
      element.currentTime = 0;
      void element.play().catch(() => undefined);
    };
    const tick = () => {
      const activeIndex = activeRef.current;
      const nextIndex: 0 | 1 = activeIndex === 0 ? 1 : 0;
      const current = refs[activeIndex].current;
      const next = refs[nextIndex].current;
      if (current && next && current.duration && !transitionRef.current && current.currentTime >= current.duration - CROSSFADE_MS / 1000) {
        if (next.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          if (current.ended || current.currentTime >= current.duration - 0.04) restart(current);
          frameRef.current = requestAnimationFrame(tick);
          return;
        }
        transitionRef.current = true;
        next.currentTime = 0;
        void next.play().catch(() => {
          transitionRef.current = false;
          restart(current);
        });
        setCrossfading(true);
        timerRef.current = window.setTimeout(() => {
          current.pause();
          current.currentTime = 0;
          activeRef.current = nextIndex;
          setActive(nextIndex);
          setCrossfading(false);
          transitionRef.current = false;
        }, CROSSFADE_MS);
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    const current = refs[0].current;
    if (current) void current.play().catch(() => undefined);
    const resume = () => {
      if (document.visibilityState !== "visible") return;
      const visible = refs[activeRef.current].current;
      if (visible?.paused) void visible.play().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", resume);
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      document.removeEventListener("visibilitychange", resume);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  // refs are stable for the lifetime of the component.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="weather-cinema-video" data-weather-renderer="cinematic-video" data-ready={ready ? "true" : "false"} data-weather={weather} data-light={light}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {poster && <img src={poster} alt="" className="weather-cinema-poster" />}
      {[0, 1].map((index) => (
        <video
          key={`${video}-${index}`}
          ref={refs[index]}
          className={`weather-cinema-video-layer ${index === active ? "is-active" : ""} ${crossfading && index !== active ? "is-entering" : ""}`}
          src={video}
          poster={poster}
          muted
          playsInline
          preload="auto"
          onCanPlay={() => { if (index === 0) setReady(true); }}
          onEnded={(event) => {
            if (!transitionRef.current && index === activeRef.current) {
              event.currentTarget.currentTime = 0;
              void event.currentTarget.play().catch(() => undefined);
            }
          }}
          onError={() => {
            failedLayersRef.current.add(index);
            if (failedLayersRef.current.size === 2 || index === 0) onUnavailable();
          }}
          aria-hidden="true"
        />
      ))}
      <div className="weather-cinema-grade" aria-hidden="true" />
    </div>
  );
}
