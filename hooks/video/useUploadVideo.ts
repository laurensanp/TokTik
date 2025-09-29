import { useState } from "react";

export function useUploadVideo() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [success, setSuccess] = useState<boolean | null>(null);

  // @ts-ignore
    const uploadVideo = async (file: File | null) => {
    if (!file) {
      setMessage("Please chose an file.");
      setSuccess(false);
      return;
    }
    setLoading(true);
    setMessage("");
    setSuccess(null);
    setProgress(0);

    try {

        const formData = new FormData();
        formData.append("file", file);

// JSON als String
        formData.append("video", JSON.stringify({
            description: "Nigga Video",
            author: {
                id: "68d9938ad69c8d907a7eb9ac",
                handle: "real_laurens_official",
                displayName: "Laurens",
                imageUrl: "https://cdn.discordapp.com/attachments/979283646571749396/1089924777273200793/IMG_0841.png?ex=68d6a88c&is=68d5570c&hm=bc3ae9e0513e2f6f9ec293fa788981983a9e05fdb82519f778b1f90e0454a708&"
            },
            likes: 0
        }));

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/video`, {
            method: "POST",
            body: formData,
        });


      if (res.ok) {
        const text = await res.text();
        setMessage(text);
        setSuccess(true);
      } else {
        setMessage("Upload Error.");
        setSuccess(false);
      }
    } catch (err) {
      setMessage("Error with Upload.");
      setSuccess(false);
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  return { uploadVideo, loading, progress, message, success, setMessage, setSuccess, setProgress };
}
