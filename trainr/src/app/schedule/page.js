"use client";

import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";


export default function SchedulePage() {
  return (
    <RequireAuth>
      <ScheduleInner />
    </RequireAuth>
  );
}

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function ScheduleInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [weekdays, setWeekdays] = useState([1,3,5]);
  const [time, setTime] = useState("18:00");
  const [label, setLabel] = useState("Workout");

  const ref = useMemo(() => doc(db, "schedule", user.uid), [user.uid]);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        setWeekdays(d.weekdays || [1,3,5]);
        setTime(d.time || "18:00");
        setLabel(d.label || "Workout");
      }
    }
    load();
  }, [ref]);

  async function save() {
    await setDoc(ref, { userId: user.uid, weekdays, time, label }, { merge: true });
    alert("Saved!");
  }

  const nextWorkoutText = useMemo(() => {
    // compute next occurrence from now
    const now = new Date();
    const [hh, mm] = time.split(":").map(Number);

    // check next 14 days
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      d.setHours(hh, mm, 0, 0);
      if (weekdays.includes(d.getDay()) && d > now) {
        return `${DAYS[d.getDay()]} at ${time}`;
      }
    }
    return "No upcoming workout found.";
  }, [time, weekdays]);

  function toggleDay(dayIdx) {
    setWeekdays((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx].sort()
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "30px auto", padding: 12 }}>
        <button
                onClick={() => router.push("/today")}
                style={{
                    marginBottom: 20,
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    background: "#000000",
                    cursor: "pointer",
                }}
            >
                ← Back to Today
            </button>
      <h1>Schedule</h1>

      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 10, marginBottom: 12 }}>
        <b>Next workout:</b> {nextWorkoutText} ({label})
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <input value={label} onChange={(e)=>setLabel(e.target.value)} style={{ border: "2px solid gray", padding: 10 }} placeholder="Label (Push/Pull/Legs)" />
        <div>
          <div style={{ marginBottom: 6 }}>Days</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {DAYS.map((d, idx) => (
              <button
                key={d}
                onClick={() => toggleDay(idx)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: weekdays.includes(idx) ? "black" : "darkgray",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>Time</div>
          <input type="time" value={time} onChange={(e)=>setTime(e.target.value)} style={{ border: "2px solid gray", padding: 10 }} />
        </div>

        <button onClick={save} style={{ border: "2px solid gray", padding: 10 }}>
          Save Schedule
        </button>
      </div>
    </div>
  );
}