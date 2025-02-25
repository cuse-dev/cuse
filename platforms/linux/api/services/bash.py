import os
import signal
import subprocess
import psutil
from typing import Dict, List, Optional, Tuple

class ProcessInfo:
    def __init__(
        self,
        pid: int,
        command: str,
        status: str,
        cpu_percent: Optional[float] = None,
        memory_percent: Optional[float] = None,
        create_time: Optional[float] = None
    ):
        self.pid = pid
        self.command = command
        self.status = status
        self.cpu_percent = cpu_percent
        self.memory_percent = memory_percent
        self.create_time = create_time

class BashService:
    def __init__(self):
        self._background_processes: Dict[int, subprocess.Popen] = {}

    async def execute_command(self, command: str, timeout: int = 15) -> Tuple[Optional[str], Optional[int], str]:
        """
        Execute a bash command with timeout.
        Returns: (output, process_id, status)
        """
        try:
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=os.path.expanduser("~"),
                preexec_fn=os.setsid
            )

            try:
                stdout, stderr = process.communicate(timeout=timeout)
                if process.returncode != 0:
                    raise Exception(f"Command failed: {stderr}")
                return stdout, None, "completed"

            except subprocess.TimeoutExpired:
                # Process is still running after timeout
                self._background_processes[process.pid] = process
                return None, process.pid, "background"

        except Exception as e:
            # Clean up process if it exists
            if 'process' in locals():
                try:
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                except (ProcessLookupError, OSError):
                    pass
            raise e

    async def get_process_output(self, pid: int) -> Tuple[Optional[str], str]:
        """
        Get output from a background process.
        Returns: (output, status)
        """
        process = self._background_processes.get(pid)
        if not process:
            raise ValueError(f"Process {pid} not found")

        # Check if process is still running
        if process.poll() is None:
            # Process still running, return what we have so far
            output = process.stdout.read() if process.stdout else ""
            return output, "background"
        else:
            # Process completed, get all output and remove from tracking
            stdout, stderr = process.communicate()
            del self._background_processes[pid]

            if process.returncode != 0:
                raise Exception(f"Command failed: {stderr}")

            return stdout, "completed"

    async def terminate_process(self, pid: int) -> None:
        """Terminate a background process."""
        process = self._background_processes.get(pid)
        if not process:
            raise ValueError(f"Process {pid} not found")

        # Terminate the entire process group
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        del self._background_processes[pid]

    async def restart_system(self) -> None:
        """Restart the system."""
        subprocess.run(["sudo", "reboot"], check=True)

    async def list_managed_processes(self) -> List[ProcessInfo]:
        """List all managed background processes."""
        processes = []
        to_remove = []

        for pid, process in self._background_processes.items():
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
                else:
                    to_remove.append(pid)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                to_remove.append(pid)

        # Clean up processes that no longer exist
        for pid in to_remove:
            del self._background_processes[pid]

        return processes 