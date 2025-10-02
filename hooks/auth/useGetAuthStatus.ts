import { ApiInstance } from "@/context/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";

const useGetAuthStatus = () => {
  return useQuery({
    queryKey: ["GET_AUTH_STATUS"],
    queryFn: async () => {
      try {
        const res = await ApiInstance.get("/auth/status");
        return res?.data;
      } catch (e) {
        console.error(e);
      }
    },
  });
};

export default useGetAuthStatus;
