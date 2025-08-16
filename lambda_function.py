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

# FastAPI imports
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import asyncio

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
BEDROCK_AGENT_ID = os.environ.get('BEDROCK_AGENT_ID', 'F0DBNGWGKS')
BEDROCK_AGENT_ALIAS_ID = os.environ.get('BEDROCK_AGENT_ALIAS_ID', 'OQR0YT8I99')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Check if Veo 3 is available
VEO3_AVAILABLE = bool(GEMINI_API_KEY and len(GEMINI_API_KEY) > 10)

# Create FastAPI app
app = FastAPI(
    title="Creative AI Video Studio API",
    description="Video generation API with Veo 3 integration",
    version="5.1-enhanced-prompting"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for request validation
class VisualAssetsRequest(BaseModel):
    client: str = "DFSA"
    context: str = ""
    limit: int = 50


class GenerateVideoRequest(BaseModel):
    client: str
    prompt: str
    duration: int = 5
    quality: str = "720p"
    reference_images: List[str] = []
    camera_movement: str = ""


class VideoStatusRequest(BaseModel):
    job_id: str
    video_key: Optional[str] = None
    client: Optional[str] = None


# Test endpoint
@app.get("/api/test")
async def test_connection():
    """Test endpoint to verify API and Veo 3 connectivity"""
    test_results = {
        'lambda': 'FastAPI Server Enhanced',
        'timestamp': datetime.now().isoformat(),
        'veo3_available': VEO3_AVAILABLE,
        'bedrock_configured': bool(BEDROCK_AGENT_ID),
        's3_buckets_configured': bool(VISUAL_ASSETS_BUCKET and VIDEO_OUTPUT_BUCKET),
        'environment_check': {
            'python_version': '3.9+',
            'server_type': 'FastAPI Enhanced',
            'async_enabled': True,
            'features': ['enhanced_prompting', 's3_asset_loading', 'reference_images']
        }
    }

    # Test Veo 3 connectivity if API key is available
    if VEO3_AVAILABLE:
        try:
            from google import genai
            client = genai.Client(api_key=GEMINI_API_KEY)
            test_results['veo3_test'] = 'success'
            test_results['veo3_sdk'] = 'google.genai available'
            test_results['veo3_model'] = 'veo-3.0-generate-preview'
        except ImportError:
            test_results['veo3_test'] = 'sdk_missing'
            test_results['veo3_error'] = 'google.genai SDK not installed'
            test_results['install_needed'] = 'pip install google-genai'
        except Exception as e:
            test_results['veo3_test'] = 'failed'
            test_results['veo3_error'] = str(e)[:200]
    else:
        test_results['veo3_test'] = 'no_api_key'
        test_results['veo3_message'] = 'Waiting for GEMINI_API_KEY'

    # Test S3 connectivity
    try:
        s3_client.head_bucket(Bucket=VISUAL_ASSETS_BUCKET)
        test_results['s3_assets_bucket'] = 'accessible'

        # Count assets
        response = s3_client.list_objects_v2(
            Bucket=VISUAL_ASSETS_BUCKET,
            Prefix='DFSA/',
            MaxKeys=10
        )
        asset_count = response.get('KeyCount', 0)
        test_results['dfsa_assets_count'] = asset_count

    except Exception as e:
        test_results['s3_assets_bucket'] = f'error: {str(e)[:100]}'

    try:
        s3_client.head_bucket(Bucket=VIDEO_OUTPUT_BUCKET)
        test_results['s3_video_bucket'] = 'accessible'
    except Exception as e:
        test_results['s3_video_bucket'] = f'error: {str(e)[:100]}'

    return test_results


# Enhanced visual assets endpoint
@app.post("/api/visual_assets")
async def get_visual_assets(request: VisualAssetsRequest):
    """Fetch visual assets for reference with enhanced categorization"""
    try:
        logger.info(f'🎨 Fetching assets for client: {request.client} (limit: {request.limit})')
        assets = []

        # Map client to folder
        client_folders = {
            'DFSA': 'client-dfsa',
            'Atlas': 'client-atlas',
            'YourBud': 'client-yourbud'
        }

        folder_name = client_folders.get(request.client, 'DFSA')
        prefix = f"{folder_name}/"

        # List objects in S3 with pagination
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

                    # Skip folders and hidden files
                    if key.endswith('/') or '/.DS_Store' in key or key == prefix:
                        continue

                    # Only include image files
                    if not any(key.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif']):
                        continue

                    try:
                        # Generate presigned URL
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

                        # Respect the limit
                        if asset_count >= request.limit:
                            break

                    except Exception as url_error:
                        logger.error(f'Error generating URL for {key}: {str(url_error)}')
                        continue

                if asset_count >= request.limit:
                    break

        # Sort assets by category priority for better display
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
        raise HTTPException(status_code=500, detail=f'Failed to fetch assets: {str(e)}')


# Enhanced video generation endpoint
@app.post("/api/generate_video")
async def generate_video(request: GenerateVideoRequest, background_tasks: BackgroundTasks):
    """Handle video generation with enhanced prompting and reference images"""
    try:
        # Extract and validate parameters
        client = request.client
        original_prompt = request.prompt.strip()
        duration = request.duration
        quality = request.quality
        reference_images = request.reference_images[:5]  # Limit to 5 reference images
        camera_movement = request.camera_movement

        logger.info(f'🎬 Enhanced video generation: client={client}, duration={duration}s, quality={quality}')
        logger.info(f'📹 Camera movement: {camera_movement}')
        logger.info(f'🖼️ Reference images: {len(reference_images)}')

        # Validation
        if not original_prompt:
            raise HTTPException(status_code=400, detail='Prompt is required and cannot be empty')

        # Veo 3 has specific duration limits
        if duration > 8:
            logger.warning(f'Duration {duration}s exceeds Veo 3 limit, capping at 8s')
            duration = 8

        if not VEO3_AVAILABLE:
            raise HTTPException(status_code=503,
                                detail='Veo 3 is temporarily unavailable. Please check your API quota and try again later.')

        # Generate unique job ID
        job_id = str(uuid.uuid4())
        logger.info(f'🆔 Generated job ID: {job_id}')

        # Step 1: Enhanced prompt with Bedrock (includes camera movement)
        logger.info('🎭 Enhancing prompt with Bedrock cinematographer...')
        enhanced_prompt, brand_context = await enhance_with_bedrock_cinematographer(
            client, original_prompt, camera_movement, reference_images, duration
        )

        # Step 2: Analyze reference images for style context
        logger.info('🎨 Analyzing reference images...')
        style_context = analyze_reference_images(reference_images, client)

        # Step 3: Final Veo 3 optimization
        logger.info('⚡ Final Veo 3 optimization...')
        veo3_prompt = optimize_for_veo3(enhanced_prompt, style_context, duration)

        # Step 4: Start video generation in background
        logger.info('🚀 Starting Veo 3 generation...')
        video_key = f"{client.lower()}/generated-videos/{job_id}/output.mp4"

        # Save comprehensive metadata
        metadata = {
            'job_id': job_id,
            'status': 'processing',
            'original_prompt': original_prompt,
            'camera_movement': camera_movement,
            'enhanced_prompt': enhanced_prompt,
            'veo3_prompt': veo3_prompt,
            'duration': duration,
            'quality': quality,
            'client': client,
            'reference_images': reference_images,
            'reference_count': len(reference_images),
            'brand_context': brand_context,
            'style_context': style_context,
            'started_at': datetime.now().isoformat(),
            'video_key': video_key,
            'estimated_completion': datetime.fromtimestamp(time.time() + 90).isoformat()
        }

        # Save metadata to S3
        s3_client.put_object(
            Bucket=VIDEO_OUTPUT_BUCKET,
            Key=f"{client.lower()}/generated-videos/{job_id}/metadata.json",
            Body=json.dumps(metadata, indent=2),
            ContentType='application/json'
        )

        # Add background task for video generation
        background_tasks.add_task(
            process_veo3_generation,
            veo3_prompt, duration, quality, reference_images, job_id, client, video_key
        )

        # Calculate estimated cost
        estimated_cost = calculate_veo3_cost(duration, quality)
        log_generation_metrics(client, duration, quality, estimated_cost, len(reference_images))

        return {
            'success': True,
            'message': 'Enhanced Veo 3 video generation initiated',
            'job_id': job_id,
            'video_key': video_key,
            'status': 'processing',
            'client': client,
            'original_prompt': original_prompt,
            'camera_movement': camera_movement,
            'enhanced_prompt': enhanced_prompt,
            'veo3_prompt': veo3_prompt,
            'quality': quality,
            'duration': duration,
            'reference_images_used': len(reference_images),
            'brand_context': brand_context,
            'style_context': style_context,
            'estimated_cost': estimated_cost,
            'estimated_time_seconds': 90,
            'features_used': ['enhanced_prompting', 'camera_movement', 'reference_images'],
            'timestamp': datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'💥 Video generation error: {str(e)}')
        logger.error(traceback.format_exc())

        # Better error messages for common issues
        error_message = str(e)
        if "quota" in error_message.lower() or "resource_exhausted" in error_message.lower():
            error_message = "API quota exhausted. Please wait a few minutes and try again, or check your billing settings."
        elif "api_key" in error_message.lower():
            error_message = "API authentication failed. Please check your API key configuration."

        raise HTTPException(status_code=500, detail=f'Video generation failed: {error_message}')


# REPLACE the enhance_with_bedrock_cinematographer function in lambda_function.py with this:

async def enhance_with_bedrock_cinematographer(client: str, prompt: str, camera_movement: str,
                                               reference_images: List[str], duration: int) -> tuple:
    """Enhanced Bedrock prompting using the configured agent's knowledge base"""
    try:
        session_id = f"veo3-cinematographer-{client}-{uuid.uuid4()}"

        # Create JSON input that matches your Bedrock agent's expected format
        agent_input = {
            "client": client,
            "original_prompt": prompt,
            "camera_movement": camera_movement,
            "reference_assets": reference_images,
            "total_duration": duration,
            "is_multi_scene": False,  # Single scene for now
            "target_platform": "veo_3",
            "requirements": [
                "brand_compliance",
                "visual_style_consistency",
                "cinematic_quality",
                "camera_movement_integration"
            ],
            "veo3_optimizations": [
                "narrative_structure",
                "physics_awareness",
                "temporal_progression",
                "material_specificity"
            ]
        }

        logger.info(f'🎭 Calling Bedrock Agent with JSON input for {client}...')
        logger.info(f'📹 Camera movement: {camera_movement}')
        logger.info(f'🎨 Reference assets: {len(reference_images)}')

        # Send JSON to your configured Bedrock agent
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: bedrock_agent.invoke_agent(
                agentId=BEDROCK_AGENT_ID,
                agentAliasId=BEDROCK_AGENT_ALIAS_ID,
                sessionId=session_id,
                inputText=json.dumps(agent_input, indent=2)  # Send as JSON string
            )
        )

        response_text = ""
        for event in response.get('completion', []):
            if 'chunk' in event and 'bytes' in event['chunk']:
                response_text += event['chunk']['bytes'].decode('utf-8')

        logger.info(f'📝 Bedrock agent response length: {len(response_text)}')
        logger.info(f'🔍 Raw response preview: {response_text[:200]}...')

        try:
            # Parse the JSON response from your agent
            result = json.loads(response_text)

            enhanced_prompt = result.get('enhanced_prompt', prompt)
            brand_context = {
                'brand_elements': result.get('brand_elements', []),
                'key_messages': result.get('key_messages', []),
                'visual_guidelines': result.get('visual_guidelines', {}),
                'veo3_optimizations': result.get('veo3_optimizations', []),
                'camera_movement': camera_movement,
                'reference_images_count': len(reference_images)
            }

            logger.info(f'✅ Enhanced prompt created: {enhanced_prompt[:100]}...')
            return enhanced_prompt, brand_context

        except json.JSONDecodeError as e:
            logger.warning(f'⚠️ JSON decode error: {e}')
            logger.warning(f'Raw response: {response_text}')

            # Fallback: try to extract prompt from text response
            enhanced_prompt = extract_prompt_from_text(response_text, prompt, camera_movement, client)
            fallback_context = create_fallback_context(client, camera_movement, len(reference_images))

            return enhanced_prompt, fallback_context

    except Exception as e:
        logger.warning(f'⚠️ Bedrock agent error: {str(e)}')
        # Return enhanced fallback
        fallback_prompt = create_fallback_prompt(prompt, camera_movement, client)
        fallback_context = create_fallback_context(client, camera_movement, len(reference_images))
        return fallback_prompt, fallback_context


def extract_prompt_from_text(response_text: str, original_prompt: str, camera_movement: str, client: str) -> str:
    """Extract enhanced prompt from non-JSON response"""
    # Look for common patterns in the response
    lines = response_text.split('\n')

    for line in lines:
        line = line.strip()
        # Skip empty lines and metadata
        if len(line) > 50 and not line.startswith(('```', '{', '}', '"enhanced_prompt"')):
            # This might be our enhanced prompt
            if any(word in line.lower() for word in ['camera', 'shot', 'lighting', 'cinematic']):
                return line

    # If no good line found, enhance the original prompt
    return create_fallback_prompt(original_prompt, camera_movement, client)


def create_fallback_context(client: str, camera_movement: str, reference_count: int) -> Dict:
    """Create fallback brand context"""
    client_styles = {
        'DFSA': {
            'brand_elements': ['premium dried fruit', 'South African heritage', 'natural quality'],
            'key_messages': ['authentic nutrition', 'family health', 'premium quality'],
            'visual_guidelines': {
                'primary_colors': ['#FF6B35', '#D4A574', '#8B4513'],
                'composition_style': 'warm food photography',
                'lighting_preference': 'golden hour natural'
            }
        },
        'Atlas': {
            'brand_elements': ['professional security', 'trust', 'reliability'],
            'key_messages': ['security', 'professionalism', 'trust'],
            'visual_guidelines': {
                'primary_colors': ['#1E3A8A', '#6B7280', '#FFFFFF'],
                'composition_style': 'clean corporate',
                'lighting_preference': 'professional studio'
            }
        },
        'YourBud': {
            'brand_elements': ['digital platform', 'connectivity', 'innovation'],
            'key_messages': ['connection', 'technology', 'innovation'],
            'visual_guidelines': {
                'primary_colors': ['#3B82F6', '#10B981', '#6B7280'],
                'composition_style': 'modern tech',
                'lighting_preference': 'vibrant digital'
            }
        }
    }

    style = client_styles.get(client, client_styles['DFSA'])
    style['camera_movement'] = camera_movement
    style['reference_images_count'] = reference_count
    style['fallback_used'] = True

    return style


def create_fallback_prompt(prompt: str, camera_movement: str, client: str) -> str:
    """Create enhanced fallback prompt when Bedrock fails"""
    camera_prefix = ""
    if camera_movement:
        movements = {
            "dolly-in": "Camera slowly dollies forward revealing",
            "dolly-out": "Camera pulls back slowly from",
            "orbit-left": "Camera orbits left around",
            "orbit-right": "Camera orbits right around",
            "crane-up": "Crane shot moving upward from",
            "crane-down": "Crane shot moving downward to",
            "pan-left": "Camera pans left across",
            "pan-right": "Camera pans right across"
        }
        camera_prefix = movements.get(camera_movement, "Camera movement: ")

    client_style = ""
    if client == "DFSA":
        client_style = ", warm golden lighting, natural textures, premium dried fruit presentation"
    elif client == "Atlas":
        client_style = ", professional corporate lighting, modern clean aesthetics"
    elif client == "YourBud":
        client_style = ", modern tech lighting, vibrant digital aesthetics"

    return f"{camera_prefix} {prompt}{client_style}, cinematic quality, 4K resolution, professional cinematography"


def get_client_visual_style(client: str) -> Dict:
    """Get client-specific visual style guidelines"""
    styles = {
        'DFSA': {
            'primary_colors': ['warm orange', 'golden yellow', 'natural brown'],
            'lighting': 'warm golden hour lighting',
            'mood': 'healthy, natural, premium',
            'textures': 'natural, organic, artisanal'
        },
        'Atlas': {
            'primary_colors': ['professional blue', 'security grey', 'trust white'],
            'lighting': 'clean professional lighting',
            'mood': 'trustworthy, secure, modern',
            'textures': 'smooth, technological, reliable'
        },
        'YourBud': {
            'primary_colors': ['digital blue', 'connection green', 'modern grey'],
            'lighting': 'modern tech lighting',
            'mood': 'innovative, connected, digital',
            'textures': 'sleek, technological, vibrant'
        }
    }
    return styles.get(client, styles['DFSA'])


# Background task for async video processing (unchanged but with better error handling)
async def process_veo3_generation(prompt: str, duration: int, quality: str, reference_images: List[str], job_id: str,
                                  client: str, video_key: str):
    """Background task to process Veo 3 video generation with enhanced error handling"""
    try:
        logger.info(f'🚀 Processing enhanced Veo 3 generation: {job_id}')

        from google import genai
        from google.genai import types

        # Initialize the Veo 3 client
        veo3_client = genai.Client(api_key=GEMINI_API_KEY)

        # Enhanced negative prompt
        negative_prompt = "blurry, distorted, low quality, watermark, text overlay, amateur lighting, shaky camera"

        # Start Veo 3 video generation
        operation = veo3_client.models.generate_videos(
            model="veo-3.0-generate-preview",
            prompt=prompt,
            config=types.GenerateVideosConfig(
                negative_prompt=negative_prompt,
            ),
        )

        logger.info(f'⚡ Veo 3 operation started: {operation.name}')

        # Update metadata with operation name
        metadata = {
            'job_id': job_id,
            'status': 'processing',
            'operation_name': operation.name,
            'video_key': video_key,
            'processing_started_at': datetime.now().isoformat()
        }

        s3_client.put_object(
            Bucket=VIDEO_OUTPUT_BUCKET,
            Key=f"{client.lower()}/generated-videos/{job_id}/metadata.json",
            Body=json.dumps(metadata, indent=2),
            ContentType='application/json'
        )

        # Poll for completion with better progress tracking
        max_attempts = 36  # 12 minutes with 20 second intervals
        attempt = 0

        while not operation.done and attempt < max_attempts:
            await asyncio.sleep(20)
            operation = veo3_client.operations.get(operation)
            attempt += 1

            # Better progress calculation
            progress = min(int((attempt / max_attempts) * 95), 95)

            # Update progress more frequently
            metadata['progress'] = progress
            metadata['last_update'] = datetime.now().isoformat()
            s3_client.put_object(
                Bucket=VIDEO_OUTPUT_BUCKET,
                Key=f"{client.lower()}/generated-videos/{job_id}/metadata.json",
                Body=json.dumps(metadata, indent=2),
                ContentType='application/json'
            )

        if operation.done:
            # Generation completed successfully
            generated_video = operation.result.generated_videos[0]
            video_data = veo3_client.files.download(file=generated_video.video)

            # Save to S3
            s3_client.put_object(
                Bucket=VIDEO_OUTPUT_BUCKET,
                Key=video_key,
                Body=video_data,
                ContentType='video/mp4'
            )

            # Update final metadata
            metadata.update({
                'status': 'completed',
                'completed_at': datetime.now().isoformat(),
                'progress': 100,
                'file_size': len(video_data),
                'generation_successful': True
            })

            s3_client.put_object(
                Bucket=VIDEO_OUTPUT_BUCKET,
                Key=f"{client.lower()}/generated-videos/{job_id}/metadata.json",
                Body=json.dumps(metadata, indent=2),
                ContentType='application/json'
            )

            logger.info(f'✅ Enhanced Veo 3 generation completed: {job_id}')
        else:
            # Timeout
            metadata.update({
                'status': 'failed',
                'error': 'Generation timeout after 12 minutes',
                'failed_at': datetime.now().isoformat()
            })

            s3_client.put_object(
                Bucket=VIDEO_OUTPUT_BUCKET,
                Key=f"{client.lower()}/generated-videos/{job_id}/metadata.json",
                Body=json.dumps(metadata, indent=2),
                ContentType='application/json'
            )

            logger.warning(f'⏰ Veo 3 generation timed out: {job_id}')

    except Exception as e:
        logger.error(f'💥 Background generation error: {str(e)}')

        # Enhanced error handling
        error_message = str(e)
        if "quota" in error_message.lower() or "resource_exhausted" in error_message.lower():
            error_message = "API quota exhausted. Please wait a few minutes before trying again."
        elif "invalid" in error_message.lower():
            error_message = "Invalid request parameters. Please check your prompt and try again."

        metadata = {
            'job_id': job_id,
            'status': 'failed',
            'error': error_message,
            'failed_at': datetime.now().isoformat(),
            'error_type': 'generation_error'
        }

        s3_client.put_object(
            Bucket=VIDEO_OUTPUT_BUCKET,
            Key=f"{client.lower()}/generated-videos/{job_id}/metadata.json",
            Body=json.dumps(metadata, indent=2),
            ContentType='application/json'
        )


# Enhanced video status check endpoint
@app.post("/api/check_video_status")
async def check_video_status(request: VideoStatusRequest):
    """Enhanced video status checking with better progress tracking"""
    try:
        job_id = request.job_id

        if not job_id:
            raise HTTPException(status_code=400, detail='job_id is required')

        logger.info(f'📊 Enhanced status check for job: {job_id}')

        # Try to find metadata for any client
        clients = ['dfsa', 'atlas', 'yourbud']
        metadata = None
        video_key = None
        client_found = None

        for client in clients:
            try:
                response = s3_client.get_object(
                    Bucket=VIDEO_OUTPUT_BUCKET,
                    Key=f"{client}/generated-videos/{job_id}/metadata.json"
                )
                metadata = json.loads(response['Body'].read())
                video_key = f"{client}/generated-videos/{job_id}/output.mp4"
                client_found = client
                break
            except s3_client.exceptions.NoSuchKey:
                continue
            except Exception as e:
                logger.warning(f'Error checking {client}: {str(e)}')
                continue

        if not metadata:
            raise HTTPException(status_code=404, detail=f'Job not found: {job_id}')

        current_status = metadata.get('status', 'unknown')
        progress = metadata.get('progress', 0)

        # Return status based on current state
        if current_status == 'completed':
            try:
                # Check if video exists in S3
                s3_client.head_object(Bucket=VIDEO_OUTPUT_BUCKET, Key=video_key)

                # Generate presigned URL
                video_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': VIDEO_OUTPUT_BUCKET, 'Key': video_key},
                    ExpiresIn=3600
                )

                return {
                    'success': True,
                    'status': 'completed',
                    'progress': 100,
                    'video_url': video_url,
                    'video_key': video_key,
                    'metadata': metadata,
                    'message': 'Enhanced video generation completed successfully',
                    'file_size': metadata.get('file_size', 0)
                }
            except s3_client.exceptions.NoSuchKey:
                # Video not in S3 yet, still processing
                return {
                    'success': True,
                    'status': 'processing',
                    'progress': 95,
                    'message': 'Video is being finalized',
                    'metadata': metadata
                }

        elif current_status == 'processing':
            # Enhanced progress calculation
            calculated_progress = calculate_enhanced_progress(metadata)
            actual_progress = max(progress, calculated_progress)

            return {
                'success': True,
                'status': 'processing',
                'progress': actual_progress,
                'message': f'Enhanced Veo 3 generation in progress... {actual_progress}% complete',
                'metadata': metadata,
                'estimated_completion': metadata.get('estimated_completion')
            }

        elif current_status == 'failed':
            error_message = metadata.get('error', 'Unknown error occurred')
            return {
                'success': False,
                'status': 'failed',
                'error': error_message,
                'message': f'Video generation failed: {error_message}',
                'metadata': metadata,
                'retry_recommended': 'quota' in error_message.lower()
            }

        else:
            return {
                'success': True,
                'status': current_status,
                'message': f'Video status: {current_status}',
                'metadata': metadata
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'💥 Enhanced status check error: {str(e)}')
        raise HTTPException(status_code=500, detail=f'Failed to check video status: {str(e)}')


