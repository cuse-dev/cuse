from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from datetime import datetime
from services import services

router = APIRouter(prefix="/filesystem", tags=["filesystem"])

class FileInfo(BaseModel):
    name: str = Field(..., description="File or directory name", example="document.txt")
    path: str = Field(..., description="Full path to the file or directory", example="/home/user/documents/document.txt")
    type: str = Field(..., description="Type of entry: 'file' or 'directory'", example="file")
    size: int = Field(..., description="Size in bytes", example=1024)
    modified_time: datetime = Field(..., description="Last modification time", example="2024-03-10T12:34:56")
    is_hidden: bool = Field(..., description="Whether the file/directory is hidden", example=False)
    extension: Optional[str] = Field(None, description="File extension if applicable", example="txt")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "name": "document.txt",
                "path": "/home/user/documents/document.txt",
                "type": "file",
                "size": 1024,
                "modified_time": "2024-03-10T12:34:56",
                "is_hidden": False,
                "extension": "txt"
            }
        }

class ListDirectoryParams(BaseModel):
    path: str = Field(..., description="Directory path to list", example="/home/user/documents")
    include_hidden: bool = Field(False, description="Whether to include hidden files/directories", example=False)
    pattern: Optional[str] = Field(None, description="Glob pattern to filter results", example="*.txt")

    class Config:
        json_schema_extra = {
            "example": {
                "path": "/home/user/documents",
                "include_hidden": False,
                "pattern": "*.txt"
            }
        }

class TreeParams(BaseModel):
    path: str = Field(..., description="Root directory path", example="/home/user/project")
    max_depth: int = Field(3, description="Maximum depth to traverse", example=3, ge=1)
    include_hidden: bool = Field(False, description="Whether to include hidden files/directories", example=False)
    pattern: Optional[str] = Field(None, description="Glob pattern to filter results", example="*.py")

    class Config:
        json_schema_extra = {
            "example": {
                "path": "/home/user/project",
                "max_depth": 3,
                "include_hidden": False,
                "pattern": "*.py"
            }
        }

class SearchParams(BaseModel):
    root_path: str = Field(..., description="Root directory to start search from", example="/home/user")
    pattern: str = Field(..., description="Glob pattern to search for", example="*.txt")
    max_results: int = Field(100, description="Maximum number of results to return", example=100, gt=0)
    include_hidden: bool = Field(False, description="Whether to include hidden files/directories", example=False)

    class Config:
        json_schema_extra = {
            "example": {
                "root_path": "/home/user",
                "pattern": "*.txt",
                "max_results": 100,
                "include_hidden": False
            }
        }

@router.post(
    "/list",
    summary="List Directory Contents",
    description="Lists the contents of a directory with optional filtering.",
    response_model=List[FileInfo],
    responses={
        200: {
            "description": "Successfully listed directory contents",
            "content": {
                "application/json": {
                    "example": [{
                        "name": "document.txt",
                        "path": "/home/user/documents/document.txt",
                        "type": "file",
                        "size": 1024,
                        "modified_time": "2024-03-10T12:34:56",
                        "is_hidden": False,
                        "extension": "txt"
                    }]
                }
            }
        },
        404: {"description": "Directory not found"},
        400: {"description": "Not a directory"},
        403: {"description": "Permission denied"},
        500: {"description": "Internal server error"}
    },
    operation_id="listDirectory"
)
async def list_directory(params: ListDirectoryParams) -> List[FileInfo]:
    """
    List contents of a directory.
    
    - Returns files and subdirectories in the specified path
    - Can filter by glob pattern (e.g., *.txt)
    - Option to include hidden files
    - Returns detailed information about each entry
    """
    try:
        return await services.filesystem.list_directory(
            params.path,
            params.include_hidden,
            params.pattern
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except NotADirectoryError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/tree",
    summary="Get Directory Tree",
    description="Generates a tree representation of a directory structure.",
    response_model=Dict,
    responses={
        200: {
            "description": "Successfully generated directory tree",
            "content": {
                "application/json": {
                    "example": {
                        "name": "project",
                        "type": "directory",
                        "children": [
                            {
                                "name": "src",
                                "type": "directory",
                                "children": [
                                    {
                                        "name": "main.py",
                                        "type": "file"
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        },
        404: {"description": "Directory not found"},
        403: {"description": "Permission denied"},
        500: {"description": "Internal server error"}
    },
    operation_id="getDirectoryTree"
)
async def get_tree(params: TreeParams) -> Dict:
    """
    Get a tree representation of a directory.
    
    - Recursively traverses directory structure
    - Limited by max_depth parameter
    - Can filter by glob pattern
    - Option to include hidden files
    """
    try:
        return await services.filesystem.get_tree(
            params.path,
            params.max_depth,
            params.include_hidden,
            params.pattern
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/search",
    summary="Search Files",
    description="Searches for files matching a pattern in a directory tree.",
    response_model=List[FileInfo],
    responses={
        200: {
            "description": "Successfully searched for files",
            "content": {
                "application/json": {
                    "example": [{
                        "name": "document.txt",
                        "path": "/home/user/documents/document.txt",
                        "type": "file",
                        "size": 1024,
                        "modified_time": "2024-03-10T12:34:56",
                        "is_hidden": False,
                        "extension": "txt"
                    }]
                }
            }
        },
        404: {"description": "Root directory not found"},
        403: {"description": "Permission denied"},
        500: {"description": "Internal server error"}
    },
    operation_id="searchFiles"
)
async def search_files(params: SearchParams) -> List[FileInfo]:
    """
    Search for files matching a pattern.
    
    - Recursively searches from root_path
    - Uses glob patterns for matching
    - Limited by max_results parameter
    - Option to include hidden files
    """
    try:
        return await services.filesystem.search_files(
            params.root_path,
            params.pattern,
            params.max_results,
            params.include_hidden
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/info/{path:path}",
    summary="Get Path Info",
    description="Gets detailed information about a file or directory.",
    response_model=FileInfo,
    responses={
        200: {
            "description": "Successfully retrieved path information",
            "content": {
                "application/json": {
                    "example": {
                        "name": "document.txt",
                        "path": "/home/user/documents/document.txt",
                        "type": "file",
                        "size": 1024,
                        "modified_time": "2024-03-10T12:34:56",
                        "is_hidden": False,
                        "extension": "txt"
                    }
                }
            }
        },
        404: {"description": "Path not found"},
        403: {"description": "Permission denied"},
        500: {"description": "Internal server error"}
    },
    operation_id="getPathInfo"
)
async def get_path_info(path: str) -> FileInfo:
    """
    Get detailed information about a file or directory.
    
    - Works with both files and directories
    - Returns size, modification time, type, etc.
    - Detects if path is hidden
    - Extracts file extension if applicable
    """
    try:
        return await services.filesystem.get_path_info(path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))