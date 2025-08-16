"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Image as ImageIcon, Layers, Settings, Play,
  Camera, Move3D, ZoomIn, RotateCw, Maximize2,
  ChevronRight, Upload, Sparkles, Clock, DollarSign,
  Monitor, Smartphone, Square, FileVideo, Download,
  Grid3x3, ArrowRight, Check, X, Home, CheckCircle, XCircle, RefreshCw, AlertCircle,
} from "lucide-react";
import { useVideoGeneration } from "../hooks/useVideoGeneration";
import LibraryTab from "../components/LibraryTab";
import CampaignsTab from "../components/CampaignsTab";

// ---------- Types ----------
type IconType = React.ComponentType<{ className?: string }>;

interface CameraPreset {
  id: string;
  name: string;
  icon: IconType;
  description: string;
  prompt: string;
}

interface PlatformPreset {
  id: string;
  name: string;
  icon: IconType;
  dimensions: string;
  aspectRatio: string;
}

interface Asset {
  key: string;
  url: string;
  filename: string;
  category: string;
  description?: string;
}

interface TimelineProps {
  duration: number;
  onDurationChange: (seconds: number) => void;
}

// ---------- Presets ----------
const cameraPresets: CameraPreset[] = [
  { id: "dolly-in", name: "Dolly In", icon: ZoomIn, description: "Smooth forward movement", prompt: "camera slowly dollies forward" },
  { id: "dolly-out", name: "Dolly Out", icon: Maximize2, description: "Smooth backward movement", prompt: "camera pulls back slowly" },
  { id: "orbit-left", name: "Orbit Left", icon: RotateCw, description: "Circular left movement", prompt: "camera orbits left around subject" },
  { id: "orbit-right", name: "Orbit Right", icon: RotateCw, description: "Circular right movement", prompt: "camera orbits right around subject" },
  { id: "crane-up", name: "Crane Up", icon: Move3D, description: "Vertical upward movement", prompt: "crane shot moving upward" },
  { id: "crane-down", name: "Crane Down", icon: Move3D, description: "Vertical downward movement", prompt: "crane shot moving downward" },
  { id: "pan-left", name: "Pan Left", icon: Camera, description: "Horizontal left rotation", prompt: "camera pans left" },
  { id: "pan-right", name: "Pan Right", icon: Camera, description: "Horizontal right rotation", prompt: "camera pans right" },
];

const platformPresets: PlatformPreset[] = [
  { id: "instagram-feed", name: "Instagram Feed", icon: Square, dimensions: "1080x1080", aspectRatio: "1:1" },
  { id: "instagram-story", name: "Instagram Story", icon: Smartphone, dimensions: "1080x1920", aspectRatio: "9:16" },
  { id: "facebook-feed", name: "Facebook Feed", icon: Monitor, dimensions: "1200x630", aspectRatio: "1.91:1" },
  { id: "youtube-thumbnail", name: "YouTube Thumbnail", icon: FileVideo, dimensions: "1280x720", aspectRatio: "16:9" },
  { id: "google-display", name: "Google Display", icon: Grid3x3, dimensions: "300x250", aspectRatio: "1.2:1" },
  { id: "linkedin-post", name: "LinkedIn Post", icon: Square, dimensions: "1200x1200", aspectRatio: "1:1" },
];

