"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Video, Download, Share2, Copy, Edit3,
  Filter, Search, Calendar, Camera, Layers,
  CheckCircle, Clock, XCircle, MoreVertical,
  Play, Eye, RefreshCw, Sparkles,
} from "lucide-react";

interface VideoMetadata {
  job_id: string;
  client: string;
  status: "completed" | "processing" | "failed";
  created_at: string;
  video_url?: string;
  thumbnail_url?: string;
  prompt: string;
  enhanced_prompt?: string;
  duration: number;
  quality: string;
  camera_movement: string;
  reference_images: string[];
  file_size?: number;
  generation_time?: number;
}

interface FilterState {
  client: string;
  status: string;
  dateRange: string;
  cameraType: string;
}

const LibraryTab = () => {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    client: "all",
    status: "all",
    dateRange: "all",
    cameraType: "all",
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const getMockVideos = useCallback((): VideoMetadata[] => {
    return [
      {
        job_id: "abc123",
        client: "DFSA",
        status: "completed",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        video_url: "/api/placeholder/video1.mp4",
        thumbnail_url: "/api/placeholder/400/225",
        prompt: "Premium dried apricots falling onto wooden table",
        enhanced_prompt: "Camera slowly dollies forward revealing premium dried apricots...",
        duration: 5,
        quality: "1080p",
        camera_movement: "dolly-in",
        reference_images: ["mlk5301.jpg", "mlk5325.jpg"],
        file_size: 15728640,
        generation_time: 87,
      },
      {
        job_id: "def456",
        client: "DFSA",
        status: "completed",
        created_at: new Date(Date.now() - 172800000).toISOString(),
        video_url: "/api/placeholder/video2.mp4",
        thumbnail_url: "/api/placeholder/400/225",
        prompt: "Family enjoying healthy snacks at breakfast",
        duration: 8,
        quality: "4K",
        camera_movement: "orbit-left",
        reference_images: ["mlk5443.jpg"],
        file_size: 31457280,
        generation_time: 120,
      },
      {
        job_id: "ghi789",
        client: "Atlas",
        status: "processing",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        prompt: "Security guard monitoring modern office building",
        duration: 10,
        quality: "1080p",
        camera_movement: "crane-up",
        reference_images: [],
        generation_time: 45,
      },
    ];
  }, []);

  const loadVideoHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/video_history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });

      if (response.ok) {
        const data = await response.json();
        setVideos((data.videos as VideoMetadata[]) || []);
      } else {
        setVideos(getMockVideos());
      }
    } catch {
      setVideos(getMockVideos());
    } finally {
      setLoading(false);
    }
  }, [getMockVideos]);

  useEffect(() => {
    loadVideoHistory();
  }, [loadVideoHistory]);

  const filteredVideos = videos.filter((video) => {
    if (searchTerm && !video.prompt.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filters.client !== "all" && video.client !== filters.client) return false;
    if (filters.status !== "all" && video.status !== filters.status) return false;
    if (filters.cameraType !== "all" && video.camera_movement !== filters.cameraType) return false;
    return true;
  });

  const StatusBadge = ({ status }: { status: "completed" | "processing" | "failed" }) => {
    const styles = {
      completed: "bg-green-500/20 text-green-400 border-green-500/30",
      processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      failed: "bg-red-500/20 text-red-400 border-red-500/30",
    } as const;

    const icons = {
      completed: <CheckCircle className="w-3 h-3" />,
      processing: <Clock className="w-3 h-3 animate-spin" />,
      failed: <XCircle className="w-3 h-3" />,
    } as const;

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  const VideoCard = ({ video }: { video: VideoMetadata }) => {
    const [showMenu, setShowMenu] = useState(false);
    return (
      <div className="group overflow-hidden rounded-xl border border-slate-700 bg-slate-900 transition-all hover:border-purple-500/50">
        <div className="relative aspect-video bg-slate-800">
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.prompt} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Video className="h-12 w-12 text-slate-600" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <StatusBadge status={video.status} />
          </div>
          <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-xs text-white">
            {video.duration}s
          </div>
        </div>

        <div className="p-4">
          <h3 className="mb-2 line-clamp-2 font-medium text-white">{video.prompt}</h3>
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <span>{video.client}</span>
            <span>{new Date(video.created_at).toLocaleDateString()}</span>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <div className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs">
              <Camera className="h-3 w-3" />
              {video.camera_movement}
            </div>
            <div className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs">
              <Layers className="h-3 w-3" />
              {video.reference_images.length} refs
            </div>
            <div className="rounded bg-slate-800 px-2 py-1 text-xs">{video.quality}</div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
                <Copy className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
                <Share2 className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setShowMenu((s) => !s)}
              className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <MoreVertical className="h-4 w-4" />
              {showMenu && (
                <div className="absolute right-0 bottom-full z-10 mb-2 w-40 rounded-lg border border-slate-700 bg-slate-800 py-2 shadow-xl">
                  <button className="block w-full px-3 py-2 text-left text-sm text-white">Open</button>
                  <button className="block w-full px-3 py-2 text-left text-sm text-white">Download</button>
                  <button className="block w-full px-3 py-2 text-left text-sm text-red-300">Delete</button>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-4">
      {loading ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-center text-slate-400">
          <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">{filteredVideos.length} items</div>
            <button
              onClick={loadVideoHistory}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map((v) => (
              <VideoCard key={v.job_id} video={v} />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default LibraryTab;
