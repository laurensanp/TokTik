"use client";
import React, { useEffect, useRef, useState } from "react";
import useCreateComment from "@/hooks/video/useCreateComment";
import useGetCommentsByVideoId from "@/hooks/video/useGetCommentsByVideoId";
import useGetVideoIds from "@/hooks/video/useGetVideoIds";
import useLazyVideos from "@/hooks/video/useLazyVideos";
import VideoFeedItem from "@/components/Videos/VideoFeedItem";
import { FeedVideo } from "@/types/video";

const DEFAULT_AUDIO_LEVEL = 0.1;

const STORAGE_KEYS = {
  lastVideoId: "toktik:lastVideoId",
  volume: "toktik:volume",
};

// Main feed page: vertical, full-screen videos (snap scroll). Simplified logic
// below keeps behavior but is easier to follow.
const VideoPage = () => {
  const { data: idsResponse, isLoading: idsLoading } = useGetVideoIds();
  const videoIds: string[] = Array.isArray(idsResponse?.data)
    ? idsResponse!.data
    : [];

  // Which ids we'll allow to be fetched by useLazyVideos
  const [fetchableIds, setFetchableIds] = useState<Set<string>>(new Set());

  // DOM refs
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const lastActiveIndexRef = useRef<number>(0);

  // UI state
  const [activeIndex, setActiveIndex] = useState(0);
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(DEFAULT_AUDIO_LEVEL);
  const [commentText, setCommentText] = useState("");
  const [videoCommentCounts, setVideoCommentCounts] = useState<
    Record<string, number>
  >({});

  const createCommentMutation = useCreateComment();

  // Lazy-loaded video data map
  const videoMap: Record<string, FeedVideo> = useLazyVideos(
    videoIds,
    fetchableIds
  );

  // Comments for modal
  const currentVideoId = openCommentsFor;
  const { data: commentsData, refetch: refetchComments } =
    useGetCommentsByVideoId(currentVideoId || "", Boolean(currentVideoId));
  const modalComments = commentsData || [];

  // Update stored per-video comment counts when the modal's comments load/change
  useEffect(() => {
    if (!currentVideoId) return;
    if (!commentsData) return;
    setVideoCommentCounts((prev) => ({
      ...prev,
      [currentVideoId]: commentsData.length,
    }));
  }, [currentVideoId, commentsData]);

  // Update comment counts when video data loads so the interaction bar shows
  // the number without needing to open the comments modal.
  useEffect(() => {
    // videoMap entries contain videoData?.comments array (possibly)
    const next: Record<string, number> = {};
    Object.entries(videoMap).forEach(([id, v]) => {
      if (!v) return;
      const len = v.comments?.length ?? 0;
      if (len > 0) next[id] = len;
    });
    if (Object.keys(next).length > 0) {
      setVideoCommentCounts((prev) => ({ ...prev, ...next }));
    }
  }, [videoMap]);

  // persist / restore audio level
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = window.localStorage.getItem(STORAGE_KEYS.volume);
      if (v !== null) setAudioLevel(Number.parseFloat(v));
    } catch {}
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.volume, String(audioLevel));
    } catch {}
    // apply immediately
    Object.values(videoRefs.current).forEach((v) => {
      if (!v) return;
      v.muted = audioLevel === 0;
      v.volume = audioLevel;
    });
  }, [audioLevel]);

  // helper: pause-only (do NOT reset currentTime). Resetting currentTime
  // causes videos to start from the beginning — avoid that for user
  // interactions like changing volume or opening comments.
  const pauseOnly = (el?: HTMLVideoElement | null) => {
    if (!el) return;
    try {
      el.pause();
    } catch {}
  };

  // try play; if blocked, mute and play then restore on interaction
  const playWithFallback = async (
    el?: HTMLVideoElement | null,
    level?: number
  ) => {
    if (!el) return;
    try {
      el.muted = (level ?? audioLevel) === 0;
      el.volume = level ?? audioLevel;
      await el.play();
      return;
    } catch {
      // try muted
      if ((level ?? audioLevel) > 0) {
        try {
          el.muted = true;
          el.volume = 0;
        } catch {}
        try {
          await el.play();
          const restore = () => {
            try {
              el.muted = (level ?? audioLevel) === 0;
              el.volume = level ?? audioLevel;
            } catch {}
          };
          window.addEventListener("pointerdown", restore, { once: true });
          window.addEventListener("keydown", restore, { once: true });
        } catch {}
      }
    }
  };

  // when activeIndex changes, ensure a window around it is fetchable
  useEffect(() => {
    if (videoIds.length === 0) return;
    setFetchableIds((prev) => {
      const next = new Set(prev);
      const idx = activeIndex;
      // expand prefetch window to fetch further-ahead videos and their
      // metadata (comments) so the count is available before the user
      // reaches the video.
      for (let i = idx - 3; i <= idx + 5; i++) {
        if (videoIds[i]) next.add(videoIds[i]);
      }
      return next;
    });
  }, [activeIndex, videoIds]);

  // register video element
  const registerVideo = (id: string, el: HTMLVideoElement | null) => {
    videoRefs.current[id] = el;
    // apply audio level immediately
    if (el) {
      try {
        el.muted = audioLevel === 0;
        el.volume = audioLevel;
      } catch {}
    }
    // if element is active and data ready => try to play
    const idx = videoIds.indexOf(id);
    if (idx === activeIndex && videoMap[id]?.url) {
      playWithFallback(el).catch(() => {});
    }
  };

  // when activeIndex changes, pause previous and play current
  useEffect(() => {
    // Determine previous active index from ref, not by estimating. This
    // avoids pausing the wrong item when the user scrolls quickly.
    const prevIdx = lastActiveIndexRef.current;
    if (
      typeof prevIdx === "number" &&
      prevIdx !== activeIndex &&
      !openCommentsFor
    ) {
      const prevId = videoIds[prevIdx];
      const prevEl = videoRefs.current[prevId];
      pauseOnly(prevEl);
    }

    const id = videoIds[activeIndex];
    const el = videoRefs.current[id];
    // If the comments modal is open, avoid toggling playback to prevent any
    // audible cut while the user interacts with comments. Playback should be
    // left as-is until the modal closes.
    if (!openCommentsFor) {
      if (el && videoMap[id]?.url) {
        // short delay to allow DOM updates
        setTimeout(() => playWithFallback(el).catch(() => {}), 30);
      }
    }

    // persist active id
    if (typeof window !== "undefined" && id) {
      try {
        window.sessionStorage.setItem(STORAGE_KEYS.lastVideoId, id);
        window.localStorage.setItem(STORAGE_KEYS.lastVideoId, id);
      } catch {}
    }

    // remember for next time
    lastActiveIndexRef.current = activeIndex;
  }, [activeIndex, videoIds, videoMap]);

  // IntersectionObserver to detect active element (keeps markup intact)
  useEffect(() => {
    if (videoIds.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.videoid;
          if (!id) return;
          if (entry.isIntersecting) {
            const idx = videoIds.indexOf(id);
            if (idx !== -1) setActiveIndex(idx);
          } else {
            // If comments modal is open, don't pause/reset videos — the
            // modal overlay can change intersection geometry and we don't
            // want to restart playback when the user opens/closes comments.
            if (openCommentsFor) return;
            const el = videoRefs.current[id];
            if (el) {
              try {
                el.pause();
              } catch {}
              try {
                el.currentTime = 0;
              } catch {}
            }
          }
        });
      },
      { threshold: 0.6 }
    );
    observerRef.current = obs;

    // Observe any containers already mounted
    Object.values(containerRefs.current).forEach((el) => {
      if (el) obs.observe(el);
    });

    return () => {
      obs.disconnect();
      observerRef.current = null;
    };
  }, [videoIds, openCommentsFor]);

  // Update activeIndex while scrolling (for natural scroll, not only arrow keys)
  useEffect(() => {
    const sc = scrollContainerRef.current;
    if (!sc) return;

    const onScroll = () => {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null;
        const rect = sc.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        // find container whose center is nearest to centerY
        let bestIdx = -1;
        let bestDist = Infinity;
        for (let i = 0; i < videoIds.length; i++) {
          const id = videoIds[i];
          const el = containerRefs.current[id];
          if (!el) continue;
          const er = el.getBoundingClientRect();
          const eCenter = er.top + er.height / 2;
          const dist = Math.abs(eCenter - centerY);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        }
        if (bestIdx !== -1 && bestIdx !== activeIndex) {
          setActiveIndex(bestIdx);
          // scrollIntoView is not needed here since user scrolled, but keep small delay logic if needed
        }
      });
    };

    sc.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      sc.removeEventListener("scroll", onScroll);
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, [videoIds, activeIndex]);

  // restore last active if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored =
        window.sessionStorage.getItem(STORAGE_KEYS.lastVideoId) ||
        window.localStorage.getItem(STORAGE_KEYS.lastVideoId);
      if (stored) {
        const idx = videoIds.indexOf(stored);
        if (idx !== -1) setActiveIndex(idx);
      }
    } catch {}
  }, [videoIds]);

  // Initial priming: when the list of ids first becomes available, mark the
  // first few ids as fetchable so comment counts and metadata arrive early.
  useEffect(() => {
    if (videoIds.length === 0) return;
    setFetchableIds((prev) => {
      const next = new Set(prev);
      // prime first 8 videos so comment counts/metadata are available early
      for (let i = 0; i < Math.min(8, videoIds.length); i++) {
        next.add(videoIds[i]);
      }
      return next;
    });
  }, [videoIds]);

  // keyboard nav (simple)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(videoIds.length - 1, i + 1));
        setTimeout(() => {
          const id = videoIds[Math.min(videoIds.length - 1, activeIndex + 1)];
          const el = containerRefs.current[id];
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 10);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        setTimeout(() => {
          const id = videoIds[Math.max(0, activeIndex - 1)];
          const el = containerRefs.current[id];
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 10);
      } else if (e.key === " " || e.key === "k") {
        e.preventDefault();
        const id = videoIds[activeIndex];
        const v = videoRefs.current[id];
        if (v) {
          if (v.paused) v.play().catch(() => {});
          else v.pause();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, videoIds]);

  const openComments = (id: string) => setOpenCommentsFor(id);
  const closeComments = () => setOpenCommentsFor(null);

  const handleCommentSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    videoId: string
  ) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createCommentMutation.mutate(
      { videoId, content: commentText.trim() },
      {
        onSuccess: () => {
          refetchComments().catch(() => {});
          setCommentText("");
        },
      }
    );
  };

  // Loading / empty states (markup preserved)
  if (idsLoading && videoIds.length === 0)
    return (
      <div className="flex h-screen w-full items-center justify-center text-sm text-white/60 bg-black">
        Loading videos...
      </div>
    );
  if (videoIds.length === 0 && !idsLoading)
    return (
      <div className="flex h-screen w-full items-center justify-center text-sm text-white/60 bg-black">
        No videos found.
      </div>
    );

  return (
    <div className="h-screen w-full bg-black text-white">
      <div
        ref={scrollContainerRef}
        className={`h-screen w-full ${
          openCommentsFor ? "overflow-hidden" : "overflow-y-scroll"
        } snap-y snap-mandatory bg-black text-white`}
      >
        {videoIds.map((id, index) => (
          <VideoFeedItem
            key={id}
            id={id}
            index={index}
            total={videoIds.length}
            videoData={videoMap[id]}
            isActive={videoIds[activeIndex] === id}
            audioLevel={audioLevel}
            setAudioLevel={setAudioLevel}
            registerContainer={(vid, el) => {
              // Unobserve previous element for this id (if any)
              const prev = containerRefs.current[vid];
              if (prev && observerRef.current) {
                try {
                  observerRef.current.unobserve(prev);
                } catch {}
              }
              if (el) {
                containerRefs.current[vid] = el;
                if (observerRef.current) {
                  try {
                    observerRef.current.observe(el);
                  } catch {}
                }
              } else {
                delete containerRefs.current[vid];
              }
            }}
            registerVideo={(vid, el) => {
              registerVideo(vid, el);
            }}
            onVideoClick={(vid) => {
              const v = videoRefs.current[vid];
              if (!v) return;
              if (v.paused) v.play().catch(() => {});
              else v.pause();
            }}
            openCommentsFor={openCommentsFor}
            onOpenComments={openComments}
            onCloseComments={closeComments}
            commentText={commentText}
            setCommentText={setCommentText}
            createCommentMutation={createCommentMutation}
            handleCommentSubmit={handleCommentSubmit}
            modalComments={modalComments}
            videoCommentCounts={videoCommentCounts}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoPage;
