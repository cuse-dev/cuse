from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
from services import services
from services.keychain import KeychainItem, AuthElement

router = APIRouter(prefix="/keychain", tags=["keychain"])

class SetItemParams(BaseModel):
    service: str = Field(..., description="Service identifier", example="github")
    item: KeychainItem = Field(..., description="Keychain item to store")

    class Config:
        json_schema_extra = {
            "example": {
                "service": "github",
                "item": {
                    "username": "user@example.com",
                    "password": "secret123",
                    "url": "https://github.com"
                }
            }
        }

class DeleteItemParams(BaseModel):
    service: str = Field(..., description="Service identifier to delete", example="github")

    class Config:
        json_schema_extra = {
            "example": {
                "service": "github"
            }
        }

class AuthenticateParams(BaseModel):
    service: str = Field(..., description="Service identifier to authenticate", example="github")
    authElements: List[AuthElement] = Field(..., description="Authentication elements to verify")

    class Config:
        json_schema_extra = {
            "example": {
                "service": "github",
                "authElements": [
                    {
                        "type": "username",
                        "coordinates": {"x": 100, "y": 200}
                    },
                    {
                        "type": "password",
                        "coordinates": {"x": 150, "y": 250}
                    }
                ]
            }
        }

@router.post(
    "/set-item",
    summary="Store Keychain Item",
    description="Stores a new keychain item for a service.",
    response_description="Successfully stored keychain item",
    status_code=204,
    responses={
        204: {"description": "Successfully stored keychain item"},
        500: {"description": "Internal server error"}
    },
    operation_id="setKeychainItem"
)
async def set_item(params: SetItemParams) -> None:
    """
    Store a new keychain item.
    
    - Securely stores credentials for a service
    - Overwrites existing item if service exists
    - Encrypts sensitive data before storage
    - Supports various credential types
    """
    try:
        await services.keychain.set_item(params.service, params.item)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/delete-item",
    summary="Delete Keychain Item",
    description="Deletes a keychain item for a service.",
    response_description="Successfully deleted keychain item",
    status_code=204,
    responses={
        204: {"description": "Successfully deleted keychain item"},
        500: {"description": "Internal server error"}
    },
    operation_id="deleteKeychainItem"
)
async def delete_item(params: DeleteItemParams) -> None:
    """
    Delete a keychain item.
    
    - Removes all stored credentials for the service
    - Safe to call even if service doesn't exist
    - Securely wipes data from storage
    - Cannot be undone
    """
    try:
        await services.keychain.delete_item(params.service)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/list-services",
    summary="List Services",
    description="Lists all services with stored keychain items.",
    response_model=List[str],
    responses={
        200: {
            "description": "Successfully retrieved service list",
            "content": {
                "application/json": {
                    "example": ["github", "gitlab", "aws"]
                }
            }
        },
        500: {"description": "Internal server error"}
    },
    operation_id="listKeychainServices"
)
async def list_services() -> List[str]:
    """
    List all services with stored credentials.
    
    - Returns service identifiers only
    - Does not return sensitive data
    - Services are sorted alphabetically
    - Empty list if no items stored
    """
    try:
        return await services.keychain.list_services()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/authenticate",
    summary="Authenticate Service",
    description="Verifies authentication elements against stored keychain item.",
    response_model=bool,
    responses={
        200: {
            "description": "Successfully performed authentication",
            "content": {
                "application/json": {
                    "example": True
                }
            }
        },
        400: {"description": "Invalid authentication elements"},
        500: {"description": "Internal server error"}
    },
    operation_id="authenticateService"
)
async def authenticate(params: AuthenticateParams) -> bool:
    """
    Authenticate against stored credentials.
    
    - Verifies provided auth elements match stored data
    - Supports multiple authentication types
    - Returns true if authentication successful
    - Secure comparison to prevent timing attacks
    """
    try:
        return await services.keychain.authenticate(params.service, params.authElements)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
