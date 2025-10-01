import { useQuery } from "@tanstack/react-query";
import axios from "axios";

/**
 * Holt nur die Liste aller Video-IDs.
 * Endpoint: GET /video/ids -> string[]
 */
const useGetVideoIds = () => {
  return useQuery({
    queryKey: ["GET_VIDEO_IDS"],
    queryFn: async () => axios.get<string[]>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/video/ids`),
    staleTime: 60_000,
  });
};

export default useGetVideoIds;

