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
  // IDs laden
  const { data: idsResponse, isLoading: idsLoading } = useGetVideoIds();
  const videoIds: string[] = Array.isArray(idsResponse?.data) ? idsResponse!.data : [];

  // Welche IDs sollen gefetched werden
  const [fetchableIds, setFetchableIds] = useState<Set<string>>(new Set());

  // Refs
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

  // Kommentaranzahl aktualisieren sobald Modal-Daten da
  useEffect(() => {
    if (currentVideoId && commentsData) {
      setVideoCommentCounts(prev => ({ ...prev, [currentVideoId]: commentsData.length }));
    }
  }, [currentVideoId, commentsData]);

  // Lautstärke aus localStorage wiederherstellen (einmalig)
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

  // Volume Änderungen persistieren
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(STORAGE_KEYS.volume, audioLevel.toString()); } catch {}
  }, [audioLevel]);

  // Intersection Observer für aktives Video + Lazy Load Trigger
  const lastActiveIndexRef = useRef<number>(0);
  const restoredRef = useRef(false);
  useEffect(() => {
    if (videoIds.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = (entry.target as HTMLElement).dataset.videoid;
        if (!id) return;
        const vidEl = videoRefs.current[id];
        if (entry.isIntersecting) {
          const idx = videoIds.indexOf(id);
          if (idx !== -1 && activeIndex !== idx) setActiveIndex(idx);
          setFetchableIds(prev => {
            const next = new Set(prev);
            next.add(id);
            const prevId = videoIds[idx - 1];
            const nextId = videoIds[idx + 1];
            if (prevId) next.add(prevId);
            if (nextId) next.add(nextId);
            return next;
          });
        } else {
          if (vidEl) {
            try { vidEl.pause(); } catch {}
            try { vidEl.currentTime = 0; } catch {}
          }
        }
      });
    }, { threshold: 0.65 });

    videoIds.forEach(id => {
      const el = containerRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [videoIds, activeIndex]);

  // Aktives Video & Nachbarn beim Scrollen laden (bereits enthalten), plus Restore beim ersten Laden
  useEffect(() => {
    if (restoredRef.current) return;
    if (videoIds.length === 0) return;
    if (typeof window === 'undefined') return;
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
        }
      }
    } catch {}
    restoredRef.current = true;
  }, [videoIds]);

  // Aktives Video in Storage merken
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

  // Laufende Volume-Anpassung ohne Neustart
  useEffect(() => {
    Object.values(videoRefs.current).forEach(v => {
      if (!v) return;
      v.muted = audioLevel === 0;
      v.volume = audioLevel;
    });
  }, [audioLevel]);

  // Video Play/Pause
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
    const vid = videoRefs.current[activeId];
    pendingUnmuteRef.current = false;
    attemptedPlayRef.current.delete(activeId);
    if (vid) {
      try { vid.pause(); } catch {}
      try { vid.currentTime = 0; } catch {}
      vid.muted = audioLevel === 0; // gewünschte Lautstärke
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
  }, [activeIndex, videoIds]);

  // Falls aktives Video erst später geladen (Element+URL) -> Autoplay nachladen
  useEffect(() => {
    const activeId = videoIds[activeIndex];
    if (!activeId) return;
    if (!videoMap[activeId]?.url) return; // Daten noch nicht da
    const vid = videoRefs.current[activeId];
    if (!vid) return; // Element noch nicht im DOM
    if (attemptedPlayRef.current.has(activeId)) return; // schon versucht
    vid.muted = audioLevel === 0;
    vid.volume = audioLevel;
    vid.play().then(() => {
      attemptedPlayRef.current.add(activeId);
    }).catch(() => {
      if (audioLevel > 0) {
        vid.muted = true; vid.volume = 0;
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

  // Klick toggelt Play/Pause
  const handleVideoClick = (id: string) => {
    const v = videoRefs.current[id];
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      try { v.pause(); } catch {}
    }
  };

  // Ladeanzeige / leer
  if (idsLoading && videoIds.length === 0) {
    return <div className="flex h-screen w-full items-center justify-center text-sm text-white/60 bg-black">Lade Videos...</div>;
  }
  if (videoIds.length === 0 && !idsLoading) {
    return <div className="flex h-screen w-full items-center justify-center text-sm text-white/60 bg-black">Keine Videos gefunden.</div>;
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
