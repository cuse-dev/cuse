import asyncio
import json
import subprocess
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class KeychainItem:
    username: Optional[str] = None
    password: Optional[str] = None
    token: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    otp: Optional[str] = None

@dataclass
class AuthElement:
    type: str
    coordinates: Dict[str, int]

class KeychainService:
    def __init__(self, mouse_service=None, keyboard_service=None):
        # Verify pass is installed
        self._verify_pass_installation()
        self.mouse = mouse_service
        self.keyboard = keyboard_service

    def _verify_pass_installation(self) -> None:
        """Verify that pass password manager is installed."""
        try:
            subprocess.run(['pass', '--version'], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            raise RuntimeError("pass password manager is not installed")

    def _run_pass_command(self, command: List[str], input_data: Optional[str] = None) -> str:
        """Run a pass command and return its output."""
        try:
            process = subprocess.run(
                ['pass'] + command,
                input=input_data if input_data else None,
                capture_output=True,
                text=True,
                check=True
            )
            return process.stdout
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"pass command failed: {e.stderr}")

    async def set_item(self, service: str, item: KeychainItem) -> None:
        """Store credentials for a service."""
        # Convert item to JSON, excluding None values
        item_dict = {k: v for k, v in item.__dict__.items() if v is not None}
        value_str = json.dumps(item_dict)
        
        # Store using pass
        self._run_pass_command(['insert', '-m', '-f', service], input_data=value_str)

    async def delete_item(self, service: str) -> None:
        """Delete credentials for a service."""
        self._run_pass_command(['rm', '-f', service])

    async def list_services(self) -> List[str]:
        """List all services in the password store."""
        output = self._run_pass_command(['ls'])
        
        # Parse the output to get service names
        services = [
            line.replace('└── ', '').strip()
            for line in output.split('\n')
            if '└──' in line
        ]
        return [s for s in services if s]

    async def authenticate(self, service: str, auth_elements: List[AuthElement]) -> bool:
        """Verify credentials exist for a service."""
        if not self.mouse or not self.keyboard:
            raise RuntimeError("Mouse and keyboard services are required for authentication")
            
        try:
            # Get stored credentials
            output = self._run_pass_command(['show', service])
            
            try:
                credentials = json.loads(output)
            except json.JSONDecodeError:
                raise ValueError("Invalid credential format")
            
            # Verify all required credentials exist
            for element in auth_elements:
                if element.type not in credentials:
                    return False
                
            for element in auth_elements:
                await self.mouse.move(element.coordinates["x"], element.coordinates["y"])
                await asyncio.sleep(0.1)
                await self.mouse.left_click()
                await asyncio.sleep(0.1)
                await self.keyboard.type_text(credentials[element.type])
                await asyncio.sleep(0.1)
            
            return True
            
        except RuntimeError:
            # Service not found or other error
            return False 