"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Image, Layers, Settings, Play, Pause, SkipForward,
  Camera, Move3D, ZoomIn, RotateCw, Maximize2,
  ChevronRight, Upload, Sparkles, Clock, DollarSign,
  Monitor, Smartphone, Square, FileVideo, Download,
  Sliders, Wand2, Grid3x3, ArrowRight, Check, X, Home,
  CheckCircle, XCircle, RefreshCw, AlertCircle, Loader2,
  ChevronDown, Zap, Globe, Orbit, Circle, RotateCcw, Split,
  Sun, Moon, Sunrise, Cloud, Palette, Focus, Grid, Compass, Info,
  Film, Cpu, Box, Target, Activity
} from 'lucide-react';
import LibraryTab from '../components/LibraryTab';
import CampaignsTab from '../components/CampaignsTab';

// Model configurations - matching backend
const VIDEO_MODELS = [
  { id: 'veo3', name: 'Veo 3', provider: 'Google', badge: 'Cinematic', icon: '🎬', supportsImageToVideo: true },
  { id: 'runway', name: 'Runway Gen-4', provider: 'Runway', badge: 'Fast', icon: '🚀', supportsImageToVideo: true },
  { id: 'hailuo', name: 'Hailuo-02', provider: 'Minimax', badge: 'Soon', icon: '📜', disabled: true }
];

const IMAGE_MODELS = [
  { id: 'dalle3', name: 'DALL-E 3', provider: 'OpenAI', badge: 'Creative', icon: '🎨' },
  { id: 'imagen4', name: 'Imagen 4', provider: 'Google', badge: 'Realistic', icon: '📷' }
];

// Camera control presets
const cameraPresets = [
  { id: 'dolly-in', name: 'Dolly In', icon: ZoomIn, description: 'Smooth forward movement' },
  { id: 'dolly-out', name: 'Dolly Out', icon: Maximize2, description: 'Smooth backward movement' },
  { id: 'orbit-left', name: 'Orbit Left', icon: RotateCw, description: 'Circular left movement' },
  { id: 'orbit-right', name: 'Orbit Right', icon: RotateCw, description: 'Circular right movement' },
  { id: 'crane-up', name: 'Crane Up', icon: Move3D, description: 'Vertical upward movement' },
  { id: 'crane-down', name: 'Crane Down', icon: Move3D, description: 'Vertical downward movement' },
  { id: 'pan-left', name: 'Pan Left', icon: Camera, description: 'Horizontal left rotation' },
  { id: 'pan-right', name: 'Pan Right', icon: Camera, description: 'Horizontal right rotation' },
];

// VFX Templates matching backend
// VFX Templates (local previews from /public/vfx)
// --- Replace your existing vfxTemplates array with this ---
type VfxTemplate = {
  id: string;
  name: string;
  description: string;
  prompt: string;
};

const vfxTemplates: VfxTemplate[] = [
  {
    id: "earth-zoom-out",
    name: "Earth Zoom Out",
    description: "Pull back to space",
    prompt: "dramatic pull-back zoom revealing Earth from space",
  },
  {
    id: "disintegrate",
    name: "Disintegrate",
    description: "Dissolve to particles",
    prompt: "subject dissolving into thousands of glowing particles",
  },
  {
    id: "face-punch",
    name: "Face Punch",
    description: "Bullet-time impact",
    prompt: "slow-motion punch with bullet-time ripples and debris",
  },
  {
    id: "eyes-in",
    name: "Eyes In",
    description: "Zoom into the eyes",
    prompt: "rapid push-in through the pupils into a new scene",
  },
  {
    id: "paint-splash",
    name: "Paint Splash",
    description: "Liquid colour burst",
    prompt: "dynamic paint splash morphing between frames",
  },
  {
    id: "lens-crack",
    name: "Lens Crack",
    description: "Glass shatter effect",
    prompt: "glass lens cracking, shards refracting light before settling",
  },
];



// Style presets for both video and images
const stylePresets = [
  { id: 'product', name: 'Product Photography', icon: Camera, description: 'Clean, professional product shots' },
  { id: 'lifestyle', name: 'Lifestyle Shot', icon: Sun, description: 'Natural, everyday scenes' },
  { id: 'marketing', name: 'Marketing Banner', icon: Monitor, description: 'Eye-catching promotional' },
  { id: 'social', name: 'Social Media Post', icon: Grid3x3, description: 'Optimized for social' }
];

