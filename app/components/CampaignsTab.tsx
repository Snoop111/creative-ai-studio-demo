import React, { useState } from 'react';
import {
  Wand2, Plus, Play, Pause, Download, Share2,
  Monitor, Smartphone, Square, FileVideo, Grid3x3,
  ChevronRight, Settings, Sparkles, Layers,
  CheckCircle, Clock, AlertCircle, Copy, Edit3,
  Package, Target, Zap, ArrowRight, BarChart3,
  X, Camera, Image
} from 'lucide-react';

// Campaign interfaces
interface PlatformVariation {
  platform: string;
  dimensions: string;
  aspectRatio: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  optimizations: string[];
  thumbnailUrl?: string;
}

interface Campaign {
  id: string;
  name: string;
  client: 'DFSA' | 'Atlas' | 'YourBud';
  masterPrompt: string;
  cameraMovement: string;
  duration: number;
  quality: string;
  referenceImages: string[];
  platforms: PlatformVariation[];
  status: 'draft' | 'generating' | 'completed' | 'partial';
  createdAt: string;
  totalCost?: number;
}

// NEW: typed shape for the new campaign form state (so we don't use `any`)
interface NewCampaign {
  name: string;
  client: 'DFSA' | 'Atlas' | 'YourBud';
  masterPrompt: string;
  cameraMovement: string;
  duration: number;
  quality: string;
  selectedPlatforms: string[];
}

