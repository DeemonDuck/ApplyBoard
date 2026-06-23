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
    status: str = "Applied"
    criteria: Optional[str] = None
    notes: Optional[str] = None


