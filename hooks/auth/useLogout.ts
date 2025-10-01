import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiInstance, useAuth } from "@/context/auth/AuthProvider";

const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["AUTH_LOGOUT"],
    mutationFn: async () => {
      return await ApiInstance.post("/auth/logout");
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["GET_AUTH_USER"] }),
  });
};

export default useLogout;
