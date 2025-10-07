"use client";
import React from "react";
import VideoInteractionBar from "@/components/Videos/VideoInteractionBar";
import { FeedVideo, VideoComment } from "@/types/video";
import Link from "next/link";

interface Props {
  id: string;
  index: number;
  total: number;
  videoData?: FeedVideo; // geladene Daten (optional)
  isActive: boolean;
  audioLevel: number;
  setAudioLevel: (v: number) => void;
  registerContainer: (id: string, el: HTMLDivElement | null) => void;
  registerVideo: (id: string, el: HTMLVideoElement | null) => void;
  onVideoClick: (id: string) => void;
  openCommentsFor: string | null;
  onOpenComments: (id: string) => void;
  onCloseComments: () => void;
  commentText: string;
  setCommentText: (v: string) => void;
  createCommentMutation: any; // TODO: genauer typisieren
  handleCommentSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    id: string
  ) => void;
  modalComments: VideoComment[];
  videoCommentCounts: Record<string, number>;
}

const VideoFeedItem: React.FC<Props> = ({
  id,
  index,
  total,
  videoData,
  isActive,
  audioLevel,
  setAudioLevel,
  registerContainer,
  registerVideo,
  onVideoClick,
  openCommentsFor,
  onOpenComments,
  onCloseComments,
  commentText,
  setCommentText,
  createCommentMutation,
  handleCommentSubmit,
  modalComments,
  videoCommentCounts,
}) => {
  const commentPreview = videoData?.comments?.[0]
    ? `${
        videoData.comments[0].author?.displayName ||
        videoData.comments[0].author?.handle ||
        ""
      }: ${videoData.comments[0].content}`
    : undefined;
  const isLoaded = !!videoData?.url;
  // If we don't have a cached count or loaded video data, leave the value
  // undefined so the interaction bar can render a placeholder instead of 0.
  const displayedCommentCount: number | undefined =
    videoCommentCounts[id] ?? videoData?.comments?.length ?? undefined;
  const isCommentsOpen = openCommentsFor === id && isLoaded;

  return (
    <div
      key={id}
      data-videoid={id}
      ref={(el) => registerContainer(id, el)}
      className="relative h-screen w-full flex items-center justify-center snap-start"
    >
      <div
        className="relative h-full flex items-center justify-center"
        style={{
          aspectRatio: "9 / 16",
          maxHeight: "100vh",
          maxWidth: "calc(100vh * 9 / 16)",
          width: "100%",
        }}
      >
        {isLoaded ? (
          <video
            data-index={id}
            ref={(el) => registerVideo(id, el)}
            src={videoData!.url}
            className="absolute inset-0 w-full h-full object-cover rounded-lg bg-black"
            playsInline
            loop
            preload="metadata"
            muted={audioLevel === 0}
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noplaybackrate nofullscreen"
            onClick={() => onVideoClick(id)}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full rounded-lg bg-gradient-to-b from-neutral-800 to-neutral-900 flex flex-col items-center justify-center gap-3 text-white/60 text-xs animate-pulse select-none">
            <div className="w-16 h-16 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
            <span>Loading video...</span>
            <span className="text-[10px] opacity-40">
              #{index + 1} / {total}
            </span>
          </div>
        )}
        {/* Volume */}
        <div className="absolute top-3 left-3 z-20 bg-black/50 hover:bg-black/70 transition-colors text-white text-xs px-3 py-2 rounded flex items-center gap-2">
          <span className="text-[10px] whitespace-nowrap">
            {audioLevel === 0 ? "🥶" : audioLevel < 0.5 ? "🥀" : "🌹"}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={audioLevel}
            onChange={(e) => setAudioLevel(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
          />
          <span className="text-[10px] min-w-[20px]">
            {Math.round(audioLevel * 100)}%
          </span>
        </div>
        {/* Video Infos */}
        {isLoaded && (
          <div className="absolute left-3 bottom-4 right-28 flex flex-col gap-1 pointer-events-none z-10">
            {videoData?.author && typeof videoData.author === "object" && (
              <span className="font-semibold text-sm drop-shadow">
                {videoData.author.displayName ||
                  videoData.author.handle ||
                  "User"}
              </span>
            )}
            {videoData?.description && (
              <span className="text-xs opacity-90 drop-shadow line-clamp-3">
                {videoData.description}
              </span>
            )}
            {commentPreview && (
              <span className="text-[11px] opacity-70 italic drop-shadow line-clamp-2">
                {commentPreview}
              </span>
            )}
          </div>
        )}
        {/* Interaction Bar */}
        <div
          className="absolute right-3 top-[60%] -translate-y-1/2 z-10 flex flex-col gap-3 items-center"
          // prevent clicks in the interaction area from toggling the video playback
          onClick={(e) => e.stopPropagation()}
        >
          <VideoInteractionBar
            userId={videoData?.author?.id || (videoData?.author as any)?._id}
            profileImage={videoData?.author?.imageUrl}
            comments={displayedCommentCount}
            onCommentsClick={() => isLoaded && onOpenComments(id)}
          />
        </div>
        {/* Comments Modal */}
        {isCommentsOpen && (
          <div
            className="absolute inset-x-0 bottom-0 h-1/2 z-30 flex flex-col bg-white text-black rounded-t-lg shadow-[0_-4px_18px_rgba(0,0,0,0.4)] border-t border-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
              <h2 className="text-sm font-semibold">
                Comments ({modalComments.length})
              </h2>
              <button
                onClick={onCloseComments}
                className="text-xs w-7 h-7 flex items-center justify-center rounded hover:bg-black/10"
                aria-label="Close comments"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs">
              {modalComments.length > 0 ? (
                modalComments.map((comment, commentIndex) => {
                  const name =
                    comment.author?.displayName ||
                    comment.author?.handle ||
                    "User";
                  const initial = name.trim().charAt(0).toUpperCase();
                  const uniqueKey =
                    (comment as any).id ||
                    `comment-${commentIndex}-${comment.content.substring(
                      0,
                      10
                    )}`;
                  return (
                    <div
                      key={uniqueKey}
                      className="flex items-start gap-3 leading-snug break-words"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-black/10 flex items-center justify-center shrink-0">
                        {comment.author?.imageUrl ? (
                          <Link href={`/user/${comment?.author?.id}`}>
                            <img
                              src={comment.author.imageUrl}
                              alt={name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </Link>
                        ) : (
                          <span className="text-[11px] font-semibold text-black/70">
                            {initial}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[11px] truncate">
                          {name}
                        </div>
                        <div className="text-[11px] whitespace-pre-wrap break-words">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs opacity-50">No Comments found.</div>
              )}
            </div>
            <form
              onSubmit={(e) => handleCommentSubmit(e, id)}
              className="px-4 py-3 border-t border-black/10 flex gap-2"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                disabled={createCommentMutation.isPending}
                className="flex-1 px-3 py-2 text-sm rounded-lg border focus:ring-1 focus:ring-black focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={
                  createCommentMutation.isPending || !commentText.trim()
                }
                className="text-xs px-3 py-2 rounded-lg bg-black text-white hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px]"
              >
                {createCommentMutation.isPending ? "..." : "Send"}
              </button>
            </form>
          </div>
        )}

        {!isLoaded && isActive && (
          <div className="absolute bottom-4 left-3 text-[11px] text-white/70">
            Loading video...
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoFeedItem;
