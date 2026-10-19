"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

// The self-hosted counterpart of YouTubeFacade: a still with one large play
// control in the middle, and the browser's own player only once it is pressed.
export function FilmPlayer({ src, title, poster, label = "Play film" }: {
  src: string;
  title: string;
  poster?: string;
  label?: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return <video src={src} poster={poster} aria-label={title} controls autoPlay playsInline />;
  }

  return (
    <button type="button" className="yt-facade film-facade" data-src={src} onClick={() => setPlaying(true)} aria-label={`${label}: ${title}`}>
      {poster && <img src={poster} alt="" loading="lazy" decoding="async" />}
      <span className="yt-facade-play" aria-hidden="true"><i /></span>
      <span className="yt-facade-label">{label}</span>
    </button>
  );
}
