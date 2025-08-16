// app/hooks/useVideoGeneration.ts
"use client";

import { useState, useCallback } from "react";

export interface VideoGenerationState {
  isGenerating: boolean;
  progress: number;
  jobId: string | null;
  videoUrl: string | null;
  error: string | null;
  status: "idle" | "processing" | "completed" | "failed";
}

export interface GenerateVideoParams {
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
    status: "idle",
  });

  const pollVideoStatusEnhanced = useCallback(async (jobId: string) => {
    const maxAttempts = 144; // ~12 min
    let attempts = 0;
    let consecutiveErrors = 0;

    const poll = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/check_video_status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: jobId }),
        });
        const result = await response.json();

        if (result.status === "completed") {
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            status: "completed",
            progress: 100,
            videoUrl: result.video_url as string,
            jobId,
          }));
          return;
        }

        if (result.status === "failed") {
          const errorMessage: string = result.error || "Generation failed";
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            status: "failed",
            error: errorMessage,
            jobId,
          }));
          return;
        }

        if (result.status === "processing") {
          const serverProgress: number = Number(result.progress ?? 0);
          setState((prev) => {
            const next = Math.max(serverProgress, prev.progress + 1);
            const capped = Math.min(next, 95);
            return { ...prev, progress: capped, status: "processing", jobId };
          });
        }

        attempts += 1;
        if (attempts < maxAttempts) {
          const interval =
            attempts < 10 ? 3000 : attempts < 30 ? 5000 : 10000;
          setTimeout(poll, interval);
        } else {
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            status: "failed",
            error: "Generation timeout after 12 minutes.",
          }));
        }
      } catch (e) {
        consecutiveErrors += 1;
        if (consecutiveErrors >= 3) {
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            status: "failed",
            error: "Lost connection to server.",
          }));
          return;
        }
        const retryDelay = Math.min(5000 * Math.pow(2, consecutiveErrors - 1), 30000);
        setTimeout(poll, retryDelay);
      }
    };

    setTimeout(poll, 2000);
  }, []);

  const generateVideo = useCallback(
    async (params: GenerateVideoParams) => {
      setState((prev) => ({
        ...prev,
        isGenerating: true,
        status: "processing",
        progress: 0,
        error: null,
        videoUrl: null,
        jobId: null,
      }));

      try {
        const response = await fetch("http://localhost:8000/api/generate_video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client: params.client,
            prompt: params.prompt,
            duration: params.duration,
            quality: params.quality,
            reference_images: params.reference_images,
            camera_movement: params.camera_movement ?? "",
          }),
        });

        const result = await response.json();
        if (!result.success) {
          const base = (result.detail || result.error || "Generation failed") as string;
          throw new Error(base);
        }

        const newJobId: string = result.job_id;
        setState((prev) => ({ ...prev, jobId: newJobId, progress: 5 }));
        pollVideoStatusEnhanced(newJobId);
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        }));
      }
    },
    [pollVideoStatusEnhanced]
  );

  const resetGeneration = useCallback(() => {
    setState({
      isGenerating: false,
      progress: 0,
      jobId: null,
      videoUrl: null,
      error: null,
      status: "idle",
    });
  }, []);

  return {
    ...state,
    generateVideo,
    resetGeneration,
    isIdle: state.status === "idle",
    isProcessing: state.status === "processing",
    isCompleted: state.status === "completed",
    isFailed: state.status === "failed",
  };
};
