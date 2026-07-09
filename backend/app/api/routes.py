from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.interaction_schema import (
    InteractionCreate,
    InteractionResponse,
)
from app.services.interaction_service import (
    create_interaction,
    get_interactions,
)

router = APIRouter()


@router.post("/interactions", response_model=InteractionResponse)
def add_interaction(
    interaction: InteractionCreate,
    db: Session = Depends(get_db),
):
    return create_interaction(db, interaction)


@router.get("/interactions", response_model=list[InteractionResponse])
def list_interactions(db: Session = Depends(get_db)):
    return get_interactions(db)
