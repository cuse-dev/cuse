from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from services import services

router = APIRouter(prefix="/bash", tags=["bash"])

class ProcessInfo(BaseModel):
    pid: int = Field(..., description="Process ID", example=1234)
    command: str = Field(..., description="Command that was executed", example="ls -la")
    status: str = Field(..., description="Current status of the process", example="running")
    output: Optional[str] = Field(None, description="Process output if available", example="total 20\ndrwxr-xr-x  3 user  group   96 Mar 10 12:34 .")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "pid": 1234,
                "command": "ls -la",
                "status": "running",
                "output": "total 20\ndrwxr-xr-x  3 user  group   96 Mar 10 12:34 ."
            }
        }

class CommandParams(BaseModel):
    command: str = Field(..., description="Shell command to execute", example="ls -la")

    class Config:
        json_schema_extra = {
            "example": {
                "command": "ls -la"
            }
        }

class CommandResponse(BaseModel):
    output: Optional[str] = Field(None, description="Command output if available", example="total 20\ndrwxr-xr-x  3 user  group   96 Mar 10 12:34 .")
    process_id: Optional[int] = Field(None, description="Process ID if running in background", example=1234)
    status: str = Field("completed", description="Command status: 'completed' or 'background'", example="completed")

    class Config:
        json_schema_extra = {
            "example": {
                "output": "total 20\ndrwxr-xr-x  3 user  group   96 Mar 10 12:34 .",
                "process_id": None,
                "status": "completed"
            }
        }

class RestartParams(BaseModel):
    pass

@router.post(
    "/command",
    summary="Execute Shell Command",
    description="Executes a shell command and returns its output or background process information.",
    response_model=CommandResponse,
    responses={
        200: {
            "description": "Successfully executed command",
            "content": {
                "application/json": {
                    "example": {
                        "output": "total 20\ndrwxr-xr-x  3 user  group   96 Mar 10 12:34 .",
                        "process_id": None,
                        "status": "completed"
                    }
                }
            }
        },
        500: {"description": "Internal server error"}
    },
    operation_id="executeCommand"
)
async def command(params: CommandParams) -> CommandResponse:
    """
    Execute a shell command.
    
    - Commands can run synchronously or asynchronously
    - For synchronous commands, returns output directly
    - For background commands, returns process ID for monitoring
    - Supports all standard shell commands and operators
    """
    try:
        output, process_id, status = await services.bash.execute_command(params.command)
        return CommandResponse(
            output=output,
            process_id=process_id,
            status=status
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/process/{pid}/output",
    summary="Get Process Output",
    description="Retrieves the output of a background process by its ID.",
    response_model=CommandResponse,
    responses={
        200: {
            "description": "Successfully retrieved process output",
            "content": {
                "application/json": {
                    "example": {
                        "output": "Processing...\n50% complete",
                        "process_id": 1234,
                        "status": "background"
                    }
                }
            }
        },
        404: {"description": "Process not found"},
        500: {"description": "Internal server error"}
    },
    operation_id="getProcessOutput"
)
async def get_process_output(pid: int) -> CommandResponse:
    """
    Get the output of a background process.
    
    - Returns current output buffer and process status
    - For running processes, returns partial output
    - For completed processes, returns full output
    - Raises 404 if process not found
    """
    try:
        output, status = await services.bash.get_process_output(pid)
        return CommandResponse(
            output=output,
            process_id=pid if status == "background" else None,
            status=status
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete(
    "/process/{pid}",
    summary="Terminate Process",
    description="Terminates a background process by its ID.",
    response_description="Successfully terminated process",
    status_code=204,
    responses={
        204: {"description": "Successfully terminated process"},
        404: {"description": "Process not found"},
        500: {"description": "Internal server error"}
    },
    operation_id="terminateProcess"
)
async def terminate_process(pid: int) -> None:
    """
    Terminate a background process.
    
    - Sends SIGTERM signal to the process
    - Waits for process to exit gracefully
    - Force kills if process doesn't respond
    - Raises 404 if process not found
    """
    try:
        await services.bash.terminate_process(pid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/restart",
    summary="Restart System",
    description="Restarts the system services.",
    response_description="Successfully initiated restart",
    status_code=204,
    responses={
        204: {"description": "Successfully initiated restart"},
        500: {"description": "Internal server error"}
    },
    operation_id="restartSystem"
)
async def restart(params: RestartParams) -> None:
    """
    Restart the system services.
    
    - Gracefully stops all running services
    - Cleans up resources and connections
    - Reinitializes system components
    - May take several seconds to complete
    """
    try:
        await services.bash.restart_system()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/processes/managed",
    summary="List Managed Processes",
    description="Lists all background processes managed by the system.",
    response_model=List[ProcessInfo],
    responses={
        200: {
            "description": "Successfully retrieved process list",
            "content": {
                "application/json": {
                    "example": [{
                        "pid": 1234,
                        "command": "long-running-task",
                        "status": "running",
                        "output": "Processing...\n50% complete"
                    }]
                }
            }
        },
        500: {"description": "Internal server error"}
    },
    operation_id="listManagedProcesses"
)
async def list_managed_processes() -> List[ProcessInfo]:
    """
    List all managed background processes.
    
    - Returns information about all tracked processes
    - Includes process ID, command, status, and output
    - Useful for monitoring long-running operations
    - Can be used to cleanup stale processes
    """
    try:
        processes = await services.bash.list_managed_processes()
        return [ProcessInfo.model_validate(p) for p in processes]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))