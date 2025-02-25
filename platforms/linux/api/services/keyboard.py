import pyautogui

class KeyboardService:
    def __init__(self):
        pyautogui.FAILSAFE = True

    async def press_key(self, key: str, display_num: int = 1) -> None:
        """Press a single key."""
        pyautogui.press(key)

    async def type_text(
        self, 
        text: str, 
        display_num: int = 1, 
        typing_delay: int = 12,
        typing_group_size: int = 50
    ) -> None:
        """
        Type text with specified delay and group size.
        
        Args:
            text: Text to type
            display_num: Display number
            typing_delay: Delay between keystrokes in milliseconds
            typing_group_size: Number of characters to type at once
        """
        pyautogui.PAUSE = typing_delay / 1000  # Convert ms to seconds
        for i in range(0, len(text), typing_group_size):
            group = text[i:i + typing_group_size]
            pyautogui.write(group)

    async def hotkey(self, *keys: str, display_num: int = 1) -> None:
        """
        Press a combination of keys together.
        Example: hotkey('ctrl', 'c') for copy
        """
        pyautogui.hotkey(*keys)

    async def hold_key(self, key: str, display_num: int = 1) -> None:
        """Hold down a key."""
        pyautogui.keyDown(key)

    async def release_key(self, key: str, display_num: int = 1) -> None:
        """Release a held key."""
        pyautogui.keyUp(key) 