from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.init_db import init_db
from app.api.routes import router
from app.api.ai_routes import router as ai_router
from app.api.dashboard_routes import router as dashboard_router

app = FastAPI(
    title="AI First CRM HCP Module",
    version="1.0.0",
)

# ---------- ADD THIS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ai-crmproj.netlify.app",   # <-- your Netlify URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ------------------------------

init_db()

app.include_router(router)
app.include_router(ai_router)
app.include_router(dashboard_router)

@app.get("/")
def root():
    return {
        "message": "AI CRM Backend Running 🚀"
    }