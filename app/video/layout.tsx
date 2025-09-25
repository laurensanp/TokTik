import { FC, ReactNode } from "react";

interface VideoLayoutProps {
  children: ReactNode;
}

const VideoLayout: FC<VideoLayoutProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default VideoLayout;
