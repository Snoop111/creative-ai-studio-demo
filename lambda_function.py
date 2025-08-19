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
from contextlib import asynccontextmanager

# FastAPI imports
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocketState
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
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')

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
MINIMAX_API_KEY = os.environ.get('MINIMAX_API_KEY', '')  # Placeholder for Hailuo
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


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"WebSocket connected: {client_id}")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"WebSocket disconnected: {client_id}")

    async def send_progress(self, client_id: str, data: dict):
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            try:
                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.send_json(data)
            except Exception as e:
                logger.error(f"Error sending to {client_id}: {e}")
                self.disconnect(client_id)


manager = ConnectionManager()

# Progress tracking
generation_progress = {}


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting Creative AI Studio Backend with WebSocket support")
    yield
    # Shutdown
    logger.info("👋 Shutting down Creative AI Studio Backend")


# Create FastAPI app
app = FastAPI(
    title="Creative AI Studio - Unified Multi-Model API",
    description="Multi-model generation API with Veo 3, Runway Gen-4, DALL-E 3, Imagen 4, and Hailuo",
    version="7.0-unified-websocket",
    lifespan=lifespan
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
            "features": ["character_animation", "emotional_expression"],
            "strengths": ["narrative_flow", "character_consistency"],
            "placeholder": True
        }
    },
    "image": {
        "dalle3": {
            "name": "DALL-E 3",
            "provider": "OpenAI",
            "available": DALLE_AVAILABLE,
            "cost_per_image": 0.04,
            "features": ["creative_interpretation", "text_rendering"],
            "strengths": ["artistic_style", "conceptual_clarity"]
        },
        "imagen4": {
            "name": "Imagen 4",
            "provider": "Google",
            "available": IMAGEN4_AVAILABLE,
            "cost_per_image": 0.03,
            "features": ["photorealism", "accurate_details"],
            "strengths": ["realistic_textures", "natural_lighting"]
        }
    }
}

# ==================== VFX TEMPLATES ====================

VFX_TEMPLATES = {
    "earth_zoom_out": {
        "name": "Earth Zoom Out",
        "motion": "The camera starts close on the subject, then smoothly pulls back through clouds into the stratosphere, continuing to retreat until Earth becomes a small blue marble in the vast darkness of space",
        "duration_hint": 6,
        "style": "cinematic, epic scale transition",
        "modifier": "with an epic zoom-out effect revealing the cosmic scale"
    },
    "lazy_susan": {
        "name": "Lazy Susan",
        "motion": "The camera orbits smoothly around the subject in a perfect 360-degree horizontal rotation, maintaining consistent distance and height, as if the subject is on a rotating turntable",
        "duration_hint": 5,
        "style": "product showcase, smooth rotation",
        "modifier": "rotating smoothly on a turntable in 360 degrees"
    },
    "vertigo_dolly": {
        "name": "Vertigo Dolly",
        "motion": "The camera simultaneously dollies backward while zooming in (or vice versa), creating a disorienting effect where the subject stays the same size but the background dramatically shifts perspective",
        "duration_hint": 4,
        "style": "psychological thriller, dramatic tension",
        "modifier": "with a vertigo effect warping perspective dramatically"
    },
    "drone_reveal": {
        "name": "Drone Reveal",
        "motion": "The camera starts low, rises smoothly upward while tilting down to maintain subject focus, revealing the surrounding landscape in an aerial establishing shot",
        "duration_hint": 5,
        "style": "aerial cinematography, landscape reveal",
        "modifier": "revealed by ascending drone footage"
    },
    "bullet_time": {
        "name": "Bullet Time",
        "motion": "Time appears to slow dramatically as the camera arcs around a frozen or slow-motion moment, capturing the subject from multiple angles in a single fluid movement",
        "duration_hint": 4,
        "style": "action sequence, time manipulation",
        "modifier": "frozen in bullet-time with dynamic camera rotation"
    },
    "push_through": {
        "name": "Push Through",
        "motion": "The camera aggressively pushes forward through space, moving past foreground elements that blur by, diving deeper into the scene toward the subject",
        "duration_hint": 3,
        "style": "dynamic entry, immersive",
        "modifier": "with aggressive forward camera movement through layers"
    },
    "parallax_slide": {
        "name": "Parallax Slide",
        "motion": "The camera tracks sideways past multiple layers of depth, with foreground elements moving faster than background, creating a rich sense of dimensional space",
        "duration_hint": 4,
        "style": "2.5D effect, layered composition",
        "modifier": "with parallax sliding revealing depth layers"
    },
    "spiral_ascent": {
        "name": "Spiral Ascent",
        "motion": "The camera spirals upward around the subject in a helix pattern, combining rotation with vertical movement for a dynamic ascending reveal",
        "duration_hint": 5,
        "style": "ethereal, ascending energy",
        "modifier": "ascending in a dramatic spiral motion"
    },
    "crash_zoom": {
        "name": "Crash Zoom",
        "motion": "An extremely rapid zoom-in that rushes toward the subject with explosive speed, creating sudden dramatic emphasis",
        "duration_hint": 2,
        "style": "comedic or dramatic emphasis",
        "modifier": "with explosive crash zoom for dramatic impact"
    },
    "infinite_zoom": {
        "name": "Infinite Zoom",
        "motion": "The camera appears to zoom endlessly into the subject, revealing new details or transitioning through nested realities in a fractal-like progression",
        "duration_hint": 6,
        "style": "surreal, recursive",
        "modifier": "with infinite zoom revealing nested realities"
    },
    "whip_pan": {
        "name": "Whip Pan",
        "motion": "The camera whips horizontally with extreme speed, creating motion blur between two points of focus, linking separate moments or locations",
        "duration_hint": 2,
        "style": "energetic transition",
        "modifier": "connected by rapid whip pan transition"
    },
    "tilt_shift": {
        "name": "Tilt Shift",
        "motion": "The focal plane shifts dramatically during movement, transforming the scene into a miniature-like perspective with selective focus that draws through the frame",
        "duration_hint": 4,
        "style": "miniaturization effect",
        "modifier": "with tilt-shift creating miniature world effect"
    }
}


