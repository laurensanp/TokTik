"use client";
import React, { useEffect, useRef, useState } from "react";
import useCreateComment from "@/hooks/video/useCreateComment";
import useGetCommentsByVideoId from "@/hooks/video/useGetCommentsByVideoId";
import useGetVideoById from "@/hooks/video/useGetVideoById";
import { useParams } from "next/navigation";
import VideoFeedItem from "@/components/Videos/VideoFeedItem";
import { FeedVideo } from "@/types/video";

const DEFAULT_AUDIO_LEVEL = 0.1;

const STORAGE_KEYS = {
  volume: "toktik:volume",
};

const VideoIdPage = () => {
  const { id } = useParams();
  const videoId = id as string | undefined;

  const { data: videoResp, isLoading, error } = useGetVideoById(videoId || "");

  const [audioLevel, setAudioLevel] = useState(DEFAULT_AUDIO_LEVEL);
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const createCommentMutation = useCreateComment();
  const { data: commentsData, refetch: refetchComments } =
    useGetCommentsByVideoId(videoId || "", Boolean(videoId));
  const modalComments = commentsData || [];

  // Refs for VideoFeedItem registration
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Playback helpers
  const attemptedPlayRef = useRef<Set<string>>(new Set());
  const pendingUnmuteRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedVol = window.localStorage.getItem(STORAGE_KEYS.volume);
      if (storedVol !== null) {
        const v = parseFloat(storedVol);
        if (!Number.isNaN(v) && v >= 0 && v <= 1) setAudioLevel(v);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.volume, audioLevel.toString());
    } catch {}
    // apply to existing video element if present
    if (videoId) {
      const v = videoRefs.current[videoId];
      if (v) {
        v.muted = audioLevel === 0;
        v.volume = audioLevel;
      }
    }
  }, [audioLevel, videoId]);

  // Attempt autoplay when video becomes available
  useEffect(() => {
    if (!videoId) return;
    const vidEl = videoRefs.current[videoId];
    if (!vidEl) return;
    if (!videoResp?.data?.url) return;
    if (attemptedPlayRef.current.has(videoId)) return;

    vidEl.muted = audioLevel === 0;
    vidEl.volume = audioLevel;
    vidEl
      .play()
      .then(() => {
        attemptedPlayRef.current.add(videoId);
      })
      .catch(() => {
        if (audioLevel > 0) {
          vidEl.muted = true;
          vidEl.volume = 0;
          vidEl
            .play()
            .then(() => {
              attemptedPlayRef.current.add(videoId);
              pendingUnmuteRef.current = true;
              const restore = () => {
                if (!pendingUnmuteRef.current) return;
                pendingUnmuteRef.current = false;
                vidEl.muted = audioLevel === 0;
                vidEl.volume = audioLevel;
              };
              window.addEventListener("pointerdown", restore, { once: true });
              window.addEventListener("keydown", restore, { once: true });
            })
            .catch(() => {});
        }
      });
  }, [videoResp, audioLevel, videoId]);

  const openComments = (vid: string) => setOpenCommentsFor(vid);
  const closeComments = () => setOpenCommentsFor(null);

  const handleCommentSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    vid: string
  ) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createCommentMutation.mutate(
      { videoId: vid, content: commentText.trim() },
      {
        onSuccess: () => {
          refetchComments().catch(() => {});
          setCommentText("");
        },
      }
    );
  };

  const handleVideoClick = (vid: string) => {
    const v = videoRefs.current[vid];
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      try {
        v.pause();
      } catch {}
    }
  };

  if (isLoading)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Loading...
      </div>
    );
  if (error || !videoResp)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Video not found.
      </div>
    );

  const videoData = videoResp.data as FeedVideo | undefined;
  if (!videoId || !videoData)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Video not found.
      </div>
    );

  return (
    <div className="h-screen w-full bg-black text-white">
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <VideoFeedItem
          key={videoId}
          id={videoId}
          index={0}
          total={1}
          videoData={videoData}
          isActive={true}
          audioLevel={audioLevel}
          setAudioLevel={setAudioLevel}
          registerContainer={(vid, el) => {
            containerRefs.current[vid] = el;
          }}
          registerVideo={(vid, el) => {
            videoRefs.current[vid] = el;

            // If the element just mounted for the current page video, attempt autoplay
            try {
              if (
                el &&
                vid === videoId &&
                videoResp?.data?.url &&
                !attemptedPlayRef.current.has(vid)
              ) {
                el.muted = audioLevel === 0;
                el.volume = audioLevel;
                el.play()
                  .then(() => {
                    attemptedPlayRef.current.add(vid);
                  })
                  .catch(() => {
                    if (audioLevel > 0) {
                      el.muted = true;
                      el.volume = 0;
                      el.play()
                        .then(() => {
                          attemptedPlayRef.current.add(vid);
                          pendingUnmuteRef.current = true;
                          const restore = () => {
                            if (!pendingUnmuteRef.current) return;
                            pendingUnmuteRef.current = false;
                            el.muted = audioLevel === 0;
                            el.volume = audioLevel;
                          };
                          window.addEventListener("pointerdown", restore, {
                            once: true,
                          });
                          window.addEventListener("keydown", restore, {
                            once: true,
                          });
                        })
                        .catch(() => {});
                    }
                  });
              }
            } catch {}
          }}
          onVideoClick={handleVideoClick}
          openCommentsFor={openCommentsFor}
          onOpenComments={openComments}
          onCloseComments={closeComments}
          commentText={commentText}
          setCommentText={setCommentText}
          createCommentMutation={createCommentMutation}
          handleCommentSubmit={handleCommentSubmit}
          modalComments={modalComments}
          videoCommentCounts={{ [videoId]: modalComments.length }}
        />
      </div>
    </div>
  );
};

export default VideoIdPage;
