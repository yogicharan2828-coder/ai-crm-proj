from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database.database import Base

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)

    doctor_name = Column(String(100), nullable=False)

    hospital = Column(String(150))

    specialization = Column(String(100))

    interaction_type = Column(String(50))

    summary = Column(Text)

    follow_up_date = Column(String(50))

    created_at = Column(DateTime, default=datetime.utcnow)