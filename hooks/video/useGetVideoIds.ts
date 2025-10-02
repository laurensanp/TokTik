import { useQuery } from "@tanstack/react-query";
import {ApiInstance} from "@/context/auth/AuthProvider";

/**
 * Holt nur die Liste aller Video-IDs.
 * Endpoint: GET /video/ids -> string[]
 */
const useGetVideoIds = () => {
  return useQuery({
    queryKey: ["GET_VIDEO_IDS"],
    queryFn: async () => ApiInstance.get<string[]>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/video/ids`),

  });
};

export default useGetVideoIds;

