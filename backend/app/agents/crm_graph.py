from typing import TypedDict
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY")
)


class CRMState(TypedDict):
    prompt: str
    response: str


def generate_response(state: CRMState):
    result = llm.invoke(state["prompt"])

    return {
        "response": result.content
    }


graph = StateGraph(CRMState)

graph.add_node("generate", generate_response)

graph.set_entry_point("generate")

graph.add_edge("generate", END)

crm_graph = graph.compile()