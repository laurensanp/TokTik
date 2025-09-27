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
      const body = {
        authorId,
        content,
      };

      console.log('Making comment request:', {
        url,
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('HTTP error response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        // Check if response has content
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');

        console.log('Response content-length:', contentLength);
        console.log('Response content-type:', contentType);

        // If response is empty or has no content, return a success response
        if (contentLength === '0' || !contentType?.includes('application/json')) {
          console.log('Empty or non-JSON response, assuming success');
          return { success: true };
        }

        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (!responseText.trim()) {
          console.log('Empty response body, assuming success');
          return { success: true };
        }

        try {
          const responseData = JSON.parse(responseText);
          console.log('Successful response:', responseData);
          return responseData;
        } catch (parseError) {
          console.warn('Failed to parse JSON response, but request was successful:', parseError);
          return { success: true };
        }
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Comment creation successful, invalidating queries');
      // Invalidate comments query to refresh comments
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (error) => {
      console.error('Comment creation failed:', error);
    }
  });
};

export default useCreateComment;
