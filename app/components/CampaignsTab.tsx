import React, { useState } from 'react';
import { 
  Wand2, Plus, Play, Pause, Download, Share2, 
  Monitor, Smartphone, Square, FileVideo, Grid3x3, 
  ChevronRight, Settings, Sparkles, Layers, 
  CheckCircle, Clock, AlertCircle, Copy, Edit3,
  Package, Target, Zap, ArrowRight, BarChart3,
  X, Camera, Image, Video
} from 'lucide-react';

// Campaign interfaces
interface PlatformVariation {
  platform: string;
  dimensions: string;
  aspectRatio: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  optimizations: string[];
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

// Platform configurations
const PLATFORM_CONFIGS = [
  { id: 'instagram-feed', name: 'Instagram Feed', icon: Square, dimensions: '1080x1080', aspectRatio: '1:1', color: 'bg-pink-500' },
  { id: 'instagram-story', name: 'Instagram Story', icon: Smartphone, dimensions: '1080x1920', aspectRatio: '9:16', color: 'bg-purple-500' },
  { id: 'facebook-feed', name: 'Facebook Feed', icon: Monitor, dimensions: '1200x630', aspectRatio: '1.91:1', color: 'bg-blue-500' },
  { id: 'youtube-short', name: 'YouTube Short', icon: FileVideo, dimensions: '1080x1920', aspectRatio: '9:16', color: 'bg-red-500' },
  { id: 'tiktok', name: 'TikTok', icon: Grid3x3, dimensions: '1080x1920', aspectRatio: '9:16', color: 'bg-slate-800' },
  { id: 'linkedin-post', name: 'LinkedIn Post', icon: Square, dimensions: '1200x1200', aspectRatio: '1:1', color: 'bg-blue-600' }
];

// Campaign templates
const CAMPAIGN_TEMPLATES = [
  {
    id: 'product-launch',
    name: 'Product Launch',
    icon: Package,
    description: 'Hero product reveal across all platforms',
    prompt: 'Cinematic reveal of premium dried apricots with dramatic lighting',
    platforms: ['instagram-feed', 'instagram-story', 'youtube-short']
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle Campaign',
    icon: Target,
    description: 'Family and lifestyle focused content',
    prompt: 'Family enjoying healthy dried fruit snacks at breakfast table',
    platforms: ['facebook-feed', 'instagram-feed', 'linkedin-post']
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
  
  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    client: 'DFSA' as const,
    masterPrompt: '',
    cameraMovement: 'dolly-in',
    duration: 5,
    quality: '1080p',
    selectedPlatforms: [] as string[]
  });

