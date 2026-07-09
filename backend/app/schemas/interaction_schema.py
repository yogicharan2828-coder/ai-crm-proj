from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class InteractionCreate(BaseModel):
    doctor_name: str
    hospital: str
    specialization: str
    interaction_type: str
    summary: Optional[str] = None
    follow_up_date: Optional[str] = None


class InteractionResponse(InteractionCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True