// Lighting presets
const lightingPresets = [
  { id: 'studio', name: 'Studio', icon: Sun },
  { id: 'natural', name: 'Natural', icon: Cloud },
  { id: 'golden', name: 'Golden Hour', icon: Sunrise },
  { id: 'dramatic', name: 'Dramatic', icon: Moon }
];

// Depth of field presets
const depthOfFieldPresets = [
  { id: 'shallow', name: 'Shallow' },
  { id: 'moderate', name: 'Moderate' },
  { id: 'deep', name: 'Deep' }
];

// Tone presets
const tonePresets = [
  { id: 'neutral', name: 'Neutral' },
  { id: 'warm', name: 'Warm' },
  { id: 'cool', name: 'Cool' }
];

// Platform presets for auto-resize
const platformPresets = [
  { id: 'instagram-feed', name: 'Instagram Feed', icon: Square, dimensions: '1080x1080', aspectRatio: '1:1' },
  { id: 'instagram-story', name: 'Instagram Story', icon: Smartphone, dimensions: '1080x1920', aspectRatio: '9:16' },
  { id: 'facebook-feed', name: 'Facebook Feed', icon: Monitor, dimensions: '1200x630', aspectRatio: '1.91:1' },
  { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', icon: FileVideo, dimensions: '1280x720', aspectRatio: '16:9' },
  { id: 'google-display', name: 'Google Display', icon: Grid3x3, dimensions: '300x250', aspectRatio: '1.2:1' },
  { id: 'linkedin-post', name: 'LinkedIn Post', icon: Square, dimensions: '1200x1200', aspectRatio: '1:1' },
];

// Animated gradient background
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/50" />
      <motion.div
        className="absolute top-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-[128px]"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[128px]"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
}

