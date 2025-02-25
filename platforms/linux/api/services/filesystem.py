import os
import fnmatch
from typing import List, Optional, Dict
from dataclasses import dataclass
from datetime import datetime
import pathlib

@dataclass
class FileInfo:
    """Information about a file or directory."""
    name: str
    path: str
    type: str  # 'file' or 'directory'
    size: int
    modified_time: datetime
    is_hidden: bool
    extension: Optional[str] = None

class FilesystemService:
    def __init__(self):
        self.home_dir = os.path.expanduser("~")

    def _get_file_info(self, path: str) -> FileInfo:
        """Get detailed information about a file or directory."""
        stat = os.stat(path)
        name = os.path.basename(path)
        return FileInfo(
            name=name,
            path=path,
            type='directory' if os.path.isdir(path) else 'file',
            size=stat.st_size,
            modified_time=datetime.fromtimestamp(stat.st_mtime),
            is_hidden=name.startswith('.'),
            extension=os.path.splitext(name)[1][1:] if os.path.splitext(name)[1] else None
        )

    async def list_directory(
        self,
        path: str,
        include_hidden: bool = False,
        pattern: Optional[str] = None
    ) -> List[FileInfo]:
        """
        List contents of a directory.
        
        Args:
            path: Directory path to list
            include_hidden: Whether to include hidden files/directories
            pattern: Optional glob pattern to filter results (e.g. "*.py")
        """
        path = os.path.expanduser(path)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Path not found: {path}")
        if not os.path.isdir(path):
            raise NotADirectoryError(f"Not a directory: {path}")

        entries = []
        for entry in os.scandir(path):
            # Skip hidden files if not requested
            if not include_hidden and entry.name.startswith('.'):
                continue
                
            # Apply pattern filter if specified
            if pattern and not fnmatch.fnmatch(entry.name, pattern):
                continue
                
            entries.append(self._get_file_info(entry.path))
            
        return sorted(entries, key=lambda x: (x.type != 'directory', x.name.lower()))

    async def get_tree(
        self,
        path: str,
        max_depth: int = 3,
        include_hidden: bool = False,
        pattern: Optional[str] = None
    ) -> Dict:
        """
        Get a tree representation of a directory.
        
        Args:
            path: Root path to start from
            max_depth: Maximum depth to traverse
            include_hidden: Whether to include hidden files/directories
            pattern: Optional glob pattern to filter results
        """
        path = os.path.expanduser(path)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Path not found: {path}")

        def build_tree(current_path: str, current_depth: int) -> Dict:
            if current_depth > max_depth:
                return {"name": os.path.basename(current_path), "type": "directory", "truncated": True}

            info = self._get_file_info(current_path)
            result = {
                "name": info.name,
                "type": info.type,
                "size": info.size,
                "modified": info.modified_time.isoformat()
            }

            if info.type == 'directory':
                try:
                    children = []
                    for entry in os.scandir(current_path):
                        # Skip hidden files if not requested
                        if not include_hidden and entry.name.startswith('.'):
                            continue
                            
                        # Apply pattern filter if specified
                        if pattern and not fnmatch.fnmatch(entry.name, pattern):
                            continue
                            
                        children.append(build_tree(entry.path, current_depth + 1))
                    result["children"] = sorted(
                        children,
                        key=lambda x: (x["type"] != "directory", x["name"].lower())
                    )
                except PermissionError:
                    result["error"] = "Permission denied"

            return result

        return build_tree(path, 0)

    async def search_files(
        self,
        root_path: str,
        pattern: str,
        max_results: int = 100,
        include_hidden: bool = False
    ) -> List[FileInfo]:
        """
        Search for files matching a pattern.
        
        Args:
            root_path: Directory to start search from
            pattern: Glob pattern to match (e.g. "*.py", "**/*.txt")
            max_results: Maximum number of results to return
            include_hidden: Whether to include hidden files/directories
        """
        root_path = os.path.expanduser(root_path)
        if not os.path.exists(root_path):
            raise FileNotFoundError(f"Path not found: {root_path}")

        results = []
        for path in pathlib.Path(root_path).rglob(pattern):
            if len(results) >= max_results:
                break
                
            # Skip hidden files if not requested
            if not include_hidden and any(part.startswith('.') for part in path.parts):
                continue
                
            results.append(self._get_file_info(str(path)))
            
        return sorted(results, key=lambda x: (x.type != 'directory', x.name.lower()))

    async def get_path_info(self, path: str) -> FileInfo:
        """Get detailed information about a file or directory."""
        path = os.path.expanduser(path)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Path not found: {path}")
        return self._get_file_info(path)