import redis
from rq import Worker, Queue, Connection
import os
import sys
from pathlib import Path
import logging
import importlib.util

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Add the current directory to Python path
current_dir = Path(__file__).parent.resolve()
logger.debug(f"Adding to Python path: {current_dir}")
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

def import_task_module():
    """Import the tasks module and register its functions."""
    try:
        # Get the full path to tasks.py
        tasks_path = current_dir / 'tasks.py'
        logger.debug(f"Importing tasks from: {tasks_path}")
        
        # Import the module using importlib
        spec = importlib.util.spec_from_file_location("tasks", tasks_path)
        if spec is None:
            raise ImportError(f"Could not load spec for tasks module from {tasks_path}")
            
        module = importlib.util.module_from_spec(spec)
        if spec.loader is None:
            raise ImportError("Spec loader is None")
            
        spec.loader.exec_module(module)
        
        # Register tasks in the global namespace
        global long_calculation, echo
        long_calculation = module.long_calculation
        echo = module.echo
        
        logger.debug("Successfully imported tasks")
        logger.debug(f"long_calculation module: {long_calculation.__module__}")
        logger.debug(f"echo module: {echo.__module__}")
        
        return module
    except Exception as e:
        logger.error(f"Failed to import tasks: {e}", exc_info=True)
        raise

# Import tasks module
tasks_module = import_task_module()

# Configure Redis connection
redis_conn = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    password=os.getenv('REDIS_PASSWORD', None),
    db=0
)

# Define which queues this worker should listen to
listen = ['default']

if __name__ == '__main__':
    logger.info("Starting worker...")
    try:
        # Start worker
        with Connection(redis_conn):
            worker = Worker(list(map(Queue, listen)))
            logger.info(f"Worker listening on queues: {listen}")
            worker.work(logging_level=logging.DEBUG)
    except Exception as e:
        logger.error(f"Worker failed: {e}", exc_info=True)
        raise 