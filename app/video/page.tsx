"use client";
import React, { useEffect, useRef, useState } from "react";
import useCreateComment from "@/hooks/video/useCreateComment";
import useGetCommentsByVideoId from "@/hooks/video/useGetCommentsByVideoId";
import useGetVideoIds from "@/hooks/video/useGetVideoIds";
import useLazyVideos from "@/hooks/video/useLazyVideos";
import VideoFeedItem from "@/components/Videos/VideoFeedItem";
import { FeedVideo } from "@/types/video";

const DEFAULT_AUDIO_LEVEL = 0.1;
const DEFAULT_AUTHOR_ID = "68dd538d5e07979a30262a31";

const STORAGE_KEYS = {
  lastVideoId: "toktik:lastVideoId",
  volume: "toktik:volume"
};

const VideoPage = () => {
  // Load all video ids
  const { data: idsResponse, isLoading: idsLoading } = useGetVideoIds();
  const videoIds: string[] = Array.isArray(idsResponse?.data) ? idsResponse!.data : [];

  // Track which ids should be fetched (lazy loading)
  const [fetchableIds, setFetchableIds] = useState<Set<string>>(new Set());

  // Refs for DOM elements
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // UI State
  const [activeIndex, setActiveIndex] = useState(0);
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(DEFAULT_AUDIO_LEVEL);
  const [commentText, setCommentText] = useState("");
  const [videoCommentCounts, setVideoCommentCounts] = useState<Record<string, number>>({});

  const createCommentMutation = useCreateComment();

  // Videos (lazy) Map id->FeedVideo
  const videoMap: Record<string, FeedVideo> = useLazyVideos(videoIds, fetchableIds);

  // Comments Daten für aktuell geöffnetes Video
  const currentVideoId = openCommentsFor;
  const { data: commentsData, refetch: refetchComments } = useGetCommentsByVideoId(
    currentVideoId || '',
    !!currentVideoId
  );
  const modalComments = commentsData || [];

  // Update comment count when modal data changes
  useEffect(() => {
    if (currentVideoId && commentsData) {
      setVideoCommentCounts(prev => ({ ...prev, [currentVideoId]: commentsData.length }));
    }
  }, [currentVideoId, commentsData]);

  // Restore volume from localStorage (once)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedVol = window.localStorage.getItem(STORAGE_KEYS.volume);
      if (storedVol !== null) {
        const v = parseFloat(storedVol);
        if (!Number.isNaN(v) && v >= 0 && v <= 1) setAudioLevel(v);
      }
    } catch {}
  }, []);

  // Persist volume changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(STORAGE_KEYS.volume, audioLevel.toString()); } catch {}
  }, [audioLevel]);

  // Intersection Observer: determine active video + prime neighbors for fetch
  const lastActiveIndexRef = useRef<number>(0);
  const restoredRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const audioLevelRef = useRef(audioLevel);

  // Keep audioLevelRef in sync
  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    if (videoIds.length === 0) return;

    // Cleanup previous observer if exists
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Small delay to ensure DOM elements are mounted
    const timeoutId = setTimeout(() => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const id = (entry.target as HTMLElement).dataset.videoid;
          if (!id) return;
          const vidEl = videoRefs.current[id];
          if (entry.isIntersecting) {
            const idx = videoIds.indexOf(id);
            if (idx !== -1) {
              setActiveIndex(idx);
              setFetchableIds(prev => {
                const next = new Set(prev);
                next.add(id);
                const prevId = videoIds[idx - 1];
                const nextId = videoIds[idx + 1];
                if (prevId) next.add(prevId);
                if (nextId) next.add(nextId);
                return next;
              });
            }
          } else {
            if (vidEl) {
              try { vidEl.pause(); } catch {}
              try { vidEl.currentTime = 0; } catch {}
            }
          }
        });
      }, { threshold: 0.5 });

      observerRef.current = observer;

      videoIds.forEach(id => {
        const el = containerRefs.current[id];
        if (el) observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [videoIds]);

  // Restore last active video on first load (if saved)
  useEffect(() => {
    if (restoredRef.current) return;
    if (videoIds.length === 0) return;
    if (typeof window === 'undefined') return;

    let restored = false;
    try {
      const storedId = window.sessionStorage.getItem(STORAGE_KEYS.lastVideoId) || window.localStorage.getItem(STORAGE_KEYS.lastVideoId);
      if (storedId) {
        const idx = videoIds.indexOf(storedId);
        if (idx !== -1) {
          setActiveIndex(idx);
          setFetchableIds(prev => {
            const next = new Set(prev);
            next.add(storedId);
            const prevId = videoIds[idx - 1];
            const nextId = videoIds[idx + 1];
            if (prevId) next.add(prevId);
            if (nextId) next.add(nextId);
            return next;
          });
          // Scroll zum gespeicherten Video nach Mount der Container
          setTimeout(() => {
            const el = containerRefs.current[storedId];
            if (el) {
              try { el.scrollIntoView({ block: 'start', behavior: 'auto' }); } catch {}
            }
          }, 0);
          restored = true;
        }
      }
    } catch {}

    // Falls kein Video wiederhergestellt wurde, lade die ersten 2 Videos
    if (!restored && videoIds.length > 0) {
      setFetchableIds(prev => {
        const next = new Set(prev);
        if (videoIds[0]) next.add(videoIds[0]);
        if (videoIds[1]) next.add(videoIds[1]);
        return next;
      });
    }

    restoredRef.current = true;
  }, [videoIds]);

  // Persist active video id
  useEffect(() => {
    const id = videoIds[activeIndex];
    if (!id) return;
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(STORAGE_KEYS.lastVideoId, id);
      window.localStorage.setItem(STORAGE_KEYS.lastVideoId, id);
    } catch {}
  }, [activeIndex, videoIds]);

  const pendingUnmuteRef = useRef(false);
  const attemptedPlayRef = useRef<Set<string>>(new Set());

  // Apply volume live without restart
  useEffect(() => {
    Object.values(videoRefs.current).forEach(v => {
      if (!v) return;
      v.muted = audioLevel === 0;
      v.volume = audioLevel;
    });
  }, [audioLevel]);

  // Handle active video change: autoplay, pause previous
  useEffect(() => {
    const prevIdx = lastActiveIndexRef.current;
    const prevId = videoIds[prevIdx];
    if (prevId && prevId !== videoIds[activeIndex]) {
      const prevVid = videoRefs.current[prevId];
      if (prevVid) {
        try { prevVid.pause(); } catch {}
        try { prevVid.currentTime = 0; } catch {}
      }
    }
    const activeId = videoIds[activeIndex];
    if (!activeId) return;

    // Reset attempt tracking BEFORE checking if video exists
    pendingUnmuteRef.current = false;
    attemptedPlayRef.current.delete(activeId);

    const vid = videoRefs.current[activeId];
    if (vid) {
      try { vid.pause(); } catch {}
      try { vid.currentTime = 0; } catch {}
      vid.muted = audioLevel === 0;
      vid.volume = audioLevel;
      const attemptPlayWithAudio = () => vid.play();
      setTimeout(() => {
        attemptPlayWithAudio().then(() => {
          attemptedPlayRef.current.add(activeId);
        }).catch(() => {
          if (audioLevel > 0) {
            vid.muted = true;
            vid.volume = 0;
            vid.play().then(() => {
              attemptedPlayRef.current.add(activeId);
              pendingUnmuteRef.current = true;
              const restore = () => {
                if (!pendingUnmuteRef.current) return;
                pendingUnmuteRef.current = false;
                vid.muted = audioLevel === 0;
                vid.volume = audioLevel;
              };
              window.addEventListener('pointerdown', restore, { once: true });
              window.addEventListener('keydown', restore, { once: true });
            }).catch(() => {});
          }
        });
      }, 30);
    }
    lastActiveIndexRef.current = activeIndex;
  }, [activeIndex, videoIds, audioLevel]);

  // Autoplay fallback when video element/data appears late
  useEffect(() => {
    const activeId = videoIds[activeIndex];
    if (!activeId) return;
    if (!videoMap[activeId]?.url) return;
    const vid = videoRefs.current[activeId];
    if (!vid) return;
    if (attemptedPlayRef.current.has(activeId)) return;

    vid.muted = audioLevel === 0;
    vid.volume = audioLevel;
    vid.play().then(() => {
      attemptedPlayRef.current.add(activeId);
    }).catch(() => {
      if (audioLevel > 0) {
        vid.muted = true;
        vid.volume = 0;
        vid.play().then(() => {
          attemptedPlayRef.current.add(activeId);
          pendingUnmuteRef.current = true;
          const restore = () => {
            if (!pendingUnmuteRef.current) return;
            pendingUnmuteRef.current = false;
            vid.muted = audioLevel === 0;
            vid.volume = audioLevel;
          };
          window.addEventListener('pointerdown', restore, { once: true });
          window.addEventListener('keydown', restore, { once: true });
        }).catch(() => {});
      }
    });
  }, [videoMap, activeIndex, videoIds, audioLevel]);

  const openComments = (id: string) => setOpenCommentsFor(id);
  const closeComments = () => setOpenCommentsFor(null);

  const handleCommentSubmit = (e: React.FormEvent<HTMLFormElement>, videoId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createCommentMutation.mutate({ videoId, authorId: DEFAULT_AUTHOR_ID, content: commentText.trim() }, {
      onSuccess: () => {
        refetchComments().catch(() => {});
        setCommentText("");
      }
    });
  };

  // Click toggles play / pause
  const handleVideoClick = (id: string) => {
    const v = videoRefs.current[id];
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      try { v.pause(); } catch {}
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();

        if (e.key === 'ArrowUp' && activeIndex > 0) {
          const newIndex = activeIndex - 1;
          const prevId = videoIds[newIndex];
          if (prevId) {
            // Ensure the video is fetchable
            setFetchableIds(prev => {
              const next = new Set(prev);
              next.add(prevId);
              const beforePrevId = videoIds[newIndex - 1];
              const afterPrevId = videoIds[newIndex + 1];
              if (beforePrevId) next.add(beforePrevId);
              if (afterPrevId) next.add(afterPrevId);
              return next;
            });

            // Scroll to the previous video
            const el = containerRefs.current[prevId];
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        } else if (e.key === 'ArrowDown' && activeIndex < videoIds.length - 1) {
          const newIndex = activeIndex + 1;
          const nextId = videoIds[newIndex];
          if (nextId) {
            // Ensure the video is fetchable
            setFetchableIds(prev => {
              const next = new Set(prev);
              next.add(nextId);
              const beforeNextId = videoIds[newIndex - 1];
              const afterNextId = videoIds[newIndex + 1];
              if (beforeNextId) next.add(beforeNextId);
              if (afterNextId) next.add(afterNextId);
              return next;
            });

            // Scroll to the next video
            const el = containerRefs.current[nextId];
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        const activeId = videoIds[activeIndex];
        if (activeId) handleVideoClick(activeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, videoIds]);

  // Loading / empty states
  if (idsLoading && videoIds.length === 0) {
    return <div className="flex h-screen w-full items-center justify-center text-sm text-white/60 bg-black">Loading videos...</div>;
  }
  if (videoIds.length === 0 && !idsLoading) {
    return <div className="flex h-screen w-full items-center justify-center text-sm text-white/60 bg-black">No videos found.</div>;
  }

  return (
    <div className="h-screen w-full bg-black text-white">
      <div className={`h-screen w-full ${openCommentsFor ? "overflow-hidden" : "overflow-y-scroll"} snap-y snap-mandatory bg-black text-white`}>
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
            registerContainer={(vid, el) => { containerRefs.current[vid] = el; }}
            registerVideo={(vid, el) => { videoRefs.current[vid] = el; }}
            onVideoClick={handleVideoClick}
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
