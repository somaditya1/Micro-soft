"use client";

// import statements for components we will use
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";
import { deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

// makes sure only signed in users can see this page
export default function FoodPage() {
    return (
        <RequireAuth>
            <FoodInner />
        </RequireAuth>
    );
}


function FoodInner() {
    const { user } = useAuth(); // verifies current user
    const router = useRouter(); // used for back navigation

    // vars to store relevent information

    const today = format(new Date(), "yyyy-MM-dd");

    const [entries, setEntries] = useState([]);
    const [form, setForm] = useState({
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        servings: 1,
        barcode: "",
    });

    // we load our data which gets stored on Firebase
    async function load() {
        const q = query(
            collection(db, "food_entries"),
            where("userId", "==", user.uid),
            where("date", "==", today),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    useEffect(() => {
        load();
    }, [user.uid]);

    // adds new entry into Firebase
    async function addEntry(e) {
        e.preventDefault();
        const calories = Number(form.calories) || 0;
        const protein = Number(form.protein) || 0;
        const carbs = Number(form.carbs) || 0;
        const fat = Number(form.fat) || 0;
        const servings = Number(form.servings) || 1;

        await addDoc(collection(db, "food_entries"), {
            userId: user.uid,
            date: today,
            name: form.name || "Food",
            calories: calories * servings,
            protein: protein * servings,
            carbs: carbs * servings,
            fat: fat * servings,
            servings,
            barcode: form.barcode || null,
            createdAt: new Date(),
        });

        // reset the form after saving new entry
        setForm({ name: "", calories: "", protein: "", carbs: "", fat: "", servings: 1, barcode: "" });
        load();
    }

    // removes entry from list
    async function removeEntry(entryId) {
        const ok = confirm("Delete this Entry?");
        if (!ok) return;

        await deleteDoc(doc(db, "food_entries", entryId));
        load(); // refresh list
    }

    // look up barcode information once inputted
    async function lookupBarcode(barcode) {
        // use OpenFoodFacts to pull nutrition facts:
        const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
        const res = await fetch(url);
        const data = await res.json();

        // handles barcode error
        if (!data || data.status !== 1) {
            alert("Barcode not found. Try manual entry.");
            return;
        }
        const p = data.product;

        const nutr = p.nutriments || {};
        const name = p.product_name || "Unknown product";

        // exact nutrition values
        const calories = nutr["energy-kcal_100g"] ?? nutr["energy-kcal_serving"] ?? 0;
        const protein = nutr["proteins_100g"] ?? nutr["proteins_serving"] ?? 0;
        const carbs = nutr["carbohydrates_100g"] ?? nutr["carbohydrates_serving"] ?? 0;
        const fat = nutr["fat_100g"] ?? nutr["fat_serving"] ?? 0;

        setForm((f) => ({
            ...f,
            barcode,
            name,
            calories: String(calories),
            protein: String(protein),
            carbs: String(carbs),
            fat: String(fat),
        }));
    }

    return (
        <div style={{ maxWidth: 820, margin: "30px auto", padding: 12 }}> 
            <button //back button
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
            <h1>Food Log</h1>
            <p>{today}</p>

            <h3>Scan Barcode</h3>
            <BarcodeScanner
                onDetected={(code) => {
                    lookupBarcode(code);
                }}
            />

            <br></br><h3>Manual Barcode Lookup</h3> 
            <div style={{ display: "flex", gap: 8 }}>
                <input
                    placeholder="Type barcode (EAN/UPC)"
                    value={form.barcode}
                    onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                    style={{ border: "2px solid gray", flex: 1, padding: 10 }}
                />
                <button onClick={() => lookupBarcode(form.barcode)} style={{ border: "2px solid gray", padding: 10 }}>
                    Lookup
                </button>
            </div>

            <h3 style={{ marginTop: 20 }}>Add Food</h3>
            <form onSubmit={addEntry} style={{ display: "grid", gap: 10 }}>
                <input placeholder="Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} style={{ border: "2px solid gray" }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 100fr)", gap: 1 }}>
                    <label htmlFor="calories">Calories:</label>
                    <input placeholder="Calories" id="calories" value={form.calories} onChange={(e) => setForm(f => ({ ...f, calories: e.target.value }))} style={{ border: "2px solid gray" }} /><br></br>
                    <label htmlFor="protein">Protein (g):</label>
                    <input placeholder="Protein" id="protein" value={form.protein} onChange={(e) => setForm(f => ({ ...f, protein: e.target.value }))} style={{ border: "2px solid gray" }} />
                    <label htmlFor="carbs">Carbs (g):</label>
                    <input placeholder="Carbs" id="carbs" value={form.carbs} onChange={(e) => setForm(f => ({ ...f, carbs: e.target.value }))} style={{ border: "2px solid gray" }} /><br></br>
                    <label htmlFor="fat">Fat (g):</label>
                    <input placeholder="Fat" id="fat" value={form.fat} onChange={(e) => setForm(f => ({ ...f, fat: e.target.value }))} style={{ border: "2px solid gray" }} />
                    <label htmlFor="servings">Servings:</label>
                    <input placeholder="Servings" id="servings" value={form.servings} onChange={(e) => setForm(f => ({ ...f, servings: e.target.value }))} style={{ border: "2px solid gray" }} />
                </div>
                <button type="submit" style={{ padding: 10 }}>Save</button>
            </form>

            <h3 style={{ marginTop: 20 }}>Today’s entries</h3>
            <ul>
                {entries.map((e) => (
                    <li key={e.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <span>
                            <b>{e.name}</b> — {e.calories} cal | P {e.protein}g | C {e.carbs}g | F {e.fat}g
                        </span>

                        <button onClick={() => removeEntry(e.id)} style={{ color: "crimson" }}>
                            Remove
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}