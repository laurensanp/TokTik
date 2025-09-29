import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateCommentRequest {
  videoId: string;
  authorId: string;
  content: string;
}

interface CreateCommentResponse {
  success: boolean;
  comment?: {
    id: string;
    content: string;
    authorId: string;
    videoId: string;
    createdAt: string;
  };
  message?: string;
}

const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateCommentResponse, Error, CreateCommentRequest>({
    mutationFn: async ({ videoId, authorId, content }) => {
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/comment/${videoId}`;
      const body = { authorId, content };
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { success: true };
      }
      const responseData = await response.json();
      return responseData;
    },
    onSuccess: async () => {
      console.log('Comment creation successful, invalidating queries');
      // Invalidate comments query to refresh comments
      await queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (error) => {
      console.error('Comment creation failed:', error);
    }
  });
};

export default useCreateComment;
