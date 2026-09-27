from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import query
from extraction.routes import documents

app = FastAPI(title="ModelLens API", description="AI Grounding & Observability Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect both Document Extraction and Query routers
app.include_router(documents.router)
app.include_router(query.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}