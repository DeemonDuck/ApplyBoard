"""
main.py
--------
The FastAPI app itself. Exposes a REST API for managing job applications.

Run with:
    uvicorn main:app --reload --port 8000

Then visit http://127.0.0.1:8000/docs for the interactive API explorer
(FastAPI generates this automatically from the schemas + type hints below).
"""

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List

from database import init_db, get_db, JobApplication
from schemas import JobApplicationCreate, JobApplicationUpdate, JobApplicationOut, VALID_STATUSES

app = FastAPI(
    title="Job Tracker API",
    description="Backend for tracking job applications across platforms (LinkedIn, Naukri, Internshala, etc.)",
    version="0.1.0",
)

# CORS is wide open (allow_origins=["*"]) because this is a local-only,
# single-user tool right now — requests will come from the dashboard
# (localhost) and the browser extension (which runs in an extension
# context, not a normal origin). If this ever gets deployed publicly,
# this should be tightened to specific origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"message": "Job Tracker API is running. Visit /docs for the API explorer."}


@app.post("/applications", response_model=JobApplicationOut)
def create_application(payload: JobApplicationCreate, db: Session = Depends(get_db)):
    """Log a new job application."""
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {VALID_STATUSES}")

    new_app = JobApplication(**payload.model_dump())
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app


@app.get("/applications", response_model=List[JobApplicationOut])
def list_applications(
    status: Optional[str] = Query(None, description="Filter by status, e.g. Interview"),
    platform: Optional[str] = Query(None, description="Filter by platform, e.g. LinkedIn"),
    db: Session = Depends(get_db),
):
    """
    List all applications, optionally filtered by status and/or platform.
    Most recent first (by date_applied).
    """
    query = db.query(JobApplication)
    if status:
        query = query.filter(JobApplication.status == status)
    if platform:
        query = query.filter(JobApplication.platform == platform)
    return query.order_by(JobApplication.date_applied.desc()).all()


@app.get("/applications/{app_id}", response_model=JobApplicationOut)
def get_application(app_id: int, db: Session = Depends(get_db)):
    """Fetch a single application by id."""
    app_obj = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_obj

