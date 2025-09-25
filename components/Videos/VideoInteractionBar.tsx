import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

interface VideoInteractionBarProps {
  duration?: number; // duration in seconds
  likes?: number;
  comments?: number;
}

const VideoInteractionBar = ({
  duration = 0,
  likes = 0,
  comments = 0,
}: VideoInteractionBarProps) => {
  const [isLiked, setIsLiked] = useState(false);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Time duration - top right */}
      <div className="absolute top-4 right-4 text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
        {formatDuration(duration)}
      </div>

      {/* Interaction buttons - vertical stack on right */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-6">
        {/* Like button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="flex flex-col items-center gap-1 group"
        >
          <Heart
            className={`w-8 h-8 ${
              isLiked ? "text-red-500 fill-red-500" : "text-white"
            } 
            group-hover:scale-110 transition-transform`}
          />
          <span className="text-white text-sm font-medium drop-shadow-lg">
            {likes}
          </span>
        </button>

        {/* Comments button */}
        <button className="flex flex-col items-center gap-1 group">
          <MessageCircle className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          <span className="text-white text-sm font-medium drop-shadow-lg">
            {comments}
          </span>
        </button>

        {/* Share button */}
        <button className="flex flex-col items-center gap-1 group">
          <Share2 className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          <span className="text-white text-sm font-medium drop-shadow-lg">
            Share
          </span>
        </button>
      </div>
    </>
  );
};

export default VideoInteractionBar;
