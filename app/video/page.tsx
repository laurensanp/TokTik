"use client";

// import VideoStream from "@/components/Videos/VideoStream";
import VideoInteractionBar from "@/components/Videos/VideoInteractionBar";
import useGetVideoForUser from "@/hooks/user/useGetVideoForUser";

const VideoPage = () => {
  const { data } = useGetVideoForUser("68d5b9383254ec301ff916b2");
  console.log({ data });
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-[calc(100vh*9/16)] mx-auto relative">
        <div className="pt-[177.777%] relative">
          {/* 16:9 aspect ratio */}
          <img
            src={data?.data?.url}
            className="absolute inset-0 w-full h-full object-cover"
            alt="video content"
          />
          <VideoInteractionBar
            duration={558}
            likes={data?.data?.likes || 0}
            comments={data?.data?.comments || 0}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
