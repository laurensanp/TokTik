    import { MessageCircle } from "lucide-react";

interface VideoInteractionBarProps {
  comments?: number;
  onCommentsClick?: () => void;
}

const VideoInteractionBar = ({ comments = 0, onCommentsClick }: VideoInteractionBarProps) => {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6">
      <button
        className="flex flex-col items-center gap-1 group"
        onClick={onCommentsClick}
        type="button"
        aria-label="Kommentare anzeigen"
      >
        <MessageCircle className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
        <span className="text-white text-sm font-medium drop-shadow-lg">
          {comments}
        </span>
      </button>
    </div>
  );
};

export default VideoInteractionBar;
