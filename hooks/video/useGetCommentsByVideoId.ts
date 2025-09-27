import { useQuery } from '@tanstack/react-query';

interface CommentAuthor {
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

interface Comment {
  id: string | null;
  creationDate: string | null;
  videoId: string;
  author: CommentAuthor;
  content: string;
  likes: number;
}

const useGetCommentsByVideoId = (videoId: string, enabled: boolean = false) => {
  return useQuery<Comment[]>({
    queryKey: ['comments', videoId],
    queryFn: async () => {
      console.log('Fetching comments for video:', videoId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/comment/${videoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Comment fetch response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Comment fetch error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Fetched comments data:', data);

      const comments = Array.isArray(data) ? data : [];
      console.log('Processed comments:', comments);

      return comments;
    },
    enabled, // Only fetch when explicitly enabled
    staleTime: 0, // Always refetch when query is invalidated
    retry: 1,
  });
};

export default useGetCommentsByVideoId;
