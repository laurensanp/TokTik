import { ApiInstance } from "@/context/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";

const useGetUserById = (id: string) => {
  return useQuery({
    queryKey: ["GET_USER_BY_ID", id],
    queryFn: async () => {
      if (id === undefined || id === null) return;
      try {
        const res = await ApiInstance.get(`/user/${id}`);
        return res?.data;
      } catch (e) {
        console.error(e);
      }
    },
  });
};

export default useGetUserById;
