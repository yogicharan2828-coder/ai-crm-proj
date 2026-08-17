from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.interaction_schema import InteractionCreate
from app.schemas.chat_schema import ChatRequest

from app.services.chat_service import get_all_interactions

from app.services.document_service import (
    process_documents,
    MAX_DOCUMENTS,
)

from app.services.ai_service import (
    generate_followup,
    chat_with_ai,
)

from app.services.interaction_service import (
    create_interaction,
)


router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


# =========================================================
# AI Clinical Assistant
# =========================================================

@router.post("/generate")
def generate_ai(
    data: InteractionCreate,
    db: Session = Depends(get_db),
):
    # Save interaction in PostgreSQL
    create_interaction(
        db,
        data,
    )

    # Generate AI insights
    result = generate_followup(
        data
    )

    return {
        "response": result
    }


# =========================================================
# AI Document Upload
# =========================================================

@router.post("/upload-document")
async def upload_document(
    files: list[UploadFile] = File(...),
):
    """
    Upload up to 3 PDFs/images.

    Supported:
    - PDF
    - JPG
    - JPEG
    - PNG
    """

    # -----------------------------------------------------
    # Validate number of files
    # -----------------------------------------------------

    if not files:
        raise HTTPException(
            status_code=400,
            detail="Please upload at least one file.",
        )

    if len(files) > MAX_DOCUMENTS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"You can upload a maximum of "
                f"{MAX_DOCUMENTS} files at once."
            ),
        )

    documents = []

    try:

        # -------------------------------------------------
        # Read all uploaded files
        # -------------------------------------------------

        for file in files:

            file_content = await file.read()

            documents.append(
                {
                    "file_content": file_content,
                    "content_type": file.content_type,
                    "filename": file.filename,
                }
            )

        # -------------------------------------------------
        # Process all documents
        # -------------------------------------------------

        result = process_documents(
            documents
        )

        # -------------------------------------------------
        # Return processed result
        # -------------------------------------------------

        return {
            "success": True,

            "documents": result[
                "documents"
            ],

            "text": result[
                "text"
            ],

            "images": result[
                "images"
            ],
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:

        print(
            "Document upload error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to process "
                "uploaded document(s)."
            ),
        )


# =========================================================
# AI Chatbot
# =========================================================

@router.post("/chat")
def chat(
    data: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    CRM chatbot endpoint.

    Supports:

    1. Normal CRM chat
    2. PDF text context
    3. Image / X-ray analysis
    4. Multiple uploaded documents
    """

    # -----------------------------------------------------
    # Get CRM context
    # -----------------------------------------------------

    crm_context = get_all_interactions(
        db
    )

    # -----------------------------------------------------
    # AI response
    # -----------------------------------------------------

    response = chat_with_ai(
        message=data.message,

        crm_context=crm_context,

        document_context=(
            data.document_context
        ),

        document_name=(
            data.document_name
        ),

        document_images=(
            data.document_images or []
        ),
    )

    return {
        "response": response
    }