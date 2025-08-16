import React, { useState, useEffect } from 'react';
import { 
  Video, Download, Share2, Copy, Trash2, Edit3, 
  Filter, Search, Calendar, Camera, Layers, 
  CheckCircle, Clock, XCircle, MoreVertical,
  Play, Eye, RefreshCw, Sparkles
} from 'lucide-react';

// Video metadata interface
interface VideoMetadata {
  job_id: string;
  client: string;
  status: 'completed' | 'processing' | 'failed';
  created_at: string;
  video_url?: string;
  thumbnail_url?: string;
  prompt: string;
  enhanced_prompt?: string;
  duration: number;
  quality: string;
  camera_movement: string;
  reference_images: string[];
  file_size?: number;
  generation_time?: number;
}

// Filter state interface
interface FilterState {
  client: string;
  status: string;
  dateRange: string;
  cameraType: string;
}

const LibraryTab = () => {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    client: 'all',
    status: 'all',
    dateRange: 'all',
    cameraType: 'all'
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Simulated data for demonstration
  useEffect(() => {
    loadVideoHistory();
  }, []);

  const loadVideoHistory = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from your API
      const response = await fetch('http://localhost:8000/api/video_history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 })
      });
      
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error loading video history:', error);
      // Use mock data for demonstration
      setVideos(getMockVideos());
    } finally {
      setLoading(false);
    }
  };

  // Mock data generator
  const getMockVideos = (): VideoMetadata[] => {
    return [
      {
        job_id: 'abc123',
        client: 'DFSA',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        video_url: '/api/placeholder/video1.mp4',
        thumbnail_url: '/api/placeholder/400/225',
        prompt: 'Premium dried apricots falling onto wooden table',
        enhanced_prompt: 'Camera slowly dollies forward revealing premium dried apricots...',
        duration: 5,
        quality: '1080p',
        camera_movement: 'dolly-in',
        reference_images: ['mlk5301.jpg', 'mlk5325.jpg'],
        file_size: 15728640,
        generation_time: 87
      },
      {
        job_id: 'def456',
        client: 'DFSA',
        status: 'completed',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        video_url: '/api/placeholder/video2.mp4',
        thumbnail_url: '/api/placeholder/400/225',
        prompt: 'Family enjoying healthy snacks at breakfast',
        duration: 8,
        quality: '4K',
        camera_movement: 'orbit-left',
        reference_images: ['mlk5443.jpg'],
        file_size: 31457280,
        generation_time: 120
      },
      {
        job_id: 'ghi789',
        client: 'Atlas',
        status: 'processing',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        prompt: 'Security guard monitoring modern office building',
        duration: 10,
        quality: '1080p',
        camera_movement: 'crane-up',
        reference_images: [],
        generation_time: 45
      }
    ];
  };

  // Filter videos based on search and filters
  const filteredVideos = videos.filter(video => {
    if (searchTerm && !video.prompt.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.client !== 'all' && video.client !== filters.client) {
      return false;
    }
    if (filters.status !== 'all' && video.status !== filters.status) {
      return false;
    }
    if (filters.cameraType !== 'all' && video.camera_movement !== filters.cameraType) {
      return false;
    }
    return true;
  });

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    const icons = {
      completed: <CheckCircle className="w-3 h-3" />,
      processing: <Clock className="w-3 h-3 animate-spin" />,
      failed: <XCircle className="w-3 h-3" />
    };

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  // Video card component
  const VideoCard = ({ video }: { video: VideoMetadata }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all group">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-slate-800">
          {video.thumbnail_url ? (
            <img 
              src={video.thumbnail_url} 
              alt={video.prompt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-12 h-12 text-slate-600" />
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button className="p-3 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors">
              <Play className="w-5 h-5 text-white" />
            </button>
            <button className="p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
              <Eye className="w-5 h-5 text-white" />
            </button>
            <button className="p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
              <Download className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <StatusBadge status={video.status} />
          </div>

          {/* Duration badge */}
          <div className="absolute bottom-3 right-3 bg-black/60 px-2 py-1 rounded text-xs text-white">
            {video.duration}s
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-white font-medium mb-2 line-clamp-2">{video.prompt}</h3>
          
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>{video.client}</span>
            <span>{new Date(video.created_at).toLocaleDateString()}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-1 text-xs bg-slate-800 px-2 py-1 rounded">
              <Camera className="w-3 h-3" />
              {video.camera_movement}
            </div>
            <div className="flex items-center gap-1 text-xs bg-slate-800 px-2 py-1 rounded">
              <Layers className="w-3 h-3" />
              {video.reference_images.length} refs
            </div>
            <div className="text-xs bg-slate-800 px-2 py-1 rounded">
              {video.quality}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                <Copy className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative"
            >
              <MoreVertical className="w-4 h-4" />
              {showMenu && (
                <div className="absolute right-0 bottom-full mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 w-40 z-10">
                  <button className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" /> Regenerate
                  </button>
                  <button className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Create Variant
                  </button>
                  <hr className="my-2 border-slate-700" />
                  <button className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Video Library</h2>
        <p className="text-slate-400">Manage and organize your generated videos</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by prompt or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Client Filter */}
          <select 
            value={filters.client}
            onChange={(e) => setFilters({...filters, client: e.target.value})}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Clients</option>
            <option value="DFSA">DFSA</option>
            <option value="Atlas">Atlas</option>
            <option value="YourBud">YourBud</option>
          </select>

          {/* Status Filter */}
          <select 
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>

          {/* Camera Filter */}
          <select 
            value={filters.cameraType}
            onChange={(e) => setFilters({...filters, cameraType: e.target.value})}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Cameras</option>
            <option value="dolly-in">Dolly In</option>
            <option value="dolly-out">Dolly Out</option>
            <option value="orbit-left">Orbit Left</option>
            <option value="orbit-right">Orbit Right</option>
            <option value="crane-up">Crane Up</option>
            <option value="crane-down">Crane Down</option>
            <option value="pan-left">Pan Left</option>
            <option value="pan-right">Pan Right</option>
          </select>

          {/* Date Range */}
          <select 
            value={filters.dateRange}
            onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-400 text-sm">
          Showing {filteredVideos.length} of {videos.length} videos
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" strokeWidth="2"/>
              <rect x="14" y="14" width="7" height="7" strokeWidth="2"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2"/>
              <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2"/>
              <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading video library...</p>
          </div>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">No videos found</p>
          <p className="text-slate-500 text-sm">Try adjusting your filters or generate a new video</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
          {filteredVideos.map((video) => (
            <VideoCard key={video.job_id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LibraryTab;