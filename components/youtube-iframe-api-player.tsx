"use client";

import { useEffect, useId, useRef } from "react";
import YouTube from "react-youtube";
import type { YouTubePlayer } from "react-youtube";

import { patchYtIframeAllow } from "@/components/site-playback-provider";
import { ensureYoutubeIframeApiLoaded } from "@/lib/youtube-iframe-api";

export type YoutubeIframeApiPlayerProps = {
  videoId: string;
  title?: string;
  playerVars: Record<string, string | number>;
  width?: number;
  height?: number;
  className?: string;
  iframeClassName?: string;
  loading?: "eager" | "lazy";
  onReady: (player: YouTubePlayer) => void;
  onStateChange?: (e: { data: number; target: YouTubePlayer }) => void;
  onEnd?: (e: { target: YouTubePlayer }) => void;
  /** https://developers.google.com/youtube/iframe_api_reference#onAutoplayBlocked */
  onAutoplayBlocked?: (e: { target: YouTubePlayer }) => void;
};

/**
 * Uses the official `YT.Player` constructor with `events.onAutoplayBlocked`.
 *
 * **Important:** Callback props are stored in refs so parent re-renders (e.g. pointermove on
 * an ancestor) do NOT re-run this effect — otherwise `YT.Player` would be destroyed/rebuilt
 * and video would freeze or restart.
 */
export function YoutubeIframeApiPlayer({
  videoId,
  title = "",
  playerVars,
  width = 1280,
  height = 720,
  className,
  iframeClassName,
  loading,
  onReady,
  onStateChange,
  onEnd,
  onAutoplayBlocked,
}: YoutubeIframeApiPlayerProps) {
  const reactId = useId().replace(/:/g, "");
  const hostId = `yt-host-${reactId}`;
  const playerInstanceRef = useRef<YouTubePlayer | null>(null);
  const destroyedRef = useRef(false);

  const onReadyRef = useRef(onReady);
  const onStateChangeRef = useRef(onStateChange);
  const onEndRef = useRef(onEnd);
  const onAutoplayBlockedRef = useRef(onAutoplayBlocked);
  const titleRef = useRef(title);
  const iframeClassNameRef = useRef(iframeClassName);
  const loadingRef = useRef(loading);

  onReadyRef.current = onReady;
  onStateChangeRef.current = onStateChange;
  onEndRef.current = onEnd;
  onAutoplayBlockedRef.current = onAutoplayBlocked;
  titleRef.current = title;
  iframeClassNameRef.current = iframeClassName;
  loadingRef.current = loading;

  const playerVarsKey = JSON.stringify(playerVars);

  useEffect(() => {
    destroyedRef.current = false;
    playerInstanceRef.current = null;

    const applyIframeDom = (player: YouTubePlayer) => {
      try {
        const iframe = (
          player as unknown as { getIframe?: () => HTMLIFrameElement }
        ).getIframe?.();
        if (!iframe) return;
        if (iframeClassNameRef.current) {
          iframe.setAttribute("class", iframeClassNameRef.current);
        }
        if (loadingRef.current) iframe.setAttribute("loading", loadingRef.current);
        if (titleRef.current) iframe.setAttribute("title", titleRef.current);
      } catch {
        /* noop */
      }
    };

    let cancelled = false;
    const parsedPlayerVars = JSON.parse(playerVarsKey) as Record<
      string,
      string | number
    >;

    void ensureYoutubeIframeApiLoaded()
      .then(() => {
        if (cancelled || destroyedRef.current) return;

        const w = window as unknown as {
          YT: {
            Player: new (
              elId: string,
              opts: Record<string, unknown>,
            ) => YouTubePlayer;
          };
        };

        const events = {
          onReady: (ev: { target: YouTubePlayer }) => {
            playerInstanceRef.current = ev.target;
            applyIframeDom(ev.target);
            patchYtIframeAllow(ev.target);
            onReadyRef.current(ev.target);
          },
          onStateChange: (ev: { target: YouTubePlayer; data: number }) => {
            onStateChangeRef.current?.({
              data: ev.data,
              target: ev.target,
            });
            if (
              onEndRef.current &&
              ev.data === YouTube.PlayerState.ENDED
            ) {
              onEndRef.current({ target: ev.target });
            }
          },
          onAutoplayBlocked: (ev: { target: YouTubePlayer }) => {
            playerInstanceRef.current = ev.target;
            onAutoplayBlockedRef.current?.({ target: ev.target });
          },
        };

        const created = new w.YT.Player(hostId, {
          videoId,
          width,
          height,
          playerVars: parsedPlayerVars,
          events: events as Record<string, unknown>,
        }) as unknown as YouTubePlayer & { destroy?: () => void };

        if (typeof created?.destroy === "function") {
          playerInstanceRef.current = created;
        }
      })
      .catch(() => {
        /* iframe_api failed — surface stays poster */
      });

    return () => {
      cancelled = true;
      destroyedRef.current = true;
      try {
        const p = playerInstanceRef.current;
        const api = p as unknown as { destroy?: () => void };
        api.destroy?.();
      } catch {
        /* noop */
      }
      playerInstanceRef.current = null;
    };
  }, [videoId, height, width, hostId, playerVarsKey]);

  return (
    <div className={className}>
      <div
        id={hostId}
        className="absolute inset-0 h-full w-full min-h-0 min-w-0"
      />
    </div>
  );
}
