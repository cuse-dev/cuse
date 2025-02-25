from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field
from services import services

router = APIRouter(prefix="/editor", tags=["editor"])

class ViewParams(BaseModel):
    path: str = Field(..., description="File path to view", example="/path/to/file.txt")
    view_range: Optional[List[int]] = Field(None, description="Line range to view [start, end]", example=[1, 10])

    class Config:
        json_schema_extra = {
            "example": {
                "path": "/path/to/file.txt",
                "view_range": [1, 10]
            }
        }

class CreateParams(BaseModel):
    path: str = Field(..., description="File path to create", example="/path/to/newfile.txt")
    file_text: Optional[str] = Field(None, description="Initial file contents", example="Hello, World!")

    class Config:
        json_schema_extra = {
            "example": {
                "path": "/path/to/newfile.txt",
                "file_text": "Hello, World!"
            }
        }

class StrReplaceParams(BaseModel):
    path: str = Field(..., description="File path to modify", example="/path/to/file.txt")
    old_str: str = Field(..., description="String to replace", example="old text")
    new_str: str = Field(..., description="Replacement string", example="new text")

    class Config:
        json_schema_extra = {
            "example": {
                "path": "/path/to/file.txt",
                "old_str": "old text",
                "new_str": "new text"
            }
        }

class InsertParams(BaseModel):
    path: str = Field(..., description="File path to modify", example="/path/to/file.txt")
    text: str = Field(..., description="Text to insert", example="New line of text")
    insert_line: Optional[int] = Field(None, description="Line number to insert at (1-based)", example=5)

    class Config:
        json_schema_extra = {
            "example": {
                "path": "/path/to/file.txt",
                "text": "New line of text",
                "insert_line": 5
            }
        }

class UndoEditParams(BaseModel):
    path: str = Field(..., description="File path to undo changes", example="/path/to/file.txt")

    class Config:
        json_schema_extra = {
            "example": {
                "path": "/path/to/file.txt"
            }
        }

@router.post(
    "/view",
    summary="View File Contents",
    description="Retrieves the contents of a file, optionally within a specified line range.",
    response_model=str,
    responses={
        200: {
            "description": "Successfully retrieved file contents",
            "content": {
                "application/json": {
                    "example": "Line 1\nLine 2\nLine 3"
                }
            }
        },
        404: {"description": "File not found"},
        500: {"description": "Internal server error"}
    },
    operation_id="viewFile"
)
async def view(params: ViewParams) -> str:
    """
    View the contents of a file.
    
    - Returns the entire file if no range specified
    - Can return a subset of lines using view_range
    - Line numbers are 1-based
    - Raises 404 if file not found
    """
    try:
        view_range_tuple = tuple(params.view_range) if params.view_range else None
        return await services.editor.view_file(params.path, view_range_tuple)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/create",
    summary="Create New File",
    description="Creates a new file with optional initial content.",
    response_description="Successfully created file",
    status_code=204,
    responses={
        204: {"description": "Successfully created file"},
        400: {"description": "File already exists"},
        500: {"description": "Internal server error"}
    },
    operation_id="createFile"
)
async def create(params: CreateParams) -> None:
    """
    Create a new file.
    
    - Creates an empty file if no content provided
    - Can initialize file with content
    - Creates parent directories if needed
    - Raises 400 if file already exists
    """
    try:
        await services.editor.create_file(params.path, params.file_text)
    except FileExistsError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/str-replace",
    summary="Replace String",
    description="Replaces all occurrences of a string in a file with a new string.",
    response_description="Successfully replaced string",
    status_code=204,
    responses={
        204: {"description": "Successfully replaced string"},
        404: {"description": "File not found"},
        500: {"description": "Internal server error"}
    },
    operation_id="replaceString"
)
async def str_replace(params: StrReplaceParams) -> None:
    """
    Replace all occurrences of a string in a file.
    
    - Case-sensitive string replacement
    - Replaces all occurrences in the file
    - No regex support, exact string matching only
    - Raises 404 if file not found
    """
    try:
        await services.editor.replace_string(params.path, params.old_str, params.new_str)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/insert",
    summary="Insert Text",
    description="Inserts text at a specified line number in a file.",
    response_description="Successfully inserted text",
    status_code=204,
    responses={
        204: {"description": "Successfully inserted text"},
        404: {"description": "File not found"},
        500: {"description": "Internal server error"}
    },
    operation_id="insertText"
)
async def insert(params: InsertParams) -> None:
    """
    Insert text at a specific line in a file.
    
    - Line numbers are 1-based
    - Appends to end if no line number specified
    - Creates a new line if needed
    - Raises 404 if file not found
    """
    try:
        await services.editor.insert_text(params.path, params.text, params.insert_line)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/undo-edit",
    summary="Undo Last Edit",
    description="Reverts the last edit made to a file.",
    response_description="Successfully undid last edit",
    status_code=204,
    responses={
        204: {"description": "Successfully undid last edit"},
        404: {"description": "File not found or no edits to undo"},
        500: {"description": "Internal server error"}
    },
    operation_id="undoEdit"
)
async def undo_edit(params: UndoEditParams) -> None:
    """
    Undo the last edit made to a file.
    
    - Reverts the most recent change
    - Only one level of undo supported
    - Includes changes from str-replace and insert
    - Raises 404 if no edits to undo
    """
    try:
        await services.editor.undo_last_edit(params.path)
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
