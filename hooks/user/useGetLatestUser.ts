import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  discordId: string | null;
  creationDate: string;
  handle: string;
  displayName: string;
  imageUrl: string;
  watchedVideos: string[];
  likedVideos: string[] | null;
  ip: string;
}

interface UserResponse {
  success?: boolean;
  data?: User;
  user?: User;
}

const useGetLatestUser = () => {
  return useQuery<User | null>({
    queryKey: ['latestUser'],
    queryFn: async () => {
      const response = await fetch('/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
          credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UserResponse = await response.json();

      // Handle different response formats
      return data.data || data.user || null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

export default useGetLatestUser;
