'use client';
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Video as VideoIcon, Image as ImageIcon, Settings, Home, Sparkles, Upload, Loader2,
  Play, Pause, Download, ChevronRight, ChevronDown, Camera, Film,
  Zap, Eye, Brain, Layers, Palette, Sun, Moon, Cloud, Sunrise,
  Wind, Droplets, Square, Grid3x3, Monitor, FileVideo, Clock,
  Check, X, Info, AlertCircle, Sliders, BookOpen, Plus, Copy,
  RefreshCw, Star, HelpCircle, Lightbulb, Hash, Type, Move,
  Maximize2, Minimize2, RotateCw, Tv, Smartphone, Circle, Split,
  Package, Volume2, Coffee, Trash2, FileImage
} from 'lucide-react';

// ======= Data (copied from studio page) =======
export const VIDEO_MODELS = [
  { id: 'veo3', name: 'Veo 3', icon: '🎬', badge: 'Preview', description: "Google's cinematic AI", maxDuration: 8, minDuration: 1 },
  { id: 'runway', name: 'RunwayML', icon: '🎥', badge: 'Gen-4', description: 'Creative video generation', maxDuration: 16, minDuration: 1 },
  { id: 'hailuo', name: 'Hailuo', icon: '🎞️', badge: 'Coming Soon', description: 'MiniMax platform', maxDuration: 6, minDuration: 1, disabled: true }
];

export const IMAGE_MODELS = [
  { id: 'dalle3', name: 'DALL-E 3', icon: '🎨', badge: 'Creative', description: "OpenAI's creative model" },
  { id: 'imagen4', name: 'Imagen 4', icon: '📸', badge: 'Fast', description: "Google's photorealistic model" },
  { id: 'runway', name: 'RunwayML', icon: '🖼️', badge: 'Gen-4', description: 'Stylized imagery' }
];

export const vfxTemplates = [
  { id: 'earth-zoom-out', name: 'Earth Zoom Out', description: 'Pull back to space', video: '/vfx/earth-zoom-out.mp4', prompt: "dramatic zoom out from ground level to Earth's orbit, pulling back to reveal the planet from space" },
  { id: 'disintegrate',   name: 'Disintegrate',   description: 'Dissolve to particles', video: '/vfx/disintegrate.mp4',   prompt: 'object or person dissolving into floating particles that drift away and disappear' },
  { id: 'eyes-in',        name: 'Eyes In',        description: 'Zoom into the eyes',   video: '/vfx/eyes-in.mp4',        prompt: "dramatic zoom into the subject's eyes, revealing reflection or transitioning through the pupil" },
  { id: 'face-punch',     name: 'Face Punch',     description: 'Bullet-time impact',   video: '/vfx/face-punch.mp4',     prompt: 'slow motion punch impact with ripple effect, bullet-time style with debris and particles' },
  { id: 'lens-crack',     name: 'Lens Crack',     description: 'Glass shatter effect', video: '/vfx/lens-crack.mp4',     prompt: 'camera lens or glass cracking and shattering with light refraction through the cracks' },
  { id: 'paint-splash',   name: 'Paint Splash',   description: 'Liquid color burst',   video: '/vfx/paint-splash.mp4',   prompt: 'explosive paint or liquid color splash, vibrant colors bursting and mixing in slow motion' }
];

export const cameraMovements = [
  { id: 'bullet-time', name: 'Bullet Time', description: 'Slow motion with rotation', video: '/cam/bullet-time.mp4' },
  { id: 'crane-down',  name: 'Crane Down',  description: 'Descend toward subject',   video: '/cam/crane-down.mp4' },
  { id: 'crane-up',    name: 'Crane Up',    description: 'Rise above subject',       video: '/cam/crane-up.mp4' },
  { id: 'dolly-in',    name: 'Dolly In',    description: 'Move toward subject',      video: '/cam/dolly-in.mp4' },
  { id: 'dolly-out',   name: 'Dolly Out',   description: 'Move away from subject',   video: '/cam/dolly-out.mp4' },
  { id: 'focus-shift', name: 'Focus Shift', description: 'Change focus point',       video: '/cam/focus-shift.mp4' },
  { id: 'fpv-drone',   name: 'FPV Drone',   description: 'First-person drone view',  video: '/cam/fpv-drone.mp4' },
  { id: 'lazy-susan',  name: 'Lazy Susan',  description: 'Smooth circular rotation', video: '/cam/lazy-susan.mp4' }
];

