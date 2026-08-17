from pydantic import BaseModel
from typing import Optional, List


class DocumentImage(BaseModel):
    name: str
    mime_type: str
    data: str


class ChatRequest(BaseModel):
    message: str

    # Existing PDF/document text support
    document_context: Optional[str] = None
    document_name: Optional[str] = None

    # New multimodal image support
    document_images: Optional[List[DocumentImage]] = None