  // Create new campaign
  const createCampaign = () => {
    const campaign: Campaign = {
      id: `campaign-${Date.now()}`,
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

    // Update campaign status
    setCampaigns(prev => prev.map(c => 
      c.id === campaignId 
        ? { ...c, status: 'generating' as const }
        : c
    ));

    // Simulate generation for each platform
    for (const platform of campaign.platforms) {
      // In production, this would call your API for each platform
      console.log(`Generating ${platform.platform} variation...`);
      
      // Update platform status
      setCampaigns(prev => prev.map(c => {
        if (c.id === campaignId) {
          return {
            ...c,
            platforms: c.platforms.map(p => 
              p.platform === platform.platform
                ? { ...p, status: 'generating' as const, progress: 0 }
                : p
            )
          };
        }
        return c;
      }));

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setCampaigns(prev => prev.map(c => {
          if (c.id === campaignId) {
            return {
              ...c,
              platforms: c.platforms.map(p => 
                p.platform === platform.platform
                  ? { ...p, progress }
                  : p
              )
            };
          }
          return c;
        }));
      }

      // Mark as completed
      setCampaigns(prev => prev.map(c => {
        if (c.id === campaignId) {
          return {
            ...c,
            platforms: c.platforms.map(p => 
              p.platform === platform.platform
                ? { 
                    ...p, 
                    status: 'completed' as const, 
                    progress: 100,
                    videoUrl: '/api/placeholder/video.mp4',
                    thumbnailUrl: '/api/placeholder/400/225'
                  }
                : p
            )
          };
        }
        return c;
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
          {platform.status === 'generating' && (
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Preview area */}
        <div className="aspect-video bg-slate-900 rounded-lg mb-3 relative overflow-hidden">
          {platform.thumbnailUrl ? (
            <img src={platform.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileVideo className="w-8 h-8 text-slate-600" />
            </div>
          )}
          
          {platform.status === 'generating' && platform.progress !== undefined && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">{platform.progress}%</div>
                <div className="text-xs text-slate-300">Generating...</div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {platform.status === 'completed' && (
            <>
              <button className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
                <Play className="w-3 h-3" /> Preview
              </button>
              <button className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </>
          )}
          {platform.status === 'pending' && (
            <button className="flex-1 py-2 bg-slate-700 text-slate-400 rounded-lg text-sm font-medium">
              Pending
            </button>
          )}
          {platform.status === 'generating' && (
            <button className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium">
              Generating...
            </button>
          )}
        </div>
      </div>
    );
  };

  // Campaign card component
  const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
    const completedCount = campaign.platforms.filter(p => p.status === 'completed').length;
    const totalCount = campaign.platforms.length;

    return (
      <div 
        className="bg-slate-900 border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-all cursor-pointer"
        onClick={() => setSelectedCampaign(campaign)}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">{campaign.name}</h3>
            <p className="text-slate-400 text-sm">{campaign.client} • {new Date(campaign.createdAt).toLocaleDateString()}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            campaign.status === 'completed' ? 'bg-green-500/20 text-green-400' :
            campaign.status === 'generating' ? 'bg-blue-500/20 text-blue-400' :
            campaign.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-slate-700 text-slate-400'
          }`}>
            {campaign.status}
          </div>
        </div>

        <p className="text-slate-300 mb-4 line-clamp-2">{campaign.masterPrompt}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1 text-slate-400">
              <Camera className="w-4 h-4" />
              {campaign.cameraMovement}
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-4 h-4" />
              {campaign.duration}s
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
          {campaign.platforms.map(platform => {
            const config = PLATFORM_CONFIGS.find(p => p.id === platform.platform)!;
            const Icon = config.icon;
            return (
              <div 
                key={platform.platform}
                className={`p-2 rounded-lg ${
                  platform.status === 'completed' ? 'bg-green-500/20' :
                  platform.status === 'generating' ? 'bg-blue-500/20' :
                  'bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Campaigns</h2>
          <p className="text-slate-400">Create multi-platform video campaigns from a single brief</p>
        </div>
        <button
          onClick={() => setShowNewCampaign(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Campaign Templates */}
      {campaigns.length === 0 && !showNewCampaign && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Start Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CAMPAIGN_TEMPLATES.map(template => {
              const Icon = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setNewCampaign({
                      ...newCampaign,
                      name: template.name,
                      masterPrompt: template.prompt,
                      selectedPlatforms: template.platforms
                    });
                    setShowNewCampaign(true);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-white">{template.name}</h4>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">{template.description}</p>
                  <div className="flex gap-2">
                    {template.platforms.map(platformId => {
                      const config = PLATFORM_CONFIGS.find(p => p.id === platformId)!;
                      const PlatformIcon = config.icon;
                      return (
                        <div key={platformId} className="p-2 bg-slate-800 rounded-lg">
                          <PlatformIcon className="w-3 h-3 text-slate-400" />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-purple-400 text-sm font-medium group-hover:text-purple-300 flex items-center gap-1">
                    Use Template <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* New Campaign Form */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Create New Campaign</h3>
                <button
                  onClick={() => setShowNewCampaign(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
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
                  {['DFSA', 'Atlas', 'YourBud'].map(client => (
                    <button
                      key={client}
                      onClick={() => setNewCampaign({...newCampaign, client: client as any})}
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
                        <Icon className="w-5 h-5 text-white mb-2" />
                        <div className="text-sm font-medium text-white">{platform.name}</div>
                        <div className="text-xs text-slate-400">{platform.dimensions}</div>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-purple-400 mt-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cost Estimate */}
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-slate-400 text-sm">Estimated Cost</div>
                    <div className="text-2xl font-bold text-white">
                      ${(newCampaign.selectedPlatforms.length * 0.50).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-sm">Platforms Selected</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {newCampaign.selectedPlatforms.length}
                    </div>
                  </div>
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
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && !showNewCampaign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedCampaign.name}</h3>
                  <p className="text-slate-400 text-sm">{selectedCampaign.client} Campaign</p>
                </div>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Campaign Info */}
              <div className="bg-slate-800 rounded-xl p-4 mb-6">
                <p className="text-white mb-3">{selectedCampaign.masterPrompt}</p>
                <div className="flex gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    {selectedCampaign.cameraMovement}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedCampaign.duration}s
                  </div>
                  <div className="flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    {selectedCampaign.quality}
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    {selectedCampaign.referenceImages.length} references
                  </div>
                </div>
              </div>

              {/* Platform Variations */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedCampaign.platforms.map(platform => (
                  <PlatformCard 
                    key={platform.platform} 
                    platform={platform} 
                    campaign={selectedCampaign}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center mt-6">
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Edit Campaign
                  </button>
                  <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                </div>
                
                {selectedCampaign.status === 'draft' && (
                  <button
                    onClick={() => generateCampaign(selectedCampaign.id)}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Generate All Variations
                  </button>
                )}
                
                {selectedCampaign.status === 'generating' && (
                  <div className="px-6 py-2 bg-blue-500/20 text-blue-400 rounded-lg font-medium flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Generating Campaign...
                  </div>
                )}
                
                {selectedCampaign.status === 'completed' && (
                  <button className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {campaigns.length === 0 && !showNewCampaign && (
        <div className="text-center py-12 mt-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No campaigns yet</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Create your first multi-platform campaign from a single brief. One prompt, endless possibilities.
          </p>
          <button
            onClick={() => setShowNewCampaign(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Your First Campaign
          </button>
        </div>
      )}
    </div>
  );
};

export default CampaignsTab;