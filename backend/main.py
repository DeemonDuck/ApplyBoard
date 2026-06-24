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

