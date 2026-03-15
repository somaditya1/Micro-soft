"use client";

// import statements for components we will use
import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";


export default function LoginPage() {
  const router = useRouter(); // used to redirect successful log-in
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  // signs in exisiting user
  async function signIn(e) {
    e.preventDefault();
    setErr("");
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      router.push("/today");
    } catch (e) {
      setErr(e.message);
    }
  }

  // creates new user entry in Firebase
  async function signUp(e) {
    e.preventDefault();
    setErr("");
    try {
      await createUserWithEmailAndPassword(auth, email, pw);
      router.push("/today");
    } catch (e) {
      setErr(e.message);
    }
  }
   // Page button's and text boxes
  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Trainr</h1>
      <p>Sign in or create an account.</p>

      <form>
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} style={{ width:"100%", padding:10, marginBottom:10 }} />
        <input placeholder="Password" type="password" value={pw} onChange={(e)=>setPw(e.target.value)} style={{ width:"100%", padding:10, marginBottom:10 }} />
        {err && <p style={{ color: "crimson" }}>{err}</p>}
        <button onClick={signIn} style={{ border: "2px solid gray", width:"100%", padding:10, marginBottom:10 }}>Sign In</button>
        <button onClick={signUp} style={{ border: "2px solid gray", width:"100%", padding:10 }}>Sign Up</button>
      </form>
    </div>
  );
}