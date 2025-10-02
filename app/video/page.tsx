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

  // Intersection Observer für aktives Video + Lazy Load Trigger
  const lastActiveIndexRef = useRef<number>(0);
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
          // Nicht mehr sichtbar: pausieren & resetten
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

  // Alle aktuell gefetchten Videos (Map id->FeedVideo)
  const videoMap: Record<string, FeedVideo> = useLazyVideos(videoIds, fetchableIds);

  // Volume auf alle geladene Video Elemente anwenden
  useEffect(() => {
    Object.values(videoRefs.current).forEach((v: HTMLVideoElement | null) => {
      if (!v) return;
      v.volume = audioLevel;
      v.muted = audioLevel === 0;
    });
  }, [audioLevel]);

  // Aktives Video auto-play
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
    if (vid) {
      try { vid.pause(); } catch {}
      try { vid.currentTime = 0; } catch {}
      vid.muted = false;
      vid.volume = audioLevel; // aktueller Wert wird beim Rendern mitgenommen
      setTimeout(() => {
        if (!vid) return;
        vid.play().catch(() => setTimeout(() => vid.play().catch(() => {}), 300));
      }, 30);
    }
    lastActiveIndexRef.current = activeIndex;
  }, [activeIndex, videoIds]);

  // Video Play/Pause
  const handleVideoClick = (id: string) => {
    const video = videoRefs.current[id];
    if (!video) return;
    video.paused ? video.play().catch(() => {}) : video.pause();
  };

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
