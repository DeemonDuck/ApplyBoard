"""
schemas.py
-----------
Pydantic models define what shape of data we ACCEPT (requests) and
what shape we SEND BACK (responses). FastAPI uses these to auto-validate
incoming JSON and to auto-generate the /docs API explorer.

Think of this as the "contract" between backend and anything that talks
to it (dashboard, extension, future iOS app).
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Allowed status values — kept as a plain list (not a strict Enum) on purpose.
# A strict Enum would reject any value outside this list at the API layer,
# which is good for safety, but if you ever want to add a stage like
# "Withdrawn" later, you'd have to touch backend code. A plain string with
# a documented convention is more flexible for a solo, evolving project.
VALID_STATUSES = ["Applied", "Screening", "Interview", "Offer", "Rejected"]


class JobApplicationCreate(BaseModel):
    """What the client sends when logging a new application."""
    company: str
    role: str
    platform: str
    url: Optional[str] = None
    location: Optional[str] = None
    status: str = "Applied"
    criteria: Optional[str] = None
    notes: Optional[str] = None
    full_description: Optional[str] = None


class JobApplicationUpdate(BaseModel):
    """
    What the client sends when editing an existing application.
    Every field is optional here — you might just want to update the
    status (e.g. "Applied" -> "Interview") without resending everything else.
    """
    company: Optional[str] = None
    role: Optional[str] = None
    platform: Optional[str] = None
    url: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    criteria: Optional[str] = None
    notes: Optional[str] = None
    full_description: Optional[str] = None


class JobApplicationOut(BaseModel):
    """What the API sends back — includes server-generated fields like id and timestamps."""
    id: int
    company: str
    role: str
    platform: str
    url: Optional[str]
    location: Optional[str]
    date_applied: datetime
    status: str
    criteria: Optional[str]
    notes: Optional[str]
    full_description: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # lets this model read directly from a SQLAlchemy object