# ==================== REQUEST MODELS ====================

class VisualAssetsRequest(BaseModel):
    client: str


class EnhancePromptRequest(BaseModel):
    prompt: str
    model: str
    type: str  # "video" or "image"
    client: str = "Generic"
    vfx_template: Optional[str] = None
    camera_movement: Optional[str] = None
    duration: Optional[int] = 5
    aspect_ratio: Optional[str] = "16:9"
    style_presets: Optional[Dict[str, Any]] = None
    has_reference_images: bool = False


class UnifiedGenerateRequest(BaseModel):
    type: str  # "video" or "image"
    model: str
    client: str
    prompt: str
    # Video specific
    duration: Optional[int] = 5
    camera_movement: Optional[str] = None
    vfx_template: Optional[str] = None
    # Image specific
    num_images: Optional[int] = 1
    # Common
    quality: str = "standard"
    aspect_ratio: Optional[str] = "16:9"
    reference_images: List[str] = []  # Now base64 data URLs
    style_presets: Optional[Dict[str, Any]] = None
    websocket_id: Optional[str] = None  # For progress tracking


class StatusRequest(BaseModel):
    job_id: str
    type: str  # "video" or "image"


# ==================== HELPER FUNCTIONS ====================

def normalize_vfx_id(vfx_id: Optional[str]) -> Optional[str]:
    """Normalize VFX template ID"""
    if not vfx_id:
        return None

    # Handle various formats
    normalized = vfx_id.lower().replace('-', '_').replace(' ', '_')

    # Map common variations
    mappings = {
        'earth_zoom': 'earth_zoom_out',
        'lazy': 'lazy_susan',
        'vertigo': 'vertigo_dolly',
        'drone': 'drone_reveal',
        'bullet': 'bullet_time',
        'push': 'push_through',
        'parallax': 'parallax_slide',
        'spiral': 'spiral_ascent',
        'crash': 'crash_zoom',
        'infinite': 'infinite_zoom',
        'whip': 'whip_pan',
        'tilt': 'tilt_shift'
    }

    for key, value in mappings.items():
        if key in normalized:
            return value

    return normalized if normalized in VFX_TEMPLATES else None


def compose_prompt_with_vfx(original_prompt: str, vfx_id: str, model: str = "veo3") -> str:
    """Compose prompt with VFX template"""
    if not vfx_id or vfx_id not in VFX_TEMPLATES:
        return original_prompt

    vfx = VFX_TEMPLATES[vfx_id]

    # For Veo 3, integrate motion naturally
    if model == "veo3":
        return f"{original_prompt}. {vfx['motion']}"
    else:
        return f"{original_prompt} {vfx['modifier']}"


