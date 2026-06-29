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
import jwt

from database import init_db, get_db, JobApplication
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

SUPABASE_JWT_SECRET = "yPVYU6Ax7LsASWQwePAAiFcjI7TeHxJkFu58AO5UC8TmUYnv2TArcekVIHN4/JJbGUaYp3O5lmkz8Ar0lEYGw=="

bearer_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> str:
    try:
        payload = jwt.decode(
            credentials.credentials,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload["sub"]  # Supabase user UUID
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

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

