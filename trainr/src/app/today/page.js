"use client";

// import statements for components we will use
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { format, subDays } from "date-fns";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";

// imports for our graphs
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

// authenticates user
export default function TodayPage() {
    return (
        <RequireAuth>
            <TodayInner />
        </RequireAuth>
    );
}

function TodayInner() {
    const { user } = useAuth(); // current logged-in user
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const startStr = format(subDays(new Date(), 6), "yyyy-MM-dd"); // last 7 days includes today

    const [todayTotals, setTodayTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    const [weekData, setWeekData] = useState([]); // [{date, calories, protein, carbs, fat}]

    const [calorieGoal, setCalorieGoal] = useState(2000);
    const [goalInput, setGoalInput] = useState("2000");

    useEffect(() => {
        async function load() {
            // query last 7 days by date string range
            const q = query(
                collection(db, "food_entries"),
                where("userId", "==", user.uid),
                where("date", ">=", startStr),
                where("date", "<=", todayStr)
            );

            const snap = await getDocs(q);
            const rows = snap.docs.map((d) => d.data());

            // we compile data into a map by date
            const map = new Map();
            for (const r of rows) {
                const d = r.date;
                if (!map.has(d)) {
                    map.set(d, { date: d, calories: 0, protein: 0, carbs: 0, fat: 0 });
                }
                const agg = map.get(d);
                agg.calories += Number(r.calories) || 0;
                agg.protein += Number(r.protein) || 0;
                agg.carbs += Number(r.carbs) || 0;
                agg.fat += Number(r.fat) || 0;
            }

            // ensure all 7 days exist
            const arr = [];
            for (let i = 6; i >= 0; i--) {
                const d = format(subDays(new Date(), i), "yyyy-MM-dd");
                arr.push(map.get(d) || { date: d, calories: 0, protein: 0, carbs: 0, fat: 0 });
            }

            setWeekData(arr);

            // today totals from today's 'bucket'
            const todayBucket = arr[arr.length - 1];
            setTodayTotals({
                calories: todayBucket.calories,
                protein: todayBucket.protein,
                carbs: todayBucket.carbs,
                fat: todayBucket.fat,
            });
        }

        // load the calorie goal from Firebase
        async function loadGoal() {
            const ref = doc(db, "profiles", user.uid);
            const snap = await getDoc(ref);

            if (snap.exists() && snap.data().calorieGoal) {
                const g = Number(snap.data().calorieGoal);
                setCalorieGoal(g);
                setGoalInput(String(g));
            } else {
                // create default profile doc once
                await setDoc(ref, { calorieGoal: 2200 }, { merge: true });
            }
        }

        if (user?.uid) loadGoal();
        if (user?.uid) load();
    }, [user?.uid, startStr, todayStr]);

    const chartData = useMemo(() => {
        // nicer labels
        return weekData.map((d) => ({
            ...d,
            label: d.date.slice(5), // "MM-dd"
        }));
    }, [weekData]);

    async function saveGoal() {
        const g = Math.max(0, Number(goalInput) || 0);
        setCalorieGoal(g);

        await setDoc(doc(db, "profiles", user.uid), { calorieGoal: g }, { merge: true });
    }

    // page style and appearance

    return (
        <div style={{ maxWidth: 900, margin: "30px auto", padding: 12 }}>
            <h1>Today</h1>
            <p>{todayStr}</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                <Card title="Calories" value={Math.round(todayTotals.calories)} />
                <Card title="Protein (g)" value={todayTotals.protein.toFixed(1)} />
                <Card title="Carbs (g)" value={todayTotals.carbs.toFixed(1)} />
                <Card title="Fat (g)" value={todayTotals.fat.toFixed(1)} />
            </div>

            <div style={{ marginTop: 20, border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div>
                        <div style={{ fontWeight: 800 }}>Daily Calorie Goal</div>
                        <div style={{ opacity: 0.75 }}>
                            {Math.round(todayTotals.calories)} / {Math.round(calorieGoal)} kcal
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                            type="number"
                            value={goalInput}
                            onChange={(e) => setGoalInput(e.target.value)}
                            style={{ width: 110, padding: 8, border: "1px solid #ccc", borderRadius: 8 }}
                        />
                        <button
                            onClick={saveGoal}
                            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc" }}
                        >
                            Save
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginTop: 12, height: 14, borderRadius: 999, background: "#eee", overflow: "hidden" }}>
                    <div
                        style={{
                            height: "100%",
                            width: `${Math.min(100, calorieGoal ? (todayTotals.calories / calorieGoal) * 100 : 0)}%`,
                            background: todayTotals.calories > calorieGoal ? "#dc2626" : "#16a34a", // red if over, green if under
                            transition: "width 200ms",
                        }}
                    />
                </div>

                <div style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}>
                    {calorieGoal > 0
                        ? todayTotals.calories > calorieGoal
                            ? `Over by ${Math.round(todayTotals.calories - calorieGoal)} kcal`
                            : `${Math.round(calorieGoal - todayTotals.calories)} kcal remaining`
                        : "Set a goal to see progress"}
                </div>
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                <Link href="/food">Food Log</Link>
                <Link href="/workout">Workout Log</Link>
                <Link href="/schedule">Schedule</Link>
            </div>

            <h2 style={{ marginTop: 30 }}>Last 7 days</h2>

            <div style={{ height: 280, border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Calories</div>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="calories" strokeWidth={3} dot />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div style={{ height: 280, border: "1px solid #eee", borderRadius: 12, padding: 12, marginTop: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Protein (g)</div>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="protein" strokeWidth={3} dot />
                    </LineChart>
                </ResponsiveContainer>
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