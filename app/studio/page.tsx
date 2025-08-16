"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Image, Layers, Settings, Play, Pause, SkipForward,
  Camera, Move3D, ZoomIn, RotateCw, Maximize2,
  ChevronRight, Upload, Sparkles, Clock, DollarSign,
  Monitor, Smartphone, Square, FileVideo, Download,
  Sliders, Wand2, Grid3x3, ArrowRight, Check, X, Home,
  CheckCircle, XCircle, RefreshCw, AlertCircle, Loader2
} from 'lucide-react';
import { useVideoGeneration } from '../hooks/useVideoGeneration';
import LibraryTab from '../components/LibraryTab';
import CampaignsTab from '../components/CampaignsTab';

// Camera control presets
const cameraPresets = [
  { id: 'dolly-in', name: 'Dolly In', icon: ZoomIn, description: 'Smooth forward movement', prompt: 'camera slowly dollies forward' },
  { id: 'dolly-out', name: 'Dolly Out', icon: Maximize2, description: 'Smooth backward movement', prompt: 'camera pulls back slowly' },
  { id: 'orbit-left', name: 'Orbit Left', icon: RotateCw, description: 'Circular left movement', prompt: 'camera orbits left around subject' },
  { id: 'orbit-right', name: 'Orbit Right', icon: RotateCw, description: 'Circular right movement', prompt: 'camera orbits right around subject' },
  { id: 'crane-up', name: 'Crane Up', icon: Move3D, description: 'Vertical upward movement', prompt: 'crane shot moving upward' },
  { id: 'crane-down', name: 'Crane Down', icon: Move3D, description: 'Vertical downward movement', prompt: 'crane shot moving downward' },
  { id: 'pan-left', name: 'Pan Left', icon: Camera, description: 'Horizontal left rotation', prompt: 'camera pans left' },
  { id: 'pan-right', name: 'Pan Right', icon: Camera, description: 'Horizontal right rotation', prompt: 'camera pans right' },
];

// Platform presets for resizing
const platformPresets = [
  { id: 'instagram-feed', name: 'Instagram Feed', icon: Square, dimensions: '1080x1080', aspectRatio: '1:1' },
  { id: 'instagram-story', name: 'Instagram Story', icon: Smartphone, dimensions: '1080x1920', aspectRatio: '9:16' },
  { id: 'facebook-feed', name: 'Facebook Feed', icon: Monitor, dimensions: '1200x630', aspectRatio: '1.91:1' },
  { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', icon: FileVideo, dimensions: '1280x720', aspectRatio: '16:9' },
  { id: 'google-display', name: 'Google Display', icon: Grid3x3, dimensions: '300x250', aspectRatio: '1.2:1' },
  { id: 'linkedin-post', name: 'LinkedIn Post', icon: Square, dimensions: '1200x1200', aspectRatio: '1:1' },
];

// Timeline component
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

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
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

      {/* Timeline bar */}
      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-slate-400">
        <span>{currentTime.toFixed(1)}s</span>
        <span>{duration}s</span>
      </div>

      {/* Duration slider */}
      <div className="mt-4">
        <label className="text-sm text-slate-400">Duration</label>
        <input
          type="range"
          min="1"
          max="30"
          value={duration}
          onChange={(e) => onDurationChange(parseInt(e.target.value))}
          className="w-full mt-2"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(duration / 30) * 100}%, #475569 ${(duration / 30) * 100}%, #475569 100%)`
          }}
        />
      </div>
    </div>
  );
}

