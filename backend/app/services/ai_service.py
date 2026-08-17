import json
import os

from dotenv import load_dotenv
from groq import Groq

from app.agents.crm_graph import crm_graph
from app.database.database import SessionLocal
from app.models.interaction import Interaction


# ---------------------------------------------------------
# Environment
# ---------------------------------------------------------

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is not configured."
    )


# ---------------------------------------------------------
# Groq Vision Client
# ---------------------------------------------------------

vision_client = Groq(
    api_key=GROQ_API_KEY
)

VISION_MODEL = "qwen/qwen3.6-27b"


# ---------------------------------------------------------
# AI Clinical Assistant
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# CRM Context
# ---------------------------------------------------------

def get_crm_context():

    db = SessionLocal()

    try:
        interactions = (
            db.query(Interaction)
            .order_by(
                Interaction.created_at.desc()
            )
            .limit(10)
            .all()
        )

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

        return crm_context

    finally:
        db.close()


# ---------------------------------------------------------
# Normal CRM Chat
# ---------------------------------------------------------

def chat_with_ai(
    message: str,
    crm_context: str = "",
    document_context: str | None = None,
    document_name: str | None = None,
    document_images: list | None = None,
):
    """
    Main AI chat function.

    Routing:

    No images
        -> existing LangGraph CRM AI

    Images present
        -> Groq Qwen 3.6 multimodal AI
    """

    # -----------------------------------------------------
    # Always get fresh CRM context
    # -----------------------------------------------------

    crm_context = get_crm_context()

    document_images = (
        document_images or []
    )

    # -----------------------------------------------------
    # IMAGE / MULTIMODAL PATH
    # -----------------------------------------------------

    if document_images:

        return chat_with_vision(
            message=message,
            crm_context=crm_context,
            document_context=document_context,
            document_name=document_name,
            document_images=document_images,
        )

    # -----------------------------------------------------
    # TEXT-ONLY PATH
    # -----------------------------------------------------

    prompt = f"""
You are an intelligent Healthcare CRM Assistant.

You have access to the company's CRM database.

Current CRM Data:

{crm_context}

"""

    # -----------------------------------------------------
    # Add document text if available
    # -----------------------------------------------------

    if document_context:

        prompt += f"""
Uploaded Document:

Document Name:
{document_name or "Uploaded document"}

Document Content:
{document_context}

"""

    prompt += f"""
Instructions:

- Answer professionally.
- Use CRM data whenever relevant.
- If a document was uploaded, use its contents when answering questions about it.
- Do not invent information that is not present in the CRM data or uploaded document.
- If information is unavailable, clearly say so.
- Use headings when useful.
- Use bullet points when useful.
- Avoid unnecessarily long paragraphs.

User Question:

{message}
"""

    result = crm_graph.invoke({
        "prompt": prompt
    })

    return result["response"]


# ---------------------------------------------------------
# Vision / Multimodal Chat
# ---------------------------------------------------------

def chat_with_vision(
    message: str,
    crm_context: str,
    document_context: str | None,
    document_name: str | None,
    document_images: list,
):
    """
    Analyze uploaded images using Groq's
    multimodal Qwen model.

    Supports:
    - X-rays
    - screenshots
    - charts
    - diagrams
    - scanned reports
    - general images
    """

    content = []

    # -----------------------------------------------------
    # Main instruction
    # -----------------------------------------------------

    prompt = f"""
You are an AI assistant integrated into a Healthcare CRM.

The user has uploaded one or more documents/images.

You must answer the user's question using:

1. The uploaded image(s)
2. Uploaded document text, if available
3. Relevant CRM information

CRM DATA:

{crm_context}
"""

    # -----------------------------------------------------
    # Document text
    # -----------------------------------------------------

    if document_context:

        prompt += f"""

UPLOADED DOCUMENT TEXT:

Document:
{document_name or "Uploaded document"}

{document_context}
"""

    # -----------------------------------------------------
    # Medical image safety / accuracy instruction
    # -----------------------------------------------------

    prompt += """

IMPORTANT IMAGE ANALYSIS RULES:

- Carefully inspect the uploaded image(s).
- If the image appears to be an X-ray or medical image, describe only visible or reasonably supported observations.
- Do NOT claim certainty of diagnosis.
- Do NOT invent findings.
- Clearly distinguish visual observations from medical conclusions.
- Mention limitations when image quality, positioning, or available context prevents reliable interpretation.
- Recommend review by a qualified healthcare professional for clinical diagnosis or treatment decisions.
- If the uploaded image is not a medical image, simply answer based on what is visibly present.
- If multiple images are uploaded, consider all of them before answering.

USER QUESTION:

""" + message

    # Add the text instruction first.
    content.append({
        "type": "text",
        "text": prompt,
    })

    # -----------------------------------------------------
    # Add uploaded images
    # -----------------------------------------------------

       # -----------------------------------------------------
    # Add uploaded images
    # -----------------------------------------------------

    for image in document_images[:3]:

        image_data = image.data

        mime_type = image.mime_type or "image/jpeg"

        if not image_data:
            continue

        if image_data.startswith("data:"):
            image_url = image_data

        else:
            image_url = (
                f"data:{mime_type};base64,"
                f"{image_data}"
            )

        content.append({
            "type": "image_url",
            "image_url": {
                "url": image_url,
            },
        })

    # -----------------------------------------------------
    # Safety check
    # -----------------------------------------------------

    image_count = len(
        [
            item
            for item in content
            if item.get("type") == "image_url"
        ]
    )

    # -----------------------------------------------------
    # Safety check
    # -----------------------------------------------------

    image_count = len(
        [
            item
            for item in content
            if item.get("type")
            == "image_url"
        ]
    )

    if image_count == 0:

        # If image data wasn't valid, fall back
        # to normal text processing.

        return chat_with_ai(
            message=message,
            crm_context=crm_context,
            document_context=document_context,
            document_name=document_name,
            document_images=[],
        )

    # -----------------------------------------------------
    # Groq Vision Request
    # -----------------------------------------------------

    try:

        completion = (
            vision_client.chat.completions.create(
                model=VISION_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": content,
                    }
                ],
                temperature=0.7,
                max_completion_tokens=2048,
                reasoning_effort="none",
                reasoning_format="hidden",
            )
        )

        response = (
            completion
            .choices[0]
            .message
            .content
        )

        if not response:
            return (
                "I couldn't generate an analysis "
                "from the uploaded image."
            )

        return response

    except Exception as error:

        print(
            "Vision AI error:",
            repr(error)
        )

        return (
            "I was unable to analyze the uploaded "
            "image at the moment. Please try again."
        )