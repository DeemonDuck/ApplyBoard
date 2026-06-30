"""
schemas.py
-----------
Pydantic models define what shape of data we ACCEPT (requests) and
what shape we SEND BACK (responses). FastAPI uses these to auto-validate
incoming JSON and to auto-generate the /docs API explorer.

Think of this as the "contract" between backend and anything that talks
to it (dashboard, extension, future iOS app).
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


# Allowed status values — kept as a plain list (not a strict Enum) on purpose.
# A strict Enum would reject any value outside this list at the API layer,
# which is good for safety, but if you ever want to add a stage like
# "Withdrawn" later, you'd have to touch backend code. A plain string with
# a documented convention is more flexible for a solo, evolving project.
VALID_STATUSES = ["Applied", "Screening", "Interview", "Offer", "Rejected"]


def _validate_url(v: Optional[str]) -> Optional[str]:
    """Only allow http(s) URLs. Blocks javascript:/data: and other schemes
    that could become a stored-XSS vector if the URL is ever rendered as a
    clickable link. Empty / missing is fine (url is optional)."""
    if v is None or v.strip() == "":
        return v
    if not (v.startswith("http://") or v.startswith("https://")):
        raise ValueError("url must start with http:// or https://")
    return v


class JobApplicationCreate(BaseModel):
    """What the client sends when logging a new application."""
    company: str = Field(..., min_length=1, max_length=200)
    role: str = Field(..., min_length=1, max_length=200)
    platform: str = Field(..., max_length=100)
    url: Optional[str] = Field(None, max_length=2000)
    location: Optional[str] = Field(None, max_length=200)
    status: str = Field("Applied", max_length=50)
    criteria: Optional[str] = Field(None, max_length=10_000)
    notes: Optional[str] = Field(None, max_length=10_000)
    full_description: Optional[str] = Field(None, max_length=100_000)

    @field_validator("url")
    @classmethod
    def check_url(cls, v):
        return _validate_url(v)


class JobApplicationUpdate(BaseModel):
    """
    What the client sends when editing an existing application.
    Every field is optional here — you might just want to update the
    status (e.g. "Applied" -> "Interview") without resending everything else.
    """
    company: Optional[str] = Field(None, min_length=1, max_length=200)
    role: Optional[str] = Field(None, min_length=1, max_length=200)
    platform: Optional[str] = Field(None, max_length=100)
    url: Optional[str] = Field(None, max_length=2000)
    location: Optional[str] = Field(None, max_length=200)
    status: Optional[str] = Field(None, max_length=50)
    criteria: Optional[str] = Field(None, max_length=10_000)
    notes: Optional[str] = Field(None, max_length=10_000)
    full_description: Optional[str] = Field(None, max_length=100_000)

    @field_validator("url")
    @classmethod
    def check_url(cls, v):
        return _validate_url(v)


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