// Platform configs for variations
const PLATFORM_CONFIGS = [
  { id: 'instagram-feed', name: 'Instagram Feed', icon: Square, dimensions: '1080x1080', aspectRatio: '1:1', color: 'bg-gradient-to-r from-pink-500 to-orange-500' },
  { id: 'instagram-story', name: 'Instagram Story', icon: Smartphone, dimensions: '1080x1920', aspectRatio: '9:16', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'facebook-feed', name: 'Facebook Feed', icon: Monitor, dimensions: '1200x630', aspectRatio: '1.91:1', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
  { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', icon: FileVideo, dimensions: '1280x720', aspectRatio: '16:9', color: 'bg-gradient-to-r from-red-500 to-orange-500' },
  { id: 'google-display', name: 'Google Display', icon: Grid3x3, dimensions: '300x250', aspectRatio: '1.2:1', color: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
  { id: 'linkedin-post', name: 'LinkedIn Post', icon: Square, dimensions: '1200x1200', aspectRatio: '1:1', color: 'bg-gradient-to-r from-sky-500 to-indigo-500' },
  { id: 'tiktok', name: 'TikTok', icon: Smartphone, dimensions: '1080x1920', aspectRatio: '9:16', color: 'bg-gradient-to-r from-fuchsia-500 to-rose-500' },
  { id: 'youtube-short', name: 'YouTube Short', icon: Smartphone, dimensions: '1080x1920', aspectRatio: '9:16', color: 'bg-gradient-to-r from-red-500 to-pink-500' }
];

// Example template library
const CAMPAIGN_TEMPLATES = [
  {
    id: 'product-launch',
    name: 'Product Launch',
    icon: Package,
    description: 'Announce a new product with hero visuals',
    prompt: 'Premium product reveal with dramatic lighting and dynamic camera moves',
    platforms: ['instagram-feed', 'youtube-thumbnail', 'linkedin-post']
  },
  {
    id: 'awareness',
    name: 'Brand Awareness',
    icon: Target,
    description: 'Build brand recall with lifestyle visuals',
    prompt: 'Warm, lifestyle scenes highlighting brand values and product in context',
    platforms: ['facebook-feed', 'instagram-feed', 'google-display']
  },
  {
    id: 'flash-sale',
    name: 'Flash Sale',
    icon: Zap,
    description: 'High-energy promotional content',
    prompt: 'Dynamic, fast-paced showcase of premium fruit selection with urgency',
    platforms: ['instagram-story', 'tiktok', 'youtube-short']
  }
];

const CampaignsTab = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // New campaign form state (now typed)
  const [newCampaign, setNewCampaign] = useState<NewCampaign>({
    name: '',
    client: 'DFSA',
    masterPrompt: '',
    cameraMovement: 'dolly-in',
    duration: 5,
    quality: '1080p',
    selectedPlatforms: [] as string[]
  });

  // Create new campaign
  const createCampaign = () => {
    const campaign: Campaign = {
      id: `cmp_${Date.now()}`,
      name: newCampaign.name || 'Untitled Campaign',
      client: newCampaign.client,
      masterPrompt: newCampaign.masterPrompt,
      cameraMovement: newCampaign.cameraMovement,
      duration: newCampaign.duration,
      quality: newCampaign.quality,
      referenceImages: [],
      platforms: newCampaign.selectedPlatforms.map(platformId => {
        const config = PLATFORM_CONFIGS.find(p => p.id === platformId)!;
        return {
          platform: platformId,
          dimensions: config.dimensions,
          aspectRatio: config.aspectRatio,
          status: 'pending' as const,
          optimizations: []
        };
      }),
      status: 'draft',
      createdAt: new Date().toISOString(),
      totalCost: newCampaign.selectedPlatforms.length * 0.50
    };

    setCampaigns([campaign, ...campaigns]);
    setShowNewCampaign(false);
    setSelectedCampaign(campaign);

    // Reset form
    setNewCampaign({
      name: '',
      client: 'DFSA',
      masterPrompt: '',
      cameraMovement: 'dolly-in',
      duration: 5,
      quality: '1080p',
      selectedPlatforms: []
    });
  };

  // Generate all platform variations
  const generateCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    // Update campaign status to generating
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId
        ? { ...c, status: 'generating' as const }
        : c
    ));

    // Simulate generation of each platform
    for (let i = 0; i < campaign.platforms.length; i++) {
      const platform = campaign.platforms[i];

      // Update platform status to generating
      setCampaigns(prev => prev.map(c => {
        if (c.id !== campaignId) return c;
        return {
          ...c,
          platforms: c.platforms.map(p =>
            p.platform === platform.platform
              ? { ...p, status: 'generating' as const }
              : p
          )
        };
      }));

      // Simulate delay for generation
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Update platform to completed with mock thumbnail
      setCampaigns(prev => prev.map(c => {
        if (c.id !== campaignId) return c;
        return {
          ...c,
          platforms: c.platforms.map(p =>
            p.platform === platform.platform
              ? {
                  ...p,
                  status: 'completed' as const,
                  thumbnailUrl: `https://picsum.photos/seed/${campaignId}-${platform.platform}/600/338`
                }
              : p
          )
        };
      }));
    }

    // Update campaign status to completed
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId
        ? { ...c, status: 'completed' as const }
        : c
    ));
  };

  // Platform card component
  const PlatformCard = ({ platform, campaign }: { platform: PlatformVariation; campaign: Campaign }) => {
    const config = PLATFORM_CONFIGS.find(p => p.id === platform.platform)!;
    const Icon = config.icon;

    return (
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 ${config.color} rounded-lg`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">{config.name}</h4>
              <p className="text-slate-400 text-xs">{config.dimensions} • {config.aspectRatio}</p>
            </div>
          </div>
          {platform.status === 'completed' && (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
        </div>

        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
          {platform.thumbnailUrl ? (
            <img src={platform.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <FileVideo className="w-12 h-12 text-slate-600" />
            </div>
          )}
          {platform.status !== 'completed' && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                <span className="text-sm text-white">Generating…</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Campaign list item
  const CampaignItem = ({ campaign }: { campaign: Campaign }) => {
    const completedCount = campaign.platforms.filter(p => p.status === 'completed').length;
    const totalCount = campaign.platforms.length;

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 hover:border-purple-500/40 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <h3 className="text-white font-medium">{campaign.name}</h3>
              <div className="text-sm text-slate-400 flex items-center gap-2">
                <span>{campaign.client}</span>
                <span>•</span>
                <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Monitor className="w-4 h-4" />
              {totalCount} platforms
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Progress</div>
            <div className="text-lg font-semibold text-white">{completedCount}/{totalCount}</div>
          </div>
        </div>

        {/* Platform preview */}
        <div className="flex gap-2 mt-4">
          {campaign.platforms.slice(0, 4).map((platform, idx) => (
            <div key={idx} className="w-1/4">
              <PlatformCard platform={platform} campaign={campaign} />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCampaign(campaign)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white border border-slate-600"
            >
              View Details
            </button>
            <button
              onClick={() => generateCampaign(campaign.id)}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-sm text-white"
            >
              Generate All
            </button>
          </div>
          {campaign.totalCost !== undefined && (
            <div className="text-slate-400 text-sm">Est. Cost: ${campaign.totalCost.toFixed(2)}</div>
          )}
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-purple-400" />
          <h2 className="text-xl font-semibold">Campaigns</h2>
        </div>

        <button
          onClick={() => setShowNewCampaign(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium hover:from-purple-500 hover:to-pink-500"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      {/* Campaign List */}
      <div className="grid gap-3">
        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-400 text-center">
            No campaigns yet. Click “New Campaign” to create your first one.
          </div>
        ) : (
          campaigns.map(c => <CampaignItem key={c.id} campaign={c} />)
        )}
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Create Campaign</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    selectedTemplate === null
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  Custom
                </button>
                {CAMPAIGN_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      setSelectedTemplate(tpl.id);
                      setNewCampaign({
                        ...newCampaign,
                        name: tpl.name,
                        masterPrompt: tpl.prompt,
                        selectedPlatforms: tpl.platforms
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                      selectedTemplate === tpl.id
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <tpl.icon className="w-4 h-4" />
                    {tpl.name}
                  </button>
                ))}
                <button
                  onClick={() => setShowNewCampaign(false)}
                  className="p-2 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="text-white font-medium mb-2 block">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  placeholder="Enter campaign name..."
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Client Selection */}
              <div>
                <label className="text-white font-medium mb-2 block">Client</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['DFSA', 'Atlas', 'YourBud'] as const).map((client) => (
                    <button
                      key={client}
                      onClick={() => setNewCampaign({...newCampaign, client: client})}
                      className={`p-3 rounded-lg border transition-all ${
                        newCampaign.client === client
                          ? 'bg-purple-500/20 border-purple-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {client}
                    </button>
                  ))}
                </div>
              </div>

              {/* Master Prompt */}
              <div>
                <label className="text-white font-medium mb-2 block">Master Prompt</label>
                <textarea
                  value={newCampaign.masterPrompt}
                  onChange={(e) => setNewCampaign({...newCampaign, masterPrompt: e.target.value})}
                  placeholder="Describe your video concept..."
                  rows={3}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Camera Movement */}
              <div>
                <label className="text-white font-medium mb-2 block">Camera Movement</label>
                <select
                  value={newCampaign.cameraMovement}
                  onChange={(e) => setNewCampaign({...newCampaign, cameraMovement: e.target.value})}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="dolly-in">Dolly In</option>
                  <option value="dolly-out">Dolly Out</option>
                  <option value="orbit-left">Orbit Left</option>
                  <option value="orbit-right">Orbit Right</option>
                  <option value="crane-up">Crane Up</option>
                  <option value="crane-down">Crane Down</option>
                  <option value="pan-left">Pan Left</option>
                  <option value="pan-right">Pan Right</option>
                </select>
              </div>

              {/* Duration & Quality */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white font-medium mb-2 block">Duration</label>
                  <input
                    type="range"
                    min={3}
                    max={12}
                    value={newCampaign.duration}
                    onChange={(e) => setNewCampaign({...newCampaign, duration: parseInt(e.target.value)})}
                    className="w-full accent-purple-500"
                  />
                  <div className="text-slate-400 text-sm mt-1">{newCampaign.duration}s</div>
                </div>

                <div>
                  <label className="text-white font-medium mb-2 block">Quality</label>
                  <select
                    value={newCampaign.quality}
                    onChange={(e) => setNewCampaign({...newCampaign, quality: e.target.value})}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="1080p">1080p</option>
                    <option value="4K">4K</option>
                    <option value="720p">720p</option>
                  </select>
                </div>
              </div>

              {/* Platform Selection */}
              <div>
                <label className="text-white font-medium mb-2 block">Target Platforms</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PLATFORM_CONFIGS.map(platform => {
                    const Icon = platform.icon;
                    const isSelected = newCampaign.selectedPlatforms.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        onClick={() => {
                          if (isSelected) {
                            setNewCampaign({
                              ...newCampaign,
                              selectedPlatforms: newCampaign.selectedPlatforms.filter(p => p !== platform.id)
                            });
                          } else {
                            setNewCampaign({
                              ...newCampaign,
                              selectedPlatforms: [...newCampaign.selectedPlatforms, platform.id]
                            });
                          }
                        }}
                        className={`p-4 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-purple-500/20 border-purple-500'
                            : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 ${platform.color} rounded-lg`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="text-white font-medium">{platform.name}</div>
                            <div className="text-slate-400 text-xs">{platform.dimensions} • {platform.aspectRatio}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowNewCampaign(false)}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createCampaign}
                disabled={!newCampaign.masterPrompt || newCampaign.selectedPlatforms.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsTab;