// Enhanced Asset panel component with S3 integration
function AssetPanel({ selectedAssets, onRemoveAsset, onAddAssets }: any) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Load assets from S3 on component mount
  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🎨 Loading DFSA assets from S3...');

      const response = await fetch('http://localhost:8000/api/visual_assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: 'DFSA',
          context: 'reference_images',
          limit: showAll ? 100 : 16  // Load 16 initially, 100 when showing all
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Loaded ${result.assets.length} assets`);
        setAssets(result.assets);
      } else {
        setError('Failed to load assets');
      }
    } catch (err) {
      console.error('💥 Error loading assets:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleAssetSelect = (asset: any) => {
    if (selectedAssets.find((a: any) => a.key === asset.key)) {
      // Remove if already selected
      const index = selectedAssets.findIndex((a: any) => a.key === asset.key);
      onRemoveAsset(index);
    } else {
      // Add if not selected (max 5 reference images for Veo 3)
      if (selectedAssets.length < 5) {
        onAddAssets([asset]);
      }
    }
  };

  const displayAssets = showAll ? assets : assets.slice(0, 8);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
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
          {/* Asset Grid - 2 rows x 4 columns */}
          <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto mb-3">
            {displayAssets.map((asset: any, index: number) => {
              const isSelected = selectedAssets.find((a: any) => a.key === asset.key);

              return (
                <motion.button
                  key={asset.key}
                  onClick={() => handleAssetSelect(asset)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative aspect-square bg-slate-800 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    isSelected ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-transparent hover:border-slate-600'
                  }`}
                  title={asset.description}
                >
                  <img
                    src={asset.url}
                    alt={asset.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Category badge */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 truncate">
                    {asset.category.replace('-', ' ')}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Show more/less button */}
          {assets.length > 8 && (
            <button
              onClick={() => {
                setShowAll(!showAll);
                if (!showAll) loadAssets(); // Load more when expanding
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              {showAll ? 'Show Less' : `Show All (${assets.length} total)`}
              <ChevronRight className={`w-4 h-4 transition-transform ${showAll ? 'rotate-90' : ''}`} />
            </button>
          )}
        </>
      )}

      {/* Selected Assets Display */}
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

