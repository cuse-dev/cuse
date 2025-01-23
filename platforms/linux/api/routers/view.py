from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.responses import RedirectResponse
import httpx
import re

router = APIRouter(
    prefix="/view",
    tags=["view"]
)

@router.api_route(
    "/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"],
    summary="noVNC Interface",
    description="Forward the noVNC web interface."
)
async def forward_novnc(request: Request, path: str = ""):
    """
    Forward all requests to the noVNC web interface running on port 6080.
    This includes the web UI, assets (JS, CSS), and WebSocket connections.
    """
    # Get the component name from the request URL
    # Handle paths like /quickstart-computer/api/view/
    path_parts = request.url.path.split('/')
    component = next((part for part in path_parts if part and part != 'api'), None)
    if not component:
        raise HTTPException(status_code=400, detail="Component name not found in URL")
    
    # Construct target URL using the component name as hostname
    target_url = f"http://{component}:6080"
    if path:
        target_url = f"{target_url}/{path}"
    
    # Forward the request headers
    headers = dict(request.headers)
    headers.pop("host", None)  # Remove the host header to avoid conflicts
    
    async with httpx.AsyncClient() as client:
        try:
            # Stream the response from noVNC
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=await request.body(),
                params=request.query_params,
                follow_redirects=True
            )
            
            # If this is the main HTML page, modify the WebSocket URL
            if path == "" and response.headers.get("content-type", "").startswith("text/html"):
                content = response.text
                # Replace the WebSocket URL configuration
                content = re.sub(
                    r'new WebsockifyConfig\((.*?)\)',
                    f'new WebsockifyConfig({{target: "{component}", path: "websockify"}})',
                    content
                )
                # Also handle any direct WebSocket path settings
                content = content.replace('"websockify"', f'"{component}/websockify"')
                return HTMLResponse(content=content)
            
            return StreamingResponse(
                response.aiter_bytes(),
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.headers.get("content-type")
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to proxy request: {str(e)}")