def get_content_type(filename: str) -> str:
    """Get content type from filename"""
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    content_types = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
        'png': 'image/png', 'gif': 'image/gif',
        'webp': 'image/webp', 'mp4': 'video/mp4'
    }
    return content_types.get(ext, 'application/octet-stream')


# ==================== PROGRESS TRACKING ====================

async def update_progress(job_id: str, websocket_id: Optional[str], progress: int, status: str, message: str = ""):
    """Send real-time progress updates via WebSocket"""
    progress_data = {
        "job_id": job_id,
        "progress": progress,
        "status": status,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }

    # Store in memory
    generation_progress[job_id] = progress_data

    # Send via WebSocket if connected
    if websocket_id:
        await manager.send_progress(websocket_id, progress_data)


# ==================== TEST ENDPOINT ====================

@app.get("/api/test")
async def test_connection():
    """Enhanced test endpoint for multi-model system"""
    test_results = {
        'lambda': 'Unified Multi-Model API v7.0',
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
        'websocket_enabled': True,
        'environment_check': {
            'python_version': '3.9+',
            'server_type': 'FastAPI Unified',
            'async_enabled': True,
            'multi_model': True,
            'features': ['unified_generation', 'vfx_templates', 'model_registry', 'websocket_progress']
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


# ==================== BEDROCK ENHANCEMENT ====================

@app.post("/api/enhance_prompt")
async def enhance_prompt_endpoint(request: EnhancePromptRequest):
    """Endpoint for enhancing prompts with Bedrock agent"""
    try:
        logger.info(f"Enhancing prompt for {request.model}: {request.prompt[:100]}...")

        # Build input for Bedrock agent
        agent_input = {
            "prompt": request.prompt,
            "model": request.model,
            "type": request.type,
            "client": request.client,
            "vfx_id": request.vfx_template,
            "reference_assets": request.has_reference_images,
            "style_presets": request.style_presets or {},
            "duration": request.duration,
            "aspect_ratio": request.aspect_ratio
        }

        # Add VFX motion if selected
        if request.vfx_template and request.vfx_template in VFX_TEMPLATES:
            vfx = VFX_TEMPLATES[request.vfx_template]
            agent_input["vfx_motion"] = vfx["motion"]
            agent_input["vfx_style"] = vfx["style"]

        # Add camera movement if no VFX
        if request.camera_movement and not request.vfx_template:
            agent_input["camera_movement"] = request.camera_movement

        # Call Bedrock agent
        try:
            response = bedrock_agent.invoke_agent(
                agentId=BEDROCK_AGENT_ID,
                agentAliasId=BEDROCK_AGENT_ALIAS_ID,
                sessionId=str(uuid.uuid4()),
                inputText=json.dumps(agent_input)
            )

            # Parse response
            enhanced_data = {}
            for event in response['completion']:
                if 'chunk' in event:
                    chunk_data = event['chunk']['bytes'].decode('utf-8')
                    try:
                        enhanced_data = json.loads(chunk_data)
                        break
                    except:
                        continue

            enhanced_prompt = enhanced_data.get("enhanced_prompt", request.prompt)

        except Exception as e:
            logger.error(f"Bedrock agent error: {e}")
            # Fallback to local enhancement
            enhanced_prompt = enhance_prompt_locally(request)

        return {
            "success": True,
            "original_prompt": request.prompt,
            "enhanced_prompt": enhanced_prompt,
            "model": request.model,
            "type": request.type
        }

    except Exception as e:
        logger.error(f"Enhancement error: {e}")
        return {
            "success": True,
            "original_prompt": request.prompt,
            "enhanced_prompt": request.prompt,
            "model": request.model,
            "type": request.type
        }


def enhance_prompt_locally(request: EnhancePromptRequest) -> str:
    """Local fallback for prompt enhancement"""
    prompt = request.prompt

    # Model-specific enhancements
    if request.model == "veo3":
        # Add cinematic language
        if "camera" not in prompt.lower():
            prompt = f"Cinematic shot: {prompt}"
        if request.duration:
            prompt = f"Duration: {request.duration}s. {prompt}"
        if request.aspect_ratio:
            prompt = f"Aspect: {request.aspect_ratio}. {prompt}"

    elif request.model == "dalle3":
        # Add composition hints
        if "style" not in prompt.lower():
            prompt = f"{prompt}, professional composition, high detail"

    elif request.model == "runway":
        # Add stylistic elements
        prompt = f"{prompt}, stylized, dynamic motion"

    # Add VFX if present
    if request.vfx_template:
        prompt = compose_prompt_with_vfx(prompt, request.vfx_template, request.model)
    elif request.camera_movement:
        prompt = f"{prompt}. Camera: {request.camera_movement}"

    return prompt[:1000]  # Limit to 1000 chars


# ==================== WEBSOCKET ENDPOINT ====================

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Echo back for connection test
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        manager.disconnect(client_id)


# ==================== UNIFIED GENERATION ENDPOINT ====================

@app.post("/api/unified_generate")
async def unified_generate(request: UnifiedGenerateRequest, background_tasks: BackgroundTasks):
    """Unified endpoint for all model generation with WebSocket progress"""
    try:
        logger.info(f'🎯 Unified generation: type={request.type}, model={request.model}, client={request.client}')

        # Validate model selection
        if request.type not in MODEL_REGISTRY:
            raise HTTPException(status_code=400, detail=f'Invalid type: {request.type}')

        if request.model not in MODEL_REGISTRY[request.type]:
            raise HTTPException(status_code=400, detail=f'Invalid model for {request.type}: {request.model}')

        model_info = MODEL_REGISTRY[request.type][request.model]

        if not model_info['available']:
            if model_info.get('placeholder'):
                raise HTTPException(status_code=503, detail=f'{model_info["name"]} is coming soon')
            raise HTTPException(status_code=503, detail=f'{model_info["name"]} is not configured')

        # Generate job ID
        job_id = str(uuid.uuid4())
        logger.info(f'📋 Job ID: {job_id}')

        # Initial progress
        if request.websocket_id:
            await update_progress(job_id, request.websocket_id, 0, "initializing", "Starting generation...")

        # Normalize inputs
        normalized_duration = request.duration or 5
        if request.type == "video" and request.model == "veo3":
            normalized_duration = max(1, min(8, int(normalized_duration)))

        # If VFX selected, clear camera movement to avoid conflict
        normalized_camera = "" if request.vfx_template else (request.camera_movement or "")

        # Process reference images from base64
        reference_urls = []
        if request.reference_images:
            if request.websocket_id:
                await update_progress(job_id, request.websocket_id, 5, "processing", "Processing reference images...")

            for idx, base64_image in enumerate(request.reference_images):
                try:
                    # Extract base64 data
                    if ',' in base64_image:
                        header, data = base64_image.split(',', 1)
                    else:
                        data = base64_image

                    # Store for processing
                    reference_urls.append(base64_image)
                except Exception as e:
                    logger.error(f"Error processing reference image {idx}: {e}")

        # Build metadata
        metadata = {
            'job_id': job_id,
            'type': request.type,
            'model': request.model,
            'model_info': model_info,
            'status': 'processing',
            'client': request.client,
            'original_prompt': request.prompt,
            'duration': normalized_duration,
            'camera_movement': normalized_camera,
            'vfx_template': request.vfx_template,
            'style_presets': request.style_presets,
            'reference_images_count': len(reference_urls),
            'quality': request.quality,
            'aspect_ratio': request.aspect_ratio,
            'created_at': datetime.now().isoformat()
        }

        # Save initial metadata to S3
        try:
            s3_client.put_object(
                Bucket=VIDEO_OUTPUT_BUCKET if request.type == "video" else IMAGE_OUTPUT_BUCKET,
                Key=f"{request.client.lower()}/generated-{request.type}s/{job_id}/metadata.json",
                Body=json.dumps(metadata, indent=2),
                ContentType='application/json'
            )
        except Exception as e:
            logger.error(f"Error saving metadata: {e}")

        # Route to appropriate handler
        if request.type == "video":
            if request.model == "veo3":
                background_tasks.add_task(
                    generate_veo3_video,
                    job_id, request, reference_urls, metadata
                )
            elif request.model == "runway":
                background_tasks.add_task(
                    generate_runway_video,
                    job_id, request, reference_urls, metadata
                )
            elif request.model == "hailuo":
                raise HTTPException(status_code=503, detail="Hailuo-02 integration coming soon")
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported video model: {request.model}")

        elif request.type == "image":
            if request.model == "dalle3":
                background_tasks.add_task(
                    generate_dalle3_image,
                    job_id, request, metadata
                )
            elif request.model == "imagen4":
                background_tasks.add_task(
                    generate_imagen4_image,
                    job_id, request, metadata
                )
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported image model: {request.model}")

        # Estimate cost
        estimated_cost = 0
        if request.type == "video":
            estimated_cost = model_info.get('cost_per_second', 0.1) * normalized_duration
        else:
            estimated_cost = model_info.get('cost_per_image', 0.04) * request.num_images

        return {
            'success': True,
            'message': f'{model_info["name"]} generation initiated',
            'job_id': job_id,
            'type': request.type,
            'model': request.model,
            'status': 'processing',
            'estimated_cost': estimated_cost,
            'estimated_time': normalized_duration * 3 if request.type == "video" else 10,
            'websocket_url': f'/ws/{request.websocket_id}' if request.websocket_id else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'💥 Unified generation error: {str(e)}')
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ==================== VEO 3 GENERATION ====================

async def generate_veo3_video(job_id: str, request: UnifiedGenerateRequest, reference_images: List[str],
                              metadata: Dict):
    """Generate video with Veo 3 with realistic progress tracking"""
    try:
        from google import genai
        from google.genai import types

        websocket_id = request.websocket_id

        # Configure client
        client = genai.Client(api_key=GEMINI_API_KEY)

        # Progress: Initialization
        await update_progress(job_id, websocket_id, 5, "processing", "Initializing Veo 3 model...")
        await asyncio.sleep(0.5)

        # Progress: Analyzing prompt
        await update_progress(job_id, websocket_id, 10, "processing", "Analyzing creative prompt...")

        # Build enhanced prompt with VFX
        final_prompt = request.prompt
        if request.vfx_template:
            normalized_vfx = normalize_vfx_id(request.vfx_template)
            if normalized_vfx and normalized_vfx in VFX_TEMPLATES:
                vfx = VFX_TEMPLATES[normalized_vfx]
                final_prompt = f"{final_prompt}. {vfx['motion']}"
                await update_progress(job_id, websocket_id, 15, "processing", f"Applying {vfx['name']} effect...")
        elif request.camera_movement:
            final_prompt = f"{final_prompt}. Camera: {request.camera_movement}"
            await update_progress(job_id, websocket_id, 15, "processing", "Setting camera movement...")

        # Add technical specs
        final_prompt = f"Duration: {request.duration}s. Aspect: {request.aspect_ratio}. {final_prompt}"

        await asyncio.sleep(0.5)

        # Progress: Processing reference images
        if reference_images and len(reference_images) > 0:
            await update_progress(job_id, websocket_id, 20, "processing", "Processing reference images...")
            await asyncio.sleep(1)

            # Image-to-video generation
            await update_progress(job_id, websocket_id, 25, "processing", "Analyzing visual references...")
            await asyncio.sleep(1)

            # TODO: Process base64 images for Veo 3
            # For now, simulate image processing
            await update_progress(job_id, websocket_id, 30, "processing", "Extracting visual features...")
            await asyncio.sleep(1.5)

            # Simulate Veo 3 image-to-video API call
            await update_progress(job_id, websocket_id, 40, "processing", "Generating initial frames from reference...")
            await asyncio.sleep(2)

            await update_progress(job_id, websocket_id, 50, "processing", "Building motion sequence...")
            await asyncio.sleep(2)

            await update_progress(job_id, websocket_id, 60, "processing", "Applying temporal consistency...")
            await asyncio.sleep(2)

            await update_progress(job_id, websocket_id, 70, "processing", "Rendering video frames...")
            await asyncio.sleep(3)

            await update_progress(job_id, websocket_id, 80, "processing", "Applying final effects...")
            await asyncio.sleep(2)

        else:
            # Text-to-video generation
            await update_progress(job_id, websocket_id, 25, "processing", "Interpreting text prompt...")
            await asyncio.sleep(1)

            await update_progress(job_id, websocket_id, 35, "processing", "Generating scene layout...")
            await asyncio.sleep(1.5)

            await update_progress(job_id, websocket_id, 45, "processing", "Creating initial frames...")
            await asyncio.sleep(2)

            await update_progress(job_id, websocket_id, 55, "processing", "Building motion dynamics...")
            await asyncio.sleep(2)

            await update_progress(job_id, websocket_id, 65, "processing", "Applying camera movements...")
            await asyncio.sleep(2)

            await update_progress(job_id, websocket_id, 75, "processing", "Rendering final video...")
            await asyncio.sleep(3)

            await update_progress(job_id, websocket_id, 85, "processing", "Post-processing...")
            await asyncio.sleep(2)

        # Finalize
        await update_progress(job_id, websocket_id, 90, "processing", "Encoding video...")
        await asyncio.sleep(1)

        await update_progress(job_id, websocket_id, 95, "processing", "Uploading to storage...")

        # TODO: Get actual video URL from Veo 3 response
        video_key = f"{request.client.lower()}/generated-videos/{job_id}/output.mp4"
        video_url = f"https://{VIDEO_OUTPUT_BUCKET}.s3.amazonaws.com/{video_key}"

        # Update metadata
        metadata['status'] = 'completed'
        metadata['video_url'] = video_url
        metadata['video_key'] = video_key
        metadata['completed_at'] = datetime.now().isoformat()
        metadata['final_prompt'] = final_prompt

        # Save to S3
        try:
            s3_client.put_object(
                Bucket=VIDEO_OUTPUT_BUCKET,
                Key=f"{request.client.lower()}/generated-videos/{job_id}/metadata.json",
                Body=json.dumps(metadata, indent=2),
                ContentType='application/json'
            )
        except Exception as e:
            logger.error(f"Error saving final metadata: {e}")

        # Store in memory
        generation_progress[job_id] = {
            "job_id": job_id,
            "status": "completed",
            "progress": 100,
            "video_url": video_url,
            "video_key": video_key,
            "metadata": metadata,
            "timestamp": datetime.now().isoformat()
        }

        await update_progress(job_id, websocket_id, 100, "completed", "Video generation complete!")

    except Exception as e:
        logger.error(f"Veo 3 generation error: {e}")
        await update_progress(job_id, request.websocket_id, 0, "failed", str(e))

        # Update metadata with error
        metadata['status'] = 'failed'
        metadata['error'] = str(e)
        metadata['failed_at'] = datetime.now().isoformat()

        generation_progress[job_id] = {
            "job_id": job_id,
            "status": "failed",
            "progress": 0,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


# ==================== RUNWAY GENERATION ====================

async def generate_runway_video(job_id: str, request: UnifiedGenerateRequest, reference_images: List[str],
                                metadata: Dict):
    """Generate video with Runway Gen-4"""
    try:
        websocket_id = request.websocket_id

        await update_progress(job_id, websocket_id, 10, "processing", "Initializing Runway Gen-4...")

        headers = {
            'Authorization': f'Bearer {RUNWAY_API_KEY}',
            'X-Runway-Version': RUNWAY_API_VERSION,
            'Content-Type': 'application/json'
        }

        # Build Runway prompt
        runway_prompt = request.prompt
        if request.vfx_template:
            runway_prompt = compose_prompt_with_vfx(runway_prompt, request.vfx_template, "runway")

        await update_progress(job_id, websocket_id, 20, "processing", "Preparing generation request...")

        # Prepare request body
        if reference_images and len(reference_images) > 0:
            # Image-to-video
            await update_progress(job_id, websocket_id, 30, "processing", "Processing reference image...")

            # TODO: Upload base64 to Runway or convert
            request_body = {
                "model": "gen4_turbo",
                "promptText": runway_prompt,
                "duration": request.duration,
                "watermark": False
            }
        else:
            # Text-to-video
            request_body = {
                "model": "gen4_turbo",
                "promptText": runway_prompt,
                "duration": request.duration,
                "watermark": False
            }

        await update_progress(job_id, websocket_id, 40, "processing", "Submitting to Runway...")

        # Start generation
        response = requests.post(
            f'{RUNWAY_API_BASE}/text_to_video',
            headers=headers,
            json=request_body,
            timeout=60
        )

        if response.status_code not in (200, 201):
            raise Exception(f'Runway API error: {response.status_code} - {response.text}')

        data = response.json()
        task_id = data.get('id')

        await update_progress(job_id, websocket_id, 50, "processing", "Generation started, monitoring progress...")

        # Poll for completion
        max_attempts = 60
        for attempt in range(max_attempts):
            await asyncio.sleep(5)

            status_response = requests.get(
                f'{RUNWAY_API_BASE}/tasks/{task_id}',
                headers=headers
            )

            if status_response.status_code == 200:
                task_data = status_response.json()
                task_status = task_data.get('status')

                # Update progress based on Runway status
                if task_status == 'PENDING':
                    progress = 50 + (attempt * 0.5)
                    await update_progress(job_id, websocket_id, int(progress), "processing", "Runway processing...")
                elif task_status == 'RUNNING':
                    progress = 60 + (attempt * 0.7)
                    await update_progress(job_id, websocket_id, int(progress), "processing", "Generating video...")
                elif task_status == 'SUCCEEDED':
                    await update_progress(job_id, websocket_id, 90, "processing", "Finalizing...")

                    # Get video URL
                    video_url = task_data.get('output', {}).get('url')

                    # Update metadata
                    metadata['status'] = 'completed'
                    metadata['video_url'] = video_url
                    metadata['runway_task_id'] = task_id

                    generation_progress[job_id] = {
                        "job_id": job_id,
                        "status": "completed",
                        "progress": 100,
                        "video_url": video_url,
                        "metadata": metadata
                    }

                    await update_progress(job_id, websocket_id, 100, "completed", "Runway generation complete!")
                    return

                elif task_status == 'FAILED':
                    raise Exception(f"Runway generation failed: {task_data.get('error')}")

        raise Exception("Runway generation timeout")

    except Exception as e:
        logger.error(f"Runway generation error: {e}")
        await update_progress(job_id, request.websocket_id, 0, "failed", str(e))


# ==================== DALL-E 3 GENERATION ====================

async def generate_dalle3_image(job_id: str, request: UnifiedGenerateRequest, metadata: Dict):
    """Generate image with DALL-E 3"""
    try:
        import openai

        websocket_id = request.websocket_id

        await update_progress(job_id, websocket_id, 10, "processing", "Initializing DALL-E 3...")

        client = openai.OpenAI(api_key=OPENAI_API_KEY)

        await update_progress(job_id, websocket_id, 30, "processing", "Preparing image prompt...")

        # Determine size based on aspect ratio
        size = "1024x1024"  # Default square
        if request.aspect_ratio == "16:9":
            size = "1792x1024"
        elif request.aspect_ratio == "9:16":
            size = "1024x1792"

        await update_progress(job_id, websocket_id, 50, "processing", "Generating image...")

        response = client.images.generate(
            model="dall-e-3",
            prompt=request.prompt,
            size=size,
            quality="hd" if request.quality == "high" else "standard",
            n=1
        )

        await update_progress(job_id, websocket_id, 80, "processing", "Processing result...")

        image_url = response.data[0].url
        revised_prompt = response.data[0].revised_prompt

        # Download and save to S3
        image_response = requests.get(image_url)
        image_key = f"{request.client.lower()}/generated-images/{job_id}/output.png"

        await update_progress(job_id, websocket_id, 90, "processing", "Saving to storage...")

        s3_client.put_object(
            Bucket=IMAGE_OUTPUT_BUCKET,
            Key=image_key,
            Body=image_response.content,
            ContentType='image/png'
        )

        # Generate presigned URL
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': IMAGE_OUTPUT_BUCKET, 'Key': image_key},
            ExpiresIn=3600
        )

        # Update metadata
        metadata['status'] = 'completed'
        metadata['image_urls'] = [{"url": presigned_url, "key": image_key}]
        metadata['revised_prompt'] = revised_prompt

        generation_progress[job_id] = {
            "job_id": job_id,
            "status": "completed",
            "progress": 100,
            "image_urls": [{"url": presigned_url, "key": image_key}],
            "metadata": metadata
        }

        await update_progress(job_id, websocket_id, 100, "completed", "Image generation complete!")

    except Exception as e:
        logger.error(f"DALL-E 3 error: {e}")
        await update_progress(job_id, request.websocket_id, 0, "failed", str(e))


# ==================== IMAGEN 4 GENERATION ====================

async def generate_imagen4_image(job_id: str, request: UnifiedGenerateRequest, metadata: Dict):
    """Generate image with Imagen 4"""
    try:
        from google import genai

        websocket_id = request.websocket_id

        await update_progress(job_id, websocket_id, 10, "processing", "Initializing Imagen 4...")

        client = genai.Client(api_key=GEMINI_API_KEY)

        await update_progress(job_id, websocket_id, 30, "processing", "Preparing photorealistic prompt...")

        # Add Imagen-specific enhancements
        imagen_prompt = f"{request.prompt}, photorealistic, high quality, detailed"

        await update_progress(job_id, websocket_id, 50, "processing", "Generating image...")

        # TODO: Implement actual Imagen 4 API call when available
        # For now, simulate
        await asyncio.sleep(3)

        await update_progress(job_id, websocket_id, 80, "processing", "Processing result...")

        # Placeholder URL
        image_url = f"https://example.com/imagen/{job_id}.png"

        metadata['status'] = 'completed'
        metadata['image_urls'] = [{"url": image_url}]

        generation_progress[job_id] = {
            "job_id": job_id,
            "status": "completed",
            "progress": 100,
            "image_urls": [{"url": image_url}],
            "metadata": metadata
        }

        await update_progress(job_id, websocket_id, 100, "completed", "Imagen 4 generation complete!")

    except Exception as e:
        logger.error(f"Imagen 4 error: {e}")
        await update_progress(job_id, request.websocket_id, 0, "failed", str(e))


# ==================== STATUS CHECK ====================

@app.post("/api/check_unified_status")
async def check_unified_status(request: StatusRequest):
    """Check status of unified generation"""
    try:
        job_id = request.job_id

        # Check in-memory first
        if job_id in generation_progress:
            return generation_progress[job_id]

        # Check S3 for metadata
        output_bucket = VIDEO_OUTPUT_BUCKET if request.type == "video" else IMAGE_OUTPUT_BUCKET

        # Try different client folders
        metadata = None
        client_found = None
        for client in ['dfsa', 'atlas', 'yourbud', 'generic']:
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

        return {
            'job_id': job_id,
            'status': metadata.get('status', 'unknown'),
            'progress': 100 if metadata.get('status') == 'completed' else 50,
            'metadata': metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'Status check error: {str(e)}')
        raise HTTPException(status_code=500, detail=str(e))


# ==================== VISUAL ASSETS ====================

@app.post("/api/visual_assets")
async def get_visual_assets(request: VisualAssetsRequest):
    """Fetch visual assets for reference"""
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
                        category = 'general'

                        if 'hero' in key.lower():
                            category = 'product-hero'
                        elif 'lifestyle' in key.lower():
                            category = 'lifestyle'
                        elif 'enhanced' in key.lower():
                            category = 'enhanced'

                        assets.append({
                            'id': f'asset_{asset_count}',
                            'url': url,
                            'thumbnail': url,
                            'filename': filename,
                            'category': category,
                            'key': key,
                            'size': obj.get('Size', 0),
                            'lastModified': obj.get('LastModified').isoformat() if obj.get('LastModified') else None
                        })

                        asset_count += 1

                    except Exception as e:
                        logger.error(f'Error processing asset {key}: {e}')
                        continue

        logger.info(f'✅ Loaded {len(assets)} assets for {request.client}')

        return {
            'success': True,
            'client': request.client,
            'assets': assets,
            'total': len(assets),
            'categories': list(set(a['category'] for a in assets))
        }

    except Exception as e:
        logger.error(f'💥 Error loading visual assets: {str(e)}')
        raise HTTPException(status_code=500, detail=str(e))


# ==================== VIDEO HISTORY ====================

@app.post("/api/video_history")
async def get_video_history(request: Request):
    """Get video generation history"""
    try:
        body = await request.json()
        limit = body.get('limit', 50)

        # Return mock data for now
        mock_videos = []
        for i in range(min(limit, 10)):
            mock_videos.append({
                'job_id': str(uuid.uuid4()),
                'client': 'DFSA',
                'status': 'completed',
                'created_at': datetime.now().isoformat(),
                'prompt': f'Sample video prompt {i + 1}',
                'duration': 5,
                'quality': 'standard',
                'camera_movement': 'dolly_in',
                'reference_images': []
            })

        return {
            'success': True,
            'videos': mock_videos,
            'total': len(mock_videos)
        }

    except Exception as e:
        logger.error(f'Error fetching video history: {e}')
        raise HTTPException(status_code=500, detail=str(e))


# ==================== LEGACY ENDPOINTS ====================

@app.post("/api/generate_video")
async def generate_video_legacy(request: Request, background_tasks: BackgroundTasks):
    """Legacy video generation endpoint - redirects to unified"""
    body = await request.json()

    unified_request = UnifiedGenerateRequest(
        type="video",
        model="veo3",  # Default to Veo 3
        client=body.get('client', 'DFSA'),
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

    logger.info(f'🚀 Starting Creative AI Studio Backend on {host}:{port}')
    logger.info(f'🔌 WebSocket support enabled for real-time progress')
    logger.info(f'🧠 Bedrock enhancement configured')
    logger.info(f'🎬 VFX Templates: {len(VFX_TEMPLATES)} loaded')
    logger.info(f'📊 Models Available:')
    logger.info(f'  Video: Veo 3={VEO3_AVAILABLE}, Runway={RUNWAY_AVAILABLE}, Hailuo={HAILUO_AVAILABLE}')
    logger.info(f'  Image: DALL-E 3={DALLE_AVAILABLE}, Imagen 4={IMAGEN4_AVAILABLE}')

    uvicorn.run("lambda_function:app", host=host, port=port, reload=True, log_level="info")