from datetime import datetime, date, time
from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str
    due_date: date | None = None
    due_time: time | None = None
    priority: int = 0
    show_from_date: date | None = None


class TaskRead(BaseModel):
    id: int
    title: str
    done: bool
    priority: int
    due_date: date | None
    due_time: time | None
    created_at: datetime
    show_from_date: date | None

    model_config = {"from_attributes": True}


class NoteUpsert(BaseModel):
    content: str


class NoteRead(BaseModel):
    note_date: date
    content: str

    model_config = {"from_attributes": True}


class CalendarDayRead(BaseModel):
    day: int  # 1, 2, 3, ... 28/29/30/31
    weekday: int  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    full_date: date  # the full date object
    in_month: bool | None = True  # whether this day is in the requested month