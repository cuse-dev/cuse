import pyautogui
from typing import Dict

class MouseService:
    def __init__(self):
        pyautogui.FAILSAFE = True

    async def move(self, x: int, y: int, display_num: int = 1) -> None:
        """Move mouse to specified coordinates."""
        pyautogui.moveTo(x, y, 0.5)

    async def left_click(self, display_num: int = 1) -> None:
        """Perform a left click."""
        pyautogui.click(button='left')

    async def right_click(self, display_num: int = 1) -> None:
        """Perform a right click."""
        pyautogui.click(button='right')

    async def middle_click(self, display_num: int = 1) -> None:
        """Perform a middle click."""
        pyautogui.click(button='middle')

    async def double_click(self, display_num: int = 1) -> None:
        """Perform a double click."""
        pyautogui.doubleClick()

    async def drag(self, x: int, y: int, display_num: int = 1) -> None:
        """Perform a left click and drag to specified coordinates."""
        pyautogui.dragTo(x, y, 1, button='left')

    async def get_position(self, display_num: int = 1) -> Dict[str, int]:
        """Get current cursor position."""
        x, y = pyautogui.position()
        return {"x": x, "y": y}

    async def scroll(self, clicks: int, display_num: int = 1) -> None:
        """Scroll the mouse wheel."""
        pyautogui.scroll(clicks) 