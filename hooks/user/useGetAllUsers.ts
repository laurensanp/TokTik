import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const QUERY_KEY = "GET_ALL_USERS";

const useGetAllUsers = () => {
    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user`),
    });
};

export default useGetAllUsers;
