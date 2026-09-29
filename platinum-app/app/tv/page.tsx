"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Session={id:string;pairing_code:string;status:string;current_index:number;remaining_seconds:number;server_started_at:string|null;remaining_players:number;total_entries:number;tournament_id:string};
type Level={position:number;kind:"level"|"break";minutes:number;sb:number|null;bb:number|null;ante:number|null};
type Sponsor={name:string;image_url:string|null;enabled:boolean;display_order:number};

function fmt(s:number){const m=Math.floor(Math.max(0,s)/60),sec=Math.max(0,s)%60;return String(m).padStart(2,"0")+":"+String(sec).padStart(2,"0")}
function ordinal(n:number){const r=n%100;if(r>=11&&r<=13)return n+"th";return n+(n%10===1?"st":n%10===2?"nd":n%10===3?"rd":"th")}

export default function TV(){
  const supabase=createClient();
  const [session,setSession]=useState<Session|null>(null);
  const [levels,setLevels]=useState<Level[]>([]);
  const [name,setName]=useState("Poker Tournament");
  const [entry,setEntry]=useState(600);
  const [payouts,setPayouts]=useState<{place:number;prize:string;visible:boolean}[]>([]);
  const [sponsors,setSponsors]=useState<Sponsor[]>([]);
  const [now,setNow]=useState(Date.now());
  const [code,setCode]=useState("");
  const params=typeof window!=="undefined"?new URLSearchParams(window.location.search):null;

  async function connect(pairing?:string){
    const pairingCode=pairing||params?.get("code")||code;
    if(!pairingCode)return;
    const {data:s,error}=await supabase.from("sessions").select("*").eq("pairing_code",pairingCode).neq("status","finished").limit(1).single();
    if(error)return;
    setSession(s);
    const {data:t}=await supabase.from("tournaments").select("name,entry_fee").eq("id",s.tournament_id).single();
    setName(t?.name||"Poker Tournament");setEntry(Number(t?.entry_fee||600));
    const {data:l}=await supabase.from("tournament_levels").select("*").eq("tournament_id",s.tournament_id).order("position");
    setLevels(l||[]);
    const {data:p}=await supabase.from("payouts").select("place,prize,visible").eq("tournament_id",s.tournament_id).order("place");
    setPayouts(p||[]);
    const {data:sp}=await supabase.from("sponsors").select("name,image_url,enabled,display_order").eq("tournament_id",s.tournament_id).eq("enabled",true).order("display_order");
    setSponsors(sp||[]);
  }

  useEffect(()=>{connect();const timer=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(timer)},[]);
  useEffect(()=>{
    if(!session)return;
    const ch=supabase.channel("tv-"+session.id).on("postgres_changes",{event:"*",schema:"public",table:"sessions",filter:"id=eq."+session.id},payload=>setSession(payload.new as Session)).subscribe();
    return()=>{supabase.removeChannel(ch)};
  },[session?.id]);

  const remaining=useMemo(()=>{
    if(!session)return 0;
    if(session.status!=="running"||!session.server_started_at)return session.remaining_seconds;
    return Math.max(0,session.remaining_seconds-Math.floor((now-new Date(session.server_started_at).getTime())/1000));
  },[session,now]);

  if(!session)return <main className="tv-pair"><div className="tv-pair-card"><div className="brand-mark">♠</div><h1>Connect Poker Clock</h1><p>Enter the 6-digit code shown on the organizer device.</p><input className="pair-input" inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))}/><button className="button primary wide" onClick={()=>connect(code)}>Connect TV</button></div></main>;

  const level=levels[session.current_index]||{position:1,kind:"level",minutes:10,sb:25,bb:50,ante:50};
  const next=levels[session.current_index+1];
  const payoutText=payouts.filter(p=>p.visible!==false).map(p=>ordinal(p.place)+" "+p.prize).join("   •   ");
  const sponsor=sponsors[0];

  return <main className="tv-shell">
    <div className="tv-left">
      <div className="tv-brand-placeholder"><span>Branding</span></div>
      <div className="tv-sponsor">{sponsor?.image_url?<img src={sponsor.image_url} alt={sponsor.name}/>:<strong>{sponsor?.name||"Sponsor"}</strong>}</div>
    </div>
    <div className="tv-center">
      <div className="tv-title">{name}</div>
      <div className="tv-rule"/>
      <div className="tv-timer">{fmt(remaining)}</div>
      <div className="tv-rows">
        <div><span>BLINDS</span><strong>{level.kind==="break"?"BREAK":(level.sb||0)+" / "+(level.bb||0)}</strong></div>
        <div><span>ANTE</span><strong>{level.ante||0}</strong></div>
        <div className="next-row"><span>NEXT LEVEL</span><strong>{next?.kind==="break"?"BREAK":next?(next.sb||0)+" / "+(next.bb||0):"Tournament end"}</strong></div>
      </div>
      {payoutText && <div className="tv-payouts">{payoutText}</div>}
    </div>
    <div className="tv-right">
      <div><span>LEVEL</span><strong>{level.kind==="break"?"BREAK":level.position}</strong></div>
      <div><span>TOTAL TIME</span><strong>—</strong></div>
      <div><span>NEXT BREAK</span><strong>—</strong></div>
      <div><span>ENTRY</span><strong>€{entry.toLocaleString("de-DE")}</strong></div>
      <div><span>PLAYERS</span><strong>{session.remaining_players} / {session.total_entries}</strong></div>
      <div><span>AVG STACK</span><strong>—</strong></div>
    </div>
    <div className="tv-powered">powered by Poker and more</div>
  </main>;
}