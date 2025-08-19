'use client';
import React, { useRef, useState } from 'react';
import { Loader2, Image as ImageIcon, Download, Maximize2, Sparkles, Brain } from 'lucide-react';
import {
  IMAGE_MODELS, stylePresets, lightingPresets, compositionRules,
  ModelSelector, ReferenceImageUpload, PromptTemplatesPanel,
  buildEnhancedPrompt, enhancePromptWithAPI
} from './StudioShared';

export default function ImagineTab() {
  const [imageModel, setImageModel] = useState('dalle3');
  const [imagePrompt, setImagePrompt] = useState('');
  const [numImages, setNumImages] = useState(1);
  const [imageQuality, setImageQuality] = useState<'standard'|'high'>('standard');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{key:string,url:string}[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('product');
  const [selectedLighting, setSelectedLighting] = useState('studio');
  const [selectedComposition, setSelectedComposition] = useState('thirds');
  const [jobId, setJobId] = useState<string|null>(null);

  const handleTemplateSelect = (template:string) => setImagePrompt(template);

  const handleEnhancePrompt = async () => {
    if (!imagePrompt) return;
    const enhancedPrompt = await enhancePromptWithAPI(imagePrompt, imageModel, {
      style: selectedStyle, lighting: selectedLighting, composition: selectedComposition
    });
    setImagePrompt(enhancedPrompt);
  };

  const handleGenerateImages = async () => {
    if (!imagePrompt.trim()) return;
    setIsGenerating(true);
    setGeneratedImages([]);

    const fullPrompt = buildEnhancedPrompt(imagePrompt, {
      style: selectedStyle, lighting: selectedLighting, composition: selectedComposition, model: imageModel
    });

    try {
      const referenceImages = await Promise.all(
        selectedFiles.map(file => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        }))
      );

      const res = await fetch('http://localhost:8000/api/unified_generate', {
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
          reference_images: referenceImages,
          style_presets: { style: selectedStyle, lighting: selectedLighting, composition: selectedComposition }
        })
      });
      const data = await res.json();
      if (data.job_id) {
        setJobId(data.job_id);
        pollImageStatus(data.job_id);
      } else {
        setIsGenerating(false);
      }
    } catch {
      setIsGenerating(false);
    }
  };

  const pollImageStatus = async (jid:string) => {
    const timer = setInterval(async () => {
      try {
        const r = await fetch('http://localhost:8000/api/check_unified_status', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: jid, type: 'image' })
        });
        const result = await r.json();
        if (result.status === 'completed' && result.image_urls) {
          setGeneratedImages(result.image_urls);
          setIsGenerating(false);
          clearInterval(timer);
        } else if (result.status === 'failed') {
          setIsGenerating(false);
          clearInterval(timer);
        }
      } catch {}
    }, 2000);
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Sidebar */}
      <div className="col-span-3 space-y-6">
        <div>
          <label className="text-white font-medium mb-2 block">Select Image Model</label>
          <ModelSelector type="image" selectedModel={imageModel} onModelChange={setImageModel} />
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Style Presets
          </h3>
          <div className="space-y-2">
            {stylePresets.map(p => {
              const Icon = p.icon;
              return (
                <button key={p.id} onClick={() => setSelectedStyle(p.id)}
                  className={`w-full p-3 rounded-lg border transition-all ${selectedStyle === p.id ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'}`}>
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-purple-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Lighting</h3>
          <div className="grid grid-cols-2 gap-2">
            {lightingPresets.map(p => {
              const Icon = p.icon;
              return (
                <button key={p.id} onClick={() => setSelectedLighting(p.id)}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-1 ${selectedLighting === p.id ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  <Icon className="w-4 h-4" /> {p.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="col-span-6 space-y-6">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-6 min-h-[400px] flex items-center justify-center">
          {generatedImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 w-full">
              {generatedImages.map((it, idx) => (
                <div key={idx} className="relative group">
                  <img src={it.url} alt={`Generated ${idx+1}`} className="w-full rounded-lg" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <a href={it.url} download className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                      <Download className="w-4 h-4" />
                    </a>
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
                  <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Your images will appear here</p>
                  <p className="text-xs text-slate-500 mt-2">Model: {imageModel.toUpperCase()}</p>
                  <p className="text-xs text-slate-500">Style: {selectedStyle}</p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Image Prompt</h3>
          </div>
          <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Describe your image..." className="w-full h-24 bg-slate-800 text-white rounded-lg p-3 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-slate-400">{imagePrompt.length}/1000 characters</p>
            <button onClick={handleEnhancePrompt} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1">
              <Brain className="w-3 h-3" /> Enhance
            </button>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Composition</h3>
          <div className="flex gap-2 flex-wrap">
            {compositionRules.map(rule => {
              const Icon = rule.icon;
              return (
                <button key={rule.id} onClick={() => setSelectedComposition(rule.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${selectedComposition === rule.id ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  <Icon className="w-3 h-3" /> {rule.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="col-span-3 space-y-6">
        <ReferenceImageUpload selectedFiles={selectedFiles} onFilesChange={setSelectedFiles} />

        <PromptTemplatesPanel model={imageModel} onSelectTemplate={handleTemplateSelect} onEnhancePrompt={handleEnhancePrompt} />

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Generation Info</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-400">Model:</span><span className="text-white">{imageModel.toUpperCase()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Images:</span><span className="text-white">{numImages}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Quality:</span><span className="text-white">{imageQuality}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Aspect:</span><span className="text-white">{aspectRatio}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Style:</span><span className="text-purple-400">{selectedStyle}</span></div>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Generation Settings</h3>
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-2 block">Number of Images</label>
            <div className="flex items-center gap-2">
              <input type="range" min="1" max="4" value={numImages} onChange={(e) => setNumImages(parseInt(e.target.value))} className="flex-1" />
              <span className="text-white text-sm font-medium w-8 text-center">{numImages}</span>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-2 block">Quality</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setImageQuality('standard')} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${imageQuality === 'standard' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Standard</button>
              <button onClick={() => setImageQuality('high')} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${imageQuality === 'high' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>High</button>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-2">
              {['1:1','16:9','9:16','4:3'].map(r => (
                <button key={r} onClick={() => setAspectRatio(r)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${aspectRatio === r ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{r}</button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleGenerateImages} disabled={!imagePrompt.trim() || isGenerating}
          className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            !imagePrompt.trim() || isGenerating ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
          }`}>
          {isGenerating ? (<><Loader2 className="w-4 h-4 animate-spin" /> Generating Images...</>) : (<><Sparkles className="w-4 h-4" /> Generate Images</>)}
        </button>
      </div>
    </div>
  );
}