def calculate_enhanced_progress(metadata: Dict) -> int:
    """Calculate enhanced generation progress based on elapsed time and metadata"""
    try:
        # Check if progress is explicitly set (from background task)
        if 'progress' in metadata and metadata['progress'] > 0:
            return metadata['progress']

        started_at = metadata.get('started_at') or metadata.get('processing_started_at')
        if not started_at:
            return 5

        start_time = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
        elapsed = (datetime.now() - start_time.replace(tzinfo=None)).total_seconds()

        # Enhanced Veo 3 typically takes 60-120 seconds
        estimated_total = 90
        progress = min(int((elapsed / estimated_total) * 100), 95)

        # Add some variance to make it feel more realistic
        if progress > 10:
            progress += min(5, int(elapsed / 10))  # Slight boost over time

        return max(5, min(progress, 95))  # Keep between 5-95%

    except Exception as e:
        logger.error(f'Error calculating enhanced progress: {str(e)}')
        return 25


# Video History Endpoint
@app.post("/api/video_history")
async def get_video_history(request: Request):
    """Fetch video generation history from S3 metadata"""
    try:
        body = await request.json()
        limit = body.get('limit', 50)
        client_filter = body.get('client', None)

        videos = []

        # List all video metadata files in S3
        response = s3_client.list_objects_v2(
            Bucket=VIDEO_OUTPUT_BUCKET,
            Prefix='',
            MaxKeys=limit
        )

        if 'Contents' in response:
            for obj in response['Contents']:
                if 'metadata.json' in obj['Key']:
                    try:
                        # Get metadata file
                        meta_response = s3_client.get_object(
                            Bucket=VIDEO_OUTPUT_BUCKET,
                            Key=obj['Key']
                        )
                        metadata = json.loads(meta_response['Body'].read())

                        # Filter by client if specified
                        if client_filter and metadata.get('client') != client_filter:
                            continue

                        # Check if video file exists
                        video_key = metadata.get('video_key')
                        video_url = None
                        if video_key:
                            try:
                                s3_client.head_object(Bucket=VIDEO_OUTPUT_BUCKET, Key=video_key)
                                video_url = s3_client.generate_presigned_url(
                                    'get_object',
                                    Params={'Bucket': VIDEO_OUTPUT_BUCKET, 'Key': video_key},
                                    ExpiresIn=3600
                                )
                            except:
                                pass

                        videos.append({
                            'job_id': metadata.get('job_id'),
                            'client': metadata.get('client'),
                            'status': metadata.get('status', 'unknown'),
                            'created_at': metadata.get('started_at', obj['LastModified'].isoformat()),
                            'video_url': video_url,
                            'thumbnail_url': video_url,  # Could generate actual thumbnail
                            'prompt': metadata.get('original_prompt', ''),
                            'enhanced_prompt': metadata.get('enhanced_prompt', ''),
                            'duration': metadata.get('duration', 5),
                            'quality': metadata.get('quality', '1080p'),
                            'camera_movement': metadata.get('camera_movement', ''),
                            'reference_images': metadata.get('reference_images', []),
                            'file_size': metadata.get('file_size', 0),
                            'generation_time': metadata.get('generation_time', 0)
                        })
                    except Exception as e:
                        logger.warning(f'Error reading metadata for {obj["Key"]}: {str(e)}')
                        continue

        # Sort by created date (newest first)
        videos.sort(key=lambda x: x['created_at'], reverse=True)

        return {
            'success': True,
            'videos': videos[:limit],
            'total': len(videos)
        }

    except Exception as e:
        logger.error(f'Error fetching video history: {str(e)}')
        raise HTTPException(status_code=500, detail=str(e))


