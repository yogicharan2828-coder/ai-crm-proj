import json

from app.agents.crm_graph import crm_graph
from app.database.database import SessionLocal
from app.models.interaction import Interaction


# ---------------------------------------
# AI Clinical Assistant
# ---------------------------------------
def generate_followup(data):

    prompt = f"""
You are an expert Pharmaceutical CRM Assistant.

Return ONLY valid JSON.

Do NOT return markdown.
Do NOT use ```json.
Do NOT explain anything.

Return exactly in this format:

{{
    "summary": "...",
    "next_action": "...",
    "follow_up_email": "...",
    "priority": "High"
}}

Instructions:

1. summary
- Maximum 30 words.
- Professional.
- Concise.

2. next_action
- One sentence only.
- Mention the next recommended action.

3. follow_up_email
- Professional email.
- Maximum 3 short paragraphs.
- Do not exceed 120 words.

4. priority
Return ONLY one value:
High
Medium
Low

Doctor Details

Doctor Name: {data.doctor_name}
Hospital: {data.hospital}
Specialization: {data.specialization}
Interaction Type: {data.interaction_type}
Interaction Summary: {data.summary}
"""

    result = crm_graph.invoke({
        "prompt": prompt
    })

    response = result["response"]

    try:
        return json.loads(response)

    except Exception:

        return {
            "summary": response,
            "next_action": "No recommendation generated.",
            "follow_up_email": "No email generated.",
            "priority": "Medium"
        }


# ---------------------------------------
# AI CRM Chat Assistant
# ---------------------------------------
def chat_with_ai(message: str,crm_context:str):

    db = SessionLocal()

    interactions = db.query(Interaction).order_by(
        Interaction.created_at.desc()
    ).limit(10).all()

    db.close()

    crm_context = ""

    for item in interactions:
        crm_context += f"""
Doctor: {item.doctor_name}
Hospital: {item.hospital}
Specialization: {item.specialization}
Interaction Type: {item.interaction_type}
Summary: {item.summary}
Follow-up Date: {item.follow_up_date}
---------------------------------------
"""

    prompt = f"""
You are an intelligent Healthcare CRM Assistant.

You have access to the company's CRM database.

Current CRM Data:

{crm_context}

Instructions:

 Use ONLY the CRM data whenever possible.
- Answer professionally.
- Use headings.
- Use bullet points.
- Never answer in one long paragraph.

User Question:

{message}
"""

    result = crm_graph.invoke({
        "prompt": prompt
    })

    return result["response"]