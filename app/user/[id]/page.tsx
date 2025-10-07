"use client";

import { useAuth } from "@/context/auth/AuthProvider";
import useGetUserById from "@/hooks/user/useGetUserById";
import useGetVideoForUser from "@/hooks/user/useGetVideoForUser";
import { FeedVideo } from "@/types/video";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import React from "react";

const UserIdPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { data: userData, isLoading: userLoading } = useGetUserById(
    id as string
  );
  const { data: userVideosRes, isLoading: videosLoading } = useGetVideoForUser(
    id as string
  );

  const videos: FeedVideo[] = Array.isArray(userVideosRes?.data)
    ? userVideosRes!.data
    : [];

  const isOwner = authUser && authUser.id === userData?.id;
  const displayName = userData?.displayName || userData?.handle || "User";
  const handle = userData?.handle ? `@${userData.handle}` : "";
  const avatarUrl = userData?.imageUrl;
  const firstInitial = (displayName || "U").trim().charAt(0).toUpperCase();

  if (userLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="w-full max-w-6xl h-[80vh] bg-neutral-950 border border-white/10 rounded-2xl shadow-2xl flex overflow-hidden animate-pulse">
          <div className="w-80 shrink-0 p-8 hidden md:flex flex-col gap-6 border-r border-white/10">
            <div className="w-32 h-32 rounded-full bg-neutral-800" />
            <div className="space-y-3">
              <div className="h-6 w-40 bg-neutral-800 rounded" />
              <div className="h-4 w-24 bg-neutral-800 rounded" />
              <div className="h-4 w-56 bg-neutral-800 rounded" />
            </div>
            <div className="flex gap-4 text-xs">
              <div className="h-10 w-16 bg-neutral-800 rounded" />
              <div className="h-10 w-16 bg-neutral-800 rounded" />
              <div className="h-10 w-16 bg-neutral-800 rounded" />
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[9/16] bg-neutral-800 rounded-lg"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-lg bg-neutral-950 border border-white/10 rounded-xl shadow-2xl p-10 text-center space-y-6">
          <button
            onClick={() => router.back()}
            className="absolute top-3 right-3 text-white/60 hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Schließen"
          >
            ×
          </button>
          <div className="text-2xl font-semibold">User nicht gefunden</div>
          <div className="text-sm opacity-60 leading-relaxed">
            Der angeforderte Nutzer existiert nicht oder wurde entfernt.
          </div>
          <button
            onClick={() => router.back()}
            className="mt-2 text-xs px-4 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/15"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-6xl h-[80vh] bg-neutral-950 border border-white/10 rounded-2xl shadow-2xl flex overflow-hidden">
        <button
          onClick={() => router.back()}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center text-lg font-semibold backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Schließen"
        >
          ×
        </button>
        {/* Sidebar */}
        <div className="hidden md:flex w-80 shrink-0 flex-col gap-8 p-8 border-r border-white/10 overflow-y-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName + " avatar"}
                  className="w-full h-full object-cover rounded-full ring-2 ring-white/10 shadow-lg"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-4xl font-semibold ring-2 ring-white/5">
                  {firstInitial}
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight break-all leading-tight">
                {displayName}
              </h1>
              {handle && (
                <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 font-mono text-white/70">
                  {handle}
                </span>
              )}
              {/* Aktionen für Owner entfernt; keine Buttons nötig */}
              {!isOwner && <ProfileActions handle={handle} isOwner={false} />}
            </div>
            <div className="w-full">
              <StatsRow
                videos={videos.length}
                joined={userData?.creationDate}
              />
            </div>
          </div>
          {/* 'Profile Panel' String entfernt */}
        </div>
        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10 md:hidden">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-full ring-2 ring-white/10"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-xl font-semibold ring-2 ring-white/5">
                    {firstInitial}
                  </div>
                )}
                {/* 'You' Badge entfernt */}
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold leading-tight">
                  {displayName}
                </span>
                {handle && (
                  <span className="text-[11px] opacity-60 font-mono">
                    {handle}
                  </span>
                )}
              </div>
            </div>
            {!isOwner && <ProfileActions handle={handle} isOwner={false} />}
          </div>
          <div className="flex items-center gap-4 px-6 py-3 md:hidden text-[11px] border-b border-white/10">
            <StatsRow videos={videos.length} joined={userData?.creationDate} />
          </div>
          <div className="px-6 pt-4 pb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <span className="inline-block w-1 h-4 bg-white/30 rounded" />
              <span>Videos</span>
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-white/5 ml-1">
                {videos.length}
              </span>
            </h2>
            {videosLoading && (
              <span className="text-[10px] px-2 py-1 rounded bg-white/5 animate-pulse">
                lädt...
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
            {videos.length === 0 && !videosLoading ? (
              <div className="mt-10">
                <EmptyState />
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {[...videos].reverse().map((v) => (
                  <ProfileVideoTile key={v.id} video={v} />
                ))}
                {videosLoading &&
                  videos.length === 0 &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[9/16] rounded-lg bg-neutral-900 animate-pulse"
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- UI Unterkomponenten ---

const StatsRow: React.FC<{ videos: number; joined?: string }> = ({
  videos,
  joined,
}) => {
  return (
    <div className="flex gap-8 mt-1 text-xs sm:text-sm select-none">
      <Stat label="Videos" value={videos} />
      <Stat
        label="Joined"
        value={joined ? new Date(joined).toLocaleDateString() : "—"}
      />
    </div>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex items-start gap-2">
    <div className="flex flex-col">
      <span className="flex items-center gap-1 font-semibold text-base sm:text-lg leading-none">
        <span>{value}</span>
      </span>
      <span className="opacity-60 text-[10px] mt-1 tracking-wide uppercase">
        {label}
      </span>
    </div>
  </div>
);

const HandleRow: React.FC<{ handle: string }> = ({ handle }) => {
  const [copied, setCopied] = React.useState(false);
  if (!handle) return null;
  const copy = () => {
    navigator.clipboard
      .writeText(handle)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => {});
  };
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-mono px-2 py-1 rounded bg-white/5 text-white/80 border border-white/10 text-xs sm:text-[13px]">
        {handle}
      </span>
      <button
        onClick={copy}
        className="text-[11px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 active:scale-[0.96] transition border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-label="Handle kopieren"
      >
        {copied ? "Kopiert" : "Copy"}
      </button>
    </div>
  );
};

const ProfileActions: React.FC<{ handle: string; isOwner: boolean }> = ({
  isOwner,
}) => {
  if (isOwner) return null; // Owner: keine Buttons
  return (
    <div className="flex items-center gap-2">
      <button className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 border border-white/15 font-medium focus:outline-none focus:ring-2 focus:ring-white/30 transition">
        Follow
      </button>
      <button className="text-xs px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition">
        Message
      </button>
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div className="relative w-full flex flex-col items-center justify-center py-14 rounded-xl border border-dashed border-white/15 bg-neutral-950 text-center overflow-hidden">
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.08]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 30% 20%,rgba(255,255,255,0.3),transparent 60%)",
      }}
    />
    <div className="relative z-10 flex flex-col items-center gap-4 max-w-sm">
      <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center ring-1 ring-white/10">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/60">
          <path fill="currentColor" d="M4 5h11v14H4z" opacity="0.4" />
          <path fill="currentColor" d="M17 7l5-3v16l-5-3V7z" />
        </svg>
      </div>
      <div className="space-y-2">
        <div className="font-semibold tracking-tight">Noch keine Videos</div>
        <div className="text-xs opacity-60 leading-relaxed">
          Sobald hier Videos hochgeladen werden, erscheinen sie in diesem
          Bereich.
        </div>
      </div>
    </div>
  </div>
);

interface ProfileVideoTileProps {
  video: FeedVideo;
}
const ProfileVideoTile: React.FC<ProfileVideoTileProps> = ({ video }) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const handleEnter = () => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
  };
  const handleLeave = () => {
    const el = videoRef.current;
    if (!el) return;
    try {
      el.pause();
    } catch {}
  };
  const likes = video.likes || 0; // wird nicht mehr angezeigt, könnte entfernt werdenconsole.log(video)
  console.log(video);

  const router = useRouter();

  const handleClick = () => {
    router.push(`/video/${video.id}`);
  };

  return (
    <div
      className="relative group aspect-[9/16] rounded-lg overflow-hidden bg-neutral-900 ring-1 ring-white/5 hover:ring-white/20 transition cursor-pointer"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onTouchStart={handleEnter}
      onTouchEnd={handleLeave}
      onClick={handleClick} // Klick auf DIV statt Video
    >
      {video.url ? (
        <video
          ref={videoRef}
          src={video.url}
          preload="metadata"
          playsInline
          muted
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-white/40">
          No Video
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/0 to-black/70 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
      <div className="absolute inset-x-0 bottom-0 p-2 flex justify-start items-end gap-2 text-[11px]">
        <span className="line-clamp-2 leading-tight font-medium drop-shadow max-w-full text-white/95">
          {video.description || "Kein Titel"}
        </span>
        {/* Likes Overlay entfernt */}
      </div>
    </div>
  );
};

export default UserIdPage;
