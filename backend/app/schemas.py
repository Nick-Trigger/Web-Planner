from datetime import datetime, date, time
from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str
    due_date: date| None = None
    due_time: time | None = None
    priority: int = 0
    show_from_date: date | None = None


class TaskRead(BaseModel):
    id: int
    title: str
    done: bool
    priority: int
    due_datetime: datetime | None
    created_at: datetime
    show_from_date: datetime | None
    model_config = {"from_attributes": True}  # lets it read from ORM objects