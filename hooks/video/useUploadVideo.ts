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
        }));

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/video`, {
            method: "POST",
            body: formData,
            credentials: "include"
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
