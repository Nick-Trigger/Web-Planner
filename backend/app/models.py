from datetime import datetime, date, time
from sqlalchemy import String, DateTime, Boolean, Date, Time
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    done: Mapped[bool] = mapped_column(Boolean, default=False)
    priority: Mapped[int] = mapped_column(default=0)
    due_date: Mapped[date] = mapped_column(Date, nullable=True)
    due_time: Mapped[time] = mapped_column(Time, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    show_from_date: Mapped[date] = mapped_column(Date, nullable=True)