import { useEffect, useState } from "react";
import { CalendarDays, FileText, RefreshCw } from "lucide-react";
import { api } from "../api/client";

const REFRESH_MS = 3000;

export default function Logs() {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDates = async () => {
    try {
      const response = await api.logs.list();
      const nextDates = [...(response.dates || [])].sort((a, b) => b.localeCompare(a));
      setDates(nextDates);
      setSelectedDate((current) => {
        if (current && nextDates.includes(current)) return current;
        return nextDates[0] || "";
      });
      setError("");
    } catch {
      setDates([]);
      setSelectedDate("");
      setError("Unable to load log dates.");
    }
  };

  const loadLog = async (date: string) => {
    if (!date) {
      setContent("");
      return;
    }

    try {
      const response = await api.logs.get(date);
      setContent(response.content || "");
      setError("");
    } catch {
      setContent("");
      setError(`Unable to load logs for ${date}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDates();
  }, []);

  useEffect(() => {
    if (!selectedDate) {
      setLoading(false);
      return;
    }

    void loadLog(selectedDate);
    const interval = window.setInterval(() => {
      void loadLog(selectedDate);
    }, REFRESH_MS);

    return () => window.clearInterval(interval);
  }, [selectedDate]);

  return (
    <div className="h-full flex flex-col">
      <header className="shrink-0 flex items-center justify-between px-6 h-14 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-slate-400" />
          <h1 className="text-lg font-semibold text-white">Agent logs</h1>
        </div>
        <button
          type="button"
          onClick={() => void loadDates()}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </header>

      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-slate-800/50">
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <CalendarDays className="w-4 h-4" />
          <select
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="bg-slate-800 text-slate-200 rounded-md border border-slate-700 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {dates.length === 0 ? (
              <option value="">No logs available</option>
            ) : (
              dates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))
            )}
          </select>
        </label>
        <span className="text-xs text-slate-600">Auto-refresh every 3s</span>
      </div>

      {error ? (
        <div className="p-6 text-sm text-red-400">{error}</div>
      ) : null}

      <div className="flex-1 overflow-auto bg-slate-950/80">
        <pre className="h-full min-h-[320px] w-full overflow-auto whitespace-pre-wrap break-words px-6 py-4 font-mono text-xs leading-6 text-slate-300">
          {loading ? "Loading log…" : content || "No log entries for this date."}
        </pre>
      </div>
    </div>
  );
}
