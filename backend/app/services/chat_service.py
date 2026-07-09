from sqlalchemy.orm import Session
from app.models.interaction import Interaction


def get_all_interactions(db: Session):

    interactions = db.query(Interaction).all()

    if not interactions:
        return "No interactions found."

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