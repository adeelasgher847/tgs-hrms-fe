import React, { useState, useMemo, useEffect } from "react";
import { Box, Paper } from "@mui/material";
import TimesheetList from "./SheetList";
import TimesheetSummary from "./TimesheetSummary";

const getMonday = (date: Date) => {
	const d = new Date(date);
	const day = d.getDay();
	const diff = (day === 0 ? -6 : 1) - day; // adjust when day is Sunday
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
};

const dayAbbrevs = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const formatMonthDay = (date: Date) => {
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
};

const formatTime = (date: Date) =>
	date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();

// Key generator for localStorage per week
const weekKey = (weekStart: Date) => {
	const iso = new Date(weekStart);
	iso.setHours(0, 0, 0, 0);
	return `timesheet:${iso.toISOString().slice(0, 10)}`; // YYYY-MM-DD of Monday
};

// Static template data (no API): Mon–Wed 8h 9–5, others 0h
const buildWeekTemplate = (weekStart: Date) => {
	const hoursTemplate = [8, 8, 8, 0, 0, 0, 0];
	const entries = [] as {
		day: string;
		date: string;
		hours: number;
		ranges: string[];
		startTs?: number | null;
		endTs?: number | null;
	}[];
	for (let i = 0; i < 7; i += 1) {
		const d = new Date(weekStart);
		d.setDate(weekStart.getDate() + i);
		const hours = hoursTemplate[i];
		entries.push({
			day: dayAbbrevs[i],
			date: formatMonthDay(d),
			hours,
			ranges: hours > 0 ? ["9:00 AM - 5:00 PM"] : [],
			startTs: null,
			endTs: null,
		});
	}
	return entries;
};

const loadWeek = (weekStart: Date) => {
	try {
		const raw = localStorage.getItem(weekKey(weekStart));
		if (raw) return JSON.parse(raw);
	} catch {}
	return buildWeekTemplate(weekStart);
};

const saveWeek = (weekStart: Date, entries: any) => {
	try {
		localStorage.setItem(weekKey(weekStart), JSON.stringify(entries));
	} catch {}
};

const TimesheetLayout: React.FC = () => {
	const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
	const [entries, setEntries] = useState(() => loadWeek(getMonday(new Date())));

	useEffect(() => {
		setEntries(loadWeek(weekStart));
	}, [weekStart]);

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const currentDayIndex = useMemo(() => {
		const end = new Date(weekStart);
		end.setDate(weekStart.getDate() + 6);
		if (today < weekStart || today > end) return null;
		return (today.getDay() + 6) % 7; // Mon=0
	}, [today.getTime?.() ?? 0, weekStart]);

	const [isClockedIn, setIsClockedIn] = useState(false);
	const [startTime, setStartTime] = useState<number | null>(null);

	// Sync with MyTimeCard via localStorage on mount
	useEffect(() => {
		const savedStart = localStorage.getItem("clockInTime");
		if (savedStart) {
			setIsClockedIn(true);
			setStartTime(parseInt(savedStart, 10));
		}
		const onStorage = (e: StorageEvent) => {
			if (e.key === "clockInTime") {
				if (e.newValue) {
					setIsClockedIn(true);
					setStartTime(parseInt(e.newValue, 10));
				} else {
					setIsClockedIn(false);
					setStartTime(null);
				}
			}
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	const handleClockIn = () => {
		const monday = getMonday(new Date());
		const ts = Date.now();
		const index = (new Date().getDay() + 6) % 7;
		const data = loadWeek(monday);
		const startLabel = formatTime(new Date(ts));
		data[index] = {
			...data[index],
			startTs: ts,
			endTs: null,
			ranges: [`${startLabel} -`],
		};
		saveWeek(monday, data);
		localStorage.setItem("clockInTime", ts.toString());
		localStorage.setItem("lastClockInTime", ts.toString());
		setWeekStart(monday);
		setEntries(data);
		setIsClockedIn(true);
		setStartTime(ts);
	};

	const handleClockOut = () => {
		const monday = getMonday(new Date());
		const ts = Date.now();
		const index = (new Date().getDay() + 6) % 7;
		const data = loadWeek(monday);
		const startTs = data[index]?.startTs ?? ts;
		const rawHours = Math.max(0, (ts - startTs) / 3_600_000);
		const workedHours = Math.round(rawHours * 100) / 100; // keep minutes precision
		const startLabel = formatTime(new Date(startTs));
		const endLabel = formatTime(new Date(ts));
		data[index] = {
			...data[index],
			endTs: ts,
			hours: workedHours,
			ranges: [`${startLabel} - ${endLabel}`],
		};
		saveWeek(monday, data);
		localStorage.removeItem("clockInTime");
		localStorage.setItem("lastClockOutTime", ts.toString());
		setWeekStart(monday);
		setEntries(data);
		setIsClockedIn(false);
		setStartTime(null);
	};

	const goPrevWeek = () => {
		const d = new Date(weekStart);
		d.setDate(weekStart.getDate() - 7);
		setWeekStart(getMonday(d));
	};

	const goNextWeek = () => {
		const d = new Date(weekStart);
		d.setDate(weekStart.getDate() + 7);
		setWeekStart(getMonday(d));
	};

	// Live-updating weekly total (adds running session time if any)
	const [tick, setTick] = useState(0);
	useEffect(() => {
		let t: number | undefined;
		if (isClockedIn) {
			t = window.setInterval(() => setTick((v) => v + 1), 1000);
		}
		return () => {
			if (t) window.clearInterval(t);
		};
	}, [isClockedIn]);

	const weekTotalHours = useMemo(() => {
		const base = entries.reduce((sum: number, e: any) => sum + (e.hours || 0), 0);
		if (isClockedIn && startTime && currentDayIndex != null) {
			return base + (Date.now() - startTime) / 3_600_000;
		}
		return base;
	}, [entries, isClockedIn, startTime, currentDayIndex, tick]);

	return (
		<Box display="flex" gap={2}>
			<Paper sx={{ flex: 1 }}>
				<TimesheetList
					entries={entries}
					currentDayIndex={currentDayIndex}
					isClockedIn={isClockedIn}
					startTime={startTime}
					weekStart={weekStart}
					onPrevWeek={goPrevWeek}
					onNextWeek={goNextWeek}
				/>
			</Paper>

			<Paper sx={{ width: 350, p: 0 }}>
				<TimesheetSummary
					isClockedIn={isClockedIn}
					startTime={startTime}
					onClockIn={handleClockIn}
					onClockOut={handleClockOut}
					weekStart={weekStart}
					weekTotalHours={weekTotalHours}
				/>
			</Paper>
		</Box>
	);
};

export default TimesheetLayout;
