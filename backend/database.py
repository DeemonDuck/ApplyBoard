"""
database.py
------------
Sets up the SQLite database and the JobApplication table.

Why SQLite: zero setup, single file (job_tracker.db), perfect for a
single-user local tool. If this ever gets deployed for multiple users,
swapping to Postgres later only means changing the DATABASE_URL below —
the rest of the code (models, queries) stays the same since we use
SQLAlchemy as the ORM layer.
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()

import os

DATABASE_URL = os.environ.get("DATABASE_URL")  # set this to your Supabase connection string

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class JobApplication(Base):
    """
    One row = one job application you submitted.
    This is the single source of truth the dashboard and extension both read/write to.
    """
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)  # Supabase user UUID

    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    platform = Column(String, nullable=False)          # e.g. LinkedIn, Naukri, Internshala, Indeed, Other
    url = Column(String, nullable=True)                 # link to the job posting
    location = Column(String, nullable=True)            # job location, auto-captured by the extension
                                                           # (e.g. "Gurugram, Haryana, India" or "Remote")

    date_applied = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Applied")           # Applied / Screening / Interview / Offer / Rejected

    criteria = Column(Text, nullable=True)                # pasted JD / key requirements (short, your own notes)
    notes = Column(Text, nullable=True)                   # referral, salary talk, follow-up reminders etc.
    full_description = Column(Text, nullable=True)        # complete raw JD text, auto-captured by the extension.
                                                            # Kept separate from `criteria` (which is your own short
                                                            # notes) so the full text is preserved untouched for
                                                            # later offline processing (e.g. extracting emails/phone
                                                            # numbers from postings with an LLM).

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def init_db():
    """Creates the table if it doesn't already exist. Safe to call every startup."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """
    FastAPI dependency — gives each request its own DB session,
    and guarantees it gets closed afterwards even if something errors out.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()