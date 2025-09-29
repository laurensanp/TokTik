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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex flex-col gap-6">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 dark:text-gray-100">Video enchilada</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-2">Whale eine Video enchilada aus oder drop sie.</p>
        <div
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}
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
            <span className="text-blue-600 dark:text-blue-300 font-medium">{file.name}</span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">File drop oder click</span>
          )}
        </div>
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Uploaded"}
          </button>
        </form>
        {loading && (
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 dark:bg-blue-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {message && (
          <div className={`w-full text-center py-2 rounded-xl font-medium ${success === true ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
