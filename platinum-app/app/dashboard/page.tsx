"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { standardLevels, defaultPayouts, defaultSponsor } from "@/lib/presets";

type Row = { id:string; name:string; starting_stack:number; total_entries:number; entry_fee:number; updated_at:string };

function makeCode(){ return String(Math.floor(100000 + Math.random()*900000)); }

export default function Dashboard(){
  const supabase=createClient();
  const [rows,setRows]=useState<Row[]>([]);
  const [email,setEmail]=useState("");
  const [name,setName]=useState("Saturday Tournament");
  const [stack,setStack]=useState(10000);
  const [entries,setEntries]=useState(30);
  const [fee,setFee]=useState(600);
  const [message,setMessage]=useState("");

  async function load(){
    const {data:user}=await supabase.auth.getUser();
    if(!user.user){ window.location.href="/login"; return; }
    setEmail(user.user.email||"");
    const {data,error}=await supabase.from("tournaments").select("id,name,starting_stack,total_entries,entry_fee,updated_at").order("updated_at",{ascending:false});
    if(error)setMessage(error.message); else setRows((data||[]) as Row[]);
  }
  useEffect(()=>{load()},[]);

  async function createTournament(){
    setMessage("");
    const {data:user}=await supabase.auth.getUser();
    if(!user.user)return window.location.href="/login";
    const {data:t,error}=await supabase.from("tournaments").insert({
      owner_id:user.user.id,name,starting_stack:stack,total_entries:entries,entry_fee:fee
    }).select().single();
    if(error)return setMessage(error.message);
    const levels=standardLevels.map((x,i)=>({...x,tournament_id:t.id,position:i+1}));
    await supabase.from("tournament_levels").insert(levels);
    await supabase.from("payouts").insert(defaultPayouts.map(x=>({...x,tournament_id:t.id})));
    await supabase.from("sponsors").insert({...defaultSponsor,tournament_id:t.id});
    setName("Saturday Tournament"); setMessage("Tournament created."); load();
  }

  async function start(id:string){
    const code=makeCode();
    const {data:user}=await supabase.auth.getUser();
    const total=rows.find(x=>x.id===id)?.total_entries||30;
    const {data:s,error}=await supabase.from("sessions").insert({
      tournament_id:id,owner_id:user.user?.id,pairing_code:code,status:"ready",remaining_players:total,total_entries:total
    }).select().single();
    if(error)return setMessage(error.message);
    window.location.href="/control?session="+s.id;
  }

  async function signOut(){ await supabase.auth.signOut(); window.location.href="/"; }

  const subtitle=useMemo(()=>rows.length===0?"No tournaments yet. Create your first Platinum tournament.":rows.length+" saved tournament"+(rows.length===1?"":"s")+" · unlimited Platinum storage",[rows.length]);

  return <main className="shell">
    <header className="app-header">
      <div><div className="eyebrow">POKER CLOCK <span className="badge">PLATINUM</span></div><h1>Organizer</h1><p className="muted">{subtitle}</p></div>
      <div className="header-actions"><span className="user-pill">{email}</span><button className="button" onClick={signOut}>Log out</button></div>
    </header>
    <section className="dashboard-grid">
      <div className="panel">
        <div className="panel-head"><h2>New tournament</h2><span className="status-dot">● Platinum trial</span></div>
        <div className="panel-body">
          <div className="form-grid">
            <label className="full">Tournament name<input value={name} onChange={e=>setName(e.target.value)} /></label>
            <label>Players / entries<input type="number" min={2} value={entries} onChange={e=>setEntries(Number(e.target.value)||2)} /></label>
            <label>Starting stack<input type="number" min={100} value={stack} onChange={e=>setStack(Number(e.target.value)||100)} /></label>
            <label>Entry fee (€)<input type="number" min={0} value={fee} onChange={e=>setFee(Number(e.target.value)||0)} /></label>
          </div>
          <button className="button primary wide" onClick={createTournament}>Create Platinum tournament</button>
          {message && <div className="notice">{message}</div>}
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><h2>Saved tournaments</h2><div className="header-actions"><Link className="text-link" href="/subscription">Subscription</Link><Link className="text-link" href="/tv">TV mode</Link></div></div>
        <div className="panel-body list">
          {rows.map(t=><div className="tournament-card" key={t.id}>
            <div><h3>{t.name}</h3><p className="muted">{t.total_entries} entries · {Number(t.entry_fee).toLocaleString("de-DE",{style:"currency",currency:"EUR"})} · stack {t.starting_stack.toLocaleString()}</p></div>
            <div className="header-actions"><Link className="button small" href={"/tournament?id="+t.id}>Edit</Link><button className="button primary small" onClick={()=>start(t.id)}>Start</button></div>
          </div>)}
        </div>
      </div>
    </section>
    <section className="info-grid">
      <div className="info-card"><b>📺 TV / projector</b><span>Dedicated TV display with QR + short-code pairing.</span></div>
      <div className="info-card"><b>📱 Mobile control</b><span>Responsive organizer interface and PWA-ready installation.</span></div>
      <div className="info-card"><b>💳 Subscription</b><span>Platinum plan is modeled now. Payment integration is intentionally not connected yet.</span></div>
    </section>
  </main>;
}