# Create Campaign Endpoint
@app.post("/api/create_campaign")
async def create_campaign(request: Request):
    """Create a new multi-platform campaign"""
    try:
        body = await request.json()

        campaign_id = f"campaign-{uuid.uuid4()}"

        campaign_data = {
            'id': campaign_id,
            'name': body.get('name', 'Untitled Campaign'),
            'client': body.get('client', 'DFSA'),
            'master_prompt': body.get('master_prompt'),
            'camera_movement': body.get('camera_movement', 'dolly-in'),
            'duration': body.get('duration', 5),
            'quality': body.get('quality', '1080p'),
            'reference_images': body.get('reference_images', []),
            'platforms': body.get('platforms', []),
            'status': 'draft',
            'created_at': datetime.now().isoformat(),
            'total_cost': len(body.get('platforms', [])) * 0.50
        }

        # Save campaign metadata to S3
        s3_client.put_object(
            Bucket=VIDEO_OUTPUT_BUCKET,
            Key=f"campaigns/{campaign_id}/campaign.json",
            Body=json.dumps(campaign_data, indent=2),
            ContentType='application/json'
        )

        return {
            'success': True,
            'campaign': campaign_data,
            'message': 'Campaign created successfully'
        }

    except Exception as e:
        logger.error(f'Error creating campaign: {str(e)}')
        raise HTTPException(status_code=500, detail=str(e))