// Model Selector Component
function ModelSelector({ type, selectedModel, onModelChange }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const models = type === 'video' ? VIDEO_MODELS : IMAGE_MODELS;
  const selected = models.find(m => m.id === selectedModel) || models[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl hover:border-purple-500/50 transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selected.icon}</span>
          <div className="text-left">
            <div className="text-white font-medium">{selected.name}</div>
            <div className="text-xs text-slate-400">{selected.provider}</div>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${
            selected.badge === 'Soon' ? 'bg-slate-600 text-slate-300' :
            selected.badge === 'Fast' ? 'bg-blue-500/20 text-blue-300' :
            selected.badge === 'Cinematic' ? 'bg-purple-500/20 text-purple-300' :
            selected.badge === 'Creative' ? 'bg-pink-500/20 text-pink-300' :
            'bg-green-500/20 text-green-300'
          }`}>
            {selected.badge}
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden z-50"
          >
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => {
                  if (!model.disabled) {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }
                }}
                disabled={model.disabled}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${
                  model.disabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${selectedModel === model.id ? 'bg-purple-500/10' : ''}`}
              >
                <span className="text-2xl">{model.icon}</span>
                <div className="flex-1 text-left">
                  <div className="text-white font-medium">{model.name}</div>
                  <div className="text-xs text-slate-400">{model.provider}</div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  model.badge === 'Soon' ? 'bg-slate-600 text-slate-300' :
                  model.badge === 'Fast' ? 'bg-blue-500/20 text-blue-300' :
                  model.badge === 'Cinematic' ? 'bg-purple-500/20 text-purple-300' :
                  model.badge === 'Creative' ? 'bg-pink-500/20 text-pink-300' :
                  'bg-green-500/20 text-green-300'
                }`}>
                  {model.badge}
                </span>
                {selectedModel === model.id && <Check className="w-4 h-4 text-purple-400" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// VFX Templates Component with inline GIF previews
function TemplatePreview({ src, alt }: { src: string; alt: string }) {
  const isVideo = src.endsWith(".mp4");
  return isVideo ? (
    <video
      src={src}
      className="w-full h-40 object-cover"
      autoPlay
      loop
      muted
      playsInline
    />
  ) : (
    <img src={src} alt={alt} className="w-full h-40 object-cover" loading="lazy" />
  );
}

// --- Replace your entire VFXTemplates component with this ---
function VFXTemplates({
  selectedTemplate,
  onTemplateSelect,
  disabled,
}: {
  selectedTemplate: string | null;
  onTemplateSelect: (id: string | null) => void;
  disabled?: boolean;
}) {
  // MP4 previews stored in /public/vfx (filenames use hyphens)
  // Keys here MATCH the underscore ids above.
  const videoPreviews: Record<string, string> = {
    "earth-zoom-out": "/vfx/earth-zoom-out.mp4",
    "disintegrate": "/vfx/disintegrate.mp4",
    "face-punch": "/vfx/face-punch.mp4",
    "eyes-in": "/vfx/eyes-in.mp4",
    "paint-splash": "/vfx/paint-splash.mp4",
    "lens-crack": "/vfx/lens-crack.mp4",
  };

  return (
    <div
      className={`bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">VFX Templates</h3>
        {selectedTemplate && !disabled && (
          <button
            onClick={() => onTemplateSelect(null)}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {vfxTemplates.map((template) => {
          const active = template.id === selectedTemplate;
          const src =
            videoPreviews[template.id] ??
            videoPreviews[template.id.replace(/-/g, "_")] ??
            ""; // robust lookup

          return (
            <motion.button
              key={template.id}
              onClick={() =>
                !disabled &&
                onTemplateSelect(active ? null : template.id)
              }
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              disabled={disabled}
              className={`relative rounded-lg overflow-hidden border text-left transition-all ${
                active
                  ? "border-purple-500 ring-2 ring-purple-500/40"
                  : disabled
                  ? "border-slate-700/50 cursor-not-allowed"
                  : "border-slate-700 hover:border-slate-500"
              }`}
              style={{ minHeight: "160px" }}
            >
              {/* Video Preview */}
              <video
                src={src}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />

              {/* Label overlay */}
              <div className="relative z-10 flex flex-col items-center justify-end h-full p-2 bg-black/40">
                <div
                  className={`text-sm ${
                    disabled ? "text-slate-600" : "text-white"
                  } font-medium`}
                >
                  {template.name}
                </div>
                <div className="text-xs text-slate-300">
                  {template.description}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {selectedTemplate && !disabled && (
        <div className="mt-3 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <p className="text-xs text-purple-300">
            This will add: "
            {vfxTemplates.find((t) => t.id === selectedTemplate)?.prompt}
            " to your prompt.
          </p>
        </div>
      )}
    </div>
  );
}


// Timeline Component
function Timeline({ duration, onDurationChange }: any) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, duration]);

  // Cap at 8s for Veo 3
  const maxDuration = 8;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Timeline
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
          </button>
          <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
            <SkipForward className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500"
          animate={{ width: `${(currentTime / duration) * 100}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-slate-400">
        <span>{currentTime.toFixed(1)}s</span>
        <span>{duration}s</span>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm text-slate-400">Duration</label>
          <span className="text-xs text-purple-400">Max: {maxDuration}s</span>
        </div>
        <input
          type="range"
          min="1"
          max={maxDuration}
          value={duration}
          onChange={(e) => onDurationChange(parseInt(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(duration / maxDuration) * 100}%, #475569 ${(duration / maxDuration) * 100}%, #475569 100%)`
          }}
        />
      </div>
    </div>
  );
}

