'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Film, Pause, Play, Download, Brain, Clock, RotateCw, Trash2 } from 'lucide-react';
import {
  VIDEO_MODELS, vfxTemplates, cameraMovements,
  QualitySettingsPanel, PromptTemplatesPanel
} from './StudioShared';

/** Local, Create-only: compact dropdown for model selection */
function VideoModelDropdown({
  value,
  onChange
}: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
      <label className="text-sm font-semibold text-white mb-2 block">Select Video Model</label>
      <select
        className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {VIDEO_MODELS.map(m => (
          <option key={m.id} value={m.id} disabled={(m as any).disabled}>
            {m.name} {m.badge ? `• ${m.badge}` : ''}
          </option>
        ))}
      </select>
      <p className="text-xs text-slate-400 mt-2">
        {VIDEO_MODELS.find(m => m.id === value)?.description}
      </p>
    </div>
  );
}

/** Local, Create-only: “Browse Assets” card with purple CTA (max 5 images) */
function ReferenceAssets({
  files,
  onChange
}: { files: File[]; onChange: (f: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const next = [...files, ...Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))]
      .slice(0, 5);
    onChange(next);
  };

  const removeAt = (idx: number) => onChange(files.filter((_, i) => i !== idx));

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Reference Assets</h3>

      <div
        className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500/60 transition-colors"
        onClick={handlePick}
        role="button"
      >
        <div className="text-slate-400 text-sm mb-2">{files.length}/5 selected</div>
        <button
          type="button"
          onClick={handlePick}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium"
        >
          Browse Assets
        </button>
        <p className="text-xs text-slate-500 mt-2">PNG • JPG • WEBP (max 5)</p>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {files.map((f, i) => (
            <div key={i} className="relative group">
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                className="w-full h-20 object-cover rounded-lg"
              />
              <button
                onClick={(e) => { e.stopPropagation(); removeAt(i); }}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded hover:bg-black/80"
                aria-label="Remove"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="hidden"
      />
    </div>
  );
}

/** Local, Create-only: larger tiles for Camera Movement */
function BigCameraSelector({
  selected,
  onSelect,
  disabled
}: { selected: string | null; onSelect: (id: string) => void; disabled: boolean }) {
  return (
    <div className={`bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 ${disabled ? 'opacity-50' : ''}`}>
      <h3 className="text-sm font-semibold text-white mb-3">Camera Movement</h3>
      <div className="grid grid-cols-2 gap-3">
        {cameraMovements.map(m => (
          <button
            key={m.id}
            onClick={() => !disabled && onSelect(m.id)}
            disabled={disabled}
            className={`relative overflow-hidden rounded-lg text-left transition-all
              ${selected === m.id ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
              h-28 md:h-32`}
          >
            <video
              src={m.video}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
            <div className="relative z-10 p-3">
              <div className="text-sm font-medium">{m.name}</div>
              <div className="text-xs opacity-75">{m.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Local, Create-only: larger tiles for VFX */
function BigVFXSelector({
  selected,
  onSelect,
  disabled
}: { selected: string | null; onSelect: (id: string) => void; disabled: boolean }) {
  return (
    <div className={`bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 ${disabled ? 'opacity-50' : ''}`}>
      <h3 className="text-sm font-semibold text-white mb-3">VFX Templates</h3>
      <div className="grid grid-cols-3 gap-3">
        {vfxTemplates.map(vfx => (
          <button
            key={vfx.id}
            onClick={() => !disabled && onSelect(vfx.id)}
            disabled={disabled}
            className={`relative overflow-hidden rounded-lg text-left transition-all
              ${selected === vfx.id ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
              h-28 md:h-32`}
          >
            <video
              src={vfx.video}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
            <div className="relative z-10 p-3">
              <div className="text-sm font-medium">{vfx.name}</div>
              <div className="text-xs opacity-75">{vfx.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Create-only: small info card */
function GenerationInfo({
  model, duration, quality, refs
}: { model: string; duration: number; quality: string; refs: number }) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Generation Info</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-slate-400">Model</span><span className="text-white">{model.toUpperCase()}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Duration</span><span className="text-white">{duration}s</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Quality</span><span className="text-white capitalize">{quality}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">References</span><span className="text-white">{refs}</span></div>
      </div>
    </div>
  );
}

/** Combined Timeline + Duration panel (in the same box) */
function TimelineAndDuration({
  videoRef,
  duration,
  minDuration,
  maxDuration,
  isPlaying,
  onPlayPause,
  onRestart,
  onChangeDuration
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  duration: number;
  minDuration: number;
  maxDuration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onRestart: () => void;
  onChangeDuration: (v: number) => void;
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDur, setVideoDur] = useState<number>(duration);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) { setVideoDur(duration); setCurrentTime(0); return; }
    const updateTime = () => setCurrentTime(v.currentTime);
    const updateDur = () => setVideoDur(v.duration || duration);
    v.addEventListener('timeupdate', updateTime);
    v.addEventListener('loadedmetadata', updateDur);
    if (v.duration) updateDur();
    return () => {
      v.removeEventListener('timeupdate', updateTime);
      v.removeEventListener('loadedmetadata', updateDur);
    };
  }, [videoRef, duration]);

  const progress = (videoDur > 0) ? (currentTime / videoDur) * 100 : 0;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4" /> Timeline
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={onPlayPause} className="p-1.5 bg-slate-800 rounded hover:bg-slate-700">
            {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
          </button>
          <button onClick={onRestart} className="p-1.5 bg-slate-800 rounded hover:bg-slate-700">
            <RotateCw className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Gradient progress bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>{currentTime.toFixed(1)}s</span>
        <span>{(videoDur || duration).toFixed(1)}s</span>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-800 my-4" />

      {/* Duration slider */}
      <div className="">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-white">Duration</h4>
          <span className="text-xs text-slate-400">Max: {maxDuration}s ({videoRef.current ? 'detected' : 'model'})</span>
        </div>
        <input
          type="range"
          min={minDuration}
          max={maxDuration}
          step={1}
          value={duration}
          onChange={(e) => onChangeDuration(parseInt(e.target.value))}
          className="w-full accent-purple-500"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{minDuration}s</span>
          <span className="text-white">{duration}s</span>
          <span>{maxDuration}s</span>
        </div>
      </div>
    </div>
  );
}

export default function CreateTab() {
  const [videoModel, setVideoModel] = useState('veo3');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [vfxTemplate, setVfxTemplate] = useState<string | null>(null);
  const [cameraMovement, setCameraMovement] = useState<string | null>(null);
  const [duration, setDuration] = useState(5);
  const [quality, setQuality] = useState<'standard' | 'high'>('standard');
  const [lighting, setLighting] = useState('studio');
  const [depthOfField, setDepthOfField] = useState('moderate');
  const [tone, setTone] = useState('neutral');
  const [noTextOrLogos, setNoTextOrLogos] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentModel = VIDEO_MODELS.find(m => m.id === videoModel);
  const maxDuration = currentModel?.maxDuration ?? 8;
  const minDuration = currentModel?.minDuration ?? 1;

  useEffect(() => {
    if (duration > maxDuration) setDuration(maxDuration);
    if (duration < minDuration) setDuration(minDuration);
  }, [videoModel, maxDuration, minDuration]);

  const handleQualitySettingsChange = (setting: string, value: any) => {
    if (setting === 'quality') setQuality(value);
    if (setting === 'lighting') setLighting(value);
    if (setting === 'depthOfField') setDepthOfField(value);
    if (setting === 'tone') setTone(value);
    if (setting === 'noTextOrLogos') setNoTextOrLogos(value);
  };

  const handleVfxSelect = (id: string) => {
    if (vfxTemplate === id) setVfxTemplate(null);
    else { setVfxTemplate(id); setCameraMovement(null); }
  };
  const handleCameraSelect = (id: string) => {
    if (cameraMovement === id) setCameraMovement(null);
    else { setCameraMovement(id); setVfxTemplate(null); }
  };

  const handleEnhanceVideoPrompt = async () => {
    if (!videoPrompt) return;
    let enhanced = videoPrompt;
    if (vfxTemplate) {
      const vfx = vfxTemplates.find(v => v.id === vfxTemplate);
      if (vfx) enhanced += `, ${vfx.prompt}`;
    } else if (cameraMovement) {
      const cam = cameraMovements.find(c => c.id === cameraMovement);
      if (cam) enhanced += `, camera movement: ${cam.name.toLowerCase()}`;
    }
    const qualityModifiers: Record<string, string> = {
      studio: 'professional studio lighting',
      natural: 'natural lighting',
      golden: 'golden hour lighting',
      dramatic: 'dramatic lighting'
    };
    if (qualityModifiers[lighting]) enhanced += `, ${qualityModifiers[lighting]}`;
    enhanced += `, ${depthOfField} depth of field, ${tone} color tone`;
    if (noTextOrLogos) enhanced += ', no text or logos';
    setVideoPrompt(enhanced);
  };

  const handlePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) v.pause(); else v.play();
    setIsPlaying(!isPlaying);
  };
  const handleRestart = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    if (!isPlaying) { v.play(); setIsPlaying(true); }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;
    setIsGenerating(true);
    setProgress(0);
    setGeneratedVideo(null);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + 10;
      });
    }, 1000);

    try {
      const referenceImages = await Promise.all(
        selectedFiles.map(f => new Promise<string>((resolve) => {
          const r = new FileReader(); r.onloadend = () => resolve(r.result as string); r.readAsDataURL(f);
        }))
      );

      const res = await fetch('http://localhost:8000/api/unified_generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          model: videoModel,
          client: 'DFSA',
          prompt: videoPrompt,
          duration,
          camera_movement: cameraMovement,
          vfx_template: vfxTemplate,
          quality,
          reference_images: referenceImages,
          style_presets: { lighting, depthOfField, tone, noTextOrLogos }
        })
      });
      const data = await res.json();

      if (data.job_id) {
        const poll = setInterval(async () => {
          const r = await fetch('http://localhost:8000/api/check_status', { // <<< FIXED ENDPOINT
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_id: data.job_id, type: 'video' })
          });
          if (!r.ok) return; // allow retry on next tick
          const status = await r.json();
          if (status.status === 'completed') {
            clearInterval(poll);
            clearInterval(progressInterval);
            setProgress(100);
            setGeneratedVideo(status);
            setIsGenerating(false);
            setIsPlaying(false);
          } else if (status.status === 'failed') {
            clearInterval(poll);
            clearInterval(progressInterval);
            setIsGenerating(false);
          }
        }, 2000);
      } else {
        clearInterval(progressInterval);
        setIsGenerating(false);
      }
    } catch {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left column */}
      <div className="col-span-3 space-y-6">
        <VideoModelDropdown value={videoModel} onChange={setVideoModel} />

        <QualitySettingsPanel
          quality={quality}
          lighting={lighting}
          depthOfField={depthOfField}
          tone={tone}
          noTextOrLogos={noTextOrLogos}
          onSettingsChange={handleQualitySettingsChange}
        />

        {/* Larger camera tiles; disabled when VFX is active */}
        <BigCameraSelector
          selected={cameraMovement}
          onSelect={handleCameraSelect}
          disabled={!!vfxTemplate}
        />
      </div>

      {/* Middle column */}
      <div className="col-span-6 space-y-6">
        {/* Video preview */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-6 min-h-[400px] flex items-center justify-center">
          {generatedVideo ? (
            <div className="relative w-full">
              <video
                ref={videoRef}
                src={generatedVideo.video_url}
                className="w-full rounded-lg"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                controls={false}
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={handlePlayPause} className="p-2 bg-slate-800 rounded hover:bg-slate-700">
                  {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                </button>
                <button onClick={handleRestart} className="p-2 bg-slate-800 rounded hover:bg-slate-700">
                  <RotateCw className="w-4 h-4 text-white" />
                </button>
                <a className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600" href={generatedVideo.video_url} download>
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {isGenerating ? (
                <>
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                  <p className="text-white">Generating video... {progress}%</p>
                </>
              ) : (
                <>
                  <Film className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Your video will appear here</p>
                  <p className="text-xs text-slate-500 mt-2">Model: {videoModel.toUpperCase()}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Video Prompt (now ABOVE timeline/VFX) */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Video Prompt</h3>
          <textarea
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            rows={4}
            className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Describe your video scene..."
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-slate-500">{videoPrompt.length}/1000 characters</span>
            <button
              onClick={handleEnhanceVideoPrompt}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm"
            >
              <Brain className="w-4 h-4" /> Enhance
            </button>
          </div>
        </div>

        {/* Combined Timeline + Duration panel */}
        <TimelineAndDuration
          videoRef={videoRef}
          duration={duration}
          minDuration={minDuration}
          maxDuration={maxDuration}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onRestart={handleRestart}
          onChangeDuration={setDuration}
        />

        {/* Larger VFX tiles; disabled when camera movement is chosen */}
        <BigVFXSelector
          selected={vfxTemplate}
          onSelect={handleVfxSelect}
          disabled={!!cameraMovement}
        />

        {/* Generate button */}
        <div className="flex justify-end">
          <button
            onClick={handleGenerateVideo}
            disabled={isGenerating || !videoPrompt.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-medium"
          >
            Generate Video
          </button>
        </div>
      </div>

      {/* Right column */}
      <div className="col-span-3 space-y-6">
        <ReferenceAssets files={selectedFiles} onChange={setSelectedFiles} />

        <PromptTemplatesPanel
          model={videoModel}
          onSelectTemplate={(t: string) => setVideoPrompt(t)}
          onEnhancePrompt={handleEnhanceVideoPrompt}
        />

        {/* Generation Info now under the Prompt Helper */}
        <GenerationInfo
          model={videoModel}
          duration={duration}
          quality={quality}
          refs={selectedFiles.length}
        />
      </div>
    </div>
  );
}
