"use client";
import React, { useEffect, useRef, useState } from "react";
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

export interface FeedVideo {
  id: string;
  url: string;
  creationDate?: string;
  author?: {
      id?: string;
      handle?: string;
      displayName?: string;
      imageUrl?: string;
  }
  description?: string | null;
  likes?: number;
  comments?: VideoComment[];
}

const DEFAULT_AUDIO_LEVEL = 0.1;
const DEFAULT_AUTHOR_ID = "68d9a03c95253c74ada9a3bc";

const VideoPage = () => {
  const { data: videosResponse, isLoading } = useGetVideos();
  const createCommentMutation = useCreateComment();

  console.log({videosResponse})

  // Feed nur aus API:
  const feed: FeedVideo[] = Array.isArray(videosResponse?.data) ? videosResponse.data : [];
  feed.sort((a, b) =>
    new Date(b.creationDate ?? 0).getTime() - new Date(a.creationDate ?? 0).getTime()
  );


  // States
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(DEFAULT_AUDIO_LEVEL);
  const [commentText, setCommentText] = useState("");
  const [videoCommentCounts, setVideoCommentCounts] = useState<Record<string, number>>({});

  // Helper var
  const isCommentsOpen = openCommentsFor !== null;
  const currentVideo = feed.find(v => v.id === openCommentsFor);
  const currentVideoId = currentVideo?.id || null;

  // Comments grab, if Modal open
  const { data: commentsData, refetch: refetchComments } = useGetCommentsByVideoId(
    currentVideoId || '',
    !!currentVideoId
  );

  const modalComments = commentsData || [];

  // Video-Ref set
  const setVideoRef = (el: HTMLVideoElement | null, id: string) => {
    videoRefs.current[id] = el;
  };

  // Load Comments bei Modal-Open
  useEffect(() => {
    if (currentVideoId && openCommentsFor !== null) {
      refetchComments().catch(() => {});
    }
  }, [currentVideoId, openCommentsFor, refetchComments]);

  // Comments-Number refresh
  useEffect(() => {
    if (currentVideoId && commentsData) {
      setVideoCommentCounts(prev => ({ ...prev, [currentVideoId]: commentsData.length }));
    }
  }, [currentVideoId, commentsData]);

  // Autoplay/Pause für Videos
  useEffect(() => {
    if (feed.length === 0) return;
    // Autoplay das Video at Initial-Render
    const activeVideo = videoRefs.current[feed[activeIndex]?.id ?? ''];
    if (activeVideo) {
      activeVideo.muted = false;
      activeVideo.volume = audioLevel;
      if (activeVideo.paused) {
        activeVideo.play().catch(() => setTimeout(() => activeVideo.play().catch(() => {}), 500));
      }
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = (entry.target as HTMLElement).dataset.index;
        if (!id) return;
        const vid = videoRefs.current[id];
        if (!vid) return;
        if (entry.isIntersecting) {
          const idx = feed.findIndex(v => v.id === id);
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
    feed.forEach((item) => {
      const v = videoRefs.current[item.id];
      if (v) observer.observe(v);
    });
    return () => observer.disconnect();
  }, [feed, activeIndex, audioLevel]);

  // Volume für alle Videos refresh
  useEffect(() => {
    Object.values(videoRefs.current).forEach((v: HTMLVideoElement | null) => {
      if (!v) return;
      v.volume = audioLevel;
      v.muted = audioLevel === 0;
    });
  }, [audioLevel]);

  // Video Play/Pause per Click
  const handleVideoClick = (id: string) => {
    const video = videoRefs.current[id];
    if (!video) return;
    video.paused ? video.play().catch(() => {}) : video.pause();
  };

  // Comments-Modal open/close
  const openComments = (id: string) => setOpenCommentsFor(id);
  const closeComments = () => setOpenCommentsFor(null);

  // Send Comments
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

  // Lade-/reset
  if (isLoading && feed.length === 0) {
    return <div className="flex h-screen w-full items-center justify-center text-sm text-white/60 bg-black">Lade Videos...</div>;
  }
  if (feed.length === 0 && !isLoading) {
    return <div className="flex h-screen w-full items-center justify-center text-sm text-white/60 bg-black">No Videos found.</div>;
  }

  // Main-Render
  return (
    <div className="h-screen w-full bg-black text-white">
      <div className={`h-screen w-full ${isCommentsOpen ? "overflow-hidden" : "overflow-y-scroll"} snap-y snap-mandatory bg-black text-white`}>
        {feed.map((item) => {
          const commentPreview = item.comments?.[0] ? `${item.comments[0].author?.displayName || item.comments[0].author?.handle || ""}: ${item.comments[0].content}` : undefined;
          return (
            <div key={item.id} className="relative h-screen w-full flex items-center justify-center snap-start">
              <div className="relative h-full flex items-center justify-center" style={{ aspectRatio: "9 / 16", maxHeight: "100vh", maxWidth: "calc(100vh * 9 / 16)", width: "100%" }}>
                {/* Video */}
                <video
                  data-index={item.id}
                  ref={el => setVideoRef(el, item.id)}
                  src={item.url}
                  className="absolute inset-0 w-full h-full object-cover rounded-lg bg-black"
                  playsInline
                  loop
                  preload="auto"
                  muted={audioLevel === 0}
                  controls={false}
                  disablePictureInPicture
                  controlsList="nodownload noplaybackrate nofullscreen"
                  onClick={() => handleVideoClick(item.id)}
                />
                {/* Volume */}
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
                    {item.author && typeof item.author === "object" && (
                        <span className="font-semibold text-sm drop-shadow">
                            {item.author.displayName || item.author.handle || "User"}
                        </span>
                    )}
                  {item.description && <span className="text-xs opacity-90 drop-shadow line-clamp-3">{item.description}</span>}
                  {commentPreview && <span className="text-[11px] opacity-70 italic drop-shadow line-clamp-2">{commentPreview}</span>}
                </div>
                {/* Interactive Bar */}
                <div className="absolute right-3 top-[60%] -translate-y-1/2 z-10 flex flex-col gap-3 items-center">
                  <VideoInteractionBar
                    duration={0}
                    likes={item.likes || 0}
                    comments={videoCommentCounts[item.id] ?? (item.comments?.length || 0)}
                    onCommentsClick={() => openComments(item.id)}
                  />
                </div>
                {/* Comment-Modal */}
                {openCommentsFor === item.id && (
                  <div className="absolute inset-x-0 bottom-0 h-1/2 z-30 flex flex-col bg-white text-black rounded-t-lg shadow-[0_-4px_18px_rgba(0,0,0,0.4)] border-t border-black/10" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
                      <h2 className="text-sm font-semibold">Comments ({modalComments.length})</h2>
                      <button onClick={closeComments} className="text-xs w-7 h-7 flex items-center justify-center rounded hover:bg-black/10" aria-label="Close comments">×</button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs">
                      {modalComments.length > 0 ? (
                        modalComments.map((comment, commentIndex) => {
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
                        <div className="text-xs opacity-50">No Comments found.</div>
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
