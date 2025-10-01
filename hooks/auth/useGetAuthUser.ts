import {useQuery} from "@tanstack/react-query";
import {ApiInstance} from "@/context/auth/AuthProvider";

const useGetAuthUser = () => {
    return useQuery({
        queryKey: ["GET_AUTH_USER"],
        queryFn: async () => {
            try {
                return await ApiInstance.get("/auth/status")
            } catch (err) {
                console.error("auth check failed", err)
            }
        }
    })
}
export default useGetAuthUser;