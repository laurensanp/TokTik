import { useQuery } from "@tanstack/react-query";
import {ApiInstance} from "@/context/auth/AuthProvider";

const useGetVideos = () => {
  return useQuery({
    queryKey: ["GET_VIDEOS"],
    queryFn: () => ApiInstance.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/video`),
  });
};

export default useGetVideos;
