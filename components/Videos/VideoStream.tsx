import useGetAllUsers from "@/hooks/user/useGetAllUsers";
import React from "react";

const VideoStream = () => {
  const { data } = useGetAllUsers();
  console.log({ data });
  return <div>{data?.data?.m}</div>;
};

export default VideoStream;
