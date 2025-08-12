import React, { useEffect, useState } from "react";

// BambooHR-Style Timer & Timesheet UI
// Single-file React + TypeScript component using Tailwind classes for styling.
// Default export is the main component so it can be previewed directly.

type AttendanceRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string | null; // ISO string
  checkOutTime?: string | null; // ISO string
  totalSeconds?: number;
  note?: string;
};

// Mock API helper - replace with real service calls (axios/fetch) later
const mockApi = {
  // Simulate server-side storage in-memory
  _todayRecord: null as AttendanceRecord | null,
  async getToday(): Promise<AttendanceRecord | null> {
    await new Promise((r) => setTimeout(r, 200));
    return this._todayRecord;
  },
  async checkIn(): Promise<AttendanceRecord> {
    await new Promise((r) => setTimeout(r, 300));
    const now = new Date();
    const rec: AttendanceRecord = {
      id: String(Date.now()),
      date: now.toISOString().slice(0, 10),
      checkInTime: now.toISOString(),
      checkOutTime: null,
      totalSeconds: 0,
    };
    this._todayRecord = rec;
    return rec;
  },
  async checkOut(id: string): Promise<AttendanceRecord> {
    await new Promise((r) => setTimeout(r, 300));
    if (!this._todayRecord || this._todayRecord.id !== id) throw new Error("not found");
    const now = new Date();
    this._todayRecord.checkOutTime = now.toISOString();
    const diff = Math.max(0, Math.floor((new Date(this._todayRecord.checkOutTime).getTime() - new Date(this._todayRecord.checkInTime!).getTime()) / 1000));
    this._todayRecord.totalSeconds = diff;
    return this._todayRecord;
  },
  async getTimesheet(from = 0): Promise<AttendanceRecord[]> {
    // return last 14 days mock
    await new Promise((r) => setTimeout(r, 200));
    const rows: AttendanceRecord[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const checkIn = new Date(d);
      checkIn.setHours(9, 0, 0);
      const checkOut = new Date(d);
      checkOut.setHours(17, 30 + (i % 3));
      const totalSeconds = Math.floor((checkOut.getTime() - checkIn.getTime()) / 1000);
      rows.push({
        id: `${dateStr}-${i}`,
        date: dateStr,
        checkInTime: checkIn.toISOString(),
        checkOutTime: checkOut.toISOString(),
        totalSeconds,
      });
    }
    return rows;
  },
};