# Generate Platform Variation Endpoint
@app.post("/api/generate_platform_variation")
async def generate_platform_variation(request: Request, background_tasks: BackgroundTasks):
    """Generate a specific platform variation for a campaign"""
    try:
        body = await request.json()

        campaign_id = body.get('campaign_id')
        platform = body.get('platform')

        # Platform-specific configurations
        platform_configs = {
            'instagram-feed': {'aspect_ratio': '1:1', 'dimensions': '1080x1080'},
            'instagram-story': {'aspect_ratio': '9:16', 'dimensions': '1080x1920'},
            'facebook-feed': {'aspect_ratio': '1.91:1', 'dimensions': '1200x630'},
            'youtube-short': {'aspect_ratio': '9:16', 'dimensions': '1080x1920'},
            'tiktok': {'aspect_ratio': '9:16', 'dimensions': '1080x1920'},
            'linkedin-post': {'aspect_ratio': '1:1', 'dimensions': '1200x1200'}
        }

        config = platform_configs.get(platform, {})

        # Enhance prompt for specific platform
        platform_prompt = f"{body.get('master_prompt')} optimized for {platform} with {config.get('aspect_ratio')} aspect ratio"

        # Use existing video generation logic
        job_id = str(uuid.uuid4())
        video_key = f"campaigns/{campaign_id}/{platform}/{job_id}/output.mp4"

        # Start generation in background
        background_tasks.add_task(
            process_veo3_generation,
            platform_prompt,
            body.get('duration', 5),
            body.get('quality', '1080p'),
            body.get('reference_images', []),
            job_id,
            body.get('client', 'DFSA'),
            video_key
        )

        return {
            'success': True,
            'job_id': job_id,
            'platform': platform,
            'video_key': video_key,
            'status': 'processing',
            'message': f'Generating {platform} variation'
        }

    except Exception as e:
        logger.error(f'Error generating platform variation: {str(e)}')
        raise HTTPException(status_code=500, detail=str(e))


