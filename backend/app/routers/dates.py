from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models import CalendarDay
from app.schemas import CalendarDayRead
import calendar

from datetime import date, time, datetime, timedelta

router = APIRouter(prefix="/dates", tags=["dates"])


@router.get("/listdates", response_model=list[CalendarDayRead])
def list_dates_by_month(year: int, month: int, pad: bool = False):
    """Returns every day of the given month. If pad=True, also includes
    leading days from the previous month (back to Monday) and trailing
    days from the next month (forward to Sunday) to fill out the weeks."""
    if not 1 <= month <= 12:
        raise HTTPException(400, "month must be between 1 and 12")

    _, days_in_month = calendar.monthrange(year, month)
    dates = [date(year, month, d) for d in range(1, days_in_month + 1)]

    if pad:
        while dates[0].weekday() != 0:
            dates.insert(0, dates[0] - timedelta(days=1))
        while dates[-1].weekday() != 6:
            dates.append(dates[-1] + timedelta(days=1))

    return [
        CalendarDayRead(
            day=dt.day,
            full_date=dt,
            weekday=dt.weekday(),
            in_month=(dt.month == month),
        )
        for dt in dates
    ]
    
@router.get("/today", response_model=CalendarDayRead)
def get_today():
    today = date.today()
    return CalendarDayRead(
        day=today.day,
        full_date=today,
        weekday=today.weekday(),
        in_month=None,
    )

@router.get("/time", response_model=str)
def get_current_time():
    now = datetime.now()
    return now.strftime("%H:%M:%S")