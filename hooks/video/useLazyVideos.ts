import { useQueries } from "@tanstack/react-query";
import axios from "axios";
import { FeedVideo } from "@/types/video";

/**
 * Verwendet useQueries um Videos nur für jene IDs zu laden, die in fetchableIds enthalten sind.
 * Gibt eine Map id->FeedVideo zurück (nur geladene Einträge vorhanden).
 */
export const useLazyVideos = (videoIds: string[], fetchableIds: Set<string>) => {
  const queries = useQueries({
    queries: videoIds.map(id => ({
      queryKey: ["GET_VIDEO_BY_ID", id],
      enabled: fetchableIds.has(id),
      staleTime: 60_000,
      queryFn: async () => {
        const res = await axios.get<FeedVideo>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/video/${id}`);
        return res.data;
      }
    }))
  });

  const map: Record<string, FeedVideo> = {};
  queries.forEach((q, idx) => {
    const id = videoIds[idx];
    if (q.data) map[id] = q.data;
  });
  return map;
};

export default useLazyVideos;

