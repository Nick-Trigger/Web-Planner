from datetime import datetime
from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str


class TaskRead(BaseModel):
    id: int
    title: str
    done: bool
    created_at: datetime

    model_config = {"from_attributes": True}  # lets it read from ORM objects