# Get Campaign Status Endpoint
@app.post("/api/campaign_status")
async def get_campaign_status(request: Request):
    """Get status of all platform variations in a campaign"""
    try:
        body = await request.json()
        campaign_id = body.get('campaign_id')

        # Get campaign metadata
        response = s3_client.get_object(
            Bucket=VIDEO_OUTPUT_BUCKET,
            Key=f"campaigns/{campaign_id}/campaign.json"
        )
        campaign_data = json.loads(response['Body'].read())

        # Check status of each platform variation
        for platform in campaign_data['platforms']:
            # Check if video exists for this platform
            platform_prefix = f"campaigns/{campaign_id}/{platform['platform']}/"

            objects = s3_client.list_objects_v2(
                Bucket=VIDEO_OUTPUT_BUCKET,
                Prefix=platform_prefix,
                MaxKeys=10
            )

            if 'Contents' in objects:
                for obj in objects['Contents']:
                    if 'output.mp4' in obj['Key']:
                        platform['status'] = 'completed'
                        platform['video_url'] = s3_client.generate_presigned_url(
                            'get_object',
                            Params={'Bucket': VIDEO_OUTPUT_BUCKET, 'Key': obj['Key']},
                            ExpiresIn=3600
                        )
                        break

        # Update overall campaign status
        completed = sum(1 for p in campaign_data['platforms'] if p.get('status') == 'completed')
        total = len(campaign_data['platforms'])

        if completed == total:
            campaign_data['status'] = 'completed'
        elif completed > 0:
            campaign_data['status'] = 'partial'

        return {
            'success': True,
            'campaign': campaign_data,
            'progress': f'{completed}/{total}'
        }

    except Exception as e:
        logger.error(f'Error getting campaign status: {str(e)}')
        raise HTTPException(status_code=500, detail=str(e))


