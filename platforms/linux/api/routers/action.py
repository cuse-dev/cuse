from fastapi import APIRouter, HTTPException
from services import services
from pydantic import BaseModel
from typing import Any, List
from services.action import Action

router = APIRouter(prefix="/action", tags=["action"])

class RunActionsParams(BaseModel):
    actions: List[Action]

    class Config:
        json_schema_extra = {
            "example": {
                "actions": [{"action": "mouse_move", "x": 100, "y": 200}]
            }
        }
@router.post(
    "/run",
    summary="Run Actions",
    description="Execute a sequence of actions like mouse movements and clicks",
    responses={
        200: {"description": "Actions executed successfully"},
        500: {"description": "Internal server error"}
    },
    operation_id="runActions"
)
async def run_actions(params: RunActionsParams) -> List[Any]:
    """
    Execute a sequence of actions.
    """
    try:
        return await services.action.run(params.actions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
