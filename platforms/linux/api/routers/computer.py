from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import Dict
from pydantic import BaseModel
import io
import pyautogui


class TypeTextRequest(BaseModel):
    text: str
    display_num: int = 1
    typing_delay: int = 12
    typing_group_size: int = 50

class KeyPressRequest(BaseModel):
    key: str
    display_num: int = 1

class MouseMoveRequest(BaseModel):
    x: int
    y: int
    display_num: int = 1

class DisplayRequest(BaseModel):
    display_num: int = 1

router = APIRouter(prefix="/computer", tags=["computer"])

@router.get("/screenshot")
async def screenshot(display_num: int = 1):
    try:
        # Take screenshot using pyautogui
        screenshot = pyautogui.screenshot()
        image_bytes = io.BytesIO()
        screenshot.save(image_bytes, format='PNG')
        image_bytes.seek(0)
        
        return StreamingResponse(
            image_bytes,
            media_type="image/png",
            headers={
                "Content-Disposition": "attachment; filename=screenshot.png"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/key")
async def key(body: KeyPressRequest) -> None:
    try:
        pyautogui.press(body.key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/type")
async def type_text(body: TypeTextRequest) -> None:
    try:
        pyautogui.PAUSE = body.typing_delay / 1000  # Convert ms to seconds
        for i in range(0, len(body.text), body.typing_group_size):
            group = body.text[i:i + body.typing_group_size]
            pyautogui.write(group)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mouse-move")
async def mouse_move(body: MouseMoveRequest) -> None:
    try:
        pyautogui.moveTo(body.x, body.y, 0.5)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/left-click")
async def left_click(body: DisplayRequest) -> None:
    try:
        pyautogui.click(button='left')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/right-click")
async def right_click(body: DisplayRequest) -> None:
    try:
        pyautogui.click(button='right')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/middle-click")
async def middle_click(body: DisplayRequest) -> None:
    try:
        pyautogui.click(button='middle')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/double-click")
async def double_click(body: DisplayRequest) -> None:
    try:
        pyautogui.doubleClick()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/left-click-drag")
async def left_click_drag(body: MouseMoveRequest) -> None:
    try:
        pyautogui.dragTo(body.x, body.y, 1, button='left')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cursor-position")
async def cursor_position(display_num: int = 1) -> Dict[str, int]:
    try:
        x, y = pyautogui.position()
        return {"x": x, "y": y}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
