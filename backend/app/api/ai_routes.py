from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.interaction_schema import InteractionCreate
from app.schemas.chat_schema import ChatRequest
from app.services.chat_service import get_all_interactions
from app.services.ai_service import (
    generate_followup,
    chat_with_ai,
)

from app.services.interaction_service import create_interaction 

router = APIRouter(prefix="/ai", tags=["AI"])


# -----------------------------
# AI Clinical Assistant
# -----------------------------
@router.post("/generate")
def generate_ai(
    data: InteractionCreate,
    db: Session = Depends(get_db)
):
    # Save interaction in PostgreSQL
    create_interaction(db, data)

    # Generate AI insights
    result = generate_followup(data)

    return {
        "response": result
    }


# -----------------------------
# AI Chatbot
# -----------------------------
@router.post("/chat")
def chat(
    data: ChatRequest,
    db: Session = Depends(get_db)
):

    crm_context = get_all_interactions(db)

    response = chat_with_ai(
        data.message,
        crm_context
    )

    return {
        "response": response
    }