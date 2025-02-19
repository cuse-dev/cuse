from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, Optional
from services import services
from tasks import long_calculation, echo

router = APIRouter(prefix="/task", tags=["task"])

class TaskResult(BaseModel):
    status: str
    result: Optional[Any] = None
    error: Optional[str] = None

@router.post(
    "/run_and_wait/{task_name}",
    summary="Run Task and Wait",
    description="Executes a task and waits for the result",
    response_model=TaskResult,
    operation_id="runTaskAndWait"
)
async def run_and_wait(task_name: str, args: Dict[str, Any] = {}) -> TaskResult:
    """
    Execute a task and wait for its completion.
    
    Args:
        task_name: Name of the task to execute
        args: Arguments for the task
    """
    try:
        # Get task function based on name
        task_func = get_task_function(task_name)
        
        # Execute task and wait for result
        result = await services.task_queue.enqueue_and_wait(
            task_func,
            timeout=60,
            **args  # Pass args as kwargs
        )
        
        return TaskResult(
            status="completed",
            result=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/run/{task_name}",
    summary="Run Task",
    description="Starts a task and returns its ID immediately",
    response_model=Dict[str, str],
    operation_id="runTask"
)
async def run_task(task_name: str, args: Dict[str, Any] = {}) -> Dict[str, str]:
    """
    Start a task execution and return its ID immediately.
    
    Args:
        task_name: Name of the task to execute
        args: Arguments for the task
    """
    try:
        # Get task function based on name
        task_func = get_task_function(task_name)
        
        # Enqueue task
        task_id = await services.task_queue.enqueue(
            task_func,
            **args  # Pass args as kwargs
        )
        
        return {"task_id": task_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/status/{task_id}",
    summary="Get Task Status",
    description="Get the status and result of a task",
    response_model=TaskResult,
    operation_id="getTaskStatus"
)
async def get_task_status(task_id: str) -> TaskResult:
    """
    Get the current status and result of a task.
    
    Args:
        task_id: ID of the task to check
    """
    try:
        result = await services.task_queue.get_result(task_id)
        return TaskResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_task_function(task_name: str) -> callable:
    """Map task names to actual functions."""
    tasks = {
        "long_calculation": long_calculation,
        "echo": echo
    }
    
    if task_name not in tasks:
        raise ValueError(f"Unknown task: {task_name}")
        
    return tasks[task_name] 