// Main Studio Interface
export default function StudioInterface() {
  const [selectedCamera, setSelectedCamera] = useState('dolly-in');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram-feed']);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [quality, setQuality] = useState('1080p');
  const [selectedAssets, setSelectedAssets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('create');

  // Use our enhanced video generation hook
  const {
    isGenerating,
    progress,
    jobId,
    videoUrl,
    error,
    status,
    generateVideo,
    resetGeneration
  } = useVideoGeneration();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt first!');
      return;
    }

    console.log('🎬 Starting enhanced generation process...');

    // Get the selected camera movement
    const selectedCameraPreset = cameraPresets.find(p => p.id === selectedCamera);
    const cameraMovement = selectedCameraPreset?.prompt || '';

    console.log('📹 Camera movement:', selectedCameraPreset?.name);
    console.log('🎨 Selected assets:', selectedAssets.length);

    await generateVideo({
      client: 'DFSA',
      prompt: prompt,
      duration: duration,
      quality: quality,
      reference_images: selectedAssets.map(asset => asset.key),
      camera_movement: cameraMovement
    });
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  // Enhanced Preview Area
  const renderPreviewArea = () => {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden" style={{ height: '400px' }}>
        <div className="relative h-full">
          {/* Video Display */}
          {videoUrl && status === 'completed' ? (
            <div className="relative h-full bg-black">
              <video
                src={videoUrl}
                className="w-full h-full object-contain"
                controls
                autoPlay
                poster="/api/placeholder/800/400"
              />

              {/* Success Overlay */}
              <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-sm border border-green-400 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span className="text-sm text-white font-medium">Enhanced Generation Complete</span>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = videoUrl;
                  a.download = `dfsa-video-${jobId?.substring(0, 8)}.mp4`;
                  a.click();
                }}
                className="absolute bottom-4 right-4 p-3 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
                title="Download Enhanced Video"
              >
                <Download className="w-5 h-5 text-white" />
              </button>

              {/* Enhanced Info Panel */}
              <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2">
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Job: {jobId?.substring(0, 8)}...</div>
                  <div>Camera: {cameraPresets.find(p => p.id === selectedCamera)?.name}</div>
                  <div>Assets: {selectedAssets.length} references</div>
                </div>
              </div>
            </div>
          ) : isGenerating ? (
            // Enhanced Generation in Progress
            <div className="h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex flex-col items-center justify-center">
              <div className="text-center">
                {/* Enhanced Animated Spinner */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  {/* Inner progress ring */}
                  <div className="absolute top-2 left-2 w-16 h-16 border-2 border-pink-500/50 rounded-full"></div>
                </div>

                {/* Enhanced Status Text */}
                <h3 className="text-xl font-semibold text-white mb-2">
                  {status === 'processing' ? 'Enhanced Veo 3 Generation...' : 'Initializing Cinematographer...'}
                </h3>

                {/* Enhanced Progress Bar */}
                <div className="w-64 h-3 bg-slate-800 rounded-full overflow-hidden mb-4 border border-slate-700">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                {/* Enhanced Progress Info */}
                <div className="space-y-2">
                  <p className="text-slate-400">
                    {progress > 0 ? `${Math.round(progress)}% complete` : 'Starting enhanced generation...'}
                  </p>
                  <p className="text-slate-500 text-sm">
                    Estimated time: {progress > 70 ? '30' : progress > 30 ? '45' : '90'} seconds
                  </p>

                  {/* Generation Features */}
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      <span>Cinematographic AI</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>{selectedAssets.length} References</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Brand Intelligence</span>
                    </div>
                  </div>
                </div>

                {/* Job ID */}
                {jobId && (
                  <p className="text-slate-600 text-xs mt-3">
                    Job ID: {jobId.substring(0, 16)}...
                  </p>
                )}
              </div>
            </div>
          ) : error ? (
            // Enhanced Error State
            <div className="h-full bg-gradient-to-br from-red-500/10 to-orange-500/10 flex items-center justify-center">
              <div className="text-center max-w-md">
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Generation Failed</h3>
                <p className="text-red-400 mb-4 text-sm leading-relaxed">{error}</p>

                {/* Enhanced Error Actions */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={resetGeneration}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>

                  {error.toLowerCase().includes('quota') && (
                    <button
                      onClick={() => window.open('https://ai.google.dev/gemini-api/docs/quota', '_blank')}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
                    >
                      Check Quota
                    </button>
                  )}
                </div>

                {/* Error Tips */}
                <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-left">
                  <p className="text-xs text-slate-400 mb-2">💡 Tips to resolve:</p>
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li>• Check your Veo 3 API quota</li>
                    <li>• Try a shorter prompt</li>
                    <li>• Reduce duration to 5 seconds</li>
                    <li>• Wait a few minutes before retrying</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            // Enhanced Default State
            <div className="h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
              <div className="text-center">
                <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">Enhanced video preview will appear here</p>
                <p className="text-slate-500 text-sm mb-4">
                  Camera: {cameraPresets.find(p => p.id === selectedCamera)?.name} |
                  Assets: {selectedAssets.length} selected
                </p>

                {/* Feature Preview */}
                <div className="flex items-center justify-center gap-6 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Cinematographic AI</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>Professional Movements</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>Custom Assets</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Enhanced Generate Button
  const renderGenerateButton = () => {
    const isDisabled = isGenerating || !prompt.trim();

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Estimated cost:</span>
            <span className="text-white font-semibold">$0.50</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Platforms:</span>
            <span className="text-white font-semibold">{selectedPlatforms.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Duration:</span>
            <span className="text-white font-semibold">{duration}s</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Camera:</span>
            <span className="text-purple-400 font-semibold">{cameraPresets.find(p => p.id === selectedCamera)?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">References:</span>
            <span className="text-green-400 font-semibold">{selectedAssets.length}/5</span>
          </div>
          {jobId && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Job ID:</span>
              <span className="text-purple-400 font-semibold">{jobId.substring(0, 8)}...</span>
            </div>
          )}
        </div>

        <motion.button
          onClick={handleGenerate}
          disabled={isDisabled}
          whileHover={!isDisabled ? { scale: 1.02 } : {}}
          whileTap={!isDisabled ? { scale: 0.98 } : {}}
          className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            isDisabled
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {progress > 0 ? `Generating... ${Math.round(progress)}%` : 'Starting Enhanced Generation...'}
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate Enhanced Campaign
            </>
          )}
        </motion.button>

        {/* Enhanced Validation Messages */}
        {!prompt.trim() && (
          <div className="flex items-center gap-2 mt-3 text-amber-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            Please enter a prompt for your video
          </div>
        )}

        {selectedAssets.length === 0 && (
          <div className="flex items-center gap-2 mt-2 text-blue-400 text-sm">
            <Layers className="w-4 h-4" />
            Tip: Select reference assets for better brand consistency
          </div>
        )}

        {selectedPlatforms.length > 0 && (
          <p className="text-xs text-slate-400 text-center mt-2">
            Will create {selectedPlatforms.length} platform variations with enhanced AI
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Top Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg" />
                <span className="text-xl font-bold text-white">Creative AI Studio</span>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">Enhanced</span>
              </div>
              <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'create' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create
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
              <a
                href="/"
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Back to Home"
              >
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

      {/* Main Content - Tab Rendering */}
      <div className="container mx-auto px-6 py-8">
        {/* Create Tab Content */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Enhanced Camera Controls */}
            <div className="col-span-3 space-y-6">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Camera Movement
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full ml-auto">Enhanced</span>
                </h3>
                <div className="space-y-2">
                  {cameraPresets.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <motion.button
                        key={preset.id}
                        onClick={() => setSelectedCamera(preset.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full p-3 rounded-lg border transition-all text-left ${
                          selectedCamera === preset.id
                            ? 'bg-purple-500/20 border-purple-500 ring-1 ring-purple-500/50'
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-purple-400" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{preset.name}</div>
                            <div className="text-xs text-slate-400">{preset.description}</div>
                          </div>
                          {selectedCamera === preset.id && (
                            <Check className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Quality Settings */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Quality Settings
                </h3>
                <div className="space-y-3">
                  {['720p', '1080p', '4K'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      className={`w-full py-2 px-3 rounded-lg transition-all flex items-center justify-between ${
                        quality === q
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <span>{q}</span>
                      {quality === q && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Center - Enhanced Main Canvas */}
            <div className="col-span-6 space-y-6">
              {/* Enhanced Preview Area */}
              {renderPreviewArea()}

              {/* Enhanced Prompt Input */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <label className="text-white font-semibold">Enhanced Prompt</label>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                    Cinematographic AI
                  </span>
                  {jobId && (
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full ml-auto">
                      Job: {jobId.substring(0, 8)}...
                    </span>
                  )}
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your video scene... (e.g., 'Close-up of premium DFSA dried apricots cascading into a wooden bowl')"
                  className="w-full h-24 p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
                />
                <div className="flex justify-between mt-2">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>Enhanced with Bedrock Cinematographer</span>
                    <span>Camera: {cameraPresets.find(p => p.id === selectedCamera)?.name}</span>
                    <span>References: {selectedAssets.length}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {prompt.length}/1000
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <Timeline duration={duration} onDurationChange={setDuration} />
            </div>

            {/* Right Sidebar - Enhanced */}
            <div className="col-span-3 space-y-6">
              {/* Platform Selection */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  Auto-Resize Platforms
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full ml-auto">Coming Soon</span>
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

              {/* Enhanced Asset Panel */}
              <AssetPanel
                selectedAssets={selectedAssets}
                onRemoveAsset={(index: number) => {
                  setSelectedAssets(prev => prev.filter((_, i) => i !== index));
                }}
                onAddAssets={(newAssets: any[]) => {
                  setSelectedAssets(prev => [...prev, ...newAssets]);
                }}
              />

              {/* Enhanced Generate Button */}
              {renderGenerateButton()}
            </div>
          </div>
        )}

        {/* Library Tab Content */}
        {activeTab === 'library' && <LibraryTab />}

        {/* Campaigns Tab Content */}
        {activeTab === 'campaigns' && <CampaignsTab />}
      </div>
    </div>
  );
}