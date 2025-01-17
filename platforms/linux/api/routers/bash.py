import subprocess
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import time
import psutil
import signal
from typing import Optional, Dict

router = APIRouter(prefix="/bash", tags=["bash"])

# Store background processes
background_processes: Dict[int, subprocess.Popen] = {}

class CommandParams(BaseModel):
    command: str

class CommandResponse(BaseModel):
    output: Optional[str] = None
    process_id: Optional[int] = None
    status: str = "completed"  # "completed" or "background"

class RestartParams(BaseModel):
    pass

class ProcessInfo(BaseModel):
    pid: int
    command: str
    status: str
    cpu_percent: Optional[float] = None
    memory_percent: Optional[float] = None
    create_time: Optional[float] = None

class ProcessListResponse(BaseModel):
    processes: list[ProcessInfo]

@router.post("/command", response_model=CommandResponse)
async def command(params: CommandParams) -> CommandResponse:
    try:
        # Start process with Popen to have more control
        process = subprocess.Popen(
            params.command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=os.path.expanduser("~"),
            preexec_fn=os.setsid
        )
        
        # Wait for up to 15 seconds
        try:
            stdout, stderr = process.communicate(timeout=15)
            if process.returncode != 0:
                raise HTTPException(status_code=500, detail=f"Command failed: {stderr}")
            return CommandResponse(output=stdout, status="completed")
            
        except subprocess.TimeoutExpired:
            # Process is still running after timeout
            # Don't terminate it, move it to background
            background_processes[process.pid] = process
            return CommandResponse(
                process_id=process.pid,
                status="background"
            )
            
    except Exception as e:
        # Clean up process if it exists
        if 'process' in locals():
            try:
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/process/{pid}/output")
async def get_process_output(pid: int) -> CommandResponse:
    try:
        process = background_processes.get(pid)
        if not process:
            raise HTTPException(status_code=404, detail=f"Process {pid} not found")
            
        # Check if process is still running
        if process.poll() is None:
            # Process still running, return what we have so far
            output = process.stdout.read() if process.stdout else ""
            return CommandResponse(
                output=output,
                process_id=pid,
                status="background"
            )
        else:
            # Process completed, get all output and remove from tracking
            stdout, stderr = process.communicate()
            del background_processes[pid]
            
            if process.returncode != 0:
                raise HTTPException(status_code=500, detail=f"Command failed: {stderr}")
                
            return CommandResponse(
                output=stdout,
                status="completed"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/process/{pid}")
async def terminate_process(pid: int) -> None:
    try:
        process = background_processes.get(pid)
        if not process:
            raise HTTPException(status_code=404, detail=f"Process {pid} not found")
            
        # Terminate the entire process group
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        del background_processes[pid]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/restart")
async def restart(params: RestartParams) -> None:
    try:
        subprocess.run(["sudo", "reboot"], check=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to restart: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/processes/managed", response_model=ProcessListResponse)
async def list_managed_processes() -> ProcessListResponse:
    processes = []
    for pid, (process, _, _) in background_processes.items():
        try:
            if process.poll() is None:  # Still running
                ps_process = psutil.Process(pid)
                processes.append(ProcessInfo(
                    pid=pid,
                    command=ps_process.cmdline()[-1] if ps_process.cmdline() else "Unknown",
                    status="running",
                    cpu_percent=ps_process.cpu_percent(),
                    memory_percent=ps_process.memory_percent(),
                    create_time=ps_process.create_time()
                ))
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            # Clean up if process no longer exists
            del background_processes[pid]
    return ProcessListResponse(processes=processes)