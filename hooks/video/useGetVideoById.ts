import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const useGetVideoById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["GET_VIDEO_BY_ID", id],
    enabled: !!id,
    queryFn: async () => {
      return axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/video/${id}`);
    },
    staleTime: 60_000,
  });
};

export default useGetVideoById;
