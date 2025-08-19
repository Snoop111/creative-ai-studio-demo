'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Video, Image, Settings, Home, Sparkles, Upload, Loader2,
  Play, Pause, Download, ChevronRight, ChevronDown, Camera, Film,
  Zap, Eye, Brain, Layers, Palette, Sun, Moon, Cloud, Sunrise,
  Wind, Droplets, Square, Grid3x3, Monitor, FileVideo, Clock,
  Check, X, Info, AlertCircle, Sliders, BookOpen, Plus, Copy,
  RefreshCw, Star, HelpCircle, Lightbulb, Hash, Type, Move,
  Maximize2, Minimize2, RotateCw, Tv, Smartphone, Circle, Split,
  Package, Volume2, Coffee
} from 'lucide-react';
import LibraryTab from '../components/LibraryTab';
import CampaignsTab from '../components/CampaignsTab';

// Animated Background Component
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl animate-pulse delay-1000" />
      </div>
    </div>
  );
};

// Model configurations
const VIDEO_MODELS = [
  { id: 'veo3', name: 'Veo 3', icon: '🎬', badge: 'Preview', description: 'Google\'s cinematic AI' },
  { id: 'runway', name: 'RunwayML', icon: '🎥', badge: 'Gen-4', description: 'Creative video generation' },
  { id: 'hailuo', name: 'Hailuo', icon: '🎞️', badge: 'Coming Soon', description: 'MiniMax platform', disabled: true }
];

const IMAGE_MODELS = [
  { id: 'dalle3', name: 'DALL-E 3', icon: '🎨', badge: 'Creative', description: 'OpenAI\'s creative model' },
  { id: 'imagen4', name: 'Imagen 4', icon: '📸', badge: 'Fast', description: 'Google\'s photorealistic model' },
  { id: 'runway', name: 'RunwayML', icon: '🖼️', badge: 'Gen-4', description: 'Stylized imagery' }
];

// VFX Templates
const vfxTemplates = [
  { id: 'earth-zoom', name: 'Earth Zoom', icon: '🌍', description: 'Zoom from space to location', prompt: 'dramatic zoom from Earth\'s orbit down to specific location, satellite view transitioning to ground level' },
  { id: 'particle-dissolve', name: 'Particle Dissolve', icon: '✨', description: 'Dissolve into particles', prompt: 'object dissolving into floating particles that drift away' },
  { id: 'glitch-transition', name: 'Glitch Transition', icon: '📺', description: 'Digital glitch effect', prompt: 'digital glitch effect with RGB channel separation and data corruption aesthetic' },
  { id: 'portal-open', name: 'Portal Open', icon: '🌀', description: 'Mystical portal opening', prompt: 'mystical portal opening with swirling energy and light' },
  { id: 'time-freeze', name: 'Time Freeze', icon: '⏱️', description: 'Everything freezes except hero', prompt: 'time freezes around the subject while they continue moving normally' },
  { id: 'shatter-effect', name: 'Shatter Effect', icon: '💎', description: 'Glass/crystal breaking', prompt: 'glass or crystal shattering into fragments with light refraction' },
  { id: 'liquid-morph', name: 'Liquid Morph', icon: '💧', description: 'Smooth liquid transformation', prompt: 'smooth liquid morphing transformation between states' },
  { id: 'lightning-strike', name: 'Lightning Strike', icon: '⚡', description: 'Dramatic lightning', prompt: 'dramatic lightning strike with electrical energy' },
  { id: 'smoke-reveal', name: 'Smoke Reveal', icon: '🌫️', description: 'Emerging from smoke', prompt: 'subject emerging from billowing smoke or mist' },
  { id: 'kaleidoscope', name: 'Kaleidoscope', icon: '🔮', description: 'Fractal mirror effects', prompt: 'kaleidoscope fractal patterns with mirror symmetry' },
  { id: 'neon-pulse', name: 'Neon Pulse', icon: '💜', description: 'Cyberpunk neon', prompt: 'cyberpunk neon lights pulsing with energy' },
  { id: 'nature-growth', name: 'Nature Growth', icon: '🌱', description: 'Accelerated plant growth', prompt: 'accelerated plant growth from seed to bloom' }
];

