import { useMutation, useQueryClient } from "@tanstack/react-query";
import {ApiInstance} from "@/context/auth/AuthProvider";

const useCreateNewUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["NEW_USER"],
    mutationFn: async (user: User) => {
      const res = await ApiInstance.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user`,
        user
      );
      return res.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["GET_ALL_USERS"] }),
  });
};

export default useCreateNewUser;
