"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SubscriptionPage(){
  const supabase=createClient();
  const [status,setStatus]=useState("trial");
  const [email,setEmail]=useState("");
  useEffect(()=>{(async()=>{const {data:user}=await supabase.auth.getUser();if(!user.user)return window.location.href="/login";setEmail(user.user.email||"");const {data:p}=await supabase.from("profiles").select("subscription_status,plan").eq("id",user.user.id).single();if(p)setStatus(p.subscription_status)})()},[]);
  return <main className="auth-page"><div className="auth-card"><div className="eyebrow">SUBSCRIPTION</div><h1>Platinum</h1><p className="muted">{email}</p><div className="notice">Status: <b>{status}</b><br/>Payment is not connected yet. The application already models the Platinum subscription so billing can be added later without changing tournament/session data.</div><div className="feature-grid" style={{color:"#111"}}><div><b>Unlimited tournaments</b><span>Saved in the database</span></div><div><b>Remote control</b><span>Phone/tablet to TV</span></div><div><b>Branding</b><span>Club and event display</span></div><div><b>Sponsors</b><span>Permanent + advertising overlay</span></div></div></div></main>;
}