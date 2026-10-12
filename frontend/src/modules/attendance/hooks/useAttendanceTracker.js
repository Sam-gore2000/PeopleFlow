import { useCallback, useEffect, useRef, useState } from "react";
import { formatDuration, formatTime } from "../../../utils/format.js";
import { attendanceApi } from "../attendanceApi.js";

const RESYNC_MS = 60_000;

// Today's punch/break state for the signed-in user (any role), with live-ticking timers.
// Timers count forward from the server's figures, so a wrong clock on the user's PC doesn't matter.
export function useAttendanceTracker() {
  const [state, setState] = useState(null);
  const [syncedAt, setSyncedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const busyRef = useRef(false);

  const refresh = useCallback(async () => {
    const status = await attendanceApi.status();
    setState(status);
    setSyncedAt(Date.now());
    return status;
  }, []);

  useEffect(() => {
    refresh().catch((error) => setMessage({ type: "warning", text: error.message }));
    const resync = setInterval(() => refresh().catch(() => {}), RESYNC_MS);
    const onFocus = () => refresh().catch(() => {}); // picks up punches made in another tab
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(resync); window.removeEventListener("focus", onFocus); };
  }, [refresh]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const punchedIn = Boolean(state?.punched_in);
  const punchedOut = Boolean(state?.punched_out);
  const onBreak = Boolean(state?.on_break);
  const sinceSync = Math.max(0, Math.floor((now - syncedAt) / 1000));
  // Work time keeps counting during breaks (work = punch in -> punch out); break time is shown separately.
  const workSeconds = (state?.work_seconds || 0) + (punchedIn ? sinceSync : 0);
  const breakSeconds = (state?.break_seconds || 0) + (onBreak ? sinceSync : 0);

  async function run(action, successText) {
    if (busyRef.current) return; // ignore double clicks
    busyRef.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const result = await action();
      const status = await refresh();
      setMessage({ type: "success", text: successText(result, status) });
    } catch (error) {
      setMessage({ type: "warning", text: error.message });
      refresh().catch(() => {});
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const punchIn = () =>
    run(attendanceApi.punchIn, (result) =>
      result.action === "punchin" ? `Punched in at ${formatTime(result.punch_in)}.` : "You're already punched in."
    );

  const punchOut = () =>
    run(attendanceApi.punchOut, (result) => {
      if (result.action !== "punchout") return "You've already punched out today.";
      const worked = `Punched out. You worked ${formatDuration(result.data?.work_seconds)} today.`;
      return result.auto_ended_break ? `${worked} Your running break was ended automatically.` : worked;
    });

  const startBreak = () => run(attendanceApi.startBreak, () => "Break started. The timer is running.");
  const stopBreak = () => run(attendanceApi.stopBreak, (result) => `Break ended (${formatDuration(result.seconds)}).`);

  return {
    loaded: Boolean(state),
    attendance: state?.attendance || {},
    breakCount: state?.break_count || 0,
    workSeconds,
    breakSeconds,
    punchedIn,
    punchedOut,
    onBreak,
    busy,
    message,
    togglePunch: punchedIn ? punchOut : punchIn,
    toggleBreak: onBreak ? stopBreak : startBreak
  };
}
