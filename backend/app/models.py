from datetime import datetime, date, time
from sqlalchemy import String, DateTime, Boolean, Date, Time, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    done: Mapped[bool] = mapped_column(Boolean, default=False)
    priority: Mapped[int] = mapped_column(default=0)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    due_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    show_from_date: Mapped[date | None] = mapped_column(Date, nullable=True)


class CalendarDay(Base):
    __tablename__ = "dates"

    id: Mapped[int] = mapped_column(primary_key=True)
    day: Mapped[int] = mapped_column(Integer, nullable=False)
    full_date: Mapped[date] = mapped_column(Date, nullable=False)
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)
    in_month: Mapped[bool | None] = mapped_column(Boolean, default=True, nullable=True)

class SingleDate(Base):
    __tablename__ = "single_dates"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_date: Mapped[date] = mapped_column(Date, nullable=True)


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    note_date: Mapped[date] = mapped_column(Date, unique=True, nullable=False)
    content: Mapped[str] = mapped_column(String, nullable=False, default="")