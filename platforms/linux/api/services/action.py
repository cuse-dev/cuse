from services.bash import BashService
from services.display import DisplayService
from services.editor import EditorService
from services.filesystem import FilesystemService
from services.keyboard import KeyboardService
from services.mouse import MouseService
from typing import Any, List, Literal, Union, Dict
from pydantic import BaseModel

class MouseMove(BaseModel):
    action: Literal["mouse_move"]
    x: int
    y: int

class MouseLeftClick(BaseModel):
    action: Literal["mouse_left_click"]

class MouseRightClick(BaseModel):
    action: Literal["mouse_right_click"]

class MouseMiddleClick(BaseModel):
    action: Literal["mouse_middle_click"]

class MouseDoubleClick(BaseModel):
    action: Literal["mouse_double_click"]

class MouseDrag(BaseModel):
    action: Literal["mouse_drag"]
    x: int
    y: int

class MouseGetPosition(BaseModel):
    action: Literal["mouse_get_position"]

class MouseScroll(BaseModel):
    action: Literal["mouse_scroll"]
    clicks: int

MouseActions = Union[MouseMove, MouseLeftClick, MouseRightClick, MouseMiddleClick, MouseDoubleClick, MouseDrag, MouseScroll]

class KeyboardPress(BaseModel):
    action: Literal["keyboard_press"]
    key: str

class KeyboardType(BaseModel):
    action: Literal["keyboard_type"]
    text: str

class KeyboardHotkey(BaseModel):
    action: Literal["keyboard_hotkey"]
    keys: List[str]

class KeyboardHold(BaseModel):
    action: Literal["keyboard_hold"]
    key: str

class KeyboardRelease(BaseModel):
    action: Literal["keyboard_release"]
    key: str

KeyboardActions = Union[KeyboardPress, KeyboardType, KeyboardHotkey, KeyboardHold, KeyboardRelease]

class DisplayScreenshot(BaseModel):
    action: Literal["display_screenshot"]
    display: int

class DisplayGetSize(BaseModel):
    action: Literal["display_get_size"]
    display: int

class DisplayLocate(BaseModel):
    action: Literal["display_locate"]
    image: str
    confidence: float
    display: int

class DisplayPixelColor(BaseModel):
    action: Literal["display_pixel_color"]
    x: int
    y: int
    display: int

DisplayActions = Union[DisplayScreenshot, DisplayGetSize, DisplayLocate, DisplayPixelColor]

class BashExecute(BaseModel):
    action: Literal["bash_execute"]
    command: str

class BashTerminateProcess(BaseModel):
    action: Literal["bash_terminate_process"]
    pid: int

class BashGetProcessOutput(BaseModel):
    action: Literal["bash_get_process_output"]
    pid: int

class BashRestart(BaseModel):
    action: Literal["bash_restart"]

class BashListProcesses(BaseModel):
    action: Literal["bash_list_processes"]

BashActions = Union[BashExecute, BashTerminateProcess, BashGetProcessOutput, BashRestart, BashListProcesses]

class EditorViewFile(BaseModel):
    action: Literal["editor_view_file"]
    path: str
    line: int
    column: int

class EditorCreateFile(BaseModel):
    action: Literal["editor_create_file"]
    path: str
    content: str

class EditorReplaceString(BaseModel):
    action: Literal["editor_replace_string"]
    path: str
    old: str
    new: str

class EditorInsertText(BaseModel):
    action: Literal["editor_insert_text"]
    path: str
    text: str
    line: int

class EditorUndoLastEdit(BaseModel):
    action: Literal["editor_undo_last_edit"]
    path: str

EditorActions = Union[EditorViewFile, EditorCreateFile, EditorReplaceString, EditorInsertText, EditorUndoLastEdit]

class FilesystemListDirectory(BaseModel):
    action: Literal["filesystem_list_directory"]
    path: str
    recursive: bool
    pattern: str

class FilesystemGetTree(BaseModel):
    action: Literal["filesystem_get_tree"]
    path: str
    depth: int

class FilesystemSearchFiles(BaseModel):
    action: Literal["filesystem_search_files"]
    path: str
    pattern: str
    max_results: int
    case_sensitive: bool