// ---------- Timeline ----------
function Timeline({ duration, onDurationChange }: TimelineProps) {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) return;

    const loop = (t: number) => {
      if (!startedAtRef.current) startedAtRef.current = t;
      const elapsed = (t - startedAtRef.current) / 1000;
      const nextTime = Math.min(duration, elapsed);
      setCurrentTime(nextTime);
      if (nextTime < duration) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        setIsPlaying(false);
        startedAtRef.current = 0;
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startedAtRef.current = 0;
    };
  }, [isPlaying, duration]);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Clock className="h-4 w-4" />
          <span>{Math.round(currentTime)}s / {duration}s</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying((v) => !v)}
            className="rounded-md bg-purple-600 px-3 py-1 text-sm font-medium hover:bg-purple-500 transition-colors"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => onDurationChange(Math.max(3, duration - 1))}
            className="rounded-md bg-slate-800 px-3 py-1 text-sm hover:bg-slate-700 transition-colors"
          >
            −1s
          </button>
          <button
            onClick={() => onDurationChange(Math.min(12, duration + 1))}
            className="rounded-md bg-slate-800 px-3 py-1 text-sm hover:bg-slate-700 transition-colors"
          >
            +1s
          </button>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded bg-slate-800">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600"
          initial={{ width: 0 }}
          animate={{ width: `${(currentTime / Math.max(1, duration)) * 100}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </div>
  );
}

// ---------- Asset panel ----------
function AssetPanel({
  selectedAssets,
  onAddAssets,
  onRemoveAsset,
}: {
  selectedAssets: Asset[];
  onAddAssets: (assets: Asset[]) => void;
  onRemoveAsset: (index: number) => void;
}) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState<boolean>(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/visual_assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });
      const data = (await res.json()) as { assets?: Asset[] };
      setAssets(data.assets ?? []);
    } catch (e) {
      setError("Failed to load assets");
      // show mock on failure
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const displayAssets = useMemo(() => (showAll ? assets : assets.slice(0, 8)), [assets, showAll]);

  const handleAssetSelect = (asset: Asset) => {
    const exists = selectedAssets.find((a) => a.key === asset.key);
    if (exists) return;
    onAddAssets([...selectedAssets, asset]);
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-purple-400" />
          <h3 className="text-sm font-semibold">Visual Assets</h3>
        </div>
        <button
          onClick={loadAssets}
          className="rounded-md bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-400">Loading…</div>
      ) : error ? (
        <div className="text-center py-8 text-red-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
          <button
            onClick={loadAssets}
            className="mt-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs transition-colors"
          >
            Retry
          </button>
        </div>
      ) : displayAssets.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Upload className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No assets found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto mb-3">
            {displayAssets.map((asset, index) => {
              const isSelected = selectedAssets.find((a) => a.key === asset.key);
              const Title = asset.description ?? asset.filename;
              return (
                <motion.button
                  key={asset.key}
                  onClick={() => handleAssetSelect(asset)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    isSelected ? "border-purple-500 ring-2 ring-purple-500/50" : "border-transparent hover:border-slate-600"
                  }`}
                  title={Title}
                >
                  <img
                    src={asset.url}
                    alt={asset.filename}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1 py-0.5 text-xs text-white">
                    {asset.category.replace("-", " ")}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {assets.length > 8 && (
            <button
              onClick={() => {
                setShowAll((s) => !s);
                if (!showAll) loadAssets();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2 text-sm text-white transition-colors hover:bg-slate-700"
            >
              {showAll ? "Show Less" : `Show All (${assets.length} total)`}
              <ChevronRight className={`h-4 w-4 transition-transform ${showAll ? "rotate-90" : ""}`} />
            </button>
          )}
        </>
      )}

      {selectedAssets.length > 0 && (
        <div className="mt-4 border-t border-slate-700 pt-4">
          <p className="mb-2 text-xs text-slate-400">Selected for reference:</p>
          <div className="flex flex-wrap gap-1">
            {selectedAssets.map((asset, index) => (
              <div key={`${asset.key}-${index}`} className="group relative">
                <img
                  src={asset.url}
                  alt={asset.filename}
                  className="h-8 w-8 rounded border border-purple-500 object-cover"
                />
                <button
                  onClick={() => onRemoveAsset(index)}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove asset"
                  title="Remove asset"
                >
                  <X className="h-2 w-2 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Main Studio ----------
export default function StudioInterface() {
  const [selectedCamera, setSelectedCamera] = useState<string>("dolly-in");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram-feed"]);
  const [prompt, setPrompt] = useState<string>("");
  const [duration, setDuration] = useState<number>(5);
  const [quality, setQuality] = useState<string>("1080p");
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "library" | "campaigns">("create");

  const {
    isGenerating,
    progress,
    videoUrl,
    status,
    generateVideo,
    resetGeneration,
  } = useVideoGeneration();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt first!");
      return;
    }

    const selectedCameraPreset = cameraPresets.find((p) => p.id === selectedCamera);
    const cameraMovement = selectedCameraPreset?.prompt ?? "";

    await generateVideo({
      client: "DFSA",
      prompt,
      duration,
      quality,
      reference_images: selectedAssets.map((a) => a.key),
      camera_movement: cameraMovement,
    });
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId]
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="h-6 w-6 text-purple-400" />
            <h1 className="text-xl font-semibold">Studio</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {(["create", "library", "campaigns"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                activeTab === tab ? "bg-purple-600" : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "create" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Left column */}
            <div className="space-y-6 md:col-span-2">
              {/* Prompt */}
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  <h3 className="text-sm font-semibold">Prompt</h3>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="h-24 w-full rounded-lg bg-slate-800 p-3 text-sm outline-none ring-0 focus:bg-slate-800"
                  placeholder="Describe the shot and subject…"
                />
              </div>

              {/* Camera */}
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-purple-400" />
                  <h3 className="text-sm font-semibold">Camera Movement</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {cameraPresets.map((preset) => {
                    const Icon = preset.icon;
                    const active = selectedCamera === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedCamera(preset.id)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          active
                            ? "border-purple-500 bg-purple-500/20"
                            : "border-slate-700 bg-slate-800 hover:bg-slate-700"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{preset.name}</div>
                          <div className="text-xs text-slate-400">{preset.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timeline */}
              <Timeline duration={duration} onDurationChange={setDuration} />

              {/* Platforms */}
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-400" />
                  <h3 className="text-sm font-semibold">Platforms</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {platformPresets.map((p) => {
                    const Icon = p.icon;
                    const active = selectedPlatforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          active
                            ? "border-purple-500 bg-purple-500/20"
                            : "border-slate-700 bg-slate-800 hover:bg-slate-700"
                        }`}
                        title={`${p.dimensions} • ${p.aspectRatio}`}
                      >
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-slate-400">
                            {p.dimensions} • {p.aspectRatio}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <AssetPanel
                selectedAssets={selectedAssets}
                onAddAssets={setSelectedAssets}
                onRemoveAsset={(i) =>
                  setSelectedAssets((prev) => prev.filter((_, idx) => idx !== i))
                }
              />

              {/* Preview / Status */}
              <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900" style={{ height: 400 }}>
                <div className="relative h-full">
                  {videoUrl && status === "completed" ? (
                    <div className="relative h-full bg-black">
                      <video
                        src={videoUrl}
                        className="h-full w-full object-contain"
                        controls
                        autoPlay
                        poster="/api/placeholder/800/400"
                      />
                    </div>
                  ) : isGenerating ? (
                    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                      <div className="relative mb-6">
                        <div className="h-20 w-20 rounded-full border-4 border-purple-500/30"></div>
                        <div className="absolute left-0 top-0 h-20 w-20 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
                      </div>
                      <h3 className="mb-2 text-xl font-semibold">
                        {status === "processing" ? "Generating…" : "Initializing…"}
                      </h3>
                      <div className="mb-4 h-3 w-64 overflow-hidden rounded border border-slate-700 bg-slate-800">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="text-slate-400">{Math.round(progress)}% complete</div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-500">
                      <Video className="mr-2 h-5 w-5" />
                      No video yet. Enter a prompt and click Generate.
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 font-medium hover:bg-purple-500 disabled:opacity-60"
                >
                  <Play className="h-4 w-4" />
                  Generate
                </button>
                <button
                  onClick={resetGeneration}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 hover:bg-slate-700"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "library" && (
          <div id="library">
            <LibraryTab />
          </div>
        )}

        {activeTab === "campaigns" && <CampaignsTab />}
      </div>
    </main>
  );
}
