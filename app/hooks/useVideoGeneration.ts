// app/hooks/useVideoGeneration.ts
'use client';

import { useState, useCallback } from 'react';

interface VideoGenerationState {
  isGenerating: boolean;
  progress: number;
  jobId: string | null;
  videoUrl: string | null;
  error: string | null;
  status: 'idle' | 'processing' | 'completed' | 'failed';
}

interface GenerateVideoParams {
  client: string;
  prompt: string;
  duration: number;
  quality: string;
  reference_images: string[];
  camera_movement?: string;
}

export const useVideoGeneration = () => {
  const [state, setState] = useState<VideoGenerationState>({
    isGenerating: false,
    progress: 0,
    jobId: null,
    videoUrl: null,
    error: null,
    status: 'idle'
  });

  const generateVideo = useCallback(async (params: GenerateVideoParams) => {
    console.log('🚀 Starting enhanced video generation...', params);

    setState(prev => ({
      ...prev,
      isGenerating: true,
      status: 'processing',
      progress: 0,
      error: null,
      videoUrl: null
    }));

    try {
      // Start enhanced generation
      console.log('📡 Calling enhanced generate_video API...');
      const response = await fetch('http://localhost:8000/api/generate_video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: params.client,
          prompt: params.prompt,
          duration: params.duration,
          quality: params.quality,
          reference_images: params.reference_images,
          camera_movement: params.camera_movement || ''
        })
      });

      const result = await response.json();
      console.log('📥 Enhanced generation API response:', result);

      if (!result.success) {
        // Enhanced error handling
        let errorMessage = result.detail || result.error || 'Generation failed';

        // Better error messages for common issues
        if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          errorMessage = 'API quota exhausted. Please wait a few minutes and try again, or check your billing settings.';
        } else if (errorMessage.includes('authentication') || errorMessage.includes('api_key')) {
          errorMessage = 'Authentication failed. Please check your API key configuration.';
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again with a shorter prompt or lower quality.';
        }

        throw new Error(errorMessage);
      }

      const jobId = result.job_id;
      console.log('✅ Enhanced job started with ID:', jobId);
      console.log('🎬 Features used:', result.features_used);
      console.log('📹 Camera movement:', result.camera_movement);
      console.log('🎨 Reference images:', result.reference_images_used);

      setState(prev => ({
        ...prev,
        jobId,
        progress: 5 // Start with 5% to show immediate feedback
      }));

      // Start enhanced polling for status
      pollVideoStatusEnhanced(jobId);

    } catch (error) {
      console.error('❌ Enhanced generation error:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, []);

  const pollVideoStatusEnhanced = useCallback(async (jobId: string) => {
    console.log('🔄 Starting enhanced status polling for job:', jobId);
    const maxAttempts = 144; // 12 minutes with 5-second intervals
    let attempts = 0;
    let consecutiveErrors = 0;

    const poll = async () => {
      try {
        console.log(`📊 Enhanced polling attempt ${attempts + 1}/${maxAttempts} for job: ${jobId}`);

        const response = await fetch('http://localhost:8000/api/check_video_status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: jobId })
        });

        const result = await response.json();
        console.log('📈 Enhanced status response:', result);

        // Reset consecutive errors on successful response
        consecutiveErrors = 0;

        if (result.status === 'completed') {
          console.log('🎉 Enhanced video generation completed!', result.video_url);
          console.log('📊 Final metadata:', result.metadata);

          setState(prev => ({
            ...prev,
            isGenerating: false,
            status: 'completed',
            progress: 100,
            videoUrl: result.video_url
          }));
          return; // Stop polling
        }

        if (result.status === 'failed') {
          console.error('💥 Enhanced video generation failed:', result.error);

          // Enhanced error handling with better messages
          let errorMessage = result.error || 'Generation failed';
          if (result.retry_recommended) {
            errorMessage += ' (Retry recommended)';
          }

          setState(prev => ({
            ...prev,
            isGenerating: false,
            status: 'failed',
            error: errorMessage
          }));
          return; // Stop polling
        }

        if (result.status === 'processing') {
          // Enhanced progress calculation
          let progress = result.progress || 0;

          // Ensure progress always moves forward (with some smoothing)
          setState(prev => {
            const newProgress = Math.max(progress, prev.progress + 1);
            const smoothedProgress = Math.min(newProgress, 95); // Cap at 95% until complete

            console.log(`⏳ Enhanced processing... ${Math.round(smoothedProgress)}%`);
            return { ...prev, progress: smoothedProgress };
          });
        }

        attempts++;
        if (attempts < maxAttempts) {
          // Use variable intervals for better UX
          const interval = attempts < 10 ? 3000 : // First 30 seconds: 3s intervals
                          attempts < 30 ? 5000 : // Next 2 minutes: 5s intervals
                          10000; // After that: 10s intervals

          setTimeout(poll, interval);
        } else {
          // Enhanced timeout handling
          console.error('⏰ Enhanced polling timeout after 12 minutes');
          setState(prev => ({
            ...prev,
            isGenerating: false,
            status: 'failed',
            error: 'Generation timeout after 12 minutes. The video may still be processing - try checking the status again in a few minutes.'
          }));
        }
      } catch (error) {
        consecutiveErrors++;
        console.error(`📡 Enhanced status polling error (${consecutiveErrors}/3):`, error);

        // Enhanced error resilience
        if (consecutiveErrors >= 3) {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            status: 'failed',
            error: 'Lost connection to server. Please check your internet connection and try again.'
          }));
          return;
        }

        // Retry with exponential backoff for network errors
        const retryDelay = Math.min(5000 * Math.pow(2, consecutiveErrors - 1), 30000);
        console.log(`🔄 Retrying in ${retryDelay}ms...`);

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, retryDelay);
        }
      }
    };

    // Start polling with initial delay to allow server processing
    setTimeout(poll, 2000);
  }, []);

  const resetGeneration = useCallback(() => {
    console.log('🔄 Resetting enhanced generation state');
    setState({
      isGenerating: false,
      progress: 0,
      jobId: null,
      videoUrl: null,
      error: null,
      status: 'idle'
    });
  }, []);

  const checkJobStatus = useCallback(async (jobId: string) => {
    console.log('🔍 Manually checking job status:', jobId);

    try {
      const response = await fetch('http://localhost:8000/api/check_video_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId })
      });

      const result = await response.json();
      console.log('📋 Manual status check result:', result);

      return result;
    } catch (error) {
      console.error('❌ Manual status check error:', error);
      throw error;
    }
  }, []);

  const downloadVideo = useCallback((videoUrl: string, filename?: string) => {
    console.log('⬇️ Downloading video:', videoUrl);

    try {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = filename || `creative-ai-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      console.log('✅ Download initiated successfully');
    } catch (error) {
      console.error('❌ Download error:', error);
      // Fallback: open in new tab
      window.open(videoUrl, '_blank');
    }
  }, []);

  // Enhanced state with additional utility functions
  return {
    // Core state
    ...state,

    // Main functions
    generateVideo,
    resetGeneration,

    // Utility functions
    checkJobStatus,
    downloadVideo,

    // Computed properties
    isIdle: state.status === 'idle',
    isProcessing: state.status === 'processing',
    isCompleted: state.status === 'completed',
    isFailed: state.status === 'failed',

    // Progress helpers
    progressPercentage: Math.round(state.progress),
    progressLabel: state.progress > 0 ? `${Math.round(state.progress)}%` : 'Starting...',

    // Time estimates
    estimatedTimeRemaining: (() => {
      if (state.progress <= 0) return '90 seconds';
      if (state.progress >= 95) return '5 seconds';

      // Rough estimate based on progress
      const remaining = ((100 - state.progress) / 100) * 90;
      return remaining > 60 ? `${Math.round(remaining / 60)} minutes` : `${Math.round(remaining)} seconds`;
    })(),

    // Error helpers
    isQuotaError: state.error?.toLowerCase().includes('quota') || false,
    isAuthError: state.error?.toLowerCase().includes('auth') || false,
    isTimeoutError: state.error?.toLowerCase().includes('timeout') || false,
    isRetryable: state.error ? !state.error.toLowerCase().includes('auth') : false,
  };
};