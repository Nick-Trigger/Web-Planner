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
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [tasks, setTasks] = useState<any[]>([]);
    const [monthTasksByDate, setMonthTasksByDate] = useState<Record<string, any[]>>({});
    const [noteContent, setNoteContent] = useState("");
    const [holidays, setHolidays] = useState<Record<string, string>>({});
    const [newTaskDate, setNewTaskDate] = useState(today.toISOString().split("T")[0]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskTime, setNewTaskTime] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState(0);

    useEffect(() => {
        fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`)
            .then((r) => r.json())
            .then((data: { date: string; localName: string }[]) => {
                const map: Record<string, string> = {};
                for (const h of data) map[h.date] = h.localName;
                setHolidays(map);
            });
    }, [year]);

    const fetchMonthTasks = (y: number, m: number) => {
        const firstDate = `${y}-${String(m).padStart(2, "0")}-01`;
        const lastDay = new Date(y, m, 0).getDate();
        const lastDate = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        fetch(`http://localhost:8000/tasks/listdates?first_date=${firstDate}&last_date=${lastDate}`)
            .then((r) => r.json())
            .then((data: any[]) => {
                const grouped: Record<string, any[]> = {};
                for (const task of data) {
                    const key = task.due_date;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(task);
                }
                setMonthTasksByDate(grouped);
            });
    };

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:8000/dates/listdates?year=${year}&month=${month}&pad=true`)
            .then((r) => r.json())
            .then((data: CalendarDay[]) => setDays(data))
            .finally(() => setLoading(false));
        fetchMonthTasks(year, month);
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

    const selectDate = (date: string) => {
        setSelectedDate(date);
        fetchTasksForDate(date);
    };

    const addTask = () => {
        fetch("http://localhost:8000/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: newTaskTitle,
                due_date: newTaskDate || null,
                due_time: newTaskTime || null,
                priority: newTaskPriority,
            }),
        })
            .then((r) => r.json())
            .then((created) => {
                setTasks((prev) => [...prev, created]);
                setNewTaskTitle("");
                setNewTaskTime("");
                setNewTaskPriority(0);
                fetchMonthTasks(year, month);
            });
    };

    const handleDeleteTask = (taskId: number) => {
        fetch(`http://localhost:8000/tasks/${taskId}`, {
            method: "DELETE",
        })
            .then(() => {
                setTasks((prev) => prev.filter((t) => t.id !== taskId));
                fetchMonthTasks(year, month);
            });
    };

    const todayIso = today.toISOString().split("T")[0];

    useEffect(() => {
        if (!selectedDate) setSelectedDate(todayIso);
    }, []);

    useEffect(() => {
        if (!selectedDate) return;
        const d = new Date(selectedDate + "T00:00:00");
        setSelectedDay(d.getDate());
        setSelectedMonth(d.getMonth() + 1);
        setSelectedYear(d.getFullYear());
        setNewTaskDate(selectedDate);
        fetch(`http://localhost:8000/notes/${selectedDate}`)
            .then((r) => r.json())
            .then((data) => setNoteContent(data.content ?? ""));
    }, [selectedDate]);

    const saveNote = () => {
        if (!selectedDate) return;
        fetch(`http://localhost:8000/notes/${selectedDate}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: noteContent }),
        });
    };

    const fetchTasksForDate = (date: string) => {
        fetch(`http://localhost:8000/tasks/listdates?first_date=${date}`)
            .then((r) => r.json())
            .then((data) => setTasks(data));
    }

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
                        const isSelected = d.full_date === selectedDate;
                        return (
                            <div key={d.full_date} className={["rounded-md min-h-30 bg-white", d.in_month ? "text-gray-900" : "bg-gray-50 text-gray-400", isSelected ? "ring-2 ring-inset ring-secondary" : "", isToday ? "ring-2 ring-inset ring-primary" : "",].join(" ")}>
                                <button onClick={() => selectDate(d.full_date)} className="w-full h-full p-2 flex flex-col items-start justify-start text-left">
                                    <div className="w-full flex items-start justify-between gap-1">
                                        <div className={["text-sm shrink-0", isToday ? "font-semibold text-primary" : "", isSelected ? "font-semibold text-secondary" : ""].join(" ")}>{d.day}</div>
                                        {holidays[d.full_date] && (
                                            <div className="text-xs text-purple-500 truncate text-right leading-tight">{holidays[d.full_date]}</div>
                                        )}
                                    </div>
                                    
                                    <div className="w-full mt-1 flex flex-col gap-0.5 overflow-hidden">
                                        {[...(monthTasksByDate[d.full_date] ?? [])].sort((a, b) => b.priority - a.priority).slice(0, 3).map((t) => {
                                            const chipClass = t.priority === 2 ? "bg-red-100 border-red-300 text-red-600" : t.priority === 1 ? "bg-yellow-100 border-yellow-300 text-yellow-600" : "bg-green-100 border-green-300 text-green-600";
                                            return (
                                                <div key={t.id} className={["text-xs px-1 py-0.5 rounded truncate leading-tight border-2", chipClass].join(" ")}>
                                                    {t.title}
                                                </div>
                                            );
                                        })}
                                        {(monthTasksByDate[d.full_date]?.length ?? 0) > 3 && (
                                            <div className="text-xs text-gray-400">+{monthTasksByDate[d.full_date].length - 3} more</div>
                                        )}
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            {/* Tasks and Note Display */}
            {selectedDate && (

                <div className="mt-4 p-4 bg-base-200 rounded-md">
                    <h3 className="text-lg font-semibold text-base-content">Tasks for {WEEKDAY_LABELS[selectedDay - 1]} {MONTH_NAMES[selectedMonth - 1]} {selectedDay}, {selectedYear}</h3>
                    <div className="grid grid-flow-col grid-rows-1 grid-cols-4 gap-2 mt-2">
                        <div className="col-span-3 mt-2 p-2 bg-base-100 rounded-md">
                            <div className="rounded-md mb-4 flex items-center justify-between">
                                <div className="grid grid-cols-1 grid-rows-1 gap-2 w-full">
                                    <div className="rounded-md flex gap-2 mt-2 bg-gray-200 p-2 w-full">
                                        {tasks.length === 0 ? (
                                            <div className="text-center text-sm text-gray-500">
                                                No tasks for this date.
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2 w-full">
                                                <div className="rounded-md grid grid-cols-6 gap-y-2 gap-x-4 w-full justify-items-center items-center text-sm text-gray-700">
                                                    <h2 className="text-md text-gray-500 text-base-content text-center col-span-2">Title</h2>
                                                    <h2 className="text-md text-gray-500 text-base-content text-center">Due Date</h2>
                                                    <h2 className="text-md text-gray-500 text-base-content text-center">Due Time</h2>
                                                    <h2 className="text-md text-gray-500 text-base-content text-center">Completed</h2>
                                                    <h2 className="text-md text-gray-500 text-base-content text-center">Delete</h2>
                                                </div>
                                                {[...tasks].sort((a, b) => b.priority - a.priority).map((task) => {
                                                    const taskPrio = task.priority;
                                                    let taskPrioClass = "";

                                                    switch (taskPrio) {
                                                        case 0:
                                                            taskPrioClass = "bg-green-100 border-green-300 text-green-600";
                                                            break;
                                                        case 1:
                                                            taskPrioClass = "bg-yellow-100 border-yellow-300 text-yellow-600";
                                                            break;
                                                        case 2:
                                                            taskPrioClass = "bg-red-100 border-red-300 text-red-600";
                                                            break;
                                                        default:
                                                            taskPrioClass = "";
                                                    }

                                                    return (
                                                        <div key={task.id} className="rounded-md flex gap-2 mt-2 bg-gray-100 p-2 w-full">
                                                            <div className="rounded-md grid grid-cols-6 gap-y-2 gap-x-4 w-full justify-items-center items-center text-sm text-gray-700">
                                                                <h2 className={["rounded-md text-md flex items-center justify-center text-center col-span-2 w-full h-full border-2", taskPrioClass].join(" ")}>{task.title}</h2>
                                                                <h2 className="text-md text-base text-center">{task.due_date ? new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : ""}</h2>
                                                                <h2 className="text-md text-basetext-center">{task.due_time ? new Date("1970-01-01T" + task.due_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}</h2>
                                                                <input type="checkbox" defaultChecked className="toggle border-neutral text-neutral checked:bg-secondary checked:text-secondary-content checked:border-secondary-content" />
                                                                <button onClick={() => handleDeleteTask(task.id)} className="btn btn-sm btn-error">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                                                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                                                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="rounded-md flex gap-2 mt-2 bg-gray-200 p-2 w-full">
                                        <div className="grid grid-cols-6 gap-y-2 gap-x-4 w-full">
                                            <h2 className="text-md text-gray-500 text-base-content text-center col-span-2">Title*</h2>
                                            <h2 className="text-md text-gray-500 text-base-content text-center">Priority*</h2>
                                            <h2 className="text-md text-gray-500 text-base-content text-center">Due Date*</h2>
                                            <h2 className="text-md text-gray-500 text-base-content text-center">Due Time</h2>
                                            <h2 className="text-md text-gray-500 text-base-content text-center"> </h2>
                                            <input type="text" placeholder="Task Title" className="validator input input-bordered input-sm w-full max-w-xs col-span-2" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required />
                                            <div className="rounded-lg bg-base-100 grid grid-cols-3 justify-items-center items-center">
                                                <input type="radio" name="priority" value="0" className="radio radio-sm radio-primary bg-green-100 border-green-300 checked:bg-green-200 checked:text-green-600 checked:border-green-600" checked={newTaskPriority === 0} onChange={() => setNewTaskPriority(0)} />
                                                <input type="radio" name="priority" value="1" className="radio radio-sm radio-primary bg-yellow-100 border-yellow-300 checked:bg-yellow-200 checked:text-yellow-600 checked:border-yellow-600" checked={newTaskPriority === 1} onChange={() => setNewTaskPriority(1)} />
                                                <input type="radio" name="priority" value="2" className="radio radio-sm radio-primary bg-red-100 border-red-300 checked:bg-red-200 checked:text-red-600 checked:border-red-600" checked={newTaskPriority === 2} onChange={() => setNewTaskPriority(2)} />
                                            </div>
                                            <input type="date" className="input input-bordered input-sm w-full max-w-xs" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} required />
                                            <input type="time" className="input input-bordered input-sm w-full max-w-xs" value={newTaskTime} onChange={(e) => setNewTaskTime(e.target.value)} />
                                            <button onClick={() => addTask()} className="btn btn-sm btn-primary">Add Task</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-1 mt-2 p-2 bg-base-100 rounded-md">
                            <h3 className="text-md text-base-content align-middle">Notes</h3>
                            <textarea placeholder=" " className="textarea textarea-primary h-5/6 w-full" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} onBlur={saveNote}></textarea>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}