from fastapi import FastAPI, Request, APIRouter
from fastapi.responses import RedirectResponse
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
import re
import logging
from routers import (
    mouse_router,
    keyboard_router,
    display_router,
    bash_router,
    editor_router,
    keychain_router,
    filesystem_router
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
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

def extract_root_path_from_referer(referer: str) -> str:
    """
    Extracts "/<computer-name>" (etc.) from the referer URL if present.
    Example referer: "http://localhost:4242/mycomputer/api/..."
    This will yield "/mycomputer" as the root path.
    """
    match = re.match(r"^https?://[^/]+(/[^/]+)(?:/.*)?", referer)
    return match.group(1) if match else ""

@app.middleware("http")
async def dynamic_root_path_middleware(request: Request, call_next):
    root_path = ""
    
    # Try to get the computer name from X-Forwarded-Prefix
    forwarded_prefix = request.headers.get("x-forwarded-prefix", "")
    if forwarded_prefix:
        match = re.match(r"^/([^/]+)(?:/.*)?$", forwarded_prefix)
        if match and match.group(1) not in ["docs", "api", "openapi.json", "redoc"]:
            root_path = f"/{match.group(1)}"
    
    # If no root_path found, try the current path
    if not root_path:
        path = request.url.path
        match = re.match(r"^/([^/]+)(?:/.*)?$", path)
        if match and match.group(1) not in ["docs", "api", "openapi.json", "redoc"]:
            root_path = f"/{match.group(1)}"
    
    # Fallback to referer if still no root_path
    if not root_path:
        referer = request.headers.get("referer", "")
        print(f"referer: {referer}")
        root_path = extract_root_path_from_referer(referer)
    
    request.scope["root_path"] = root_path
    response = await call_next(request)
    
    # If we're getting redirected and we have a root_path, 
    # make sure the redirect includes the computer name
    if response.status_code in (301, 302, 307) and root_path:
        location = response.headers.get("location")
        if location and location.startswith("/"):
            # Don't add root_path if it's already there
            if not location.startswith(root_path + "/"):
                response.headers["location"] = f"{root_path}{location}"
    
    return response


# Create API router with /api prefix
api_router = APIRouter(prefix="/api")
api_router.include_router(mouse_router)
api_router.include_router(keyboard_router)
api_router.include_router(display_router)
api_router.include_router(bash_router)
api_router.include_router(editor_router)
api_router.include_router(keychain_router)
api_router.include_router(filesystem_router)

# Include the API router
app.include_router(api_router)

# Redirect root to docs
@app.get("/")
async def root(request: Request):
    root_path = request.scope.get("root_path", "")
    return RedirectResponse(url=f"{root_path}/docs")

# Redirect /api to /docs
@app.get("/api")
async def api_root(request: Request):
    root_path = request.scope.get("root_path", "")
    return RedirectResponse(url=f"{root_path}/docs")
