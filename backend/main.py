"""
main.py
--------
The FastAPI app itself. Exposes a REST API for managing job applications.

Run with:
    uvicorn main:app --reload --port 8000

Then visit http://127.0.0.1:8000/docs for the interactive API explorer
(FastAPI generates this automatically from the schemas + type hints below).
"""

import os

from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from database import init_db, get_db, JobApplication, LOCAL_MODE
from schemas import JobApplicationCreate, JobApplicationUpdate, JobApplicationOut, VALID_STATUSES

app = FastAPI(
    title="Job Tracker API",
    description="Backend for tracking job applications across platforms (LinkedIn, Naukri, Internshala, etc.)",
    version="0.1.0",
)


def _client_ip(request: Request) -> str:
    # On Render the real client IP is in X-Forwarded-For; fall back to the
    # socket peer for local runs.
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return get_remote_address(request)


# Rate limiting protects the deployed API from floods / brute force. Disabled
# in LOCAL_MODE so offline single-user dev is never throttled.
limiter = Limiter(
    key_func=_client_ip,
    default_limits=["120/minute"],
    enabled=not LOCAL_MODE,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Reject oversized request bodies before they're parsed. Our largest field
# (full_description) caps at 100 KB; 256 KB leaves generous headroom for the
# rest of the JSON while still stopping someone from POSTing huge blobs.
MAX_BODY_BYTES = 256 * 1024


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length is not None:
        try:
            if int(content_length) > MAX_BODY_BYTES:
                return JSONResponse(status_code=413, content={"detail": "Request body too large"})
        except ValueError:
            return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length header"})
    return await call_next(request)

SUPABASE_URL = "https://dejqmsopgacdwpsftpfk.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlanFtc29wZ2FjZHdwc2Z0cGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTk1OTIsImV4cCI6MjA5ODI5NTU5Mn0.7T8rXwDP0-6Oy6eMrL1McnhDCp8WPUx9-_QJGuLd1Hc"

# Set this (Supabase → Settings → API → JWT Secret) to verify tokens locally
# via signature instead of a network call per request. Optional: if unset, we
# fall back to asking Supabase to validate each token.
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

bearer_scheme = HTTPBearer(auto_error=not LOCAL_MODE)

LOCAL_USER_ID = "local-user"

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> str:
    # Offline mode: no Supabase, no token needed. Everything belongs to one
    # local user — same single-user experience as the original local setup.
    if LOCAL_MODE:
        return LOCAL_USER_ID

    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials

    # Preferred path: verify the JWT signature locally. No network round-trip,
    # and the API stays up even if Supabase's auth endpoint is slow/down. Also
    # removes the amplification vector where each junk-token request forced an
    # outbound call. Supabase signs session tokens HS256, audience "authenticated".
    if SUPABASE_JWT_SECRET:
        import jwt  # PyJWT
        try:
            claims = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing subject")
        return user_id

    # Fallback (no JWT secret configured): ask Supabase to validate the token.
    import httpx  # only needed online; keeps offline mode dependency-free
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
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