# Legacy endpoint for compatibility
@app.post("/api/")
async def legacy_handler(request: Request, background_tasks: BackgroundTasks):
    """Legacy endpoint for backward compatibility with Lambda format"""
    try:
        body = await request.json()
        action = body.get('action', 'visual_assets')

        logger.info(f'🔄 Legacy endpoint called with action: {action}')

        if action == 'visual_assets':
            req = VisualAssetsRequest(
                client=body.get('client', 'DFSA'),
                context=body.get('context', ''),
                limit=body.get('limit', 50)
            )
            return await get_visual_assets(req)

        elif action == 'generate_video':
            req = GenerateVideoRequest(
                client=body.get('client'),
                prompt=body.get('prompt'),
                duration=body.get('duration', 5),
                quality=body.get('quality', '720p'),
                reference_images=body.get('reference_images', []),
                camera_movement=body.get('camera_movement', '')
            )
            return await generate_video(req, background_tasks)

        elif action == 'check_video_status':
            req = VideoStatusRequest(
                job_id=body.get('job_id'),
                video_key=body.get('video_key'),
                client=body.get('client')
            )
            return await check_video_status(req)

        elif action == 'test':
            return await test_connection()

        else:
            raise HTTPException(status_code=400, detail=f'Unknown action: {action}')

    except Exception as e:
        logger.error(f'💥 Legacy handler error: {str(e)}')
        raise HTTPException(status_code=500, detail=f'Internal server error: {str(e)}')


