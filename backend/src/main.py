import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

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
        raise HTTPException(500, "Azure config missing")

    prompt_prefix = {
        "image": "You are a prompt engineer for image generation models. Craft a clear descriptive prompt.",
        "code": "You are a skilled software engineer. Craft a precise coding task prompt.",
        "write": "You are a creative assistant. Craft a unique writing prompt."
    }.get(req.type, "You are a helpful prompt engineer.")

    system_prompt = f"{prompt_prefix}\nContext: {req.context or ''}\nProduce:"

    body = {
        "messages": [
            {"role": "system", "content": prompt_prefix},
            {"role": "user", "content": req.context or ""}
        ],
        "max_tokens": 200,
        "temperature": 0.7
    }

    url = f"{AZURE_ENDPOINT}/openai/deployments/{DEPLOYMENT}/chat/completions?api-version={API_VERSION}"

    async with httpx.AsyncClient() as client:
        r = await client.post(url, json=body, headers={"api-key": AZURE_KEY}, timeout=30)

    if r.status_code != 200:
        raise HTTPException(500, detail=r.text)

    data = r.json()
    text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    return {"prompt": text}