// Asset Panel Component - Extended height for 2 rows
function AssetPanel({
  selectedAssets,
  onRemoveAsset,
  onAddAssets,
}: any) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8000/api/visual_assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: "DFSA",
          context: "reference_images",
          limit: showAll ? 100 : 16,
        }),
      });
      const result = await response.json();
      if (result?.success) setAssets(result.assets || []);
      else setError("Failed to load assets");
    } catch (err) {
      console.error("Error loading assets:", err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleAssetSelect = (asset: any) => {
    const existingIdx = selectedAssets.findIndex((a: any) => a.key === asset.key);
    if (existingIdx >= 0) {
      onRemoveAsset(existingIdx);
    } else if (selectedAssets.length < 5) {
      onAddAssets([asset]);
    }
  };

  const displayAssets = showAll ? assets : assets.slice(0, 16);

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Reference Assets
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
            {selectedAssets.length}/5 selected
          </span>
          {loading && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
        </div>
      </div>

      {error ? (
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
      ) : displayAssets.length === 0 && !loading ? (
        <div className="text-center py-8 text-slate-500">
          <Upload className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No assets found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto mb-3">
            {displayAssets.map((asset: any, index: number) => {
              const isSelected = selectedAssets.some((a: any) => a.key === asset.key);
              return (
                <motion.button
                  key={asset.key}
                  onClick={() => handleAssetSelect(asset)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative aspect-square bg-slate-800 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    isSelected
                      ? "border-purple-500 ring-2 ring-purple-500/50"
                      : "border-transparent hover:border-slate-600"
                  }`}
                  title={asset.description}
                >
                  <img
                    src={asset.url}
                    alt={asset.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 truncate">
                    {asset.filename.split(".")[0]}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {assets.length > 16 && (
            <button
              onClick={() => {
                setShowAll(!showAll);
                if (!showAll) loadAssets(); // refresh with higher limit
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              {showAll ? "Show Less" : `Show All (${assets.length} total)`}
              <ChevronRight
                className={`w-4 h-4 transition-transform ${showAll ? "rotate-90" : ""}`}
              />
            </button>
          )}
        </>
      )}

      {selectedAssets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-2">Selected for reference:</p>
          <div className="flex gap-1 flex-wrap">
            {selectedAssets.map((asset: any, index: number) => (
              <div key={index} className="relative group">
                <img
                  src={asset.url}
                  alt={asset.filename}
                  className="w-8 h-8 object-cover rounded border border-purple-500"
                />
                <button
                  onClick={() => onRemoveAsset(index)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2 h-2 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// Enhanced Quality Settings Panel with Video Resolution
function QualitySettingsPanel({ quality, lighting, depthOfField, tone, noTextOrLogos, onSettingsChange }: any) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Sliders className="w-4 h-4" />
        Quality Settings
      </h3>

      <div className="space-y-4">
        {/* Video Resolution */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Video Resolution</label>
          <div className="grid grid-cols-3 gap-2">
            {['720p', '1080p', '4K'].map(res => (
              <button
                key={res}
                onClick={() => onSettingsChange('quality', res)}
                className={`py-2 px-2 rounded-lg text-xs transition-all ${
                  quality === res
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>

        {/* Lighting */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Lighting</label>
          <div className="grid grid-cols-2 gap-2">
            {lightingPresets.map(preset => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSettingsChange('lighting', preset.id)}
                  className={`p-2 rounded-lg border transition-all flex items-center gap-2 ${
                    lighting === preset.id
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Icon className="w-3 h-3 text-white" />
                  <span className="text-xs text-white">{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Depth of Field */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Depth of Field</label>
          <div className="grid grid-cols-3 gap-2">
            {depthOfFieldPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => onSettingsChange('depthOfField', preset.id)}
                className={`py-1 px-2 rounded-lg text-xs transition-all ${
                  depthOfField === preset.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Tone</label>
          <div className="grid grid-cols-3 gap-2">
            {tonePresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => onSettingsChange('tone', preset.id)}
                className={`py-1 px-2 rounded-lg text-xs transition-all ${
                  tone === preset.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* No Text/Logos Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-400">No Text or Logos</label>
          <button
            onClick={() => onSettingsChange('noTextOrLogos', !noTextOrLogos)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              noTextOrLogos ? 'bg-purple-500' : 'bg-slate-700'
            }`}
          >
            <motion.div
              className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full"
              animate={{ x: noTextOrLogos ? 20 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced Imagine Tab
function ImagineTab() {
  const [imageModel, setImageModel] = useState('dalle3');
  const [imagePrompt, setImagePrompt] = useState('');
  const [numImages, setNumImages] = useState(1);
  const [imageQuality, setImageQuality] = useState('standard');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selectedAssets, setSelectedAssets] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('product');
  const [selectedLighting, setSelectedLighting] = useState('studio');
  const [selectedComposition, setSelectedComposition] = useState('thirds');
  const [jobId, setJobId] = useState<string | null>(null);

  const handleGenerateImages = async () => {
    if (!imagePrompt.trim()) return;

    setIsGenerating(true);
    setGeneratedImages([]);

    try {
      const response = await fetch('http://localhost:8000/api/unified_generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          model: imageModel,
          client: 'DFSA',
          prompt: imagePrompt,
          num_images: numImages,
          quality: imageQuality,
          aspect_ratio: aspectRatio,
          reference_images: selectedAssets.map(a => a.key),
          style_presets: {
            style: selectedStyle,
            lighting: selectedLighting,
            composition: selectedComposition
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        setJobId(result.job_id);
        pollImageStatus(result.job_id);
      }
    } catch (error) {
      console.error('Image generation error:', error);
      setIsGenerating(false);
    }
  };

  const pollImageStatus = async (jobId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/check_status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: jobId,
            type: 'image'
          })
        });

        const result = await response.json();

        if (result.status === 'completed' && result.image_urls) {
          setGeneratedImages(result.image_urls);
          setIsGenerating(false);
        } else if (result.status === 'failed') {
          console.error('Generation failed:', result.error);
          setIsGenerating(false);
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000);
          } else {
            setIsGenerating(false);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setIsGenerating(false);
        }
      }
    };

    poll();
  };

  const downloadImage = (url: string, filename: string) => {
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      });
  };

  // Dynamic grid based on number of images
  const getImageGridClass = () => {
    if (numImages === 1) return 'grid-cols-1';
    if (numImages === 2) return 'grid-cols-2';
    return 'grid-cols-2'; // 3 or 4 images
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Sidebar - Model & Style */}
      <div className="col-span-3 space-y-6">
        <div>
          <label className="text-white font-medium mb-2 block">Select Image Model</label>
          <ModelSelector type="image" selectedModel={imageModel} onModelChange={setImageModel} />
        </div>

        {/* Style Presets */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Style Presets
          </h3>
          <div className="space-y-2">
            {stylePresets.map(style => {
              const Icon = style.icon;
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    selectedStyle === style.id
                      ? 'bg-purple-500/20 border-purple-500 ring-1 ring-purple-500/50'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-purple-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{style.name}</div>
                      <div className="text-xs text-slate-400">{style.description}</div>
                    </div>
                    {selectedStyle === style.id && <Check className="w-4 h-4 text-purple-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lighting */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-4">Lighting</h3>
          <div className="grid grid-cols-2 gap-2">
            {lightingPresets.map(light => {
              const Icon = light.icon;
              return (
                <button
                  key={light.id}
                  onClick={() => setSelectedLighting(light.id)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedLighting === light.id
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4 text-white mx-auto mb-1" />
                  <div className="text-xs text-white">{light.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Center - Image Generation */}
      <div className="col-span-6 space-y-6">
        {/* Image Preview with Dynamic Grid */}
        <div className="relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-slate-700 rounded-xl p-6" style={{ minHeight: '400px' }}>
          {generatedImages.length > 0 ? (
            <div className={`grid ${getImageGridClass()} gap-4`}>
              {generatedImages.map((img, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative group"
                >
                  <img
                    src={img.url}
                    alt={`Generated ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg shadow-lg"
                  />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => downloadImage(img.url, `image-${jobId}-${idx + 1}.png`)}
                      className="p-2 bg-slate-900/80 backdrop-blur-sm rounded-lg hover:bg-slate-800"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : isGenerating ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full mx-auto"></div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Generating Images...</h3>
                <p className="text-slate-400">
                  {IMAGE_MODELS.find(m => m.id === imageModel)?.name} is creating your images
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Image className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">Your images will appear here</p>
                <p className="text-slate-500 text-sm">
                  Model: {IMAGE_MODELS.find(m => m.id === imageModel)?.name}
                </p>
                <p className="text-slate-500 text-sm">
                  Style: {stylePresets.find(s => s.id === selectedStyle)?.name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <label className="text-white font-semibold">Image Prompt</label>
          </div>
          <textarea
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Describe your image... (e.g., 'Professional product photography of DFSA dried fruits in elegant packaging')"
            className="w-full h-24 p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Composition Guides */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">Composition</h3>
          <div className="flex gap-2">
            {[
              { id: 'thirds', name: 'Rule of Thirds', icon: Grid },
              { id: 'center', name: 'Center Focus', icon: Focus },
              { id: 'leading', name: 'Leading Lines', icon: ArrowRight },
              { id: 'symmetrical', name: 'Symmetrical', icon: Compass }
            ].map(guide => {
              const Icon = guide.icon;
              return (
                <button
                  key={guide.id}
                  onClick={() => setSelectedComposition(guide.id)}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                    selectedComposition === guide.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{guide.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <motion.button
          onClick={handleGenerateImages}
          disabled={isGenerating || !imagePrompt.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            isGenerating || !imagePrompt.trim()
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Images...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Generate Images
            </>
          )}
        </motion.button>
      </div>

      {/* Right Sidebar */}
      <div className="col-span-3 space-y-6">
        <AssetPanel
          selectedAssets={selectedAssets}
          onRemoveAsset={(index: number) => {
            setSelectedAssets(prev => prev.filter((_, i) => i !== index));
          }}
          onAddAssets={(newAssets: any[]) => {
            setSelectedAssets(prev => [...prev, ...newAssets]);
          }}
        />

        {/* Generation Settings */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-4">Generation Settings</h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400">Number of Images</label>
              <input
                type="range"
                min="1"
                max="4"
                value={numImages}
                onChange={(e) => setNumImages(parseInt(e.target.value))}
                className="w-full mt-2"
              />
              <div className="flex justify-between mt-1 text-xs text-slate-500">
                <span>1</span>
                <span>{numImages}</span>
                <span>4</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400">Quality</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['standard', 'high'].map(q => (
                  <button
                    key={q}
                    onClick={() => setImageQuality(q)}
                    className={`py-2 px-3 rounded-lg transition-all ${
                      imageQuality === q
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {q.charAt(0).toUpperCase() + q.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400">Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['1:1', '16:9', '9:16', '4:3'].map(ar => (
                  <button
                    key={ar}
                    onClick={() => setAspectRatio(ar)}
                    className={`py-2 px-3 rounded-lg transition-all text-sm ${
                      aspectRatio === ar
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Generation Info */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">Generation Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Model:</span>
              <span className="text-white">{IMAGE_MODELS.find(m => m.id === imageModel)?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Style:</span>
              <span className="text-white">{stylePresets.find(s => s.id === selectedStyle)?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Lighting:</span>
              <span className="text-white">{lightingPresets.find(l => l.id === selectedLighting)?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Images:</span>
              <span className="text-white">{numImages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quality:</span>
              <span className="text-white">{imageQuality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Aspect:</span>
              <span className="text-white">{aspectRatio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Est. Cost:</span>
              <span className="text-purple-400 font-semibold">${(numImages * 0.04).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Studio Interface
export default function StudioInterface() {
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram-feed']);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [quality, setQuality] = useState('1080p');
  const [selectedAssets, setSelectedAssets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('create');
  const [videoModel, setVideoModel] = useState('veo3');
  const [vfxTemplate, setVfxTemplate] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');

  // Quality settings
  const [lighting, setLighting] = useState('studio');
  const [depthOfField, setDepthOfField] = useState('shallow');
  const [tone, setTone] = useState('neutral');
  const [noTextOrLogos, setNoTextOrLogos] = useState(true);

  // Handle camera/VFX conflict
  useEffect(() => {
    if (selectedCamera && vfxTemplate) {
      setVfxTemplate(null); // Clear VFX if camera is selected
    }
  }, [selectedCamera]);

  useEffect(() => {
    if (vfxTemplate && selectedCamera) {
      setSelectedCamera(''); // Clear camera if VFX is selected
    }
  }, [vfxTemplate]);

  const handleQualitySettingsChange = (setting: string, value: any) => {
    switch(setting) {
      case 'quality': setQuality(value); break;
      case 'lighting': setLighting(value); break;
      case 'depthOfField': setDepthOfField(value); break;
      case 'tone': setTone(value); break;
      case 'noTextOrLogos': setNoTextOrLogos(value); break;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt first!');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setVideoUrl(null);
    setStatus('processing');

    try {
      const response = await fetch('http://localhost:8000/api/unified_generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          model: videoModel,
          client: 'DFSA',
          prompt: prompt,
          duration: duration,
          camera_movement: selectedCamera || '',
          quality: quality,
          aspect_ratio: '16:9',
          reference_images: selectedAssets.map(asset => asset.key),
          vfx_template: vfxTemplate,
          style_presets: {
            lighting,
            depthOfField,
            tone,
            noTextOrLogos
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setJobId(result.job_id);
        console.log('🎬 Generation started:', {
          job_id: result.job_id,
          model: result.model,
          using_reference: result.reference_images?.length > 0,
          enhanced_prompt: result.enhanced_prompt
        });
        pollStatus(result.job_id);
      } else {
        setError(result.detail || result.error || 'Generation failed');
        setIsGenerating(false);
        setStatus('failed');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to start generation');
      setIsGenerating(false);
      setStatus('failed');
    }
  };

  const pollStatus = async (jobId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/check_status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: jobId,
            type: 'video'
          })
        });

        const result = await response.json();

        if (result.status === 'completed') {
          setVideoUrl(result.video_url);
          setIsGenerating(false);
          setProgress(100);
          setStatus('completed');
        } else if (result.status === 'failed') {
          setError(result.error || 'Generation failed');
          setIsGenerating(false);
          setStatus('failed');
        } else if (result.status === 'processing') {
          setProgress(result.progress || 25);
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000);
          } else {
            setError('Generation timeout');
            setIsGenerating(false);
            setStatus('failed');
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
  };

  const downloadVideo = () => {
    if (videoUrl) {
      fetch(videoUrl)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `dfsa-video-${jobId?.substring(0, 8)}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(blobUrl);
        })
        .catch(error => {
          console.error('Download error:', error);
          window.open(videoUrl, '_blank');
        });
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const renderPreviewArea = () => {
    return (
      <div className="relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-slate-700 rounded-xl overflow-hidden" style={{ height: '400px' }}>
        {videoUrl && status === 'completed' ? (
          <div className="relative h-full bg-black">
            <video
              src={videoUrl}
              className="w-full h-full object-contain"
              controls
              poster="/api/placeholder/800/400"
            />
            <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-sm border border-green-400 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">Generation Complete</span>
              </div>
            </div>
            <button
              onClick={downloadVideo}
              className="absolute bottom-4 right-4 p-3 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
          </div>
        ) : isGenerating ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full mx-auto"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {videoModel === 'veo3' ? 'Veo 3' : 'Runway Gen-4'} Generation...
              </h3>
              <div className="w-64 h-3 bg-slate-800 rounded-full overflow-hidden mb-4 border border-slate-700 mx-auto">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-slate-400">
                {progress > 0 ? `${Math.round(progress)}% complete` : 'Starting generation...'}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Generation Failed</h3>
              <p className="text-red-400 mb-4 text-sm">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setStatus('idle');
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">Video preview will appear here</p>
              <p className="text-slate-500 text-sm mb-2">
                Model: {VIDEO_MODELS.find(m => m.id === videoModel)?.name}
              </p>
              {vfxTemplate && (
                <p className="text-purple-400 text-sm">
                  VFX: {vfxTemplates.find(t => t.id === vfxTemplate)?.name}
                </p>
              )}
              {selectedAssets.length > 0 && (
                <p className="text-green-400 text-sm">
                  Using {selectedAssets.length} reference image{selectedAssets.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* Top Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl relative z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg" />
                <span className="text-xl font-bold text-white">Creative AI Studio</span>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">Multi-Model</span>
              </div>
              <div className="flex gap-1 bg-slate-800/50 backdrop-blur-sm rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'create' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create
                </button>
                <button
                  onClick={() => setActiveTab('imagine')}
                  className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                    activeTab === 'imagine' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Imagine
                </button>
                <button
                  onClick={() => setActiveTab('library')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'library' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Library
                </button>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'campaigns' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Campaigns
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="p-2 text-slate-400 hover:text-white transition-colors">
                <Home className="w-5 h-5" />
              </a>
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-purple-500 rounded-full" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <div className="col-span-3 space-y-6">
              {/* Model Selector */}
              <div>
                <label className="text-white font-medium mb-2 block">Select Video Model</label>
                <ModelSelector type="video" selectedModel={videoModel} onModelChange={setVideoModel} />
              </div>

              {/* Quality Settings - Merged and moved here */}
              <QualitySettingsPanel
                quality={quality}
                lighting={lighting}
                depthOfField={depthOfField}
                tone={tone}
                noTextOrLogos={noTextOrLogos}
                onSettingsChange={handleQualitySettingsChange}
              />

              {/* Camera Controls */}
              <div className={`bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 ${vfxTemplate ? 'opacity-50' : ''}`}>
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Camera Movement
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full ml-auto">Enhanced</span>
                </h3>
                {vfxTemplate && (
                  <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-yellow-300">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Disabled when VFX is selected
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  {cameraPresets.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <motion.button
                        key={preset.id}
                        onClick={() => !vfxTemplate && setSelectedCamera(preset.id === selectedCamera ? '' : preset.id)}
                        disabled={!!vfxTemplate}
                        whileHover={!vfxTemplate ? { scale: 1.02 } : {}}
                        whileTap={!vfxTemplate ? { scale: 0.98 } : {}}
                        className={`w-full p-3 rounded-lg border transition-all text-left ${
                          selectedCamera === preset.id
                            ? 'bg-purple-500/20 border-purple-500 ring-1 ring-purple-500/50'
                            : vfxTemplate
                              ? 'bg-slate-800/30 border-slate-700/50 cursor-not-allowed'
                              : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${vfxTemplate ? 'text-slate-600' : 'text-purple-400'}`} />
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${vfxTemplate ? 'text-slate-600' : 'text-white'}`}>{preset.name}</div>
                            <div className="text-xs text-slate-400">{preset.description}</div>
                          </div>
                          {selectedCamera === preset.id && !vfxTemplate && (
                            <Check className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Center - Main Canvas */}
            <div className="col-span-6 space-y-6">
              {renderPreviewArea()}

              {/* Prompt Input */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <label className="text-white font-semibold">Enhanced Prompt</label>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                    Cinematographic AI
                  </span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your video scene... (e.g., 'Golden dried apple rings arranged on a rustic wooden table')"
                  className="w-full h-24 p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500"
                />
                <div className="flex justify-between mt-2">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>Model: {VIDEO_MODELS.find(m => m.id === videoModel)?.name}</span>
                    {selectedCamera && <span>Camera: {cameraPresets.find(p => p.id === selectedCamera)?.name}</span>}
                    {vfxTemplate && <span>VFX: {vfxTemplates.find(t => t.id === vfxTemplate)?.name}</span>}
                    {selectedAssets.length > 0 && <span className="text-green-400">{selectedAssets.length} refs</span>}
                  </div>
                  <span className="text-xs text-slate-400">{prompt.length}/1000</span>
                </div>
              </div>

              {/* Timeline */}
              <Timeline duration={duration} onDurationChange={setDuration} />

              {/* VFX Templates */}
              <VFXTemplates
                selectedTemplate={vfxTemplate}
                onTemplateSelect={setVfxTemplate}
                disabled={!!selectedCamera}
              />
            </div>

            {/* Right Sidebar */}
            <div className="col-span-3 space-y-6">
              {/* Reference Assets - Extended height */}
              <AssetPanel
                selectedAssets={selectedAssets}
                onRemoveAsset={(index: number) => {
                  setSelectedAssets(prev => prev.filter((_, i) => i !== index));
                }}
                onAddAssets={(newAssets: any[]) => {
                  setSelectedAssets(prev => [...prev, ...newAssets]);
                }}
              />

              {/* Platform Selection */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  Auto-Resize Platforms
                </h3>
                <div className="space-y-2">
                  {platformPresets.map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = selectedPlatforms.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        onClick={() => togglePlatform(platform.id)}
                        className={`w-full p-3 rounded-lg border transition-all text-left ${
                          isSelected
                            ? 'bg-green-500/20 border-green-500'
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-slate-400" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{platform.name}</div>
                            <div className="text-xs text-slate-400">{platform.dimensions}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-green-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generate Button */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Model:</span>
                    <span className="text-white font-semibold">{VIDEO_MODELS.find(m => m.id === videoModel)?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-white font-semibold">{duration}s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">References:</span>
                    <span className="text-green-400 font-semibold">{selectedAssets.length}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Est. Cost:</span>
                    <span className="text-purple-400 font-semibold">$0.50</span>
                  </div>
                </div>

                <motion.button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    isGenerating || !prompt.trim()
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating... {Math.round(progress)}%
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate Video
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Imagine Tab */}
        {activeTab === 'imagine' && <ImagineTab />}

        {/* Library Tab */}
        {activeTab === 'library' && <LibraryTab />}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && <CampaignsTab />}
      </div>
    </div>
  );
}