// Camera movements
const cameraMovements = [
  { id: 'dolly-in', name: 'Dolly In', icon: '👁️', description: 'Move toward subject' },
  { id: 'dolly-out', name: 'Dolly Out', icon: '👁️', description: 'Move away from subject' },
  { id: 'pan-left', name: 'Pan Left', icon: '⬅️', description: 'Rotate camera left' },
  { id: 'pan-right', name: 'Pan Right', icon: '➡️', description: 'Rotate camera right' },
  { id: 'orbit', name: 'Orbit', icon: '🔄', description: 'Circle around subject' },
  { id: 'zoom-in', name: 'Zoom In', icon: '🔍', description: 'Magnify the subject' },
  { id: 'zoom-out', name: 'Zoom Out', icon: '🔍', description: 'Widen the view' },
  { id: 'tracking', name: 'Tracking', icon: '🎯', description: 'Follow subject movement' },
  { id: 'crane-up', name: 'Crane Up', icon: '⬆️', description: 'Rise above subject' },
  { id: 'crane-down', name: 'Crane Down', icon: '⬇️', description: 'Descend toward subject' }
];

// Prompt templates for different models
const PROMPT_TEMPLATES = {
  veo3: [
    { category: 'Cinematic', template: 'Cinematic shot: [subject], dramatic lighting, 4K quality, smooth camera movement', icon: Film },
    { category: 'Product', template: '[Product] rotating slowly, professional studio lighting, pristine white background', icon: Package },
    { category: 'Audio Cue', template: 'Audio: [sound effect description]. Visual: [scene description]', icon: Volume2 },
    { category: 'Nature', template: 'Time-lapse of [natural phenomenon], golden hour lighting, wide angle lens', icon: Sunrise }
  ],
  dalle3: [
    { category: 'Professional', template: 'A professional photograph of [subject], high-quality, detailed, sharp focus', icon: Camera },
    { category: 'Artistic', template: 'An artistic rendering of [subject] in the style of [art movement]', icon: Palette },
    { category: 'Marketing', template: 'A modern marketing banner featuring [product], minimalist design, brand colors', icon: Monitor }
  ],
  imagen4: [
    { category: 'Photorealistic', template: 'Photorealistic image of [subject], commercial photography, perfect lighting', icon: Camera },
    { category: 'Product Shot', template: 'Premium [product] photography, elegant packaging, lifestyle setting', icon: Package },
    { category: 'Food', template: 'Appetizing [food item], professional food photography, natural lighting', icon: Coffee }
  ],
  runway: [
    { category: 'Dynamic', template: '[Subject] with dynamic motion, energetic movement, cinematic quality', icon: Zap },
    { category: 'Stylized', template: 'Stylized [scene], artistic interpretation, bold colors and composition', icon: Palette }
  ]
};

// Prompt tips for each model
const PROMPT_TIPS = {
  veo3: [
    "Use cinematic language: 'dolly shot', 'rack focus', 'crane shot'",
    "Include audio cues for better results: 'Audio: wings flapping'",
    "Keep prompts under 1000 characters for optimal processing",
    "When using reference images, focus on motion and camera work",
    "Specify frame rate and quality: '24fps, cinematic quality'"
  ],
  dalle3: [
    "Start with an article: 'A', 'An', 'The' for better comprehension",
    "DALL-E 3 handles text in images well - specify if needed",
    "Be specific about artistic style and mood",
    "Include composition details: 'centered', 'rule of thirds'"
  ],
  imagen4: [
    "Best for photorealistic results - emphasize realism",
    "Include professional photography terms",
    "Specify lighting: 'studio lighting', 'golden hour', 'soft box'",
    "Great for product photography - mention surface and texture"
  ],
  runway: [
    "Keep prompts concise and action-focused",
    "Maximum 500 characters for best results",
    "Focus on motion and dynamics",
    "Good for stylized and creative content"
  ]
};

