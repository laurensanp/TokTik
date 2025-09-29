// Upload-Site für Video-Dateien
"use client";
import React, { useState, useRef } from "react";
import { useUploadVideo } from "@/hooks/video/useUploadVideo";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    uploadVideo,
    loading,
    progress,
    message,
    success,
    setMessage,
    setSuccess,
  } = useUploadVideo();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage("");
      setSuccess(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setMessage("");
      setSuccess(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    await uploadVideo(file);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-md p-8 bg-black rounded-2xl shadow-xl flex flex-col gap-6 border border-gray-800">
        <h1 className="text-3xl font-extrabold text-center text-white">Upload Video</h1>
        <p className="text-center text-gray-300 mb-2">Select a video file or drag and drop it here.</p>
        <div
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? 'border-blue-500 bg-blue-950' : 'border-gray-700 bg-black'}`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            ref={inputRef}
            className="hidden"
          />
          {file ? (
            <span className="text-blue-400 font-medium">{file.name}</span>
          ) : (
            <span className="text-gray-400">Drop or click to select a file</span>
          )}
        </div>
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </form>
        {loading && (
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {message && (
          <div className={`w-full text-center py-2 rounded-xl font-medium ${success === true ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
