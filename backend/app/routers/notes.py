from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import date

from app.database import get_db
from app.models import Note
from app.schemas import NoteRead, NoteUpsert

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("/{note_date}", response_model=NoteRead)
def get_note(note_date: date, db: Session = Depends(get_db)):
    note = db.scalars(select(Note).where(Note.note_date == note_date)).first()
    if note is None:
        return NoteRead(note_date=note_date, content="")
    return note


@router.put("/{note_date}", response_model=NoteRead)
def upsert_note(note_date: date, payload: NoteUpsert, db: Session = Depends(get_db)):
    note = db.scalars(select(Note).where(Note.note_date == note_date)).first()
    if note is None:
        note = Note(note_date=note_date, content=payload.content)
        db.add(note)
    else:
        note.content = payload.content
    db.commit()
    db.refresh(note)
    return note
