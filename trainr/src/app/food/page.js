"use client";

import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";

export default function FoodPage() {
  return (
    <RequireAuth>
      <FoodInner />
    </RequireAuth>
  );
}

function FoodInner() {
  const { user } = useAuth();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

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

    setForm({ name: "", calories: "", protein: "", carbs: "", fat: "", servings: 1, barcode: "" });
    load();
  }

  async function lookupBarcode(barcode) {
    // OpenFoodFacts:
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data || data.status !== 1) {
      alert("Barcode not found. Try manual entry.");
      return;
    }
    const p = data.product;

    // values may exist per 100g; keep it simple:
    const nutr = p.nutriments || {};
    const name = p.product_name || "Unknown product";

    // Try common keys:
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
      <h1>Food Log</h1>
      <p>{today}</p>

      <h3>Scan Barcode</h3>
      <BarcodeScanner
        onDetected={(code) => {
          lookupBarcode(code);
        }}
      />

      <h3>Manual Barcode Lookup (fallback)</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Type barcode (EAN/UPC)"
          value={form.barcode}
          onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={() => lookupBarcode(form.barcode)} style={{ padding: 10 }}>
          Lookup
        </button>
      </div>

      <h3 style={{ marginTop: 20 }}>Add Food</h3>
      <form onSubmit={addEntry} style={{ display: "grid", gap: 10 }}>
        <input placeholder="Name" value={form.name} onChange={(e)=>setForm(f=>({ ...f, name: e.target.value }))} style={{ padding: 10 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          <input placeholder="Calories" value={form.calories} onChange={(e)=>setForm(f=>({ ...f, calories: e.target.value }))} style={{ padding: 10 }} />
          <input placeholder="Protein" value={form.protein} onChange={(e)=>setForm(f=>({ ...f, protein: e.target.value }))} style={{ padding: 10 }} />
          <input placeholder="Carbs" value={form.carbs} onChange={(e)=>setForm(f=>({ ...f, carbs: e.target.value }))} style={{ padding: 10 }} />
          <input placeholder="Fat" value={form.fat} onChange={(e)=>setForm(f=>({ ...f, fat: e.target.value }))} style={{ padding: 10 }} />
          <input placeholder="Servings" value={form.servings} onChange={(e)=>setForm(f=>({ ...f, servings: e.target.value }))} style={{ padding: 10 }} />
        </div>
        <button type="submit" style={{ padding: 10 }}>Save</button>
      </form>

      <h3 style={{ marginTop: 20 }}>Today’s entries</h3>
      <ul>
        {entries.map((e) => (
          <li key={e.id}>
            <b>{e.name}</b> — {e.calories} cal | P {e.protein}g | C {e.carbs}g | F {e.fat}g
          </li>
        ))}
      </ul>
    </div>
  );
}