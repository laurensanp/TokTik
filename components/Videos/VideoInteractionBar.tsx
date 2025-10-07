"use client";

import Link from "next/link";
import { MessageCircle, User } from "lucide-react";

interface VideoInteractionBarProps {
  comments?: number | undefined;
  onCommentsClick?: () => void;
  // user id used for profile link (optional)
  userId?: string;
  // profile image url (optional) - if omitted, show fallback icon
  profileImage?: string | null;
}

const VideoInteractionBar = ({
  comments,
  onCommentsClick,
  userId,
  profileImage,
}: VideoInteractionBarProps) => {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6">
      {/* Add button at the very top of the interaction column (centered horizontally) */}      
      <Link
        href="/video/upload"
        aria-label="Add"
        type="button"
        className="w-10 h-10 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-lg hover:scale-105 transition-transform self-center"
      >
        <span className="text-white text-lg font-bold leading-none">+</span>
      </Link>
      {/* Profile avatar linking to /user/{id} */}
      {userId ? (
        <Link
          href={`/user/${userId}`}
          aria-label={`Open profile ${userId}`}
          className="flex items-center justify-center"
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className="w-12 h-12 rounded-full ring-2 ring-white object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
        </Link>
      ) : (
        // If no userId available, show a non-interactive placeholder
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
      )}
      <button
        className="flex flex-col items-center gap-1 group"
        onClick={onCommentsClick}
        type="button"
        aria-label="Show comments"
      >
        <MessageCircle className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
        <span className="text-white text-sm font-medium drop-shadow-lg">
          {typeof comments === "number" ? comments : "—"}
        </span>
      </button>
    </div>
  );
};

export default VideoInteractionBar;
