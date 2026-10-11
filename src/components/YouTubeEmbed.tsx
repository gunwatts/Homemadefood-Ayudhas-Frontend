"use client";

import { useState } from "react";
import { asset } from "@/lib/config";
import { IconPlay } from "./Icons";

/**
 * Privacy-friendly, lightweight YouTube embed: shows a thumbnail first and only loads
 * the player (from youtube-nocookie.com) when the visitor taps play. A "Watch on
 * YouTube" link is always available as a fallback if embedding is blocked.
 */
export function YouTubeEmbed({
  videoId,
  title,
  url,
  thumbnail,
}: {
  videoId: string;
  title: string;
  url?: string;
  thumbnail?: string | null;
}) {
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const thumb = thumbFailed ? asset("/placeholders/maker.svg") : thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const watchUrl = url || `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-ink">
      <div className="relative aspect-video">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Play video: ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt=""
              loading="lazy"
              onError={() => setThumbFailed(true)}
              className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
            />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-brand/90 pl-1 text-white shadow-lg transition group-hover:scale-105">
                <IconPlay />
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="flex items-center justify-between gap-3 bg-paper px-4 py-3 text-sm">
        <span className="font-semibold text-ink">{title}</span>
        <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-brand underline-offset-2 hover:underline">
          Watch on YouTube
        </a>
      </figcaption>
    </figure>
  );
}
