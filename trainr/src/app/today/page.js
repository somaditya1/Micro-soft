"use client";

import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { format } from "date-fns";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TodayPage() {
  return (
    <RequireAuth>
      <TodayInner />
    </RequireAuth>
  );
}

function TodayInner() {
  const { user } = useAuth();
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    async function load() {
      const q = query(
        collection(db, "food_entries"),
        where("userId", "==", user.uid),
        where("date", "==", today)
      );
      const snap = await getDocs(q);
      let t = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      snap.forEach((doc) => {
        const d = doc.data();
        t.calories += d.calories;
        t.protein += d.protein;
        t.carbs += d.carbs;
        t.fat += d.fat;
      });
      setTotals(t);
    }
    load();
  }, [user.uid, today]);

  return (
    <div style={{ maxWidth: 720, margin: "30px auto", padding: 12 }}>
      <h1>Today</h1>
      <p>{today}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        <Card title="Calories" value={totals.calories} />
        <Card title="Protein (g)" value={totals.protein.toFixed(1)} />
        <Card title="Carbs (g)" value={totals.carbs.toFixed(1)} />
        <Card title="Fat (g)" value={totals.fat.toFixed(1)} />
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        <Link href="/food">Food Log</Link>
        <Link href="/workout">Workout Log</Link>
        <Link href="/schedule">Schedule</Link>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 10 }}>
      <div style={{ opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
    </div>
  );
}