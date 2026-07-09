from sqlalchemy.orm import Session
from app.models.interaction import Interaction
from app.schemas.interaction_schema import InteractionCreate


def create_interaction(db: Session, interaction: InteractionCreate):
    db_interaction = Interaction(
        doctor_name=interaction.doctor_name,
        hospital=interaction.hospital,
        specialization=interaction.specialization,
        interaction_type=interaction.interaction_type,
        summary=interaction.summary,
        follow_up_date=interaction.follow_up_date,
    )

    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)

    return db_interaction


def get_interactions(db: Session):
    return db.query(Interaction).all()


# ⭐ NEW FUNCTION
def get_all_interactions(db: Session):
    interactions = db.query(Interaction).all()

    if not interactions:
        return "No doctor interactions found."

    context = ""

    for item in interactions:
        context += f"""
Doctor: {item.doctor_name}
Hospital: {item.hospital}
Specialization: {item.specialization}
Interaction Type: {item.interaction_type}
Summary: {item.summary}
Follow-up Date: {item.follow_up_date}

"""

    return context