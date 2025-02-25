from fastapi import APIRouter, HTTPException, Body
from typing import Dict
from pydantic import BaseModel, Field
from services import services

router = APIRouter(
    prefix="/mouse",
    tags=["mouse"]
)

class MouseMoveRequest(BaseModel):
    x: int = Field(..., description="X coordinate to move the cursor to", example=500)
    y: int = Field(..., description="Y coordinate to move the cursor to", example=300)
    display_num: int = Field(1, description="Display number to target", example=1)

    class Config:
        json_schema_extra = {
            "example": {
                "x": 500,
                "y": 300,
                "display_num": 1
            }
        }

class ScrollRequest(BaseModel):
    clicks: int = Field(
        ...,
        description="Number of clicks to scroll. Positive numbers scroll up, negative numbers scroll down",
        example=3
    )
    display_num: int = Field(1, description="Display number to target", example=1)

    class Config:
        json_schema_extra = {
            "example": {
                "clicks": 3,
                "display_num": 1
            }
        }

class DisplayRequest(BaseModel):
    display_num: int = Field(1, description="Display number to target", example=1)

    class Config:
        json_schema_extra = {
            "example": {
                "display_num": 1
            }
        }

@router.post(
    "/move",
    summary="Move Mouse Cursor",
    description="Moves the mouse cursor to the specified X and Y coordinates on the screen.",
    response_description="Successfully moved the cursor",
    status_code=204,
    responses={
        204: {"description": "Successfully moved the cursor"},
        500: {"description": "Internal server error"}
    },
    operation_id="moveMouse"
)
async def mouse_move(
    body: MouseMoveRequest = Body(..., description="Coordinates to move the cursor to")
) -> None:
    """
    Move the mouse cursor to specific coordinates on the screen.
    
    - Coordinates are in pixels from the top-left corner (0,0)
    - Movement is smooth and takes about 0.5 seconds
    - If coordinates are outside the screen, the cursor will move to the nearest valid position
    """
    try:
        await services.mouse.move(body.x, body.y, body.display_num)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/left-click",
    summary="Perform Left Click",
    description="Performs a left mouse button click at the current cursor position.",
    response_description="Successfully performed left click",
    status_code=204,
    responses={
        204: {"description": "Successfully performed left click"},
        500: {"description": "Internal server error"}
    },
    operation_id="leftClick"
)
async def left_click(
    body: DisplayRequest = Body(..., description="Display settings for the click operation")
) -> None:
    """
    Perform a left mouse button click at the current cursor position.
    
    The click is instantaneous and simulates a full press and release of the left mouse button.
    """
    try:
        await services.mouse.left_click(body.display_num)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/right-click",
    summary="Perform Right Click",
    description="Performs a right mouse button click at the current cursor position.",
    response_description="Successfully performed right click",
    status_code=204,
    responses={
        204: {"description": "Successfully performed right click"},
        500: {"description": "Internal server error"}
    },
    operation_id="rightClick"
)
async def right_click(
    body: DisplayRequest = Body(..., description="Display settings for the click operation")
) -> None:
    """
    Perform a right mouse button click at the current cursor position.
    
    The click is instantaneous and simulates a full press and release of the right mouse button.
    """
    try:
        await services.mouse.right_click(body.display_num)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/middle-click",
    summary="Perform Middle Click",
    description="Performs a middle mouse button (scroll wheel) click at the current cursor position.",
    response_description="Successfully performed middle click",
    status_code=204,
    responses={
        204: {"description": "Successfully performed middle click"},
        500: {"description": "Internal server error"}
    },
    operation_id="middleClick"
)
async def middle_click(
    body: DisplayRequest = Body(..., description="Display settings for the click operation")
) -> None:
    """
    Perform a middle mouse button click at the current cursor position.
    
    The click is instantaneous and simulates a full press and release of the middle mouse button (scroll wheel).
    """
    try:
        await services.mouse.middle_click(body.display_num)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/double-click",
    summary="Perform Double Click",
    description="Performs a double left click at the current cursor position.",
    response_description="Successfully performed double click",
    status_code=204,
    responses={
        204: {"description": "Successfully performed double click"},
        500: {"description": "Internal server error"}
    },
    operation_id="doubleClick"
)
async def double_click(
    body: DisplayRequest = Body(..., description="Display settings for the click operation")
) -> None:
    """
    Perform a double click at the current cursor position.
    
    Simulates two quick left clicks in succession, matching the system's double-click speed.
    """
    try:
        await services.mouse.double_click(body.display_num)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/drag",
    summary="Drag Mouse",
    description="Performs a drag operation from the current cursor position to the specified coordinates.",
    response_description="Successfully performed drag operation",
    status_code=204,
    responses={
        204: {"description": "Successfully performed drag operation"},
        500: {"description": "Internal server error"}
    },
    operation_id="dragMouse"
)
async def drag(
    body: MouseMoveRequest = Body(..., description="Target coordinates for the drag operation")
) -> None:
    """
    Perform a drag operation from the current cursor position to the specified coordinates.
    
    - Holds down the left mouse button at the current position
    - Moves to the target coordinates
    - Releases the left mouse button
    - Movement takes about 1 second to complete
    """
    try:
        await services.mouse.drag(body.x, body.y, body.display_num)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/position",
    summary="Get Cursor Position",
    description="Gets the current position of the mouse cursor on the screen.",
    response_description="Current cursor coordinates",
    response_model=Dict[str, int],
    responses={
        200: {
            "description": "Successfully retrieved cursor position",
            "content": {
                "application/json": {
                    "example": {"x": 500, "y": 300}
                }
            }
        },
        500: {"description": "Internal server error"}
    },
    operation_id="getMousePosition"
)
async def get_position(
    display_num: int = 1
) -> Dict[str, int]:
    """
    Get the current position of the mouse cursor.
    
    Returns a dictionary with 'x' and 'y' coordinates in pixels from the top-left corner (0,0).
    """
    try:
        return await services.mouse.get_position(display_num)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/scroll",
    summary="Scroll Mouse Wheel",
    description="Scrolls the mouse wheel by the specified number of clicks.",
    response_description="Successfully performed scroll operation",
    status_code=204,
    responses={
        204: {"description": "Successfully performed scroll operation"},
        500: {"description": "Internal server error"}
    },
    operation_id="scrollMouse"
)
async def scroll(
    body: ScrollRequest = Body(..., description="Scroll operation parameters")
) -> None:
    """
    Scroll the mouse wheel by a specified number of clicks.
    
    - Positive numbers scroll up
    - Negative numbers scroll down
    - Each click typically corresponds to about 3 lines of text
    """
    try:
        await services.mouse.scroll(body.clicks, body.display_num)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 