import pyautogui
from io import BytesIO
from typing import Tuple, Optional

class DisplayService:
    def __init__(self):
        pyautogui.FAILSAFE = True

    async def take_screenshot(self, display_num: int = 1) -> bytes:
        """
        Take a screenshot of the specified display.
        Returns bytes containing the PNG image.
        """
        screenshot = pyautogui.screenshot()
        image_bytes = BytesIO()
        screenshot.save(image_bytes, format='PNG')
        return image_bytes.getvalue()

    async def get_screen_size(self, display_num: int = 1) -> Tuple[int, int]:
        """Get the size of the specified display."""
        width, height = pyautogui.size()
        return width, height

    async def locate_on_screen(
        self,
        image_path: str,
        confidence: float = 0.9,
        display_num: int = 1
    ) -> Optional[Tuple[int, int, int, int]]:
        """
        Locate an image on the screen.
        Returns (left, top, width, height) or None if not found.
        
        Args:
            image_path: Path to the image file to locate
            confidence: How confident the match should be (0-1)
            display_num: Display number
        """
        try:
            location = pyautogui.locateOnScreen(
                image_path,
                confidence=confidence
            )
            if location:
                return (
                    location.left,
                    location.top,
                    location.width,
                    location.height
                )
            return None
        except (pyautogui.ImageNotFoundException, OSError, ValueError):
            return None

    async def pixel_color(self, x: int, y: int, display_num: int = 1) -> Tuple[int, int, int]:
        """Get the RGB color of a pixel at the specified coordinates."""
        screenshot = pyautogui.screenshot(region=(x, y, 1, 1))
        return screenshot.getpixel((0, 0)) 