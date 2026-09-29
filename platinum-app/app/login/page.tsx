"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (result.error) return setMessage(result.error.message);
    if (mode === "signup") {
      setMessage("Account created. If email confirmation is enabled, check your inbox.");
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="back-link">← Poker Clock</Link>
        <div className="eyebrow">PLATINUM ORGANIZER</div>
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="muted">Platinum subscription is prepared as a plan. Payment is intentionally not connected yet.</p>
        <form onSubmit={submit} className="form-stack">
          <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label>Password<input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></label>
          {message && <div className="notice">{message}</div>}
          <button className="button primary" type="submit">{mode === "login" ? "Log in" : "Create account"}</button>
        </form>
        <button className="link-button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Create a new account" : "I already have an account"}
        </button>
      </div>
    </main>
  );
}