export const PROMPT_TEMPLATES: Record<string, any[]> = {
  veo3: [
    { category: 'Cinematic', template: "Cinematic shot: [subject], dramatic lighting, 4K quality, smooth camera movement", icon: Film },
    { category: 'Product',   template: "[Product] rotating slowly, professional studio lighting, pristine white background", icon: Package },
    { category: 'Audio Cue', template: "Audio: [sound effect description]. Visual: [scene description]", icon: Volume2 },
    { category: 'Nature',    template: "Time-lapse of [natural phenomenon], golden hour lighting, wide angle lens", icon: Sunrise }
  ],
  dalle3: [
    { category: 'Professional', template: 'A professional photograph of [subject], high-quality, detailed, sharp focus', icon: Camera },
    { category: 'Artistic',     template: 'An artistic rendering of [subject] in the style of [art movement]', icon: Palette },
    { category: 'Marketing',    template: 'A modern marketing banner featuring [product], minimalist design, brand colors', icon: Monitor }
  ],
  imagen4: [
    { category: 'Photorealistic', template: 'Photorealistic image of [subject], commercial photography, perfect lighting', icon: Camera },
    { category: 'Product Shot',   template: 'Premium [product] photography, elegant packaging, lifestyle setting', icon: Package },
    { category: 'Food',           template: 'Appetizing [food item], professional food photography, natural lighting', icon: Coffee }
  ],
  runway: [
    { category: 'Dynamic',  template: '[Subject] with dynamic motion, energetic movement, cinematic quality', icon: Zap },
    { category: 'Stylized', template: 'Stylized [scene], artistic interpretation, bold colors and composition', icon: Palette }
  ]
};

export const PROMPT_TIPS: Record<string, string[]> = {
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

export const stylePresets = [
  { id: 'product',   name: 'Product Photography', icon: Camera, description: 'Clean, professional product shots' },
  { id: 'lifestyle', name: 'Lifestyle Shot',      icon: Sun,    description: 'Natural, everyday scenes' },
  { id: 'marketing', name: 'Marketing Banner',    icon: Monitor,description: 'Eye-catching promotional' },
  { id: 'social',    name: 'Social Media Post',   icon: Grid3x3,description: 'Optimized for social' }
];

export const compositionRules = [
  { id: 'thirds',     name: 'Rule of Thirds', icon: Grid3x3 },
  { id: 'golden',     name: 'Golden Ratio',   icon: Circle },
  { id: 'center',     name: 'Center Focus',   icon: Circle },
  { id: 'leading',    name: 'Leading Lines',  icon: Move },
  { id: 'symmetrical',name: 'Symmetrical',    icon: Split }
];

export const lightingPresets = [
  { id: 'studio',   name: 'Studio',      icon: Sun },
  { id: 'natural',  name: 'Natural',     icon: Cloud },
  { id: 'golden',   name: 'Golden Hour', icon: Sunrise },
  { id: 'dramatic', name: 'Dramatic',    icon: Moon }
];

export const depthOfFieldPresets = [
  { id: 'shallow',  name: 'Shallow' },
  { id: 'moderate', name: 'Moderate' },
  { id: 'deep',     name: 'Deep' }
];

export const tonePresets = [
  { id: 'neutral', name: 'Neutral' },
  { id: 'warm',    name: 'Warm' },
  { id: 'cool',    name: 'Cool' }
];

// ======= Visual background =======
export const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950" />
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl animate-pulse delay-1000" />
    </div>
  </div>
);

