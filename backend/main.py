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
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List

from database import init_db, get_db, JobApplication, LOCAL_MODE
from schemas import JobApplicationCreate, JobApplicationUpdate, JobApplicationOut, VALID_STATUSES

app = FastAPI(
    title="Job Tracker API",
    description="Backend for tracking job applications across platforms (LinkedIn, Naukri, Internshala, etc.)",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = "https://dejqmsopgacdwpsftpfk.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlanFtc29wZ2FjZHdwc2Z0cGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTk1OTIsImV4cCI6MjA5ODI5NTU5Mn0.7T8rXwDP0-6Oy6eMrL1McnhDCp8WPUx9-_QJGuLd1Hc"

bearer_scheme = HTTPBearer(auto_error=not LOCAL_MODE)

LOCAL_USER_ID = "local-user"

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> str:
    # Offline mode: no Supabase, no token needed. Everything belongs to one
    # local user — same single-user experience as the original local setup.
    if LOCAL_MODE:
        return LOCAL_USER_ID

    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    import httpx  # only needed online; keeps offline mode dependency-free
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {credentials.credentials}",
                "apikey": SUPABASE_ANON_KEY,
            },
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return resp.json()["id"]  # Supabase user UUID

@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"message": "Job Tracker API is running. Visit /docs for the API explorer."}


@app.post("/applications", response_model=JobApplicationOut)
def create_application(payload: JobApplicationCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    """Log a new job application."""
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {VALID_STATUSES}")

    new_app = JobApplication(**payload.model_dump(), user_id=user_id)
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app


@app.get("/applications", response_model=List[JobApplicationOut])
def list_applications(
    status: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    query = db.query(JobApplication).filter(JobApplication.user_id == user_id)
    if status:
        query = query.filter(JobApplication.status == status)
    if platform:
        query = query.filter(JobApplication.platform == platform)
    return query.order_by(JobApplication.date_applied.desc()).all()


@app.get("/applications/{app_id}", response_model=JobApplicationOut)
def get_application(app_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    app_obj = db.query(JobApplication).filter(JobApplication.id == app_id, JobApplication.user_id == user_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_obj

@app.patch("/applications/{app_id}", response_model=JobApplicationOut)
def update_application(app_id: int, payload: JobApplicationUpdate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    app_obj = db.query(JobApplication).filter(JobApplication.id == app_id, JobApplication.user_id == user_id).first()
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
def delete_application(app_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    app_obj = db.query(JobApplication).filter(JobApplication.id == app_id, JobApplication.user_id == user_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app_obj)
    db.commit()
    return {"message": f"Application {app_id} deleted"}


@app.get("/stats")
def get_stats(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    all_apps = db.query(JobApplication).filter(JobApplication.user_id == user_id).all()
    counts = {status: 0 for status in VALID_STATUSES}
    for a in all_apps:
        counts[a.status] = counts.get(a.status, 0) + 1
    counts["total"] = len(all_apps)
    return counts

