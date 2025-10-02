import { useQuery } from "@tanstack/react-query";
import {ApiInstance} from "@/context/auth/AuthProvider";

const useGetVideoById = (id: string | undefined, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["GET_VIDEO_BY_ID", id],
    enabled: !!id && enabled,
    queryFn: async () => {
      return ApiInstance.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/video/${id}`);
    },
    staleTime: 60_000,
  });
};

export default useGetVideoById;