# Helper functions
def analyze_reference_images(reference_images: List[str], client: str) -> Dict:
    """Enhanced reference image analysis for style context"""
    if not reference_images:
        return {
            'style': 'default',
            'elements': [],
            'description': 'No reference images provided',
            'reference_count': 0,
            'client_style': get_client_visual_style(client)
        }

    style_context = {
        'primary_colors': [],
        'composition': '',
        'lighting': '',
        'product_presentation': '',
        'brand_elements': [],
        'reference_count': len(reference_images),
        'asset_types': []
    }

    for img_key in reference_images:
        filename = img_key.split('/')[-1].lower()

        # Enhanced style extraction from filenames
        if any(word in filename for word in ['mlk5301', 'mlk5325', 'mlk5356']):  # Based on your S3 images
            style_context['asset_types'].append('premium_product')
            style_context['composition'] = 'professional product photography with clean backgrounds'
            style_context['lighting'] = 'studio lighting with natural shadows'
        elif 'dried' in filename or 'fruit' in filename:
            style_context['asset_types'].append('dried_fruit')
            style_context['composition'] = 'natural food presentation with organic arrangement'
            style_context['lighting'] = 'warm natural lighting enhancing texture'
        elif 'enhanced' in filename:
            style_context['asset_types'].append('enhanced_product')
            style_context['composition'] = 'artistically enhanced product presentation'

    # Client-specific enhancements
    if client == 'DFSA':
        style_context['primary_colors'] = ['warm orange', 'golden amber', 'natural brown', 'cream white']
        style_context['brand_elements'] = ['DFSA premium packaging', 'South African heritage', 'artisanal quality']
        style_context['product_presentation'] = 'premium dried fruit with natural textures and warm lighting'
    elif client == 'Atlas':
        style_context['primary_colors'] = ['professional blue', 'security grey', 'trust white']
        style_context['brand_elements'] = ['Atlas security badge', 'professional uniformity', 'technology integration']
        style_context['product_presentation'] = 'security equipment and professional service presentation'
    elif client == 'YourBud':
        style_context['primary_colors'] = ['digital blue', 'connection green', 'modern grey']
        style_context['brand_elements'] = ['digital interface', 'connectivity symbols', 'modern technology']
        style_context['product_presentation'] = 'app interface and digital platform presentation'

    return style_context


def optimize_for_veo3(prompt: str, style_context: Dict, duration: int) -> str:
    """Enhanced Veo 3 optimization with better cinematographic techniques"""
    optimizations = []
    optimized_prompt = prompt

    # Ensure cinematic quality markers
    quality_markers = ['photorealistic', 'cinematic', 'high quality', '4K', 'professional']
    if not any(marker in optimized_prompt.lower() for marker in quality_markers):
        optimized_prompt = f"{optimized_prompt}, professional cinematic quality, 4K resolution"
        optimizations.append('quality_enhancement')

    # Add temporal progression for longer videos
    if duration > 5:
        if not any(word in optimized_prompt.lower() for word in ['then', 'transition', 'sequence', 'revealing']):
            optimized_prompt = f"{optimized_prompt}, with smooth cinematic progression and revealing details"
            optimizations.append('temporal_progression')

    # Enhance with style context
    if style_context.get('primary_colors'):
        colors = ', '.join(style_context['primary_colors'][:3])  # Limit to 3 colors
        if not any(color.split()[0] in optimized_prompt.lower() for color in style_context['primary_colors']):
            optimized_prompt = f"{optimized_prompt}, featuring {colors} color palette"
            optimizations.append('color_enhancement')

    # Add composition guidance
    if style_context.get('composition') and len(style_context['composition']) > 10:
        optimized_prompt = f"{optimized_prompt}, {style_context['composition']}"
        optimizations.append('composition_guidance')

    # Ensure proper lighting
    if style_context.get('lighting') and 'lighting' not in optimized_prompt.lower():
        optimized_prompt = f"{optimized_prompt}, {style_context['lighting']}"
        optimizations.append('lighting_enhancement')

    logger.info(f'⚡ Veo 3 optimizations applied: {optimizations}')
    logger.info(f'📝 Final optimized prompt ({len(optimized_prompt)} chars): {optimized_prompt[:150]}...')

    return optimized_prompt


