from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from typing import Dict, Optional, Tuple
from pydantic import BaseModel, Field
from services import services
import io

router = APIRouter(
    prefix="/display",
    tags=["display"]
)

class ImageLocateRequest(BaseModel):
    image_path: str = Field(
        ...,
        description="Path to the image file to locate on screen",
        example="/path/to/image.png"
    )
    confidence: float = Field(
        0.9,
        description="Confidence threshold for image matching (0.0 to 1.0)",
        example=0.9,
        ge=0.0,
        le=1.0
    )
    display_num: int = Field(1, description="Display number to target", example=1)

    class Config:
        json_schema_extra = {
            "example": {
                "image_path": "/path/to/image.png",
                "confidence": 0.9,
                "display_num": 1
            }
        }

class PixelColorRequest(BaseModel):
    x: int = Field(..., description="X coordinate of the pixel", example=100)
    y: int = Field(..., description="Y coordinate of the pixel", example=100)
    display_num: int = Field(1, description="Display number to target", example=1)

    class Config:
        json_schema_extra = {
            "example": {
                "x": 100,
                "y": 100,
                "display_num": 1
            }
        }

@router.get(
    "/screenshot",
    summary="Take Screenshot",
    description="Captures a screenshot of the specified display.",
    response_class=StreamingResponse,
    responses={
        200: {
            "description": "Successfully captured screenshot",
            "content": {"image/png": {}}
        },
        500: {"description": "Internal server error"}
    },
    operation_id="takeScreenshot"
)
async def screenshot(
    display_num: int = 1
) -> StreamingResponse:
    """
    Take a screenshot of the specified display.
    
    - Returns a PNG image of the entire display
    - Supports multiple displays through display_num parameter
    - Image is returned as a streaming response for efficiency
    - Can be used for visual automation and verification
    """
    try:
        screenshot = await services.display.take_screenshot(display_num)
        return StreamingResponse(
            io.BytesIO(screenshot),
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=screenshot.png"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/screen_size",
    summary="Get Screen Size",
    description="Retrieves the dimensions of the specified display.",
    response_model=Dict[str, int],
    responses={
        200: {
            "description": "Successfully retrieved screen size",
            "content": {
                "application/json": {
                    "example": {"width": 1920, "height": 1080}
                }
            }
        },
        500: {"description": "Internal server error"}
    },
    operation_id="getScreenSize"
)
async def get_screen_size(
    display_num: int = 1
) -> Dict[str, int]:
    """
    Get the dimensions of the specified display.
    
    - Returns width and height in pixels
    - Supports multiple displays through display_num parameter
    - Useful for calculating relative positions and boundaries
    - Common resolutions: 1920x1080, 2560x1440, 3840x2160
    """
    try:
        width, height = await services.display.get_screen_size(display_num)
        return {"width": width, "height": height}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/locate",
    summary="Locate Image on Screen",
    description="Searches for a specified image on the screen and returns its location if found.",
    response_model=Optional[Dict[str, int]],
    responses={
        200: {
            "description": "Successfully searched for image",
            "content": {
                "application/json": {
                    "example": {"x": 100, "y": 100, "width": 50, "height": 50}
                }
            }
        },
        500: {"description": "Internal server error"}
    },
    operation_id="locateImage"
)
async def locate_on_screen(
    body: ImageLocateRequest = Body(..., description="Image search parameters")
) -> Optional[Dict[str, int]]:
    """
    Locate an image on the screen.
    
    - Returns position and dimensions if image is found
    - Supports confidence threshold for matching accuracy
    - Returns None if image is not found
    - Useful for visual automation and testing
    """
    try:
        result = await services.display.locate_on_screen(
            body.image_path,
            body.confidence,
            body.display_num
        )
        if result is None:
            return None
        x, y, width, height = result
        return {"x": x, "y": y, "width": width, "height": height}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/pixel_color",
    summary="Get Pixel Color",
    description="Retrieves the RGB color values of a pixel at the specified coordinates.",
    response_model=Tuple[int, int, int],
    responses={
        200: {
            "description": "Successfully retrieved pixel color",
            "content": {
                "application/json": {
                    "example": [255, 128, 0]
                }
            }
        },
        500: {"description": "Internal server error"}
    },
    operation_id="getPixelColor"
)
async def get_pixel_color(
    body: PixelColorRequest = Body(..., description="Pixel coordinates")
) -> Tuple[int, int, int]:
    """
    Get the RGB color of a pixel at specified coordinates.
    
    - Returns a tuple of (red, green, blue) values
    - Each color component ranges from 0 to 255
    - Coordinates are relative to the specified display
    - Useful for color-based automation and verification
    """
    try:
        return await services.display.pixel_color(body.x, body.y, body.display_num)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 