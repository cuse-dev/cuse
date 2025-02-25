import os
from typing import List, Optional, Tuple

class EditorService:
    def __init__(self):
        self._file_history: dict[str, List[str]] = {}  # For undo functionality

    async def view_file(self, path: str, view_range: Optional[Tuple[int, int]] = None) -> str:
        """
        View contents of a file, optionally within a specific line range.
        """
        if not os.path.exists(path):
            raise FileNotFoundError(f"File not found: {path}")

        with open(path, 'r') as file:
            lines = file.readlines()

        if view_range:
            start, end = view_range
            start = max(0, start - 1)  # Convert to 0-based index
            end = min(len(lines), end)
            lines = lines[start:end]

        return "".join(lines)

    async def create_file(self, path: str, content: Optional[str] = None) -> None:
        """
        Create a new file with optional content.
        """
        if os.path.exists(path):
            raise FileExistsError(f"File already exists: {path}")

        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(path), exist_ok=True)

        with open(path, 'w') as file:
            if content:
                file.write(content)

        # Initialize history for the file
        self._file_history[path] = []

    async def replace_string(self, path: str, old_str: str, new_str: str) -> None:
        """
        Replace all occurrences of a string in a file.
        """
        if not os.path.exists(path):
            raise FileNotFoundError(f"File not found: {path}")

        # Read current content
        with open(path, 'r') as file:
            content = file.read()

        # Save current content to history
        if path not in self._file_history:
            self._file_history[path] = []
        self._file_history[path].append(content)

        # Replace string and write back
        new_content = content.replace(old_str, new_str)
        with open(path, 'w') as file:
            file.write(new_content)

    async def insert_text(self, path: str, text: str, insert_line: Optional[int] = None) -> None:
        """
        Insert text at a specific line in the file.
        If insert_line is None, append to the end of the file.
        """
        if not os.path.exists(path):
            raise FileNotFoundError(f"File not found: {path}")

        # Read current content
        with open(path, 'r') as file:
            lines = file.readlines()

        # Save current content to history
        if path not in self._file_history:
            self._file_history[path] = []
        self._file_history[path].append("".join(lines))

        # Prepare text for insertion
        if not text.endswith('\n'):
            text += '\n'

        # Insert text at specified line or append
        if insert_line is None:
            insert_line = len(lines)
        else:
            insert_line = max(0, min(len(lines), insert_line - 1))  # Convert to 0-based index
        
        lines.insert(insert_line, text)

        # Write back to file
        with open(path, 'w') as file:
            file.writelines(lines)

    async def undo_last_edit(self, path: str) -> None:
        """
        Undo the last edit made to a file.
        """
        if not os.path.exists(path):
            raise FileNotFoundError(f"File not found: {path}")

        if path not in self._file_history or not self._file_history[path]:
            raise ValueError(f"No history available for file: {path}")

        # Get the last version and remove it from history
        previous_content = self._file_history[path].pop()

        # Write the previous version back to file
        with open(path, 'w') as file:
            file.write(previous_content) 