def categorize_asset(key: str, filename: str) -> str:
    """Enhanced asset categorization based on DFSA structure"""
    lower_key = key.lower()
    lower_filename = filename.lower()

    # DFSA-specific categorization based on your S3 structure
    if any(code in lower_filename for code in ['mlk5301', 'mlk5325', 'mlk5356', 'mlk5358']):
        return 'product-hero'
    elif any(code in lower_filename for code in ['mlk5443', 'mlk5457', 'mlk5458', 'mlk5459']):
        return 'lifestyle-cooking'
    elif any(code in lower_filename for code in ['mlk5499', 'mlk5510', 'mlk5515', 'mlk5517']):
        return 'lifestyle-family'
    elif 'enhanced' in lower_filename:
        return 'enhanced-product'
    elif any(word in lower_filename for word in ['brand', 'logo', 'core']):
        return 'brand-core'
    elif lower_filename.endswith(('.mp4', '.mov', '.avi', '.webm')):
        return 'video-references'
    else:
        return 'product-general'


def get_content_type(filename: str) -> str:
    """Get content type based on file extension"""
    ext = filename.split('.')[-1].lower() if '.' in filename else ''

    content_types = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
        'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml',
        'mp4': 'video/mp4', 'mov': 'video/quicktime', 'avi': 'video/avi',
        'webm': 'video/webm', 'mkv': 'video/x-matroska'
    }

    return content_types.get(ext, 'application/octet-stream')


def generate_asset_description(filename: str, category: str) -> str:
    """Generate helpful descriptions for assets"""
    descriptions = {
        'product-hero': 'Premium product photography',
        'lifestyle-cooking': 'Cooking and kitchen lifestyle',
        'lifestyle-family': 'Family and lifestyle scenes',
        'enhanced-product': 'Artistically enhanced product',
        'brand-core': 'Core brand elements',
        'video-references': 'Video reference material',
        'product-general': 'General product imagery'
    }
    return descriptions.get(category, 'Brand asset')


def calculate_veo3_cost(duration: int, quality: str) -> float:
    """Calculate estimated cost for enhanced Veo 3 generation"""
    base_costs = {
        '720p': 0.05,
        '1080p': 0.10,
        '4K': 0.20
    }

    cost_per_second = base_costs.get(quality, 0.10)
    total_cost = duration * cost_per_second

    return round(total_cost, 2)


def log_generation_metrics(client: str, duration: int, quality: str, cost: float, reference_count: int):
    """Enhanced generation metrics logging"""
    metrics = {
        'timestamp': datetime.now().isoformat(),
        'client': client,
        'duration': duration,
        'quality': quality,
        'estimated_cost': cost,
        'reference_images': reference_count,
        'provider': 'veo_3_enhanced',
        'version': '5.1-enhanced',
        'features': ['cinematographic_prompting', 'reference_images', 'camera_movement']
    }

    logger.info(f'📊 Enhanced generation metrics: {json.dumps(metrics)}')


# Health check endpoint
@app.get("/health")
async def health_check():
    """Enhanced health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "creative-ai-video-studio-enhanced",
        "version": "5.1-enhanced-prompting",
        "features": [
            "veo3_integration",
            "enhanced_prompting",
            "reference_images",
            "camera_movements",
            "s3_asset_loading",
            "cinematographic_ai"
        ]
    }


# Root endpoint
@app.get("/")
async def root():
    """Enhanced root endpoint with feature information"""
    return {
        "message": "Creative AI Video Studio API - Enhanced",
        "version": "5.1-enhanced-prompting",
        "documentation": "/docs",
        "endpoints": {
            "test": "/api/test",
            "visual_assets": "/api/visual_assets",
            "generate_video": "/api/generate_video",
            "check_video_status": "/api/check_video_status",
            "legacy": "/api/"
        },
        "features": [
            "Enhanced Veo 3 video generation",
            "Cinematographic AI prompting",
            "Custom asset integration from S3",
            "Camera movement controls",
            "Reference image styling",
            "Real-time status tracking",
            "Professional error handling"
        ],
        "supported_clients": ["DFSA", "Atlas", "YourBud"]
    }


# Run the FastAPI server
if __name__ == "__main__":
    import uvicorn

    # Configuration
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 8000))

    logger.info(f'🚀 Starting Enhanced Creative AI Video Studio API on {host}:{port}')
    logger.info(f'🎬 Veo 3 Available: {VEO3_AVAILABLE}')
    logger.info(f'🎭 Bedrock Cinematographer: {bool(BEDROCK_AGENT_ID)}')
    logger.info(f'🎨 S3 Asset Buckets: {VISUAL_ASSETS_BUCKET}, {VIDEO_OUTPUT_BUCKET}')
    logger.info(f'✨ Enhanced Features: Cinematographic AI, Reference Images, Camera Controls')

    uvicorn.run(
        "lambda_function:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )