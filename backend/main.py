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

@app.patch("/applications/{app_id}", response_model=JobApplicationOut)
def update_application(app_id: int, payload: JobApplicationUpdate, db: Session = Depends(get_db)):
    """
    Update an existing application. Only the fields you send get changed —
    this is what makes quick status updates (e.g. moving to 'Interview')
    cheap and simple from the dashboard.
    """
    app_obj = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    update_data = payload.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {VALID_STATUSES}")

    for field, value in update_data.items():
        setattr(app_obj, field, value)

    db.commit()
    db.refresh(app_obj)
    return app_obj


@app.delete("/applications/{app_id}")
def delete_application(app_id: int, db: Session = Depends(get_db)):
    """Remove an application (e.g. if you logged it by mistake)."""
    app_obj = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(app_obj)
    db.commit()
    return {"message": f"Application {app_id} deleted"}


@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """
    Quick summary numbers — how many applications per status.
    Handy for a dashboard header like 'You've applied to 47 jobs, 5 in Interview stage'.
    """
    all_apps = db.query(JobApplication).all()
    counts = {status: 0 for status in VALID_STATUSES}
    for a in all_apps:
        counts[a.status] = counts.get(a.status, 0) + 1
    counts["total"] = len(all_apps)
    return counts

