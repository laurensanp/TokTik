export interface VideoCommentAuthor {
  id?: string;
  handle?: string;
  displayName?: string;
  imageUrl?: string;
}

export interface VideoComment {
  id?: string | null;
  content: string;
  author?: VideoCommentAuthor | null;
}

export interface FeedVideo {
  id: string;
  url: string;
  creationDate?: string;
  author?: VideoCommentAuthor;
  description?: string | null;
  likes?: number;
  comments?: VideoComment[];
}

