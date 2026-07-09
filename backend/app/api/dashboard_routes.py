from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from app.database.database import get_db
from app.models.interaction import Interaction

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db)):

    total_interactions = db.query(Interaction).count()

    pending_followups = db.query(Interaction).count()
    

    return {
        "total_interactions": total_interactions,
        "ai_insights": total_interactions,
        "pending_followups": pending_followups,
    }