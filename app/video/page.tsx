"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import VideoInteractionBar from "@/components/Videos/VideoInteractionBar";
import useGetVideos from "@/hooks/video/useGetVideos";
import useCreateComment from "@/hooks/video/useCreateComment";
import useGetCommentsByVideoId from "@/hooks/video/useGetCommentsByVideoId";

interface VideoComment {
  id: string;
  content: string;
  author?: {
    id?: string;
    handle?: string;
    displayName?: string;
    imageUrl?: string;
  } | null;
}

interface FeedVideo {
  id: string;
  url: string;
  creationDate?: string;
  author?: string | null;
  description?: string | null;
  likes?: number;
  comments?: VideoComment[];
}

// VideoPage zeigt einen Video-Feed (hartcodiert oder API) mit Kommentar- und Lautstärkefunktion.
const VideoPage = () => {
  const { data: videosResponse, isLoading } = useGetVideos();
  const createCommentMutation = useCreateComment();

  // Demo-Videos
  const hardcodedFeed: FeedVideo[] = [
    {
      id: "vid1",
      url: "https://cdn.discordapp.com/attachments/978003347783159880/1421537020307701860/d38fecf979969690d77e260fe5302149.mp4?ex=68da0dc4&is=68d8bc44&hm=fe7228d098545cf8f87343f841b5c4d757ea93bce07eedc17f6bc094d704d4d6&",
      creationDate: "2025-09-27T16:33:09.932+00:00",
      author: "Testuser",
      description: "Beispielvideo 1",
      likes: 5,
      comments: [
        {
          id: "c1",
          content: "Cooles Video!",
          author: {
            id: "u1",
            handle: "tester",
            displayName: "Tester",
            imageUrl: ""
          }
        }
      ]
    },
    {
      id: "vid2",
      url: "https://cdn.discordapp.com/attachments/978003347783159880/1421537020307701860/d38fecf979969690d77e260fe5302149.mp4?ex=68da0dc4&is=68d8bc44&hm=fe7228d098545cf8f87343f841b5c4d757ea93bce07eedc17f6bc094d704d4d6&",
      creationDate: "2025-09-27T16:33:09.932+00:00",
      author: "DemoUser",
      description: "Beispielvideo 2",
      likes: 2,
      comments: []
    }
  ];

  // true: Demo-Feed, false: API-Feed
  const useHardcodedFeed = false;
  const feed: FeedVideo[] = useHardcodedFeed ? hardcodedFeed : (
    Array.isArray(videosResponse?.data) ? videosResponse.data : []
  );

  // States
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [openCommentsFor, setOpenCommentsFor] = useState<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0.1);
  const [commentText, setCommentText] = useState("");
  const [videoCommentCounts, setVideoCommentCounts] = useState<Record<string, number>>({});

  // Hilfsvariablen
  const isCommentsOpen = openCommentsFor !== null;
  const currentVideoId = openCommentsFor !== null ? feed[openCommentsFor]?.id : null;

  // Kommentare holen, wenn Modal offen
  const { data: commentsData, refetch: refetchComments } = useGetCommentsByVideoId(
    currentVideoId || '',
    !!currentVideoId
  );

  // Video-Ref setzen
  const setVideoRef = (el: HTMLVideoElement | null, idx: number) => {
    if (el) videoRefs.current[idx] = el;
  };

  // Kommentare nachladen bei Modal-Öffnung
  useEffect(() => {
    if (currentVideoId && openCommentsFor !== null) {
      refetchComments().catch(() => {});
    }
  }, [currentVideoId, openCommentsFor, refetchComments]);

  // Kommentar-Anzahl aktualisieren
  useEffect(() => {
    if (currentVideoId && commentsData) {
      setVideoCommentCounts(prev => ({ ...prev, [currentVideoId]: commentsData.length }));
    }
  }, [currentVideoId, commentsData]);

  // Autoplay/Pause für Videos
  useEffect(() => {
    if (feed.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const idx = Number((entry.target as HTMLElement).dataset.index);
        if (Number.isNaN(idx)) return;
        const vid = videoRefs.current[idx];
        if (!vid) return;
        if (entry.isIntersecting) {
          if (activeIndex !== idx) setActiveIndex(idx);
          vid.muted = false;
          vid.volume = audioLevel;
          if (vid.paused) {
            vid.play().catch(() => setTimeout(() => vid.play().catch(() => {}), 500));
          }
        } else {
          vid.pause();
          vid.currentTime = 0;
        }
      });
    }, { threshold: 0.65 });
    videoRefs.current.forEach((v) => v && observer.observe(v));
    return () => observer.disconnect();
  }, [feed, activeIndex, audioLevel]);

  // Lautstärke für alle Videos aktualisieren
  useEffect(() => {
    videoRefs.current.forEach(v => {
      if (!v) return;
      v.volume = audioLevel;
      v.muted = audioLevel === 0;
    });
  }, [audioLevel]);

  // Video Play/Pause per Klick
  const handleVideoClick = (idx: number) => {
    const video = videoRefs.current[idx];
    if (!video) return;
    video.paused ? video.play().catch(() => {}) : video.pause();
  };

  // Kommentar-Modal öffnen/schließen
  const openComments = (idx: number) => setOpenCommentsFor(idx);
  const closeComments = () => setOpenCommentsFor(null);

  // Kommentar absenden
  const handleCommentSubmit = (e: React.FormEvent<HTMLFormElement>, videoId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const authorId = "68d826bc2018cc621ffe4415";
    createCommentMutation.mutate({ videoId, authorId, content: commentText.trim() }, {
      onSuccess: () => {
        refetchComments().catch(() => {});
        setCommentText("");
      }
    });
  };

  // Lade-/Leere-Zustände
  if (isLoading && feed.length === 0) {
    return <div className="flex h-screen w-full items-center justify-center text-sm text-white/60 bg-black">Lade Videos...</div>;
  }
  if (feed.length === 0 && !isLoading) {
    return <div className="flex h-screen w-full items-center justify-center text-sm text-white/60 bg-black">No Videos found.</div>;
  }

  // Haupt-Render
  return (
    <div className="h-screen w-full bg-black text-white">
      <div className={`h-screen w-full ${isCommentsOpen ? "overflow-hidden" : "overflow-y-scroll"} snap-y snap-mandatory bg-black text-white`}>
        {feed.map((item, idx) => {
          const commentPreview = item.comments?.[0] ? `${item.comments[0].author?.displayName || item.comments[0].author?.handle || ""}: ${item.comments[0].content}` : undefined;
          return (
            <div key={item.id} className="relative h-screen w-full flex items-center justify-center snap-start">
              <div className="relative h-full flex items-center justify-center" style={{ aspectRatio: "9 / 16", maxHeight: "100vh", maxWidth: "calc(100vh * 9 / 16)", width: "100%" }}>
                {/* Video */}
                <video
                  data-index={idx}
                  ref={el => setVideoRef(el, idx)}
                  src={item.url}
                  className="absolute inset-0 w-full h-full object-cover rounded-lg bg-black"
                  playsInline
                  loop
                  preload="auto"
                  muted={audioLevel === 0}
                  controls={false}
                  disablePictureInPicture
                  controlsList="nodownload noplaybackrate nofullscreen"
                  onClick={() => handleVideoClick(idx)}
                />
                {/* Lautstärke-Regler */}
                <div className="absolute top-3 left-3 z-20 bg-black/50 hover:bg-black/70 transition-colors text-white text-xs px-3 py-2 rounded flex items-center gap-2">
                  <span className="text-[10px] whitespace-nowrap">{audioLevel === 0 ? '🥶' : audioLevel < 0.5 ? '🥀' : '🌹'}</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={audioLevel}
                    onChange={e => setAudioLevel(Number(e.target.value))}
                    onClick={e => e.stopPropagation()}
                    className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                  />
                  <span className="text-[10px] min-w-[20px]">{Math.round(audioLevel * 100)}%</span>
                </div>
                {/* Video-Infos */}
                <div className="absolute left-3 bottom-4 right-28 flex flex-col gap-1 pointer-events-none z-10">
                  {item.author && <span className="font-semibold text-sm drop-shadow">{item.author}</span>}
                  {item.description && <span className="text-xs opacity-90 drop-shadow line-clamp-3">{item.description}</span>}
                  {commentPreview && <span className="text-[11px] opacity-70 italic drop-shadow line-clamp-2">{commentPreview}</span>}
                </div>
                {/* Interaktionsleiste */}
                <div className="absolute right-3 top-[60%] -translate-y-1/2 z-10 flex flex-col gap-3 items-center">
                  <VideoInteractionBar
                    duration={0}
                    likes={item.likes || 0}
                    comments={videoCommentCounts[item.id] ?? (item.comments?.length || 0)}
                    onCommentsClick={() => openComments(idx)}
                  />
                </div>
                {/* Kommentar-Modal */}
                {openCommentsFor === idx && (
                  <div className="absolute inset-x-0 bottom-0 h-1/2 z-30 flex flex-col bg-white text-black rounded-t-lg shadow-[0_-4px_18px_rgba(0,0,0,0.4)] border-t border-black/10" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
                      <h2 className="text-sm font-semibold">Comments ({commentsData?.length || 0})</h2>
                      <button onClick={closeComments} className="text-xs w-7 h-7 flex items-center justify-center rounded hover:bg-black/10" aria-label="Close comments">×</button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs">
                      {commentsData && commentsData.length > 0 ? (
                        commentsData.map((comment, commentIndex) => {
                          const name = comment.author?.displayName || comment.author?.handle || "User";
                          const initial = name.trim().charAt(0).toUpperCase();
                          const uniqueKey = comment.id || `comment-${commentIndex}-${comment.content.substring(0, 10)}`;
                          return (
                            <div key={uniqueKey} className="flex items-start gap-3 leading-snug break-words">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-black/10 flex items-center justify-center shrink-0">
                                {comment.author?.imageUrl ? (
                                  <img src={comment.author.imageUrl} alt={name} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <span className="text-[11px] font-semibold text-black/70">{initial}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[11px] truncate">{name}</div>
                                <div className="text-[11px] whitespace-pre-wrap break-words">{comment.content}</div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs opacity-50">{commentsData === undefined ? 'Loading Comments...' : 'No Comments found.'}</div>
                      )}
                    </div>
                    <form onSubmit={e => handleCommentSubmit(e, item.id)} className="px-4 py-3 border-t border-black/10 flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="Kommentar schreiben..."
                        disabled={createCommentMutation.isPending}
                        className="flex-1 px-3 py-2 text-sm rounded-lg border focus:ring-1 focus:ring-black focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="submit"
                        disabled={createCommentMutation.isPending || !commentText.trim()}
                        className="text-xs px-3 py-2 rounded-lg bg-black text-white hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px]"
                      >
                        {createCommentMutation.isPending ? "..." : "Send"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoPage;