// Style presets
const stylePresets = [
  { id: 'product', name: 'Product Photography', icon: Camera, description: 'Clean, professional product shots' },
  { id: 'lifestyle', name: 'Lifestyle Shot', icon: Sun, description: 'Natural, everyday scenes' },
  { id: 'marketing', name: 'Marketing Banner', icon: Monitor, description: 'Eye-catching promotional' },
  { id: 'social', name: 'Social Media Post', icon: Grid3x3, description: 'Optimized for social' }
];

// Composition rules
const compositionRules = [
  { id: 'thirds', name: 'Rule of Thirds', icon: Grid3x3 },
  { id: 'golden', name: 'Golden Ratio', icon: Circle },
  { id: 'center', name: 'Center Focus', icon: Circle },
  { id: 'leading', name: 'Leading Lines', icon: Move },
  { id: 'symmetrical', name: 'Symmetrical', icon: Split }
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

// Model Selector Component
function ModelSelector({ type, selectedModel, onModelChange }: any) {
  const models = type === 'video' ? VIDEO_MODELS : IMAGE_MODELS;

  return (
    <div className="space-y-2">
      {models.map((model) => (
        <button
          key={model.id}
          onClick={() => !model.disabled && onModelChange(model.id)}
          disabled={model.disabled}
          className={`w-full p-3 rounded-lg border transition-all ${
            selectedModel === model.id
              ? 'border-purple-500 bg-purple-500/10'
              : model.disabled
              ? 'border-slate-700 bg-slate-900/50 opacity-50 cursor-not-allowed'
              : 'border-slate-700 bg-slate-900/50 hover:border-purple-500/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{model.icon}</span>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{model.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  model.badge === 'Coming Soon'
                    ? 'bg-slate-700 text-slate-400'
                    : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {model.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{model.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// Prompt Templates & Tips Panel (replaces Auto-Resize in Create tab)
function PromptTemplatesPanel({ model, onSelectTemplate, onEnhancePrompt }: any) {
  const [showTips, setShowTips] = useState(false);
  const templates = PROMPT_TEMPLATES[model] || PROMPT_TEMPLATES.veo3;
  const tips = PROMPT_TIPS[model] || PROMPT_TIPS.veo3;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Prompt Helper
        </h3>
        <button
          onClick={onEnhancePrompt}
          className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          Enhance Prompt
        </button>
      </div>

      {/* Quick Templates */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">Quick Templates</p>
          <button
            onClick={() => setShowTips(!showTips)}
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <Lightbulb className="w-3 h-3" />
            {showTips ? 'Hide' : 'Show'} Tips
          </button>
        </div>

        {templates.map((template, idx) => {
          const Icon = template.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectTemplate(template.template)}
              className="w-full p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-left transition-all group"
            >
              <div className="flex items-start gap-2">
                <Icon className="w-4 h-4 text-purple-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-white">{template.category}</p>
                  <p className="text-xs text-slate-400 mt-0.5 group-hover:text-slate-300">
                    {template.template}
                  </p>
                </div>
                <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Tips Section */}
      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-slate-700">
              <p className="text-xs font-medium text-white mb-2 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Model Tips
              </p>
              <div className="space-y-1">
                {tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-purple-400 text-xs">•</span>
                    <p className="text-xs text-slate-400">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quality Settings Panel Component
function QualitySettingsPanel({ quality, lighting, depthOfField, tone, noTextOrLogos, onSettingsChange }: any) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Sliders className="w-4 h-4" />
        Quality Settings
      </h3>

      <div className="space-y-4">
        {/* Quality Preset */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Quality</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSettingsChange('quality', 'standard')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                quality === 'standard'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => onSettingsChange('quality', 'high')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                quality === 'high'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              High Quality
            </button>
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
                  className={`p-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                    lighting === preset.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {preset.name}
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
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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

  // Handle template selection
  const handleTemplateSelect = (template: string) => {
    setImagePrompt(template);
  };

  // Enhanced prompt function
  const handleEnhancePrompt = async () => {
    if (!imagePrompt) return;

    try {
      const enhancedPrompt = await enhancePromptWithAPI(imagePrompt, imageModel, {
        style: selectedStyle,
        lighting: selectedLighting,
        composition: selectedComposition
      });
      setImagePrompt(enhancedPrompt);
    } catch (error) {
      console.error('Error enhancing prompt:', error);
    }
  };

  const handleGenerateImages = async () => {
    if (!imagePrompt.trim()) return;

    setIsGenerating(true);
    setGeneratedImages([]);

    // Build enhanced prompt with settings
    const fullPrompt = buildEnhancedPrompt(imagePrompt, {
      style: selectedStyle,
      lighting: selectedLighting,
      composition: selectedComposition,
      model: imageModel
    });

    try {
      const response = await fetch('http://localhost:8000/api/unified_generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          model: imageModel,
          client: 'DFSA',
          prompt: fullPrompt,
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

      const data = await response.json();
      if (data.job_id) {
        setJobId(data.job_id);
        pollImageStatus(data.job_id);
      }
    } catch (error) {
      console.error('Error generating images:', error);
      setIsGenerating(false);
    }
  };

  const pollImageStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:8000/api/check_unified_status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: jobId, type: 'image' })
        });

        const result = await response.json();

        if (result.status === 'completed' && result.image_urls) {
          setGeneratedImages(result.image_urls);
          setIsGenerating(false);
          clearInterval(interval);
        } else if (result.status === 'failed') {
          setIsGenerating(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    }, 2000);
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Sidebar */}
      <div className="col-span-3 space-y-6">
        {/* Model Selector */}
        <div>
          <label className="text-white font-medium mb-2 block">Select Image Model</label>
          <ModelSelector type="image" selectedModel={imageModel} onModelChange={setImageModel} />
        </div>

        {/* Style Presets */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Style Presets
          </h3>
          <div className="space-y-2">
            {stylePresets.map(preset => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedStyle(preset.id)}
                  className={`w-full p-3 rounded-lg border transition-all ${
                    selectedStyle === preset.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-purple-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{preset.name}</p>
                      <p className="text-xs text-slate-400">{preset.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lighting */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Lighting</h3>
          <div className="grid grid-cols-2 gap-2">
            {lightingPresets.map(preset => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedLighting(preset.id)}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
                    selectedLighting === preset.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="col-span-6 space-y-6">
        {/* Generated Images Display */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-6 min-h-[400px] flex items-center justify-center">
          {generatedImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 w-full">
              {generatedImages.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url} alt={`Generated ${idx + 1}`} className="w-full rounded-lg" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <button className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              {isGenerating ? (
                <>
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                  <p className="text-white">Generating images...</p>
                </>
              ) : (
                <>
                  <Image className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Your images will appear here</p>
                  <p className="text-xs text-slate-500 mt-2">Model: {imageModel.toUpperCase()}</p>
                  <p className="text-xs text-slate-500">Style: {selectedStyle}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Image Prompt Input */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Image Prompt</h3>
          </div>
          <textarea
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Describe your image... (e.g., 'Professional product photography of DFSA dried fruits in elegant packaging')"
            className="w-full h-24 bg-slate-800 text-white rounded-lg p-3 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-slate-400">{imagePrompt.length}/1000 characters</p>
            <button
              onClick={handleEnhancePrompt}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1"
            >
              <Brain className="w-3 h-3" />
              Enhance
            </button>
          </div>
        </div>

        {/* Composition Settings */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Composition</h3>
          <div className="flex gap-2 flex-wrap">
            {compositionRules.map(rule => {
              const Icon = rule.icon;
              return (
                <button
                  key={rule.id}
                  onClick={() => setSelectedComposition(rule.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                    selectedComposition === rule.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {rule.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="col-span-3 space-y-6">
        {/* Reference Assets */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Reference Assets
          </h3>
          <div className="text-center py-6 border-2 border-dashed border-slate-700 rounded-lg">
            <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">0/5 selected</p>
          </div>
        </div>

        {/* Generation Settings */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Generation Settings</h3>

          {/* Number of Images */}
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-2 block">Number of Images</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="4"
                value={numImages}
                onChange={(e) => setNumImages(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-white text-sm font-medium w-8 text-center">{numImages}</span>
            </div>
          </div>

          {/* Quality */}
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-2 block">Quality</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setImageQuality('standard')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  imageQuality === 'standard'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setImageQuality('high')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  imageQuality === 'high'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                High
              </button>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAspectRatio('1:1')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  aspectRatio === '1:1'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                1:1
              </button>
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  aspectRatio === '16:9'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                16:9
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  aspectRatio === '9:16'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                9:16
              </button>
              <button
                onClick={() => setAspectRatio('4:3')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  aspectRatio === '4:3'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                4:3
              </button>
            </div>
          </div>
        </div>

        {/* Prompt Templates */}
        <PromptTemplatesPanel
          model={imageModel}
          onSelectTemplate={handleTemplateSelect}
          onEnhancePrompt={handleEnhancePrompt}
        />

        {/* Generate Button */}
        <button
          onClick={handleGenerateImages}
          disabled={!imagePrompt.trim() || isGenerating}
          className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            !imagePrompt.trim() || isGenerating
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Images...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate Images
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Helper functions for prompt enhancement
function buildEnhancedPrompt(basePrompt: string, settings: any) {
  let enhanced = basePrompt;

  // Add style modifiers
  const styleModifiers: any = {
    product: ', professional product photography, clean background, commercial quality',
    lifestyle: ', natural lifestyle setting, warm and inviting, everyday scene',
    marketing: ', eye-catching marketing visual, bold and modern, promotional style',
    social: ', optimized for social media, engaging and shareable, trendy aesthetic'
  };

  // Add lighting modifiers
  const lightingModifiers: any = {
    studio: ', professional studio lighting, soft shadows, even illumination',
    natural: ', natural lighting, outdoor ambiance, soft and organic',
    golden: ', golden hour lighting, warm tones, dramatic shadows',
    dramatic: ', dramatic lighting, high contrast, moody atmosphere'
  };

  // Add composition modifiers
  const compositionModifiers: any = {
    thirds: ', composed using rule of thirds',
    golden: ', golden ratio composition',
    center: ', centered composition with focal point',
    leading: ', leading lines guiding the eye',
    symmetrical: ', perfectly symmetrical composition'
  };

  if (settings.style && styleModifiers[settings.style]) {
    enhanced += styleModifiers[settings.style];
  }

  if (settings.lighting && lightingModifiers[settings.lighting]) {
    enhanced += lightingModifiers[settings.lighting];
  }

  if (settings.composition && compositionModifiers[settings.composition]) {
    enhanced += compositionModifiers[settings.composition];
  }

  // Model-specific enhancements
  if (settings.model === 'dalle3' && !enhanced.toLowerCase().startsWith('a ') && !enhanced.toLowerCase().startsWith('an ') && !enhanced.toLowerCase().startsWith('the ')) {
    enhanced = 'A ' + enhanced;
  }

  if (settings.model === 'imagen4') {
    enhanced += ', photorealistic, high detail, professional photography';
  }

  return enhanced;
}

async function enhancePromptWithAPI(prompt: string, model: string, settings: any) {
  // This would call your backend enhance endpoint
  // For now, we'll use the buildEnhancedPrompt function
  return buildEnhancedPrompt(prompt, { ...settings, model });
}

// Main Studio Page Component
export default function StudioPage() {
  const [activeTab, setActiveTab] = useState('create');
  const [videoModel, setVideoModel] = useState('veo3');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [vfxTemplate, setVfxTemplate] = useState<string | null>(null);
  const [cameraMovement, setCameraMovement] = useState<string | null>(null);
  const [duration, setDuration] = useState(5);
  const [quality, setQuality] = useState('standard');
  const [lighting, setLighting] = useState('studio');
  const [depthOfField, setDepthOfField] = useState('moderate');
  const [tone, setTone] = useState('neutral');
  const [noTextOrLogos, setNoTextOrLogos] = useState(true);
  const [selectedAssets, setSelectedAssets] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle quality settings change
  const handleQualitySettingsChange = (setting: string, value: any) => {
    switch(setting) {
      case 'quality': setQuality(value); break;
      case 'lighting': setLighting(value); break;
      case 'depthOfField': setDepthOfField(value); break;
      case 'tone': setTone(value); break;
      case 'noTextOrLogos': setNoTextOrLogos(value); break;
    }
  };

  // Handle VFX selection (mutual exclusion with camera movement)
  const handleVfxSelect = (vfxId: string) => {
    if (vfxTemplate === vfxId) {
      setVfxTemplate(null);
    } else {
      setVfxTemplate(vfxId);
      setCameraMovement(null); // Clear camera movement when VFX is selected
    }
  };

  // Handle camera movement selection (mutual exclusion with VFX)
  const handleCameraSelect = (movementId: string) => {
    if (cameraMovement === movementId) {
      setCameraMovement(null);
    } else {
      setCameraMovement(movementId);
      setVfxTemplate(null); // Clear VFX when camera movement is selected
    }
  };

  // Handle template selection for video
  const handleVideoTemplateSelect = (template: string) => {
    setVideoPrompt(template);
  };

  // Enhance video prompt
  const handleEnhanceVideoPrompt = async () => {
    if (!videoPrompt) return;

    // Build enhanced prompt with all settings
    let enhanced = videoPrompt;

    // Add VFX or camera movement to prompt if selected
    if (vfxTemplate) {
      const vfx = vfxTemplates.find(v => v.id === vfxTemplate);
      if (vfx) {
        enhanced += `, ${vfx.prompt}`;
      }
    } else if (cameraMovement) {
      const camera = cameraMovements.find(c => c.id === cameraMovement);
      if (camera) {
        enhanced += `, camera movement: ${camera.name.toLowerCase()}`;
      }
    }

    // Add quality settings to prompt
    const qualityModifiers: any = {
      studio: 'professional studio lighting',
      natural: 'natural lighting',
      golden: 'golden hour lighting',
      dramatic: 'dramatic lighting'
    };

    if (lighting && qualityModifiers[lighting]) {
      enhanced += `, ${qualityModifiers[lighting]}`;
    }

    // Add depth of field
    enhanced += `, ${depthOfField} depth of field`;

    // Add tone
    enhanced += `, ${tone} color tone`;

    if (noTextOrLogos) {
      enhanced += ', no text or logos';
    }

    setVideoPrompt(enhanced);
  };

  // Generate video
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;

    setIsGenerating(true);
    setProgress(0);
    setGeneratedVideo(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 1000);

    try {
      const response = await fetch('http://localhost:8000/api/unified_generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          model: videoModel,
          client: 'DFSA',
          prompt: videoPrompt,
          duration: duration,
          camera_movement: cameraMovement,
          vfx_template: vfxTemplate,
          quality: quality,
          reference_images: selectedAssets.map(a => a.key),
          style_presets: {
            lighting,
            depthOfField,
            tone,
            noTextOrLogos
          }
        })
      });

      const data = await response.json();

      if (data.job_id) {
        // Poll for status
        const checkStatus = setInterval(async () => {
          const statusResponse = await fetch('http://localhost:8000/api/check_unified_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_id: data.job_id, type: 'video' })
          });

          const statusData = await statusResponse.json();

          if (statusData.status === 'completed') {
            clearInterval(checkStatus);
            clearInterval(progressInterval);
            setProgress(100);
            setGeneratedVideo(statusData);
            setIsGenerating(false);
          } else if (statusData.status === 'failed') {
            clearInterval(checkStatus);
            clearInterval(progressInterval);
            setIsGenerating(false);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error generating video:', error);
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
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

              {/* Quality Settings */}
              <QualitySettingsPanel
                quality={quality}
                lighting={lighting}
                depthOfField={depthOfField}
                tone={tone}
                noTextOrLogos={noTextOrLogos}
                onSettingsChange={handleQualitySettingsChange}
              />

              {/* Camera Controls (disabled when VFX is selected) */}
              <div className={`bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 ${vfxTemplate ? 'opacity-50' : ''}`}>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Camera Movement
                  {vfxTemplate && <span className="text-xs text-yellow-400">(Disabled - VFX Active)</span>}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {cameraMovements.slice(0, 6).map(movement => (
                    <button
                      key={movement.id}
                      onClick={() => handleCameraSelect(movement.id)}
                      disabled={!!vfxTemplate}
                      className={`p-2 rounded-lg text-xs transition-all ${
                        cameraMovement === movement.id
                          ? 'bg-purple-500 text-white'
                          : vfxTemplate
                          ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-lg mb-1 block">{movement.icon}</span>
                      {movement.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="col-span-6 space-y-6">
              {/* Video Preview Area */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-6 min-h-[400px] flex items-center justify-center">
                {generatedVideo ? (
                  <div className="relative w-full">
                    <video
                      ref={videoRef}
                      src={generatedVideo.video_url}
                      className="w-full rounded-lg"
                      controls
                      autoPlay={false}
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    {isGenerating ? (
                      <>
                        <div className="relative w-24 h-24 mx-auto mb-4">
                          <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                          <div
                            className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-semibold">{Math.round(progress)}%</span>
                          </div>
                        </div>
                        <p className="text-white">Generating video...</p>
                        <p className="text-xs text-slate-400 mt-2">Model: {videoModel.toUpperCase()}</p>
                      </>
                    ) : (
                      <>
                        <Film className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">Your video will appear here</p>
                        <p className="text-xs text-slate-500 mt-2">Duration: {duration} seconds</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Video Prompt Input */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">Video Prompt</h3>
                </div>
                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="Describe your video scene..."
                  className="w-full h-24 bg-slate-800 text-white rounded-lg p-3 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-slate-400">{videoPrompt.length}/1000 characters</p>
                  <button
                    onClick={handleEnhanceVideoPrompt}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <Brain className="w-3 h-3" />
                    Enhance
                  </button>
                </div>
              </div>

              {/* VFX Templates (disabled when camera movement is selected) */}
              <div className={`bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 ${cameraMovement ? 'opacity-50' : ''}`}>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  VFX Templates
                  {cameraMovement && <span className="text-xs text-yellow-400">(Disabled - Camera Active)</span>}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {vfxTemplates.slice(0, 6).map(vfx => (
                    <button
                      key={vfx.id}
                      onClick={() => handleVfxSelect(vfx.id)}
                      disabled={!!cameraMovement}
                      className={`p-3 rounded-lg transition-all ${
                        vfxTemplate === vfx.id
                          ? 'bg-purple-500 text-white'
                          : cameraMovement
                          ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-2xl mb-1 block">{vfx.icon}</span>
                      <p className="text-xs">{vfx.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Slider */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration
                  </h3>
                  <span className="text-white font-medium">{duration}s</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="10"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>5s</span>
                  <span>10s</span>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="col-span-3 space-y-6">
              {/* Reference Assets */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Reference Assets
                </h3>
                <div className="text-center py-6 border-2 border-dashed border-slate-700 rounded-lg">
                  <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">0/5 selected</p>
                  <button className="mt-2 text-xs text-purple-400 hover:text-purple-300">
                    Browse Assets
                  </button>
                </div>
              </div>

              {/* Prompt Templates & Tips (replacing Auto-Resize) */}
              <PromptTemplatesPanel
                model={videoModel}
                onSelectTemplate={handleVideoTemplateSelect}
                onEnhancePrompt={handleEnhanceVideoPrompt}
              />

              {/* Generation Info */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Generation Info</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model:</span>
                    <span className="text-white">{videoModel.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-white">{duration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quality:</span>
                    <span className="text-white">{quality === 'high' ? '1080p' : '720p'}</span>
                  </div>
                  {vfxTemplate && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">VFX:</span>
                      <span className="text-purple-400">
                        {vfxTemplates.find(v => v.id === vfxTemplate)?.name}
                      </span>
                    </div>
                  )}
                  {cameraMovement && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Camera:</span>
                      <span className="text-purple-400">
                        {cameraMovements.find(c => c.id === cameraMovement)?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <div className="space-y-3">
                <motion.button
                  onClick={handleGenerateVideo}
                  disabled={!videoPrompt.trim() || isGenerating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    !videoPrompt.trim() || isGenerating
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