function formatSeconds(totalSeconds = 0) {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function timeFromIso(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TimerBambo(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [secondsWorked, setSecondsWorked] = useState(0);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [timesheet, setTimesheet] = useState<AttendanceRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setIsLoading(true);
      try {
        const today = await mockApi.getToday();
        if (!mounted) return;
        if (today && today.checkInTime && !today.checkOutTime) {
          setAttendanceId(today.id);
          setIsCheckedIn(true);
          const diff = Math.floor((Date.now() - new Date(today.checkInTime).getTime()) / 1000);
          setSecondsWorked(diff);
          startTimer();
        }
        const ts = await mockApi.getTimesheet();
        if (!mounted) return;
        setTimesheet(ts);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    init();
    return () => {
      mounted = false;
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer control
  const [timerRef, setTimerRef] = useState<number | null>(null);
  function startTimer() {
    if (timerRef) return;
    const id = window.setInterval(() => setSecondsWorked((s) => s + 1), 1000);
    setTimerRef(id);
  }
  function stopTimer() {
    if (timerRef) {
      clearInterval(timerRef);
      setTimerRef(null);
    }
  }

  // Actions
  const handleCheckIn = async () => {
    setIsProcessing(true);
    try {
      const res = await mockApi.checkIn();
      setAttendanceId(res.id);
      setIsCheckedIn(true);
      setSecondsWorked(0);
      startTimer();
      // refresh timesheet first row
      setTimesheet((t) => [res, ...t]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!attendanceId) return;
    setIsProcessing(true);
    try {
      const res = await mockApi.checkOut(attendanceId);
      setIsCheckedIn(false);
      stopTimer();
      setSecondsWorked(res.totalSeconds ?? 0);
      // update timesheet
      setTimesheet((t) => [res, ...t.filter((r) => r.date !== res.date)]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // UI parts
  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-500 flex items-center justify-center text-white text-lg font-semibold">HR</div>
          <div>
            <h1 className="text-2xl font-semibold">Attendance</h1>
            <p className="text-sm text-gray-500">Today • {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="bg-white shadow rounded-lg px-5 py-3 text-center">
            <div className="text-xs text-gray-500">Today</div>
            <div className="text-xl font-mono mt-1">{formatSeconds(secondsWorked)}</div>
            <div className="text-xs text-gray-400">Running time</div>
          </div>

          <div className="bg-white shadow rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="flex flex-col">
              <div className="text-xs text-gray-500">Check In</div>
              <div className="text-sm font-medium">{isCheckedIn ? timeFromIso(new Date(Date.now() - secondsWorked * 1000).toISOString()) : "-"}</div>
            </div>
            <div className="flex flex-col">
              <div className="text-xs text-gray-500">Check Out</div>
              <div className="text-sm font-medium">{isCheckedIn ? "-" : "-"}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckIn}
              disabled={isCheckedIn || isProcessing}
              className={`px-4 py-2 rounded-md text-white font-medium shadow ${isCheckedIn ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!isCheckedIn || isProcessing}
              className={`px-4 py-2 rounded-md text-white font-medium shadow ${!isCheckedIn ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}>
              Check Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timesheet */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Timesheet</h2>
            <div className="flex items-center gap-2">
              <input type="date" className="border px-2 py-1 rounded-md text-sm" />
              <input type="date" className="border px-2 py-1 rounded-md text-sm" />
              <button className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm">Filter</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Check In</th>
                  <th className="py-2 px-3">Check Out</th>
                  <th className="py-2 px-3">Hours</th>
                  <th className="py-2 px-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-500">Loading…</td></tr>
                ) : (
                  timesheet.map((row) => (
                    <tr key={row.id} className="border-t last:border-b hover:bg-gray-50">
                      <td className="py-3 px-3 align-top">
                        <div className="text-sm font-medium">{row.date}</div>
                        <div className="text-xs text-gray-400">{new Date(row.date).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 px-3 align-top">{timeFromIso(row.checkInTime)}</td>
                      <td className="py-3 px-3 align-top">{timeFromIso(row.checkOutTime)}</td>
                      <td className="py-3 px-3 align-top">{formatSeconds(row.totalSeconds)}</td>
                      <td className="py-3 px-3 align-top text-sm text-gray-600">{row.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Summary & Actions */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-4">
          <div>
            <h3 className="text-sm text-gray-500">This Week</h3>
            <div className="text-2xl font-semibold mt-1">{formatSeconds(timesheet.slice(0,7).reduce((s, r) => s + (r.totalSeconds || 0), 0))}</div>
            <div className="text-sm text-gray-400">Total hours tracked</div>
          </div>

          <div>
            <h3 className="text-sm text-gray-500">Quick Actions</h3>
            <div className="mt-2 flex flex-col gap-2">
              <button className="w-full text-left px-3 py-2 border rounded-md hover:bg-gray-50">Add Manual Entry</button>
              <button className="w-full text-left px-3 py-2 border rounded-md hover:bg-gray-50">Export CSV</button>
              <button className="w-full text-left px-3 py-2 border rounded-md hover:bg-gray-50">Request Edit</button>
            </div>
          </div>

          <div className="mt-auto text-xs text-gray-400">Design inspired by BambooHR • Implementation mock (replace mockApi with real endpoints)</div>
        </div>
      </div>
    </div>
  );
}
