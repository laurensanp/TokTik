import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

interface VideoInteractionBarProps {
  duration?: number; // deprecated: kept for backward compatibility
  likes?: number;
  comments?: number;
  onCommentsClick?: () => void; // callback when comments button clicked
}

const VideoInteractionBar = ({
  duration: _duration = 0, // renamed to avoid unused var warning
  likes = 0,
  comments = 0,
  onCommentsClick,
}: VideoInteractionBarProps) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <>
      {/* Interaction buttons - vertical stack on right */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6">
        {/* Like button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="flex flex-col items-center gap-1 group"
        >
          <Heart
            className={`w-8 h-8 ${
              isLiked ? "text-red-500 fill-red-500" : "text-white"
            } group-hover:scale-110 transition-transform`}
          />
          <span className="text-white text-sm font-medium drop-shadow-lg">
            {likes}
          </span>
        </button>

        {/* Comments button */}
        <button
          className="flex flex-col items-center gap-1 group"
          onClick={onCommentsClick}
          type="button"
        >
          <MessageCircle className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          <span className="text-white text-sm font-medium drop-shadow-lg">
            {comments}
          </span>
        </button>
      </div>
    </>
  );
};

export default VideoInteractionBar;