// ======= Shared UI pieces (copied 1:1) =======
export function ModelSelector({ type, selectedModel, onModelChange }:{type:'video'|'image',selectedModel:string,onModelChange:(id:string)=>void}) {
  const models = type === 'video' ? VIDEO_MODELS : IMAGE_MODELS;
  return (
    <div className="space-y-2">
      {models.map((model) => (
        <button
          key={model.id}
          onClick={() => !model.disabled && onModelChange(model.id)}
          disabled={!!(model as any).disabled}
          className={`w-full p-3 rounded-lg border transition-all ${
            selectedModel === model.id
              ? 'border-purple-500 bg-purple-500/10'
              : (model as any).disabled
                ? 'border-slate-700 bg-slate-900/50 opacity-50 cursor-not-allowed'
                : 'border-slate-700 bg-slate-900/50 hover:border-purple-500/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{(model as any).icon}</span>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{model.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  (model as any).badge === 'Coming Soon'
                    ? 'bg-slate-700 text-slate-400'
                    : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {(model as any).badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{(model as any).description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function ReferenceImageUpload({ selectedFiles, onFilesChange }:{selectedFiles:File[], onFilesChange:(f:File[])=>void}) {
  const fileInputRef = useRef<HTMLInputElement|null>(null);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file:any) => file.type.startsWith('image/'));
    onFilesChange([...(selectedFiles||[]), ...imageFiles].slice(0, 5));
  };
  const removeFile = (index:number) => onFilesChange(selectedFiles.filter((_, i) => i !== index));
  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Layers className="w-4 h-4" /> Reference Images
      </h3>
      {selectedFiles?.length > 0 ? (
        <div className="space-y-2">
          {selectedFiles.map((file:any, index:number) => (
            <div key={index} className="flex items-center gap-2 bg-slate-800 rounded-lg p-2">
              <img src={URL.createObjectURL(file)} alt={file.name} className="w-10 h-10 rounded object-cover" />
              <span className="text-xs text-slate-300 flex-1 truncate">{file.name}</span>
              <button onClick={() => removeFile(index)} className="p-1 hover:bg-slate-700 rounded transition-colors">
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ))}
          {selectedFiles.length < 5 && (
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 border-2 border-dashed border-slate-700 rounded-lg text-xs text-slate-400 hover:border-purple-500/50 hover:text-purple-400 transition-colors">
              Add More ({5 - selectedFiles.length} remaining)
            </button>
          )}
        </div>
      ) : (
        <div onClick={() => fileInputRef.current?.click()} className="text-center py-6 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-purple-500/50 transition-colors">
          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Click to upload</p>
          <p className="text-xs text-slate-500 mt-1">Max 5 images</p>
        </div>
      )}
      <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
    </div>
  );
}

export function VideoTimeline({ videoRef, duration, isPlaying, onPlayPause, onRestart }:{videoRef: any, duration:number, isPlaying:boolean, onPlayPause:()=>void, onRestart:()=>void}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration);

  useEffect(() => {
    const video = videoRef.current as HTMLVideoElement | null;
    if (!video) return;
    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setVideoDuration(video.duration);
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    if (video.duration) updateDuration();
    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [videoRef]);

  const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Clock className="w-4 h-4" /> Timeline</h3>
        <div className="flex items-center gap-2">
          <button onClick={onPlayPause} className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 transition-colors">
            {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
          </button>
          <button onClick={onRestart} className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 transition-colors">
            <RotateCw className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      <div className="relative">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{currentTime.toFixed(1)}s</span>
          <span>{videoDuration.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}

export function VFXSelector({ selectedVfx, onVfxSelect, disabled }:{selectedVfx:string|null, onVfxSelect:(id:string)=>void, disabled:boolean}) {
  return (
    <div className={`bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 ${disabled ? 'opacity-50' : ''}`}>
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Zap className="w-4 h-4" /> VFX Templates {disabled && <span className="text-xs text-yellow-400">(Disabled - Camera Active)</span>}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {vfxTemplates.map(vfx => (
          <div key={vfx.id} className="relative group">
            <button
              onClick={() => onVfxSelect(vfx.id)}
              disabled={disabled}
              className={`w-full p-4 rounded-lg transition-all relative overflow-hidden flex flex-col items-center justify-center text-center ${
                selectedVfx === vfx.id ? 'bg-purple-500 text-white' :
                disabled ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <video src={vfx.video} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-30" />
              <div className="relative z-10">
                <p className="text-xs font-medium">{vfx.name}</p>
                <p className="text-xs opacity-75 mt-1">{vfx.description}</p>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CameraMovementSelector({ selectedMovement, onMovementSelect, disabled, vfxActive }:{selectedMovement:string|null,onMovementSelect:(id:string)=>void,disabled:boolean,vfxActive:boolean}) {
  return (
    <div className={`bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 ${vfxActive ? 'opacity-50' : ''}`}>
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <VideoIcon className="w-4 h-4" /> Camera Movement {vfxActive && <span className="text-xs text-yellow-400">(Disabled - VFX Active)</span>}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {cameraMovements.map(m => (
          <div key={m.id} className="relative group">
            <button
              onClick={() => onMovementSelect(m.id)}
              disabled={vfxActive}
              className={`w-full p-4 rounded-lg transition-all relative overflow-hidden flex flex-col items-center justify-center text-center ${
                selectedMovement === m.id ? 'bg-purple-500 text-white' :
                vfxActive ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <video src={m.video} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-30" />
              <div className="relative z-10">
                <p className="text-xs font-medium">{m.name}</p>
                <p className="text-xs opacity-75 mt-1">{m.description}</p>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PromptTemplatesPanel({ model, onSelectTemplate, onEnhancePrompt }:{model:string,onSelectTemplate:(t:string)=>void,onEnhancePrompt:()=>void}) {
  const [showTips, setShowTips] = useState(false);
  const templates = PROMPT_TEMPLATES[model] || PROMPT_TEMPLATES.veo3;
  const tips = PROMPT_TIPS[model] || PROMPT_TIPS.veo3;
  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><BookOpen className="w-4 h-4" /> Prompt Helper</h3>
        <button onClick={onEnhancePrompt} className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Enhance Prompt
        </button>
      </div>
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">Quick Templates</p>
          <button onClick={() => setShowTips(!showTips)} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" /> {showTips ? 'Hide' : 'Show'} Tips
          </button>
        </div>
        {templates.map((t, idx) => {
          const Icon = t.icon;
          return (
            <button key={idx} onClick={() => onSelectTemplate(t.template)} className="w-full p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-left transition-all group">
              <div className="flex items-start gap-2">
                <Icon className="w-4 h-4 text-purple-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-white">{t.category}</p>
                  <p className="text-xs text-slate-400 mt-0.5 group-hover:text-slate-300">{t.template}</p>
                </div>
                <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {showTips && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-3 border-t border-slate-700">
              <p className="text-xs font-medium text-white mb-2 flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Model Tips</p>
              <div className="space-y-1">
                {tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2"><span className="text-purple-400 text-xs">•</span><p className="text-xs text-slate-400">{tip}</p></div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function QualitySettingsPanel({ quality, lighting, depthOfField, tone, noTextOrLogos, onSettingsChange }:{
  quality:'standard'|'high', lighting:string, depthOfField:string, tone:string, noTextOrLogos:boolean, onSettingsChange:(k:string,v:any)=>void
}) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Sliders className="w-4 h-4" /> Quality Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Quality</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onSettingsChange('quality', 'standard')} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${quality === 'standard' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Standard</button>
            <button onClick={() => onSettingsChange('quality', 'high')} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${quality === 'high' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>High Quality</button>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Lighting</label>
          <div className="grid grid-cols-2 gap-2">
            {lightingPresets.map(p => {
              const Icon = p.icon;
              return (
                <button key={p.id} onClick={() => onSettingsChange('lighting', p.id)} className={`p-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${lighting === p.id ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  <Icon className="w-3 h-3" /> {p.name}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Depth of Field</label>
          <div className="grid grid-cols-3 gap-2">
            {depthOfFieldPresets.map(p => (
              <button key={p.id} onClick={() => onSettingsChange('depthOfField', p.id)} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${depthOfField === p.id ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{p.name}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Tone</label>
          <div className="grid grid-cols-3 gap-2">
            {tonePresets.map(p => (
              <button key={p.id} onClick={() => onSettingsChange('tone', p.id)} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${tone === p.id ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{p.name}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-400">No Text or Logos</label>
          <button onClick={() => onSettingsChange('noTextOrLogos', !noTextOrLogos)} className={`relative w-10 h-5 rounded-full transition-colors ${noTextOrLogos ? 'bg-purple-500' : 'bg-slate-700'}`}>
            <motion.div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full" animate={{ x: noTextOrLogos ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ======= Helpers (copied) =======
export function buildEnhancedPrompt(basePrompt:string, settings:any) {
  let enhanced = basePrompt;
  const styleModifiers = {
    product: ', professional product photography, clean background, commercial quality',
    lifestyle: ', natural lifestyle setting, warm and inviting, everyday scene',
    marketing: ', eye-catching marketing visual, bold and modern, promotional style',
    social: ', optimized for social media, engaging and shareable, trendy aesthetic'
  } as Record<string, string>;

  const lightingModifiers = {
    studio: ', professional studio lighting, soft shadows, even illumination',
    natural: ', natural lighting, outdoor ambiance, soft and organic',
    golden: ', golden hour lighting, warm tones, dramatic shadows',
    dramatic: ', dramatic lighting, high contrast, moody atmosphere'
  } as Record<string, string>;

  const compositionModifiers = {
    thirds: ', composed using rule of thirds',
    golden: ', golden ratio composition',
    center: ', centered composition with focal point',
    leading: ', leading lines guiding the eye',
    symmetrical: ', perfectly symmetrical composition'
  } as Record<string, string>;

  if (settings.style && styleModifiers[settings.style]) enhanced += styleModifiers[settings.style];
  if (settings.lighting && lightingModifiers[settings.lighting]) enhanced += lightingModifiers[settings.lighting];
  if (settings.composition && compositionModifiers[settings.composition]) enhanced += compositionModifiers[settings.composition];

  if (settings.model === 'dalle3' && !enhanced.toLowerCase().startsWith('a ') && !enhanced.toLowerCase().startsWith('an ') && !enhanced.toLowerCase().startsWith('the '))
    enhanced = 'A ' + enhanced;
  if (settings.model === 'imagen4') enhanced += ', photorealistic, high detail, professional photography';
  return enhanced;
}

export async function enhancePromptWithAPI(prompt:string, model:string, settings:any) {
  // mirrors your local helper behavior
  return buildEnhancedPrompt(prompt, { ...settings, model });
}
