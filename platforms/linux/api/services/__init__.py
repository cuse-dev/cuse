from typing import Optional
from .mouse import MouseService
from .keyboard import KeyboardService
from .display import DisplayService
from .bash import BashService
from .editor import EditorService
from .keychain import KeychainService
from .filesystem import FilesystemService

class ServiceContainer:
    _instance: Optional['ServiceContainer'] = None
    
    def __init__(self):
        self._mouse: Optional[MouseService] = None
        self._keyboard: Optional[KeyboardService] = None
        self._display: Optional[DisplayService] = None
        self._bash: Optional[BashService] = None
        self._editor: Optional[EditorService] = None
        self._keychain: Optional[KeychainService] = None
        self._filesystem: Optional[FilesystemService] = None

    @classmethod
    def get_instance(cls) -> 'ServiceContainer':
        if cls._instance is None:
            cls._instance = ServiceContainer()
        return cls._instance

    @property
    def mouse(self) -> MouseService:
        if self._mouse is None:
            self._mouse = MouseService()
        return self._mouse

    @property
    def keyboard(self) -> KeyboardService:
        if self._keyboard is None:
            self._keyboard = KeyboardService()
        return self._keyboard

    @property
    def display(self) -> DisplayService:
        if self._display is None:
            self._display = DisplayService()
        return self._display

    @property
    def bash(self) -> BashService:
        if self._bash is None:
            self._bash = BashService()
        return self._bash

    @property
    def editor(self) -> EditorService:
        if self._editor is None:
            self._editor = EditorService()
        return self._editor

    @property
    def keychain(self) -> KeychainService:
        if self._keychain is None:
            self._keychain = KeychainService(
                mouse_service=self.mouse,
                keyboard_service=self.keyboard
            )
        return self._keychain

    @property
    def filesystem(self) -> FilesystemService:
        if self._filesystem is None:
            self._filesystem = FilesystemService()
        return self._filesystem

# Export services for convenience
services = ServiceContainer.get_instance() 