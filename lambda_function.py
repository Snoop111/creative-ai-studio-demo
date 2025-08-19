import json
import boto3
import time
import uuid
import os
from datetime import datetime
from typing import Optional, List, Dict, Any
import traceback
import logging
from dotenv import load_dotenv
import requests
import base64
import asyncio

# FastAPI imports
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AWS clients
s3_client = boto3.client('s3')
bedrock_agent = boto3.client('bedrock-agent-runtime', region_name='us-east-1')

# Configuration from environment variables
VISUAL_ASSETS_BUCKET = os.environ.get('VISUAL_ASSETS_BUCKET', 'creative-brief-visual-assets-087432099530')
VIDEO_OUTPUT_BUCKET = os.environ.get('VIDEO_OUTPUT_BUCKET', 'creative-brief-video-generation-087432099530')
IMAGE_OUTPUT_BUCKET = os.environ.get('IMAGE_OUTPUT_BUCKET', 'creative-brief-visual-assets-087432099530')
BEDROCK_AGENT_ID = os.environ.get('BEDROCK_AGENT_ID', 'F0DBNGWGKS')
BEDROCK_AGENT_ALIAS_ID = os.environ.get('BEDROCK_AGENT_ALIAS_ID', 'OQR0YT8I99')

# API Keys
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
RUNWAY_API_KEY = os.environ.get('RUNWAY_API_KEY', '')
MINIMAX_API_KEY = os.environ.get('MINIMAX_API_KEY', '')  # Placeholder
ADOBE_API_KEY = os.environ.get('ADOBE_API_KEY', '')  # Placeholder
FIGMA_API_KEY = os.environ.get('FIGMA_API_KEY', '')  # Placeholder

# Check model availability
VEO3_AVAILABLE = bool(GEMINI_API_KEY and len(GEMINI_API_KEY) > 10)
RUNWAY_AVAILABLE = bool(RUNWAY_API_KEY and len(RUNWAY_API_KEY) > 10)
DALLE_AVAILABLE = bool(OPENAI_API_KEY and len(OPENAI_API_KEY) > 10)
IMAGEN4_AVAILABLE = bool(GEMINI_API_KEY and len(GEMINI_API_KEY) > 10)
HAILUO_AVAILABLE = bool(MINIMAX_API_KEY and len(MINIMAX_API_KEY) > 10)

# Runway configuration
RUNWAY_API_BASE = 'https://api.dev.runwayml.com/v1'
RUNWAY_API_VERSION = '2024-11-06'

