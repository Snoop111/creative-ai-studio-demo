'use client';
import React, { useState } from 'react';
import { Settings, Home, Sparkles } from 'lucide-react';
import { AnimatedBackground } from '../components/StudioShared';
import CreateTab from '../components/CreateTab';
import ImagineTab from '../components/ImagineTab';
import LibraryTab from '../components/LibraryTab';
import CampaignsTab from '../components/CampaignsTab';

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState<'create'|'imagine'|'library'|'campaigns'>('create');

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      {/* Top Navigation (unchanged) */}
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
                <button onClick={() => setActiveTab('create')}
                        className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'create' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                  Create
                </button>
                <button onClick={() => setActiveTab('imagine')}
                        className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${activeTab === 'imagine' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <Sparkles className="w-4 h-4" /> Imagine
                </button>
                <button onClick={() => setActiveTab('library')}
                        className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'library' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                  Library
                </button>
                <button onClick={() => setActiveTab('campaigns')}
                        className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'campaigns' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                  Campaigns
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="p-2 text-slate-400 hover:text-white transition-colors"><Home className="w-5 h-5" /></a>
              <button className="p-2 text-slate-400 hover:text-white transition-colors"><Settings className="w-5 h-5" /></button>
              <div className="w-8 h-8 bg-purple-500 rounded-full" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 relative z-10">
        {activeTab === 'create'   && <CreateTab />}
        {activeTab === 'imagine'  && <ImagineTab />}
        {activeTab === 'library'  && <LibraryTab />}
        {activeTab === 'campaigns'&& <CampaignsTab />}
      </div>
    </div>
  );
}
