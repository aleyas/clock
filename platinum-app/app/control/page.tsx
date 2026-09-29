"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import QRCode from "qrcode";

type Session={id:string;pairing_code:string;status:string;current_index:number;remaining_seconds:number;server_started_at:string|null;remaining_players:number;total_entries:number;tournament_id:string};
type Level={position:number;kind:"level"|"break";minutes:number;sb:number|null;bb:number|null;ante:number|null};

function fmt(s:number){const m=Math.floor(Math.max(0,s)/60),sec=Math.max(0,s)%60;return String(m).padStart(2,"0")+":"+String(sec).padStart(2,"0")}
function ordinal(n:number){const r=n%100;if(r>=11&&r<=13)return n+"th";return n+(n%10===1?"st":n%10===2?"nd":n%10===3?"rd":"th")}

export default function Control(){
  const supabase=createClient();
  const [session,setSession]=useState<Session|null>(null);
  const [levels,setLevels]=useState<Level[]>([]);
  const [name,setName]=useState("");
  const [payouts,setPayouts]=useState<{place:number;prize:string;visible:boolean}[]>([]);
  const [qr,setQr]=useState("");
  const [now,setNow]=useState(Date.now());
  const params=typeof window!=="undefined"?new URLSearchParams(window.location.search):null;
  const sessionId=params?.get("session");

  async function load(){
    if(!sessionId)return;
    const {data,error}=await supabase.from("sessions").select("*").eq("id",sessionId).single();
    if(error)return;
    setSession(data);
    const {data:t}=await supabase.from("tournaments").select("name").eq("id",data.tournament_id).single();
    setName(t?.name||"Tournament");
    const {data:l}=await supabase.from("tournament_levels").select("*").eq("tournament_id",data.tournament_id).order("position");
    setLevels(l||[]);
    const {data:p}=await supabase.from("payouts").select("place,prize,visible").eq("tournament_id",data.tournament_id).order("place");
    setPayouts(p||[]);
    const tvUrl=window.location.origin+"/tv?code="+data.pairing_code;
    setQr(await QRCode.toDataURL(tvUrl,{width:240,margin:2}));
  }

  useEffect(()=>{load();const timer=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(timer)},[sessionId]);
  useEffect(()=>{
    if(!sessionId)return;
    const ch=supabase.channel("session-"+sessionId).on("postgres_changes",{event:"*",schema:"public",table:"sessions",filter:"id=eq."+sessionId},payload=>setSession(payload.new as Session)).subscribe();
    return()=>{supabase.removeChannel(ch)};
  },[sessionId]);

  const remaining=useMemo(()=>{
    if(!session)return 0;
    if(session.status!=="running"||!session.server_started_at)return session.remaining_seconds;
    return Math.max(0,session.remaining_seconds-Math.floor((now-new Date(session.server_started_at).getTime())/1000));
  },[session,now]);

  async function command(type:string,delta=0){
    if(!session)return;
    const current=remaining;
    const patch:any={updated_at:new Date().toISOString()};
    if(type==="START"){patch.status="running";patch.server_started_at=new Date().toISOString();patch.remaining_seconds=current;}
    if(type==="PAUSE"){patch.status="paused";patch.remaining_seconds=current;patch.server_started_at=null;}
    if(type==="TIME_ADJUST"){patch.remaining_seconds=Math.max(0,current+delta);if(session.status==="running")patch.server_started_at=new Date().toISOString();}
    if(type==="PLAYER_INCREMENT")patch.remaining_players=Math.min(session.total_entries,session.remaining_players+1);
    if(type==="PLAYER_DECREMENT")patch.remaining_players=Math.max(0,session.remaining_players-1);
    if(type==="RESET"){patch.status="ready";patch.current_index=0;patch.remaining_seconds=(levels[0]?.minutes||10)*60;patch.server_started_at=null;}
    if(type==="NEXT"){const n=Math.min(levels.length-1,session.current_index+1);patch.current_index=n;patch.remaining_seconds=(levels[n]?.minutes||10)*60;patch.server_started_at=session.status==="running"?new Date().toISOString():null;}
    if(type==="PREV"){const n=Math.max(0,session.current_index-1);patch.current_index=n;patch.remaining_seconds=(levels[n]?.minutes||10)*60;patch.server_started_at=session.status==="running"?new Date().toISOString():null;}
    await supabase.from("sessions").update(patch).eq("id",session.id);
  }

  if(!session)return <main className="center-page"><div className="panel panel-body">Loading session…</div></main>;
  const level=levels[session.current_index];
  const next=levels[session.current_index+1];
  const payoutText=payouts.filter(p=>p.visible!==false).map(p=>ordinal(p.place)+" "+p.prize).join("   •   ");

  return <main className="control-page">
    <header className="control-header"><div><div className="eyebrow">PLATINUM CONTROL</div><h1>{name}</h1><span className="connected">● Live session · code {session.pairing_code}</span></div><Link href={"/tv?code="+session.pairing_code} className="button">Open TV</Link></header>
    <div className="control-layout">
      <section className="remote-card">
        <div className="remote-timer">{fmt(remaining)}</div>
        <div className="remote-level">LEVEL {level?.position||1}</div>
        <div className="remote-blinds">{level?.kind==="break"?"BREAK":(level?.sb||0)+" / "+(level?.bb||0)}</div>
        <div className="remote-grid">
          <div><span>ANTE</span><b>{level?.ante||0}</b></div>
          <div><span>NEXT</span><b>{next?.kind==="break"?"BREAK":next?(next.sb||0)+" / "+(next.bb||0):"End"}</b></div>
          <div><span>PLAYERS</span><b>{session.remaining_players} / {session.total_entries}</b></div>
          <div><span>STATUS</span><b>{session.status}</b></div>
        </div>
        <div className="remote-buttons">
          <button className="button primary" onClick={()=>command(session.status==="running"?"PAUSE":"START")}>{session.status==="running"?"Pause":"Start"}</button>
          <button className="button" onClick={()=>command("PREV")}>← Previous</button>
          <button className="button" onClick={()=>command("NEXT")}>Next →</button>
          <button className="button" onClick={()=>command("TIME_ADJUST",-30)}>−30 sec</button>
          <button className="button" onClick={()=>command("TIME_ADJUST",30)}>+30 sec</button>
          <button className="button" onClick={()=>command("PLAYER_DECREMENT")}>Player −</button>
          <button className="button" onClick={()=>command("PLAYER_INCREMENT")}>Player +</button>
          <button className="button danger" onClick={()=>command("RESET")}>Reset</button>
        </div>
        <div className="payout-preview">{payoutText}</div>
      </section>
      <aside className="pair-card">
        <h2>Connect TV</h2><p className="muted">Use either QR code or the 6-digit code.</p>
        {qr && <img src={qr} alt="TV pairing QR code" className="qr"/>}
        <div className="pair-code">{session.pairing_code}</div>
        <div className="notice">The TV is read-only. Tournament commands come from this organizer device.</div>
      </aside>
    </div>
  </main>;
}