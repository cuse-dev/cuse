from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
import re
import logging
from routers import computer, bash, editor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
    logger.info(f"{request.method} {request.url.path} - Status: {response.status_code}")
    return response

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(computer.router)
app.include_router(bash.router)
app.include_router(editor.router)

def extract_root_path_from_referer(referer: str) -> str:
    # Extract the computer ID path from referer URL
    match = re.match(r"^https?://[^/]+(/[^/]+)", referer or "")
    return match.group(1) if match else ""

@app.middleware("http")
async def dynamic_root_path_middleware(request: Request, call_next):
    referer = request.headers.get("referer", "")
    root_path = extract_root_path_from_referer(referer)
    
    # Update request scope with root_path
    request.scope["root_path"] = root_path
    
    # If accessing openapi.json, update the servers list
    if request.url.path.endswith("/openapi.json"):
        app.openapi_schema = None  # Clear cached schema
        openapi_schema = get_openapi(
            title="Computer API",
            version="1.0.0",
            description="API for controlling a computer",
            routes=app.routes,
        )
        if root_path:
            # Get the host and port from the referer URL
            referer_match = re.match(r"^https?://([^/]+)", referer)
            if referer_match:
                host_with_port = referer_match.group(1)
            else:
                # Fallback to request host
                host_with_port = request.headers.get("host", request.url.netloc)
            
            # Get the scheme (http/https)
            scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
            # Use the root path as server URL with the correct host and port
            server_url = f"{scheme}://{host_with_port}{root_path}"
            openapi_schema["servers"] = [{"url": server_url}]
        app.openapi_schema = openapi_schema
    
    response = await call_next(request)
    return response

@app.get("/")
async def root():
    return RedirectResponse(url="docs")
