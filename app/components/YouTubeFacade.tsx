"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

// A still frame with a play control stands in for the YouTube player until the
// visitor asks for it. The page never shows an empty black rectangle while the
// embed loads, and YouTube's own chrome only appears once someone chooses to watch.
export function YouTubeFacade({ id, title, poster, label = "Play film" }: {
  id: string;
  title: string;
  poster?: string;
  label?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const embed = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  const still = poster ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  if (playing) {
    return (
      <iframe
        className="yt-embed"
        src={`${embed}&autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <button type="button" className="yt-facade" data-embed={embed} onClick={() => setPlaying(true)} aria-label={`${label}: ${title}`}>
      <img src={still} alt="" loading="lazy" decoding="async" />
      <span className="yt-facade-play" aria-hidden="true"><i /></span>
      <span className="yt-facade-label">{label}</span>
    </button>
  );
}
