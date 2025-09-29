import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const useGetVideoForUser = (id: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["GET_VIDEO_FOR_USER"],
    queryFn: async () => {
      const data = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/video/${id}`
      );
      await queryClient.invalidateQueries({ queryKey: ["GET_ALL_USERS"] });
      return data;
    },
  });
};

export default useGetVideoForUser;
