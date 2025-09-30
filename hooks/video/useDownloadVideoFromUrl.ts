import { useState } from "react";

const APIFY_TOKEN = process.env.NEXT_PUBLIC_APIFY_TOKEN;
const APIFY_ACTOR = "bytepulselabs~tiktok-video-downloader";
const APIFY_DATASET_ENDPOINT = (actor: string, token: string) => `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`; // returns dataset items array

function isTikTok(url: string) { return /tiktok\.com\//i.test(url); }

function normalizeTikTok(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes("vm.tiktok.com")) return trimmed; // short redirect – let actor resolve
  const u = new URL(trimmed);
  u.search = ""; u.hash = "";
  if (!u.hostname.startsWith("www.")) u.hostname = "www." + u.hostname.replace(/^www\./, "");
  let cleaned = u.origin + u.pathname;
  if (cleaned.endsWith("/")) cleaned = cleaned.slice(0, -1);
  if (!/^https:\/\/www\.tiktok\.com\/@[A-Za-z0-9_.-]+\/video\/\d+$/.test(cleaned)) {
    throw new Error("Invalid TikTok video URL format");
  }
  return cleaned;
}

// Merge chunk URLs into a single Blob
async function assembleParts(parts: string[], onProgress?: (pct: number) => void, contentType?: string): Promise<Blob> {
  const buffers: Uint8Array[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const r = await fetch(p);
    if (!r.ok) throw new Error(`Failed to fetch chunk ${i}`);
    const arr = new Uint8Array(await r.arrayBuffer());
    buffers.push(arr);
    if (onProgress) onProgress(Math.round(((i + 1) / parts.length) * 100));
  }
  const total = buffers.reduce((a, b) => a + b.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const b of buffers) { merged.set(b, offset); offset += b.length; }
  return new Blob([merged], { type: contentType || 'video/mp4' });
}

export function useDownloadVideoFromUrl() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null); // only used if parts
  const [busy, setBusy] = useState(false);

  const downloadVideo = async (url: string): Promise<File | null> => {
    if (busy || loading) return null; // Guard gegen Doppel-Trigger (StrictMode / Doppelklick)
    setBusy(true);
    setLoading(true);
    setError(null);
    setProgress(null);
    try {
      if (!url.trim()) throw new Error("Empty URL");
      if (!isTikTok(url)) throw new Error("Only TikTok URLs supported");
      if (!APIFY_TOKEN) throw new Error("Missing NEXT_PUBLIC_APIFY_TOKEN");

      const normalized = normalizeTikTok(url);
      const body = {
        urls: [{ url: normalized, method: "GET" }],
        quality: "480",
        proxy: { useApifyProxy: false }
      };

      const resp = await fetch(APIFY_DATASET_ENDPOINT(APIFY_ACTOR, APIFY_TOKEN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(()=>"");
        throw new Error(`Apify dataset call failed ${resp.status}: ${txt || resp.statusText}`);
      }

      // Expect JSON array (dataset items). If not JSON, treat as binary fallback.
      const contentType = resp.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Possibly direct binary (unlikely for this endpoint but handle anyway)
        const blob = await resp.blob();
        if (!blob.size) throw new Error('Empty binary response');
        return new File([blob], `tiktok_${Date.now()}.mp4`, { type: blob.type || 'video/mp4' });
      }

      let items: any;
      try {
        items = await resp.json();
      } catch (e) {
        throw new Error('Failed to parse Apify JSON response');
      }
      if (!Array.isArray(items) || items.length === 0) throw new Error('Apify returned no items');

      const first = items[0];
      // Attempt multiple known shapes
      // 1) Direct videoUrl
      if (first.videoUrl) {
        const v = await fetch(first.videoUrl);
        if (!v.ok) throw new Error('Failed to fetch videoUrl');
        const vb = await v.blob();
        if (!vb.size) throw new Error('Empty video blob');
        return new File([vb], `tiktok_${Date.now()}.mp4`, { type: vb.type || 'video/mp4' });
      }
      // 2) partsUrl referencing key-value store
      if (first.partsUrl) {
        const metaResp = await fetch(first.partsUrl);
        if (!metaResp.ok) throw new Error('Failed to fetch partsUrl meta');
        const meta = await metaResp.json();
        if (!Array.isArray(meta.parts) || meta.parts.length === 0) throw new Error('No parts in meta');
        const blob = await assembleParts(meta.parts, (p)=>setProgress(p), meta.contentType);
        if (blob.size === 0) throw new Error('Received empty video (parts total 0 bytes)');
        return new File([blob], `tiktok_${Date.now()}.mp4`, { type: blob.type || 'video/mp4' });
      }
      // 3) Inline parts array in item
      if (Array.isArray(first.parts) && first.parts.length > 0) {
        const blob = await assembleParts(first.parts, (p)=>setProgress(p), first.contentType);
        if (blob.size === 0) throw new Error('Received empty video (inline parts total 0 bytes)');
        return new File([blob], `tiktok_${Date.now()}.mp4`, { type: blob.type || 'video/mp4' });
      }
      // 4) Base64 fallback
      if (first.base64) {
        const bin = atob(first.base64);
        const arr = new Uint8Array(bin.length);
        for (let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i);
        const blob = new Blob([arr], { type: 'video/mp4' });
        return new File([blob], `tiktok_${Date.now()}.mp4`, { type: blob.type });
      }

      throw new Error('Unsupported Apify item format (no videoUrl / partsUrl / parts / base64)');
    } catch (e:any) {
      setError(e.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
      setBusy(false);
    }
  };

  return { downloadVideo, loading, error, progress };
}
