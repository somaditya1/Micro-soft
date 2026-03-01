"use client";

import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { addDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function WorkoutPage() {
  return (
    <RequireAuth>
      <WorkoutInner />
    </RequireAuth>
  );
}

function WorkoutInner() {
  const { user } = useAuth();
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");

  const [workouts, setWorkouts] = useState([]);
  const [title, setTitle] = useState("Workout");
  const [exercise, setExercise] = useState("Bench Press");
  const [reps, setReps] = useState(8);
  const [weight, setWeight] = useState(135);

  async function load() {
    const q = query(
      collection(db, "workouts"),
      where("userId", "==", user.uid),
      where("date", "==", today),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    setWorkouts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  async function addWorkout(e) {
    e.preventDefault();
    await addDoc(collection(db, "workouts"), {
      userId: user.uid,
      date: today,
      title,
      exercises: [
        {
          name: exercise,
          sets: [{ reps: Number(reps), weight: Number(weight) }],
        },
      ],
      createdAt: new Date(),
    });
    load();
  }

  return (
    <div style={{ maxWidth: 820, margin: "30px auto", padding: 12 }}>
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
      <h1>Workout Log</h1>
      <p>{today}</p>

      <h3>Create quick workout</h3>
      <form onSubmit={addWorkout} style={{ display: "grid", gap: 10 }}><br></br>
        <label htmlFor="workout-title">Workout Title</label>
        <input value={title} id="workout-title" onChange={(e)=>setTitle(e.target.value)} style={{ border: "2px solid gray", padding: 10}} placeholder="Workout title" /><br></br>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <label htmlFor="exercise">Exercise</label>
          <label htmlFor="reps">Reps</label>
          <label htmlFor="weight">Weight (lbs)</label>
          <input value={exercise} id="exercise" onChange={(e)=>setExercise(e.target.value)} style={{ border: "2px solid gray", padding: 10 }} placeholder="Exercise" /> 
          <input value={reps} id="reps" onChange={(e)=>setReps(e.target.value)} style={{ border: "2px solid gray", padding: 10 }} placeholder="Reps" />
          <input value={weight} id="weight" onChange={(e)=>setWeight(e.target.value)} style={{ border: "2px solid gray", padding: 10 }} placeholder="Weight" />
        </div>
        <button type="submit" style={{ border: "2px solid gray", padding: 10 }}>Save Workout</button>
      </form>

      <h3 style={{ marginTop: 20 }}>Today’s workouts</h3>
      {workouts.map((w) => (
        <div key={w.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 10, marginBottom: 10 }}>
          <b>{w.title}</b>
          <ul>
            {(w.exercises || []).map((ex, idx) => (
              <li key={idx}>
                {ex.name}: {(ex.sets || []).map((s, sidx) => (
                  <span key={sidx}> {s.weight}x{s.reps}</span>
                ))}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}