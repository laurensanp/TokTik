import { useQuery } from "@tanstack/react-query";
import { ApiInstance } from "@/context/auth/AuthProvider";

const useGetAuthUser = (isAuthenticated?: boolean) => {
    return useQuery({
        queryKey: ["GET_AUTH_USER"],
        queryFn: async () => {
            const res = await ApiInstance.get("/user/me")
            return res?.data
        },
        enabled: isAuthenticated === true,
        retry: false
    })
}
export default useGetAuthUser;
