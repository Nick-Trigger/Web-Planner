from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models import Task
from app.schemas import TaskCreate, TaskRead

from datetime import date, time, datetime

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskRead)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    task = Task(
        title=payload.title,
        due_date=payload.due_date,
        due_time=payload.due_time,
        priority=payload.priority,
        show_from_date=payload.show_from_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("", response_model=list[TaskRead])
def list_tasks(db: Session = Depends(get_db)):
    return db.scalars(select(Task).order_by(Task.created_at.desc())).all()


@router.get("/listdates", response_model=list[TaskRead])
def list_tasks_by_date(
    first_date: date, last_date: date | None = None, db: Session = Depends(get_db)
):
    if last_date is None:
        last_date = first_date

    try:
        return db.scalars(
            select(Task)
            .where(Task.due_date >= first_date, Task.due_date <= last_date)
            .order_by(Task.due_date)
        ).all()
    except Exception as e:
        try:
            return db.scalars(
                select(Task)
                .where(Task.due_date >= first_date, Task.due_date <= last_date)
                .order_by(Task.created_at.desc())
            ).all()
        except Exception as e:
            raise HTTPException(500, "Error occurred while fetching tasks") from e


@router.get("/listprio", response_model=list[TaskRead])
def list_tasks_by_priority(priority: int, db: Session = Depends(get_db)):
    try:
        return db.scalars(
            select(Task)
            .where(Task.priority == priority)
            .order_by(Task.created_at.desc())
        ).all()
    except Exception as e:
        raise HTTPException(500, "Error occurred while fetching tasks") from e


@router.get("/{task_id}", response_model=TaskRead)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(404, "Task not found")
    return task


@router.patch("/{task_id}/done", response_model=TaskRead)
def mark_done(task_id: int, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(404, "Task not found")
    task.done = not task.done
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(404, "Task not found")
    db.delete(task)
    db.commit()
