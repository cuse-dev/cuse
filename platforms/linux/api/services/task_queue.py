import redis
from rq import Queue, job
from typing import Any, Optional, Dict
from datetime import timedelta
import json
import os
import importlib
import logging

logger = logging.getLogger(__name__)

class TaskQueueService:
    def __init__(self):
        # Connect to Redis
        self.redis_conn = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            password=os.getenv('REDIS_PASSWORD', None),  # In case Redis is password protected
            db=0
        )
        # Create RQ queue
        self.queue = Queue(connection=self.redis_conn)

    def _serialize_task(self, task_func: callable) -> str:
        """Convert a function to a string that RQ can deserialize."""
        module_name = task_func.__module__
        if module_name == '__main__':
            # If the function is from __main__, use the actual module name
            module_name = 'tasks'
        func_name = task_func.__name__
        task_path = f"{module_name}.{func_name}"
        logger.debug(f"Serializing task: {task_path}")
        return task_path

    async def enqueue_and_wait(
        self,
        task_func: callable,
        *args,
        timeout: int = 60,
        **kwargs
    ) -> Any:
        """
        Enqueue a task and wait for its result.
        
        Args:
            task_func: Function to execute
            *args: Positional arguments for the function
            timeout: Maximum time to wait for result in seconds
            **kwargs: Keyword arguments for the function
            
        Returns:
            The result of the task
        """
        try:
            # Serialize the task function
            task_path = self._serialize_task(task_func)
            logger.debug(f"Enqueueing task: {task_path}")
            logger.debug(f"Args: {args}")
            logger.debug(f"Kwargs: {kwargs}")
            
            # Enqueue the task
            job = self.queue.enqueue(
                task_path,
                args=args,
                kwargs=kwargs,
                result_ttl=300  # Keep result for 5 minutes
            )
            
            logger.debug(f"Job ID: {job.id}")
            # Wait for result
            return job.result(timeout=timeout)
        except Exception as e:
            logger.error(f"Error enqueueing task: {e}", exc_info=True)
            raise

    async def enqueue(
        self,
        task_func: callable,
        *args,
        **kwargs
    ) -> str:
        """
        Enqueue a task and return its ID immediately.
        
        Args:
            task_func: Function to execute
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function
            
        Returns:
            Task ID that can be used to fetch results later
        """
        try:
            # Serialize the task function
            task_path = self._serialize_task(task_func)
            logger.debug(f"Enqueueing task: {task_path}")
            logger.debug(f"Args: {args}")
            logger.debug(f"Kwargs: {kwargs}")
            
            # Enqueue the task
            job = self.queue.enqueue(
                task_path,
                args=args,
                kwargs=kwargs,
                result_ttl=300  # Keep result for 5 minutes
            )
            logger.debug(f"Job ID: {job.id}")
            return job.id
        except Exception as e:
            logger.error(f"Error enqueueing task: {e}", exc_info=True)
            raise

    async def get_result(self, task_id: str) -> Dict[str, Any]:
        """
        Get the result of a task by its ID.
        
        Args:
            task_id: The task ID returned by enqueue()
            
        Returns:
            Dict containing task status and result/error if available
        """
        job = self.queue.fetch_job(task_id)
        
        if job is None:
            return {
                "status": "not_found",
                "result": None,
                "error": "Task not found"
            }

        if job.is_failed:
            return {
                "status": "failed",
                "result": None,
                "error": str(job.exc_info)
            }

        if job.is_finished:
            return {
                "status": "completed",
                "result": job.result,
                "error": None
            }

        return {
            "status": "pending",
            "result": None,
            "error": None
        } 