class FilesystemGetPathInfo(BaseModel):
    action: Literal["filesystem_get_path_info"]
    path: str

FilesystemActions = Union[FilesystemListDirectory, FilesystemGetTree, FilesystemSearchFiles, FilesystemGetPathInfo]

Action = Union[MouseActions, KeyboardActions, DisplayActions, BashActions, EditorActions, FilesystemActions]

class ActionService:
    def __init__(self, bash_service: BashService, display_service: DisplayService, editor_service: EditorService, file_service: FilesystemService, keyboard_service: KeyboardService, mouse_service: MouseService):
        self.bash_service = bash_service
        self.display_service = display_service
        self.editor_service = editor_service
        self.file_service = file_service
        self.keyboard_service = keyboard_service
        self.mouse_service = mouse_service

    async def run(self, actions: List[Action]) -> None:
        results = []
        for action in actions:
            result = await self.act(action)
            if result is not None:
                results.append(result)
        return results

    async def act(self, action: Action) -> Any:
        if action.action == "mouse_move":
            await self.mouse_service.move(action.x, action.y)
        elif action.action == "mouse_left_click":
            await self.mouse_service.left_click()
        elif action.action == "mouse_right_click":
            await self.mouse_service.right_click()
        elif action.action == "mouse_middle_click":
            await self.mouse_service.middle_click()
        elif action.action == "mouse_double_click":
            await self.mouse_service.double_click()
        elif action.action == "mouse_drag":
            await self.mouse_service.drag(action.x, action.y)
        elif action.action == "mouse_get_position":
            return await self.mouse_service.get_position()
        elif action.action == "mouse_scroll":
            await self.mouse_service.scroll(action.clicks)
        elif action.action == "keyboard_press":
            await self.keyboard_service.press_key(action.key)
        elif action.action == "keyboard_type":
            await self.keyboard_service.type_text(action.text)
        elif action.action == "keyboard_hotkey":
            await self.keyboard_service.hotkey(action.keys)
        elif action.action == "keyboard_hold":
            await self.keyboard_service.hold_key(action.key)
        elif action.action == "keyboard_release":
            await self.keyboard_service.release_key(action.key)
        elif action.action == "display_screenshot":
            return await self.display_service.take_screenshot(action.display)
        elif action.action == "display_get_size":
            return await self.display_service.get_screen_size(action.display)
        elif action.action == "display_locate":
            return await self.display_service.locate_on_screen(action.image, action.confidence, action.display)
        elif action.action == "display_pixel_color":
            return await self.display_service.pixel_color(action.x, action.y, action.display)
        elif action.action == "bash_execute":
            return await self.bash_service.execute_command(action.command)
        elif action.action == "bash_terminate_process":
            await self.bash_service.terminate_process(action.pid)
        elif action.action == "bash_get_process_output":
            return await self.bash_service.get_process_output(action.pid)
        elif action.action == "bash_restart":
            await self.bash_service.restart_system()
        elif action.action == "bash_list_processes":
            return await self.bash_service.list_managed_processes()
        elif action.action == "editor_view_file":
            return await self.editor_service.view_file(action.file, action.start, action.end)
        elif action.action == "editor_create_file":
            await self.editor_service.create_file(action.file, action.content)
        elif action.action == "editor_replace_string":
            await self.editor_service.replace_string(action.file, action.old, action.new)
        elif action.action == "editor_insert_text":
            await self.editor_service.insert_text(action.file, action.text, action.line)
        elif action.action == "editor_undo_last_edit":
            await self.editor_service.undo_last_edit(action.file)
        elif action.action == "filesystem_list_directory":
            return await self.file_service.list_directory(action.path, action.hidden, action.pattern)
        elif action.action == "filesystem_get_tree":
            return await self.file_service.get_tree(action.path, action.depth)
        elif action.action == "filesystem_search_files":
            return await self.file_service.search_files(action.root, action.pattern, action.max_results, action.hidden)
        elif action.action == "filesystem_get_path_info":
            return await self.file_service.get_path_info(action.path)
        else:
            raise ValueError(f"Unknown action: {action.action}")
