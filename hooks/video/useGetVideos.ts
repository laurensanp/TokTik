import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const useGetVideos = () => {
  return useQuery({
    queryKey: ["GET_VIDEOS"],
    queryFn: () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/video`),
  });
};

export default useGetVideos;
