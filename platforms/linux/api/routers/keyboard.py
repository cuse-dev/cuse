from fastapi import APIRouter, HTTPException, Body
from typing import List
from pydantic import BaseModel, Field
from services import services

router = APIRouter(
    prefix="/keyboard",
    tags=["keyboard"]
)

class KeyPressRequest(BaseModel):
    key: str = Field(
        ...,
        description="Key to press (e.g., 'a', 'enter', 'shift', 'ctrl', 'alt', etc.)",
        example="enter"
    )
    display_num: int = Field(1, description="Display number to target", example=1)

    class Config:
        json_schema_extra = {
            "example": {
                "key": "enter",
                "display_num": 1
            }
        }

class TypeTextRequest(BaseModel):
    text: str = Field(..., description="Text to type", example="Hello, World!")
    display_num: int = Field(1, description="Display number to target", example=1)
    typing_delay: int = Field(
        12,
        description="Delay between keystrokes in milliseconds",
        example=12,
        ge=0
    )
    typing_group_size: int = Field(
        50,
        description="Number of characters to type at once",
        example=50,
        gt=0
    )

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Hello, World!",
                "display_num": 1,
                "typing_delay": 12,
                "typing_group_size": 50
            }
        }

class HotkeyRequest(BaseModel):
    keys: List[str] = Field(
        ...,
        description="List of keys to press simultaneously",
        example=["ctrl", "c"],
        min_items=1
    )
    display_num: int = Field(1, description="Display number to target", example=1)

    class Config:
        json_schema_extra = {
            "example": {
                "keys": ["ctrl", "c"],
                "display_num": 1
            }
        }

@router.post(
    "/key",
    summary="Press Key",
    description="Presses a single keyboard key.",
    response_description="Successfully pressed the key",
    status_code=200,
    responses={
        200: {"description": "Successfully pressed the key"},
        500: {"description": "Internal server error"}
    },
    operation_id="pressKey"
)
async def press_key(
    body: KeyPressRequest = Body(..., description="Key to press")
) -> None:
    """
    Press a single keyboard key.
    
    - Simulates a full press and release of the key
    - Supports regular keys (a-z, 0-9), special keys (enter, space, backspace),
      and modifier keys (shift, ctrl, alt)
    - Key names are case-insensitive
    """
    try:
        await services.keyboard.press_key(body.key, body.display_num)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/type",
    summary="Type Text",
    description="Types a sequence of text with configurable speed and grouping.",
    response_description="Successfully typed the text",
    status_code=200,
    responses={
        200: {"description": "Successfully typed the text"},
        500: {"description": "Internal server error"}
    },
    operation_id="typeText"
)
async def type_text(
    body: TypeTextRequest = Body(..., description="Text to type and typing parameters")
) -> None:
    """
    Type a sequence of text.
    
    - Types the text character by character or in groups
    - Supports configurable delay between keystrokes
    - Can handle any printable characters
    - Typing is done in groups to improve performance
    """
    try:
        await services.keyboard.type_text(
            body.text,
            body.display_num,
            body.typing_delay,
            body.typing_group_size
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/hotkey",
    summary="Press Hotkey Combination",
    description="Presses multiple keys simultaneously to perform a hotkey combination.",
    response_description="Successfully pressed the hotkey combination",
    status_code=200,
    responses={
        200: {"description": "Successfully pressed the hotkey combination"},
        500: {"description": "Internal server error"}
    },
    operation_id="pressHotkey"
)
async def hotkey(
    body: HotkeyRequest = Body(..., description="Keys to press simultaneously")
) -> None:
    """
    Press a combination of keys simultaneously.
    
    - Useful for keyboard shortcuts (e.g., Ctrl+C, Alt+Tab)
    - Keys are pressed in the order specified
    - All keys are held down, then released in reverse order
    - Common combinations: ['ctrl', 'c'] for copy, ['ctrl', 'v'] for paste
    """
    try:
        await services.keyboard.hotkey(*body.keys, display_num=body.display_num)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/hold",
    summary="Hold Key",
    description="Holds down a keyboard key without releasing it.",
    response_description="Successfully started holding the key",
    status_code=200,
    responses={
        200: {"description": "Successfully started holding the key"},
        500: {"description": "Internal server error"}
    },
    operation_id="holdKey"
)
async def hold_key(
    body: KeyPressRequest = Body(..., description="Key to hold down")
) -> None:
    """
    Hold down a keyboard key.
    
    - Key remains held down until explicitly released
    - Useful for modifier keys or gaming inputs
    - Must be paired with a release operation to avoid stuck keys
    - Use with caution and ensure proper release
    """
    try:
        await services.keyboard.hold_key(body.key, body.display_num)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/release",
    summary="Release Key",
    description="Releases a previously held keyboard key.",
    response_description="Successfully released the key",
    status_code=200,
    responses={
        200: {"description": "Successfully released the key"},
        500: {"description": "Internal server error"}
    },
    operation_id="releaseKey"
)
async def release_key(
    body: KeyPressRequest = Body(..., description="Key to release")
) -> None:
    """
    Release a held keyboard key.
    
    - Releases a key that was previously held down
    - Should be used to release keys held with the hold operation
    - Safe to call even if the key wasn't held
    - Recommended to use in try/finally blocks when holding keys
    """
    try:
        await services.keyboard.release_key(body.key, body.display_num)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 