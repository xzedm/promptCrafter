import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="PromptCrafter API", version="1.0.0")

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your extension URL in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AZURE_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_KEY = os.getenv("AZURE_OPENAI_KEY")
DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")
API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2025-01-01-preview")

class GenerateReq(BaseModel):
    type: str
    context: str | None = None

@app.post("/api/generate")
async def generate(req: GenerateReq):
    if not AZURE_ENDPOINT or not AZURE_KEY or not DEPLOYMENT:
        raise HTTPException(500, "Azure OpenAI configuration missing")

    if not req.context or not req.context.strip():
        raise HTTPException(400, "Context is required")

    # Enhanced prompt templates for each type
    prompt_templates = {
        "image": {
            "system": "You are an expert prompt engineer specializing in AI image generation. Create detailed, descriptive prompts that will produce high-quality visual content. Focus on visual details, style, composition, lighting, and artistic elements.",
            "instruction": "Transform this request into a detailed image generation prompt optimized for AI tools like DALL-E, Midjourney, or Stable Diffusion. Include specific visual elements, style references, lighting conditions, and composition details."
        },
        "video": {
            "system": "You are an expert prompt engineer for AI video generation tools. Create prompts that specify motion, transitions, visual style, and temporal elements for video content creation.",
            "instruction": "Convert this request into a comprehensive video generation prompt. Include details about motion, camera movements, visual style, transitions, duration, and any specific video elements needed."
        },
        "code": {
            "system": "You are a senior software engineer and prompt engineer. Create precise, technical prompts for AI coding assistants that specify requirements, constraints, technologies, and expected outcomes.",
            "instruction": "Transform this into a clear, technical prompt for AI coding tools. Include specific requirements, programming languages, frameworks, constraints, and expected functionality."
        },
        "write": {
            "system": "You are a professional writing coach and prompt engineer. Create prompts that guide AI to produce well-structured, engaging content with clear tone, style, and purpose.",
            "instruction": "Convert this into a detailed writing prompt. Specify the content type, tone, target audience, structure, key points to cover, and any stylistic requirements."
        },
        "marketing": {
            "system": "You are a marketing expert and prompt engineer specializing in advertising and promotional content. Create prompts that generate persuasive, targeted marketing materials.",
            "instruction": "Transform this into a marketing-focused prompt. Include target audience, brand voice, key messaging, call-to-action, platform specifications, and marketing objectives."
        },
        "productivity": {
            "system": "You are a productivity consultant and prompt engineer. Create prompts that help AI assistants provide organized, actionable solutions for daily tasks and workflow optimization.",
            "instruction": "Convert this into a productivity-focused prompt. Include task organization, time management aspects, priority levels, deadlines, and actionable steps needed."
        }
    }

    template = prompt_templates.get(req.type, prompt_templates["write"])
    
    system_prompt = template["system"]
    user_prompt = f"{template['instruction']}\n\nOriginal request: {req.context}\n\nOptimized prompt:"

    body = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": 300,
        "temperature": 0.7,
        "top_p": 0.9
    }

    url = f"{AZURE_ENDPOINT}/openai/deployments/{DEPLOYMENT}/chat/completions?api-version={API_VERSION}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, 
                json=body, 
                headers={
                    "api-key": AZURE_KEY,
                    "Content-Type": "application/json"
                }, 
                timeout=30
            )

        if response.status_code != 200:
            error_detail = f"Azure OpenAI API error: {response.status_code} - {response.text}"
            raise HTTPException(500, error_detail)

        data = response.json()
        
        # Extract the generated prompt
        if "choices" not in data or len(data["choices"]) == 0:
            raise HTTPException(500, "No response from Azure OpenAI")
        
        generated_prompt = data["choices"][0].get("message", {}).get("content", "").strip()
        
        if not generated_prompt:
            raise HTTPException(500, "Empty response from Azure OpenAI")

        return {"prompt": generated_prompt}

    except httpx.TimeoutException:
        raise HTTPException(504, "Request to Azure OpenAI timed out")
    except httpx.RequestError as e:
        raise HTTPException(500, f"Network error: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"Unexpected error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "PromptCrafter API"}

@app.get("/")
async def root():
    return {
        "message": "Welcome to PromptCrafter API", 
        "version": "1.0.0",
        "endpoints": {
            "generate": "/api/generate",
            "health": "/health"
        }
    }