# Create FastAPI app
app = FastAPI(
    title="Creative AI Studio - Unified Multi-Model API",
    description="Multi-model generation API with Veo 3, Runway Gen-4, DALL-E 3, and Imagen 4",
    version="6.0-unified-architecture"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== MODEL REGISTRY ====================

MODEL_REGISTRY = {
    "video": {
        "veo3": {
            "name": "Veo 3",
            "provider": "Google",
            "available": VEO3_AVAILABLE,
            "max_duration": 8,
            "cost_per_second": 0.10,
            "features": ["physics_aware", "camera_controls", "reference_images"],
            "strengths": ["cinematic_quality", "realistic_motion", "brand_consistency"]
        },
        "runway": {
            "name": "Runway Gen-4",
            "provider": "Runway",
            "available": RUNWAY_AVAILABLE,
            "max_duration": 10,
            "cost_per_second": 0.15,
            "features": ["motion_control", "fast_generation", "style_transfer"],
            "strengths": ["trendy_effects", "quick_turnaround", "creative_freedom"]
        },
        "hailuo": {
            "name": "Hailuo-02",
            "provider": "Minimax",
            "available": HAILUO_AVAILABLE,
            "max_duration": 6,
            "cost_per_second": 0.08,
            "features": ["action_movements", "cinematic_quality"],
            "strengths": ["dynamic_action", "cost_effective"],
            "placeholder": True
        }
    },
    "image": {
        "dalle3": {
            "name": "DALL-E 3",
            "provider": "OpenAI",
            "available": DALLE_AVAILABLE,
            "max_resolution": "1024x1024",
            "cost_per_image": 0.04,
            "features": ["creative_style", "text_rendering", "artistic"],
            "strengths": ["artistic_interpretation", "creative_composition"]
        },
        "imagen4": {
            "name": "Imagen 4",
            "provider": "Google",
            "available": IMAGEN4_AVAILABLE,
            "max_resolution": "2048x2048",
            "cost_per_image": 0.03,
            "features": ["photorealistic", "fast_generation"],
            "strengths": ["photo_quality", "speed", "accuracy"]
        }
    }
}


# === VFX Templates (new 6-pack; long-form, UI-aligned ids) ===
VFX_TEMPLATES = {
    "earth-zoom-out": {
        "name": "Earth Zoom Out",
        "description": "Pull back to space",
        "prompt_modifier": (
        "camera begins a continuous pull-back: reveal the full roadside and traffic, then the wider landscape, "
        "the region, the continent, and eventually pulling back into the blackness of space, showing a "
        "photorealistic Earth spinning slowly with a subtle glowing marker at the starting location"
        ),
    },
    "disintegrate": {
        "name": "Disintegrate",
        "description": "Dissolve to particles",
        "prompt_modifier": (
            "subject dissolves into thousands of glowing particles that drift away; shimmering dust motes, "
            "magic realism; hold the moment as form breaks into luminous grains"
        ),
    },
    "face-punch": {
        "name": "Face Punch",
        "description": "Bullet-time impact",
        "prompt_modifier": (
            "bullet-time slow motion impact; dynamic ripples in air, micro-debris suspended, subtle camera orbit; "
            "no gore"
        ),
    },
    "eyes-in": {
        "name": "Eyes In",
        "description": "Zoom into the eyes",
        "prompt_modifier": (
            "rapid push-in through the pupil like a portal; pass through iris detail into a new scene in a seamless cut"
        ),
    },
    "paint-splash": {
        "name": "Paint Splash",
        "description": "Liquid colour burst",
        "prompt_modifier": (
            "high-speed liquid paint splashes burst and morph; macro droplets, glossy fluid, vibrant neon hues"
        ),
    },
    "lens-crack": {
        "name": "Lens Crack",
        "description": "Glass shatter effect",
        "prompt_modifier": (
            "the camera lens cracks outward; crystalline shards refract light, then settle; dramatic reflections"
        ),
    },
}

# Back-compat so old ids keep working
VFX_ALIASES = {
    "earth_zoom": "earth-zoom-out",
    "particle_dissolve": "disintegrate",
    "time_freeze": "face-punch",
    "portal_transition": "eyes-in",
    "inception_fold": "paint-splash",  # temp mapping until you add a fold effect
    "shatter_reform": "lens-crack",
}


# ==================== PYDANTIC MODELS ====================

class VisualAssetsRequest(BaseModel):
    client: str = "DFSA"
    context: str = ""
    limit: int = 50


class UnifiedGenerateRequest(BaseModel):
    type: str  # "video" or "image"
    model: str  # "veo3", "runway", "dalle3", "imagen4", etc.
    client: str
    prompt: str
    # Video specific
    duration: Optional[int] = 5
    camera_movement: Optional[str] = ""
    # Image specific
    num_images: Optional[int] = 1
    # Common
    quality: str = "standard"
    aspect_ratio: Optional[str] = "16:9"
    reference_images: List[str] = []
    vfx_template: Optional[str] = None
    style_presets: Optional[Dict[str, Any]] = None

class StatusRequest(BaseModel):
    job_id: str
    type: str  # "video" or "image"


# ==================== TEST ENDPOINT ====================

@app.get("/api/test")
async def test_connection():
    """Enhanced test endpoint for multi-model system"""
    test_results = {
        'lambda': 'Unified Multi-Model API v6.0',
        'timestamp': datetime.now().isoformat(),
        'models_available': {
            'video': {
                'veo3': VEO3_AVAILABLE,
                'runway': RUNWAY_AVAILABLE,
                'hailuo': HAILUO_AVAILABLE
            },
            'image': {
                'dalle3': DALLE_AVAILABLE,
                'imagen4': IMAGEN4_AVAILABLE
            }
        },
        'vfx_templates': len(VFX_TEMPLATES),
        'bedrock_configured': bool(BEDROCK_AGENT_ID),
        's3_buckets_configured': bool(VISUAL_ASSETS_BUCKET and VIDEO_OUTPUT_BUCKET),
        'environment_check': {
            'python_version': '3.9+',
            'server_type': 'FastAPI Unified',
            'async_enabled': True,
            'multi_model': True,
            'features': ['unified_generation', 'vfx_templates', 'model_registry']
        }
    }

    # Test each model's connectivity
    for model_type, models in MODEL_REGISTRY.items():
        for model_id, model_info in models.items():
            if model_info['available']:
                test_results[f'{model_id}_status'] = 'ready'
            else:
                test_results[f'{model_id}_status'] = 'not_configured'

    return test_results


# ==================== UNIFIED GENERATION ENDPOINT ====================

@app.post("/api/unified_generate")
async def unified_generate(request: UnifiedGenerateRequest, background_tasks: BackgroundTasks):
    """Unified endpoint for all model generation"""
    try:
        logger.info(f'🎯 Unified generation: type={request.type}, model={request.model}, client={request.client}')

        # ---- Validate model selection ----
        if request.type not in MODEL_REGISTRY:
            raise HTTPException(status_code=400, detail=f'Invalid type: {request.type}')

        if request.model not in MODEL_REGISTRY[request.type]:
            raise HTTPException(status_code=400, detail=f'Invalid model for {request.type}: {request.model}')

        model_info = MODEL_REGISTRY[request.type][request.model]

        if not model_info['available']:
            if model_info.get('placeholder'):
                raise HTTPException(status_code=503, detail=f'{model_info["name"]} is coming soon')
            raise HTTPException(status_code=503, detail=f'{model_info["name"]} is not configured')

        # ---- Generate job ID ----
        job_id = str(uuid.uuid4())
        logger.info(f'🔑 Job ID: {job_id}')

        # ---- Normalize inputs (non-destructive copy) ----
        # Cap Veo-3 duration to 1..8s; otherwise leave as provided
        normalized_duration = request.duration or 5
        if request.type == "video" and request.model == "veo3":
            normalized_duration = max(1, min(8, int(normalized_duration)))

        # If a VFX is selected, let VFX drive motion: blank out camera to avoid conflict
        normalized_camera = "" if (request.vfx_template) else (request.camera_movement or "")

        # Default style presets (kept out of user-visible prompt)
        normalized_style_presets = request.style_presets or {
            "lighting": "studio",
            "depthOfField": "shallow",
            "tone": "neutral",
            "noTextOrLogos": True
        }

        # Build a working copy of the request with safe overrides
        req = request.copy(update={
            "duration": normalized_duration,
            "camera_movement": normalized_camera,
            "style_presets": normalized_style_presets
        })

        # ---- Apply VFX template text modifier (optional) ----
        enhanced_prompt = req.prompt
        if req.vfx_template and req.vfx_template in VFX_TEMPLATES:
            template = VFX_TEMPLATES[req.vfx_template]
            # Keep this short—agent will integrate it cleanly
            enhanced_prompt = f"{req.prompt}, {template['prompt_modifier']}"
            logger.info(f'🎬 Applied VFX template: {req.vfx_template}')

        # ---- Enhance with Bedrock (passes structured guidance, not user-typed text) ----
        logger.info('🧠 Enhancing with Bedrock Agent...')
        final_prompt, brand_context = await enhance_with_bedrock_unified(
            req.client,
            enhanced_prompt,
            req.model,
            req.type,
            req.reference_images,
            req.vfx_template,
            req.style_presets,    # NEW: forward presets
        )

        # ---- Route to appropriate handler ----
        if req.type == "video":
            if req.model == "veo3":
                result = await generate_veo3_video(
                    final_prompt, req, job_id, brand_context, background_tasks
                )
            elif req.model == "runway":
                result = await generate_runway_video(
                    final_prompt, req, job_id, brand_context, background_tasks
                )
            elif req.model == "hailuo":
                raise HTTPException(status_code=503, detail="Hailuo-02 coming soon")

        elif req.type == "image":
            if req.model == "dalle3":
                result = await generate_dalle3_image(
                    final_prompt, req, job_id, brand_context
                )
            elif req.model == "imagen4":
                result = await generate_imagen4_image(
                    final_prompt, req, job_id, brand_context
                )
            else:
                raise HTTPException(status_code=400, detail=f'Unsupported image model: {req.model}')
        else:
            raise HTTPException(status_code=400, detail=f'Unsupported type: {req.type}')

        # ---- Calculate cost ----
        if req.type == "video":
            estimated_cost = (req.duration or 5) * model_info['cost_per_second']
        else:
            estimated_cost = (req.num_images or 1) * model_info['cost_per_image']

        # ---- Response ----
        return {
            'success': True,
            'message': f'{model_info["name"]} generation initiated',
            'job_id': job_id,
            'type': req.type,
            'model': req.model,
            'model_info': model_info,
            'status': 'processing',
            'client': req.client,
            'original_prompt': req.prompt,
            'enhanced_prompt': final_prompt,
            'vfx_template': req.vfx_template,
            'brand_context': brand_context,
            'estimated_cost': estimated_cost,
            'timestamp': datetime.now().isoformat(),

            # Echo normalized fields back to the UI:
            'duration': req.duration,
            'camera_movement': req.camera_movement,
            'style_presets': req.style_presets,
            'reference_images': req.reference_images,

            # plus whatever the model handler returned (e.g., video_key, operation_type)
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'💥 Unified generation error: {str(e)}')
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))



# ==================== VEO 3 HANDLER ====================

async def generate_veo3_video(
    prompt: str,
    request: UnifiedGenerateRequest,
    job_id: str,
    brand_context: Dict,
    background_tasks: BackgroundTasks
) -> Dict:
    """Generate video with Veo 3 (with image-to-video support)"""
    try:
        from google import genai  # keep import to match your existing pattern

        ref_images = getattr(request, "reference_images", []) or []
        cam_move = getattr(request, "camera_movement", None)
        raw_vfx = getattr(request, "vfx_template", None)
        norm_vfx = normalize_vfx_id(raw_vfx)
        logger.info(f"🎞️ VFX template (normalized): {norm_vfx or 'none'}")
        logger.info(f'🎬 Veo 3 generation: {request.duration}s, {request.quality}')
        logger.info(f'📸 Reference images provided: {len(ref_images)}')

        # Compose a final base prompt (non-breaking)
        composed_prompt = compose_local_prompt(
            original_prompt=prompt,
            model="veo3",
            vfx_id=norm_vfx,
            camera_movement=cam_move,
            reference_descriptions=getattr(request, "reference_descriptions", None),
        )

        # Then apply your existing Veo3 optimizers (unchanged logic)
        if ref_images:
            veo3_prompt = optimize_for_veo3_with_reference(composed_prompt, brand_context, request.duration)
        else:
            veo3_prompt = optimize_for_veo3(composed_prompt, brand_context, request.duration)

        video_key = f"{request.client.lower()}/generated-videos/{job_id}/output.mp4"

        # Save initial metadata
        metadata = {
            "job_id": job_id,
            "model": "veo3",
            "status": "processing",
            "original_prompt": prompt,
            "composed_prompt": composed_prompt,
            "optimized_prompt": veo3_prompt,
            "duration": request.duration,
            "quality": request.quality,
            "client": request.client,
            "camera_movement": cam_move,
            "reference_images": ref_images,
            "vfx_template": norm_vfx,
            "image_to_video": bool(ref_images),
            "started_at": datetime.now().isoformat(),
            "video_key": video_key,
        }
        s3_client.put_object(
            Bucket=VIDEO_OUTPUT_BUCKET,
            Key=f"{request.client.lower()}/generated-videos/{job_id}/metadata.json",
            Body=json.dumps(metadata, indent=2),
            ContentType="application/json",
        )

        # Launch the background job
        background_tasks.add_task(
            process_veo3_generation,
            veo3_prompt,
            request.duration,
            request.quality,
            ref_images,
            job_id,
            request.client,
            video_key,
        )

        return {
            "video_key": video_key,
            "operation_type": "veo3_generation",
            "using_image_to_video": bool(ref_images),
        }

    except Exception as e:
        logger.error(f"💥 Veo 3 error: {str(e)}")
        raise



async def process_veo_3_upload_to_gemini(s3_key: str):
    """Helper: fetch S3 object and upload to Gemini Files, returning the File handle."""
    from google import genai
    veo3_client = genai.Client(api_key=GEMINI_API_KEY)

    # Download from S3
    obj = s3_client.get_object(Bucket=VISUAL_ASSETS_BUCKET, Key=s3_key)
    data = obj['Body'].read()

    # Write to temp then upload (SDK wants a file-like path or bytes under 'file')
    import tempfile, os as _os
    with tempfile.NamedTemporaryFile(suffix=_infer_image_suffix(s3_key), delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        # IMPORTANT: use `file=`, not `path=`
        uploaded = veo3_client.files.upload(file=tmp_path)
        return uploaded
    finally:
        try:
            _os.unlink(tmp_path)
        except Exception:
            pass


def _infer_image_suffix(name: str) -> str:
    lower = name.lower()
    if lower.endswith(".png"): return ".png"
    if lower.endswith(".webp"): return ".webp"
    if lower.endswith(".jpeg"): return ".jpeg"
    return ".jpg"


async def process_veo3_generation(
    prompt: str,
    duration: int,
    quality: str,
    reference_images: List[str],
    job_id: str,
    client: str,
    video_key: str,
):
    """
    Background worker for Veo 3.
    - Sends an inline reference image (bytes + mime) instead of a Files handle.
    - Polls the LRO, then downloads the first generated video and writes to S3.
    - Keeps your existing metadata/progress scheme.
    """
    try:
        import asyncio, json
        from datetime import datetime
        from typing import List  # for clarity if this file is executed standalone

        from google import genai
        from google.genai import types

        logger.info(f'🚀 Processing Veo 3: {job_id}')
        logger.info(f'📸 Reference images: {len(reference_images)}')

        veo3_client = genai.Client(api_key=GEMINI_API_KEY)

        # -------- Build optional image payload (first selected asset only) --------
        image_payload = None
        if reference_images:
            first_key = reference_images[0]
            logger.info(f'🖼️ Fetching reference image from S3: {first_key}')

            s3_obj = s3_client.get_object(Bucket=VISUAL_ASSETS_BUCKET, Key=first_key)
            image_bytes = s3_obj["Body"].read()

            mime = "image/jpeg"
            lower = first_key.lower()
            if lower.endswith(".png"):
                mime = "image/png"
            elif lower.endswith(".webp"):
                mime = "image/webp"
            elif lower.endswith(".gif"):
                mime = "image/gif"

            image_payload = types.Image(image_bytes=image_bytes, mime_type=mime)
            logger.info(f'✅ Prepared inline image payload ({mime}, {len(image_bytes)} bytes)')

        negative_prompt = "blurry, distorted, low quality, watermark, text overlay"

        # ----------------------------- Kick off generation -----------------------------
        if image_payload is not None:
            logger.info('🎬 Generating WITH reference image (image-to-video)')
            operation = veo3_client.models.generate_videos(
                model="veo-3.0-generate-preview",
                prompt=prompt,
                image=image_payload,
                config=types.GenerateVideosConfig(negative_prompt=negative_prompt),
            )
        else:
            logger.info('🎬 Generating WITHOUT reference image (text-only)')
            operation = veo3_client.models.generate_videos(
                model="veo-3.0-generate-preview",
                prompt=prompt,
                config=types.GenerateVideosConfig(negative_prompt=negative_prompt),
            )

        logger.info(f'⚡ Veo 3 operation started: {operation.name}')

        # ---------------- Poll for completion (update progress metadata) ----------------
        max_attempts = 36  # ~12 minutes @ 20s
        attempt = 0
        while not operation.done and attempt < max_attempts:
            await asyncio.sleep(20)
            operation = veo3_client.operations.get(operation)
            attempt += 1

            progress = min(int((attempt / max_attempts) * 95), 95)
            try:
                meta_key = f"{client.lower()}/generated-videos/{job_id}/metadata.json"
                meta_obj = s3_client.get_object(Bucket=VIDEO_OUTPUT_BUCKET, Key=meta_key)
                meta = json.loads(meta_obj["Body"].read().decode("utf-8"))
                meta["status"] = "processing"
                meta["progress"] = progress
                s3_client.put_object(
                    Bucket=VIDEO_OUTPUT_BUCKET,
                    Key=meta_key,
                    Body=json.dumps(meta, indent=2),
                    ContentType="application/json",
                )
            except Exception as upd_err:
                logger.warning(f"Progress update failed (non-fatal): {upd_err}")

        # ------------------------------ Download & write -------------------------------
        if not operation.done or not getattr(operation, "result", None) or not getattr(operation.result, "generated_videos", None):
            raise RuntimeError("Veo 3 operation did not return generated_videos.")

        generated_video = operation.result.generated_videos[0]
        video_file_ref = generated_video.video  # Files service handle
        video_bytes = veo3_client.files.download(file=video_file_ref)

        # Some SDK versions return a stream-like object
        if hasattr(video_bytes, "read"):
            video_bytes = video_bytes.read()

        s3_client.put_object(
            Bucket=VIDEO_OUTPUT_BUCKET,
            Key=video_key,
            Body=video_bytes,
            ContentType="video/mp4",
        )

        # ------------------------------ Finalize metadata ------------------------------
        meta_key = f"{client.lower()}/generated-videos/{job_id}/metadata.json"
        meta_obj = s3_client.get_object(Bucket=VIDEO_OUTPUT_BUCKET, Key=meta_key)
        meta = json.loads(meta_obj["Body"].read().decode("utf-8"))
        meta.update({"status": "completed", "progress": 100, "completed_at": datetime.now().isoformat()})
        s3_client.put_object(
            Bucket=VIDEO_OUTPUT_BUCKET,
            Key=meta_key,
            Body=json.dumps(meta, indent=2),
            ContentType="application/json",
        )

        logger.info("✅ Veo 3 video saved and metadata marked completed.")

    except Exception as e:
        logger.error(f'💥 Veo 3 background error: {e}')
        # Record failure so UI shows a useful status
        try:
            meta_key = f"{client.lower()}/generated-videos/{job_id}/metadata.json"
            meta_obj = s3_client.get_object(Bucket=VIDEO_OUTPUT_BUCKET, Key=meta_key)
            meta = json.loads(meta_obj["Body"].read().decode("utf-8"))
            meta.update({"status": "failed", "error": str(e), "completed_at": datetime.now().isoformat()})
            s3_client.put_object(
                Bucket=VIDEO_OUTPUT_BUCKET,
                Key=meta_key,
                Body=json.dumps(meta, indent=2),
                ContentType="application/json",
            )
        except Exception as meta_err:
            logger.error(f"Also failed to write failure metadata: {meta_err}")
        raise



# ==================== RUNWAY HANDLER ====================

async def generate_runway_video(prompt: str, request: UnifiedGenerateRequest, job_id: str,
                                brand_context: Dict, background_tasks: BackgroundTasks) -> Dict:
    """Generate video with Runway Gen-4"""
    try:
        logger.info(f'🎥 Runway Gen-4 generation: {request.duration}s')

        # Optimize for Runway
        runway_prompt = optimize_for_runway(prompt, brand_context)

        video_key = f"{request.client.lower()}/generated-videos/{job_id}/output.mp4"

        # Prepare headers
        headers = {
            'Authorization': f'Bearer {RUNWAY_API_KEY}',
            'X-Runway-Version': RUNWAY_API_VERSION,
            'Content-Type': 'application/json'
        }

        # Handle reference image
        prompt_image_url = "https://via.placeholder.com/1x1/000000/000000"  # Black pixel fallback
        if request.reference_images:
            try:
                prompt_image_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': VISUAL_ASSETS_BUCKET, 'Key': request.reference_images[0]},
                    ExpiresIn=3600
                )
            except:
                pass

        # Map aspect ratio
        ratio_map = {
            "16:9": "1280:720",
            "9:16": "720:1280",
            "1:1": "1024:1024",
            "4:3": "1024:768"
        }
        ratio = ratio_map.get(request.aspect_ratio, "1280:720")

        # Create generation request
        request_body = {
            "model": "gen4_turbo",
            "promptImage": prompt_image_url,
            "promptText": runway_prompt,
            "ratio": ratio,
            "duration": request.duration,
            "watermark": False
        }

        # Start generation
        response = requests.post(
            f'{RUNWAY_API_BASE}/image_to_video',
            headers=headers,
            json=request_body,
            timeout=60
        )

        if response.status_code not in (200, 201):
            raise Exception(f'Runway API error: {response.status_code} - {response.text}')

        data = response.json()
        task_id = data.get('id')

        # Save metadata
        metadata = {
            'job_id': job_id,
            'model': 'runway',
            'runway_task_id': task_id,
            'status': 'processing',
            'prompt': runway_prompt,
            'duration': request.duration,
            'ratio': ratio,
            'client': request.client,
            'started_at': datetime.now().isoformat(),
            'video_key': video_key
        }

        s3_client.put_object(
            Bucket=VIDEO_OUTPUT_BUCKET,
            Key=f"{request.client.lower()}/generated-videos/{job_id}/metadata.json",
            Body=json.dumps(metadata, indent=2),
            ContentType='application/json'
        )

        # Start async polling
        background_tasks.add_task(
            poll_runway_status,
            task_id, job_id, request.client, video_key
        )

        return {
            'video_key': video_key,
            'runway_task_id': task_id,
            'operation_type': 'runway_generation'
        }

    except Exception as e:
        logger.error(f'💥 Runway error: {str(e)}')
        raise


async def poll_runway_status(task_id: str, job_id: str, client: str, video_key: str):
    """Poll Runway task status"""
    try:
        headers = {
            'Authorization': f'Bearer {RUNWAY_API_KEY}',
            'X-Runway-Version': RUNWAY_API_VERSION
        }

        max_attempts = 60
        for attempt in range(max_attempts):
            await asyncio.sleep(10)

            response = requests.get(
                f'{RUNWAY_API_BASE}/tasks/{task_id}',
                headers=headers,
                timeout=30
            )

            if response.status_code == 200:
                task_data = response.json()
                status = task_data.get('status')

                if status == 'SUCCEEDED':
                    output = task_data.get('output')
                    if output:
                        video_url = output if isinstance(output, str) else output[0]
                        video_response = requests.get(video_url, timeout=120)

                        if video_response.status_code == 200:
                            s3_client.put_object(
                                Bucket=VIDEO_OUTPUT_BUCKET,
                                Key=video_key,
                                Body=video_response.content,
                                ContentType='video/mp4'
                            )

                            # Update metadata
                            metadata = s3_client.get_object(
                                Bucket=VIDEO_OUTPUT_BUCKET,
                                Key=f"{client.lower()}/generated-videos/{job_id}/metadata.json"
                            )
                            metadata_dict = json.loads(metadata['Body'].read())
                            metadata_dict.update({
                                'status': 'completed',
                                'completed_at': datetime.now().isoformat()
                            })

                            s3_client.put_object(
                                Bucket=VIDEO_OUTPUT_BUCKET,
                                Key=f"{client.lower()}/generated-videos/{job_id}/metadata.json",
                                Body=json.dumps(metadata_dict, indent=2),
                                ContentType='application/json'
                            )

                            logger.info(f'✅ Runway completed: {job_id}')
                            return

                elif status == 'FAILED':
                    raise Exception(task_data.get('failure_reason', 'Unknown error'))

    except Exception as e:
        logger.error(f'💥 Runway polling error: {str(e)}')
        # Update metadata with error
        metadata = {
            'job_id': job_id,
            'status': 'failed',
            'error': str(e),
            'failed_at': datetime.now().isoformat()
        }
        s3_client.put_object(
            Bucket=VIDEO_OUTPUT_BUCKET,
            Key=f"{client.lower()}/generated-videos/{job_id}/metadata.json",
            Body=json.dumps(metadata, indent=2),
            ContentType='application/json'
        )


# ==================== DALL-E 3 HANDLER ====================

async def generate_dalle3_image(prompt: str, request: UnifiedGenerateRequest,
                                job_id: str, brand_context: Dict) -> Dict:
    """Generate image with DALL-E 3"""
    try:
        logger.info(f'🎨 DALL-E 3 generation: {request.num_images} images')

        # Optimize for DALL-E 3
        dalle_prompt = optimize_for_dalle3(prompt, brand_context)

        # Map aspect ratio to DALL-E 3 sizes
        size_map = {
            "1:1": "1024x1024",
            "16:9": "1792x1024",
            "9:16": "1024x1792"
        }
        size = size_map.get(request.aspect_ratio, "1024x1024")

        headers = {
            'Authorization': f'Bearer {OPENAI_API_KEY}',
            'Content-Type': 'application/json'
        }

        saved_images = []
        for i in range(request.num_images or 1):
            payload = {
                "model": "dall-e-3",
                "prompt": dalle_prompt,
                "n": 1,
                "size": size,
                "quality": "hd" if request.quality == "high" else "standard",
                "style": "natural",
                "response_format": "b64_json"
            }

            response = requests.post(
                'https://api.openai.com/v1/images/generations',
                headers=headers,
                json=payload,
                timeout=120
            )

            if response.status_code == 200:
                result = response.json()
                if 'data' in result and len(result['data']) > 0:
                    image_data_b64 = result['data'][0]['b64_json']
                    image_data = base64.b64decode(image_data_b64)

                    image_key = f"{request.client.lower()}/generated-images/{job_id}/image_{i + 1}.png"

                    s3_client.put_object(
                        Bucket=IMAGE_OUTPUT_BUCKET,
                        Key=image_key,
                        Body=image_data,
                        ContentType='image/png'
                    )

                    saved_images.append(image_key)
                    logger.info(f'✅ DALL-E 3 image {i + 1} saved')

                    if i < request.num_images - 1:
                        await asyncio.sleep(2)  # Rate limiting

        # Save metadata
        metadata = {
            'job_id': job_id,
            'model': 'dalle3',
            'status': 'completed',
            'prompt': dalle_prompt,
            'images': saved_images,
            'completed_at': datetime.now().isoformat()
        }

        s3_client.put_object(
            Bucket=IMAGE_OUTPUT_BUCKET,
            Key=f"{request.client.lower()}/generated-images/{job_id}/metadata.json",
            Body=json.dumps(metadata, indent=2),
            ContentType='application/json'
        )

        return {
            'image_keys': saved_images,
            'status': 'completed'
        }

    except Exception as e:
        logger.error(f'💥 DALL-E 3 error: {str(e)}')
        raise


# ==================== IMAGEN 4 HANDLER ====================

async def generate_imagen4_image(prompt: str, request: UnifiedGenerateRequest,
                                 job_id: str, brand_context: Dict) -> Dict:
    """Generate image with Imagen 4"""
    try:
        logger.info(f'📷 Imagen 4 generation: {request.num_images} images')

        # Optimize for Imagen 4
        imagen_prompt = optimize_for_imagen4(prompt, brand_context)

        headers = {
            'x-goog-api-key': GEMINI_API_KEY,
            'Content-Type': 'application/json'
        }

        # Map aspect ratio
        aspect_map = {
            "1:1": "1:1",
            "16:9": "16:9",
            "9:16": "9:16",
            "4:3": "4:3"
        }
        aspect = aspect_map.get(request.aspect_ratio, "1:1")

        payload = {
            "instances": [{"prompt": imagen_prompt}],
            "parameters": {
                "sampleCount": request.num_images or 1,
                "aspectRatio": aspect,
                "includeRaiInfo": False
            }
        }

        response = requests.post(
            'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-preview-06-06:predict',
            headers=headers,
            json=payload,
            timeout=120
        )

        saved_images = []
        if response.status_code == 200:
            result = response.json()
            predictions = result.get('predictions', [])

            for i, prediction in enumerate(predictions[:request.num_images]):
                if 'bytesBase64Encoded' in prediction:
                    image_data = base64.b64decode(prediction['bytesBase64Encoded'])
                    image_key = f"{request.client.lower()}/generated-images/{job_id}/image_{i + 1}.png"

                    s3_client.put_object(
                        Bucket=IMAGE_OUTPUT_BUCKET,
                        Key=image_key,
                        Body=image_data,
                        ContentType='image/png'
                    )

                    saved_images.append(image_key)
                    logger.info(f'✅ Imagen 4 image {i + 1} saved')

        # Save metadata
        metadata = {
            'job_id': job_id,
            'model': 'imagen4',
            'status': 'completed',
            'prompt': imagen_prompt,
            'images': saved_images,
            'completed_at': datetime.now().isoformat()
        }

        s3_client.put_object(
            Bucket=IMAGE_OUTPUT_BUCKET,
            Key=f"{request.client.lower()}/generated-images/{job_id}/metadata.json",
            Body=json.dumps(metadata, indent=2),
            ContentType='application/json'
        )

        return {
            'image_keys': saved_images,
            'status': 'completed'
        }

    except Exception as e:
        logger.error(f'💥 Imagen 4 error: {str(e)}')
        raise


# ==================== STATUS CHECKING ====================

@app.post("/api/check_status")
async def check_unified_status(request: StatusRequest):
    """Unified status checking for all models"""
    try:
        job_id = request.job_id
        if not job_id:
            raise HTTPException(status_code=400, detail='job_id is required')

        logger.info(f'🔍 Status check: {job_id} ({request.type})')

        # Determine bucket based on type
        output_bucket = VIDEO_OUTPUT_BUCKET if request.type == "video" else IMAGE_OUTPUT_BUCKET

        # Find metadata
        metadata = None
        client_found = None

        for client in ['dfsa', 'atlas', 'yourbud']:
            try:
                response = s3_client.get_object(
                    Bucket=output_bucket,
                    Key=f"{client}/generated-{request.type}s/{job_id}/metadata.json"
                )
                metadata = json.loads(response['Body'].read())
                client_found = client
                break
            except s3_client.exceptions.NoSuchKey:
                continue

        if not metadata:
            raise HTTPException(status_code=404, detail=f'Job not found: {job_id}')

        current_status = metadata.get('status', 'unknown')
        model = metadata.get('model', 'unknown')

        if current_status == 'completed':
            if request.type == "video":
                video_key = metadata.get('video_key')
                try:
                    s3_client.head_object(Bucket=output_bucket, Key=video_key)
                    video_url = s3_client.generate_presigned_url(
                        'get_object',
                        Params={'Bucket': output_bucket, 'Key': video_key},
                        ExpiresIn=3600
                    )
                    return {
                        'success': True,
                        'status': 'completed',
                        'video_url': video_url,
                        'video_key': video_key,
                        'metadata': metadata
                    }
                except:
                    return {
                        'success': True,
                        'status': 'processing',
                        'progress': 95,
                        'message': 'Finalizing video...'
                    }
            else:  # image
                image_keys = metadata.get('images', [])
                image_urls = []
                for key in image_keys:
                    try:
                        s3_client.head_object(Bucket=output_bucket, Key=key)
                        url = s3_client.generate_presigned_url(
                            'get_object',
                            Params={'Bucket': output_bucket, 'Key': key},
                            ExpiresIn=3600
                        )
                        image_urls.append({'key': key, 'url': url})
                    except:
                        pass

                return {
                    'success': True,
                    'status': 'completed',
                    'image_urls': image_urls,
                    'metadata': metadata
                }

        elif current_status == 'processing':
            progress = metadata.get('progress', 25)
            return {
                'success': True,
                'status': 'processing',
                'progress': progress,
                'message': f'{model} generation in progress...',
                'metadata': metadata
            }

        elif current_status == 'failed':
            return {
                'success': False,
                'status': 'failed',
                'error': metadata.get('error', 'Unknown error'),
                'metadata': metadata
            }

        return {
            'success': True,
            'status': current_status,
            'metadata': metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'💥 Status check error: {str(e)}')
        raise HTTPException(status_code=500, detail=str(e))


# ==================== VISUAL ASSETS (EXISTING) ====================

@app.post("/api/visual_assets")
async def get_visual_assets(request: VisualAssetsRequest):
    """Fetch visual assets for reference (existing implementation)"""
    try:
        logger.info(f'🎨 Loading {request.client} assets...')
        assets = []

        client_folders = {
            'DFSA': 'client-dfsa',
            'Atlas': 'client-atlas',
            'YourBud': 'client-yourbuddy'
        }

        folder_name = client_folders.get(request.client, 'client-dfsa')
        prefix = f"{folder_name}/"

        paginator = s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(
            Bucket=VISUAL_ASSETS_BUCKET,
            Prefix=prefix,
            MaxKeys=1000
        )

        asset_count = 0
        for page in pages:
            if 'Contents' in page:
                for obj in page['Contents']:
                    key = obj['Key']
                    if key.endswith('/') or '/.DS_Store' in key or key == prefix:
                        continue

                    if not any(key.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif']):
                        continue

                    try:
                        url = s3_client.generate_presigned_url(
                            'get_object',
                            Params={'Bucket': VISUAL_ASSETS_BUCKET, 'Key': key},
                            ExpiresIn=3600
                        )

                        filename = key.split('/')[-1]
                        category = categorize_asset(key, filename)

                        assets.append({
                            'key': key,
                            'url': url,
                            'filename': filename,
                            'size': obj['Size'],
                            'category': category,
                            'content_type': get_content_type(filename),
                            'last_modified': obj['LastModified'].isoformat(),
                            'description': generate_asset_description(filename, category)
                        })

                        asset_count += 1
                        if asset_count >= request.limit:
                            break

                    except Exception as url_error:
                        logger.error(f'Error generating URL for {key}: {str(url_error)}')
                        continue

                if asset_count >= request.limit:
                    break

        # Sort by category priority
        priority_order = ['product-hero', 'lifestyle-cooking', 'lifestyle-family', 'brand-core', 'general']
        assets.sort(key=lambda x: priority_order.index(x['category']) if x['category'] in priority_order else 999)

        logger.info(f'✅ Found {len(assets)} assets for {request.client}')

        return {
            'success': True,
            'client': request.client,
            'assets': assets,
            'total_assets': len(assets),
            'has_more': asset_count >= request.limit,
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f'💥 Error fetching assets: {str(e)}')
        raise HTTPException(status_code=500, detail=str(e))



# ==================== BEDROCK ENHANCEMENT ====================

async def enhance_with_bedrock_unified(
    client_name: str,
    user_prompt: str,
    model_id: str,
    gen_type: str,
    reference_images: List[str],
    vfx_template_id: Optional[str],
    style_presets: Optional[Dict[str, Any]] = None,
):
    """
    Calls the Bedrock Agent to produce a structured JSON response.
    Minimal cleanup added:
      - strips DFSA/food language if client != DFSA
      - normalizes earth zoom phrasing
    """
    session_id = str(uuid.uuid4())

    agent_input = {
        "client": client_name or "Generic",
        "model": model_id,
        "type": gen_type,
        "user_prompt": user_prompt,
        "vfx_id": vfx_template_id or "",
        "reference_assets": {
            "has_assets": bool(reference_images),
            "keys": reference_images[:5],
        },
        "style_presets": style_presets or {},
    }

    try:
        response = bedrock_agent.invoke_agent(
            agentId=BEDROCK_AGENT_ID,
            agentAliasId=BEDROCK_AGENT_ALIAS_ID,
            sessionId=session_id,
            inputText=json.dumps(agent_input),
        )

        chunks = []
        for event in response.get("completion", []):
            if "chunk" in event and "bytes" in event["chunk"]:
                chunks.append(event["chunk"]["bytes"].decode("utf-8", errors="ignore"))
        raw_text = "".join(chunks).strip()

        if not raw_text and "outputText" in response:
            raw_text = response["outputText"]

        agent_json = json.loads(raw_text)

        enhanced = agent_json.get("enhanced_prompt", user_prompt)
        brand_ctx = agent_json.get("brand_context", {"client": client_name or "Generic"})

        # 🚫 Simple guard: strip old DFSA language if not DFSA
        if client_name.strip().lower() != "dfsa":
            for bad in [
                "warm natural food photography",
                "premium dried fruit",
                "dried fruit",
                "food photography",
            ]:
                enhanced = enhanced.replace(bad, "")

        # 🔧 Fix earth zoom phrasing
        enhanced = enhanced.replace(
            "the view transitions into",
            "eventually pulling back into the blackness of space, showing",
        )

        return enhanced.strip(), brand_ctx

    except Exception as e:
        logger.warning(f"Bedrock Agent failed, falling back locally: {e}")

        movement = "slow continuous zoom out"
        aspect = "16:9"
        duration = "8s" if (gen_type == "video" and model_id == "veo3") else "5s"

        vfx_suffix = ""
        if vfx_template_id == "earth-zoom-out":
            vfx_suffix = (
                " The camera pulls back: reveal the full roadside and traffic, the wider landscape, "
                "the region, the continent, and eventually pulling back into the blackness of space, "
                "showing a photorealistic Earth spinning slowly with a subtle glowing marker at the starting location."
            )

        header = f"Camera: {movement}; Duration: {duration}; Aspect: {aspect}."
        enhanced = f"{header} {user_prompt.strip()}{vfx_suffix}"

        if client_name.strip().lower() != "dfsa":
            for bad in [
                "warm natural food photography",
                "premium dried fruit",
                "dried fruit",
                "food photography",
            ]:
                enhanced = enhanced.replace(bad, "")

        enhanced = enhanced.replace(
            "the view transitions into",
            "eventually pulling back into the blackness of space, showing",
        )

        return enhanced.strip(), {"client": client_name or "Generic", "notes": "local-fallback"}



# ==================== OPTIMIZATION FUNCTIONS ====================

def optimize_for_veo3(prompt: str, brand_context: Dict, duration: int) -> str:
    """
    Non–image-to-video path. Respect VFX directives when present; otherwise
    add a bit of cinematic motion so previews aren’t static.
    """
    parts: list[str] = []

    # Keep the composed prompt first (may include VFX)
    parts.append(prompt.strip())

    if not has_vfx_directive(prompt):
        parts.append(
            "Use a tasteful cinematic camera move (subtle dolly or parallax) to add life to the shot."
        )

    parts.append(
        f"Total duration: ~{duration}s. Cinematic grade, stabilized, no text or logos, "
        "24–30 fps, natural motion blur."
    )

    return " ".join(parts)



def has_vfx_directive(text: str) -> bool:
    """
    Detect if the composed prompt already contains a VFX/camera directive.
    We keep this intentionally simple and robust to wording.
    """
    if not text:
        return False
    needles = [
        "vfx:", "earth zoom", "zoom out", "dolly-out", "pull back",
        "disintegrate", "particle", "lens crack", "paint splash",
        "zoom into the eyes", "eyes in", "face punch", "bullet time"
    ]
    lt = text.lower()
    return any(n in lt for n in needles)


def optimize_for_veo3_with_reference(prompt: str, brand_context: Dict, duration: int) -> str:
    """
    Keep the first frame faithful to the reference, but DO NOT inject a default
    push-in if a VFX directive already exists (e.g., Earth Zoom Out).
    """
    parts: list[str] = []

    # Keep the prompt we already composed (it may include a VFX directive)
    parts.append(prompt.strip())

    # Reference-image guidance
    parts.append(
        "Start from the provided reference frame and preserve the subject identity, outfit, "
        "and environment in the opening shot. Keep composition and lighting consistent for a smooth transition."
    )

    # Only add a default gentle motion if no explicit VFX/camera directive is present
    if not has_vfx_directive(prompt):
        parts.append(
            "Add subtle cinematic motion (gentle push‑in) to avoid a static shot."
        )

    # Duration & output quality constraints that play well with Veo 3 preview
    parts.append(
        f"Total duration: ~{duration}s. Stabilized, cinematic look, no text or logos, "
        "24–30 fps, natural motion blur, crisp focus where appropriate."
    )

    return " ".join(parts)



def optimize_for_runway(prompt: str, brand_context: Dict) -> str:
    """Optimize prompt for Runway Gen-4"""
    # Runway prefers concise, action-focused prompts
    if len(prompt) > 500:
        prompt = prompt[:500]

    if 'motion' not in prompt.lower():
        prompt += ", dynamic motion"

    return prompt


def optimize_for_dalle3(prompt: str, brand_context: Dict) -> str:
    """Optimize prompt for DALL-E 3"""
    if not prompt.lower().startswith(('a ', 'an ', 'the ')):
        prompt = f"A high-quality image of {prompt}"

    prompt += ", professional photography, detailed, sharp focus"
    return prompt


def optimize_for_imagen4(prompt: str, brand_context: Dict) -> str:
    """Optimize prompt for Imagen 4"""
    prompt = f"Professional photography style, {prompt}, photorealistic, commercial quality, detailed"
    return prompt


def create_fallback_prompt(prompt: str, model: str, client: str) -> str:
    """Create fallback prompt when Bedrock fails"""
    client_styles = {
        'DFSA': 'warm natural food photography, premium dried fruit',
        'Atlas': 'professional corporate, modern security',
        'YourBud': 'modern tech aesthetic, digital platform'
    }

    style = client_styles.get(client, '')
    return f"{prompt}, {style}, professional quality"


# ==================== HELPER FUNCTIONS ====================

def normalize_vfx_id(vfx_id: str | None) -> str | None:
    """Map old ids to new, and validate known effects."""
    if not vfx_id:
        return None
    if vfx_id in VFX_TEMPLATES:
        return vfx_id
    if vfx_id in VFX_ALIASES:
        return VFX_ALIASES[vfx_id]
    return None


def compose_local_prompt(
    original_prompt: str,
    model: str,
    vfx_id: str | None,
    camera_movement: str | None,
    reference_descriptions: list[str] | None = None,
) -> str:
    """
    Deterministic prompt composer (no external calls).
    Reference images control appearance; text focuses on motion/VFX & cinematography.
    """
    parts: list[str] = []
    if original_prompt.strip():
        parts.append(original_prompt.strip())

    # Reference guidance
    if reference_descriptions:
        fused = "; ".join(reference_descriptions)[:600]
        parts.append(
            "Use the reference image(s) as the appearance authority. Preserve identity, wardrobe, setting and props. "
            f"Reference details: {fused}."
        )

    # Camera vs VFX (UI prevents both, but guard here too)
    cam_txt = None
    if camera_movement:
        cam_txt = f"Camera movement: {camera_movement.replace('-', ' ')}."
    vfx_txt = None
    if vfx_id:
        mod = VFX_TEMPLATES[vfx_id]["prompt_modifier"]
        vfx_txt = f"VFX: {VFX_TEMPLATES[vfx_id]['name']} — {mod}."

    if cam_txt and not vfx_txt:
        parts.append(cam_txt)
    if vfx_txt and not cam_txt:
        parts.append(vfx_txt)

    # Light model-specific nudges
    if model.lower() == "veo3":
        parts.append("Cinematic quality, realistic physics and materials, temporal coherence, 4K render aesthetics.")
        if reference_descriptions:
            parts.append("Focus text on action and motion; do not re-describe appearance already in images.")

    return " ".join(parts).strip()


def categorize_asset(key: str, filename: str) -> str:
    """Categorize asset based on filename"""
    lower_filename = filename.lower()

    if any(code in lower_filename for code in ['mlk5301', 'mlk5325', 'mlk5356']):
        return 'product-hero'
    elif any(code in lower_filename for code in ['mlk5443', 'mlk5457']):
        return 'lifestyle-cooking'
    elif any(code in lower_filename for code in ['mlk5499', 'mlk5510']):
        return 'lifestyle-family'
    elif 'enhanced' in lower_filename:
        return 'enhanced-product'
    elif 'brand' in lower_filename or 'logo' in lower_filename:
        return 'brand-core'
    else:
        return 'product-general'


def get_content_type(filename: str) -> str:
    """Get content type from filename"""
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    content_types = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
        'png': 'image/png', 'gif': 'image/gif',
        'webp': 'image/webp', 'mp4': 'video/mp4'
    }
    return content_types.get(ext, 'application/octet-stream')


def generate_asset_description(filename: str, category: str) -> str:
    """Generate asset description"""
    descriptions = {
        'product-hero': 'Premium product photography',
        'lifestyle-cooking': 'Cooking and kitchen lifestyle',
        'lifestyle-family': 'Family and lifestyle scenes',
        'enhanced-product': 'Artistically enhanced product',
        'brand-core': 'Core brand elements',
        'product-general': 'General product imagery'
    }
    return descriptions.get(category, 'Brand asset')


# ==================== LEGACY ENDPOINTS FOR COMPATIBILITY ====================

@app.post("/api/generate_video")
async def generate_video_legacy(request: Request, background_tasks: BackgroundTasks):
    """Legacy video generation endpoint - redirects to unified"""
    body = await request.json()

    unified_request = UnifiedGenerateRequest(
        type="video",
        model="veo3",  # Default to Veo 3 for legacy
        client=body.get('client'),
        prompt=body.get('prompt'),
        duration=body.get('duration', 5),
        camera_movement=body.get('camera_movement', ''),
        quality=body.get('quality', 'standard'),
        aspect_ratio="16:9",
        reference_images=body.get('reference_images', [])
    )

    return await unified_generate(unified_request, background_tasks)


@app.post("/api/check_video_status")
async def check_video_status_legacy(request: Request):
    """Legacy status check - redirects to unified"""
    body = await request.json()

    status_request = StatusRequest(
        job_id=body.get('job_id'),
        type="video"
    )

    return await check_unified_status(status_request)


# ==================== MAIN ====================

if __name__ == "__main__":
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 8000))

    logger.info(f'🚀 Starting Unified Multi-Model API on {host}:{port}')
    logger.info(f'📊 Models Available:')
    logger.info(f'  Video: Veo 3={VEO3_AVAILABLE}, Runway={RUNWAY_AVAILABLE}, Hailuo={HAILUO_AVAILABLE}')
    logger.info(f'  Image: DALL-E 3={DALLE_AVAILABLE}, Imagen 4={IMAGEN4_AVAILABLE}')
    logger.info(f'🎬 VFX Templates: {len(VFX_TEMPLATES)}')

    uvicorn.run("lambda_function:app", host=host, port=port, reload=True, log_level="info")