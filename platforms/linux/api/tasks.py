__name__ = 'tasks'  # Ensure consistent module name

import time
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

def long_calculation(seconds: int = 5, fail: bool = False) -> Dict[str, Any]:
    """
    Example task that simulates a long calculation.
    
    Args:
        seconds: How long to sleep
        fail: If True, raises an exception
    
    Returns:
        Dictionary with calculation results
    """
    logger.info(f"Starting long calculation: seconds={seconds}, fail={fail}")
    try:
        # Simulate work
        time.sleep(seconds)
        
        if fail:
            raise ValueError("Task failed as requested")
            
        result = {
            "calculation": "completed",
            "time_taken": seconds,
            "result": 42
        }
        logger.info(f"Calculation completed: {result}")
        return result
    except Exception as e:
        logger.error(f"Calculation failed: {e}", exc_info=True)
        raise

def echo(message: str) -> Dict[str, Any]:
    """
    Simple echo task that returns the input message.
    
    Args:
        message: Message to echo back
        
    Returns:
        Dictionary with the message
    """
    logger.info(f"Echo task received message: {message}")
    result = {
        "message": message,
        "timestamp": time.time()
    }
    logger.info(f"Echo task completed: {result}")
    return result 