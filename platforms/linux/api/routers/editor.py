from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import os

router = APIRouter(prefix="/editor", tags=["editor"])

class ViewParams(BaseModel):
    path: str
    view_range: Optional[List[int]] = None

class CreateParams(BaseModel):
    path: str
    file_text: Optional[str] = None

class StrReplaceParams(BaseModel):
    path: str
    old_str: str
    new_str: str

class InsertParams(BaseModel):
    path: str
    text: str
    insert_line: Optional[int] = None

class UndoEditParams(BaseModel):
    path: str

@router.post("/view")
async def view(params: ViewParams) -> str:
    try:
        with open(params.path, 'r') as file:
            lines = file.readlines()
        if params.view_range and len(params.view_range) == 2:
            start, end = params.view_range
            start = max(0, start)
            end = min(len(lines), end)
            lines = lines[start:end]
        return "".join(lines)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {params.path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create")
async def create(params: CreateParams) -> None:
    try:
        os.makedirs(os.path.dirname(params.path), exist_ok=True)
        with open(params.path, 'w') as file:
            file.write(params.file_text or '')
    except FileExistsError:
        raise HTTPException(status_code=400, detail=f"File already exists: {params.path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/str-replace")
async def str_replace(params: StrReplaceParams) -> None:
    try:
        with open(params.path, 'r') as file:
            content = file.read()
        new_content = content.replace(params.old_str, params.new_str)
        with open(params.path, 'w') as file:
            file.write(new_content)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {params.path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/insert")
async def insert(params: InsertParams) -> None:
    try:
        with open(params.path, 'r') as file:
            lines = file.readlines()
        if params.insert_line is None:
            params.insert_line = len(lines)
        params.insert_line = max(0, min(len(lines), params.insert_line))
        if not params.text.endswith('\n'):
            params.text += '\n'
        lines.insert(params.insert_line, params.text)
        with open(params.path, 'w') as file:
            file.writelines(lines)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {params.path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/undo-edit")
async def undo_edit(params: UndoEditParams) -> None:
    try:
        raise Exception("Not implemented")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
