import { useEffect, useState } from "react";

type CalendarDay = {
    day: number;
    full_date: string; // ISO date string from FastAPI (e.g. "2026-05-22")
    weekday: number;   // 0=Monday ... 6=Sunday
    in_month: boolean;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export default function Calendar() {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1); // JS months are 0-indexed; API expects 1-indexed
    const [days, setDays] = useState<CalendarDay[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:8000/dates/listdates?year=${year}&month=${month}&pad=true`)
            .then((r) => r.json())
            .then((data: CalendarDay[]) => setDays(data))
            .finally(() => setLoading(false));
    }, [year, month]);

    const prevMonth = () => {
        if (month === 1) {
            setYear(year - 1);
            setMonth(12);
        } else {
            setMonth(month - 1);
        }
    };

    const nextMonth = () => {
        if (month === 12) {
            setYear(year + 1);
            setMonth(1);
        } else {
            setMonth(month + 1);
        }
    };

    const todayIso = today.toISOString().split("T")[0];

    return (
        <div className="mx-auto max-w-5/6 p-6">
            {/* Header: month name + nav */}
            <div className="glass rounded-md mb-4 flex items-center justify-between">
                <button
                    onClick={prevMonth}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-content hover:text-primary"
                >
                    ← Prev
                </button>
                <h2 className="text-xl font-semibold text-base-content">
                    {MONTH_NAMES[month - 1]} {year}
                </h2>
                <button
                    onClick={nextMonth}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-content hover:text-primary"
                >
                    Next →
                </button>
            </div>

            {/* Weekday header row */}
            <div className="grid grid-cols-7 pb-1 gap-px rounded-t-md bg-gray-200 text-center text-xs font-medium text-gray-600">
                {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="rounded-md bg-gray-50 py-2">
                        {label}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            {loading ? (
                <div className="rounded-b-md border border-t-0 border-base-300 py-12 text-center text-sm textinfo">
                    Loading...
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-px rounded-b-md bg-gray-200">
                    {days.map((d) => {
                        const isToday = d.full_date === todayIso;
                        return (
                            <div
                                key={d.full_date}
                                className={[
                                    "rounded-md min-h-24 bg-white p-2",
                                    d.in_month ? "text-gray-900" : "bg-gray-50 text-gray-400",
                                    isToday ? "ring-2 ring-inset ring-primary" : "",
                                ].join(" ")}
                            >
                                <div
                                    className={[
                                        "text-sm",
                                        isToday ? "font-semibold text-primary" : "",
                                    ].join(" ")}
                                >
                                    {d.day}
                                </div>
                                {/* Task slots go here later */}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}