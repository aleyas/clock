"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Level={id?:string;position:number;kind:"level"|"break";minutes:number;sb:number|null;bb:number|null;ante:number|null};
type Payout={id?:string;place:number;prize:string;visible:boolean};
type Sponsor={id?:string;name:string;image_url:string|null;enabled:boolean;display_order:number;interval_seconds:number;duration_seconds:number};

export default function TournamentEditor(){
  const supabase=createClient();
  const [id,setId]=useState("");
  const [name,setName]=useState("");
  const [stack,setStack]=useState(10000);
  const [entries,setEntries]=useState(30);
  const [fee,setFee]=useState(600);
  const [brandName,setBrandName]=useState("");
  const [brandImage,setBrandImage]=useState("");
  const [levels,setLevels]=useState<Level[]>([]);
  const [payouts,setPayouts]=useState<Payout[]>([]);
  const [sponsors,setSponsors]=useState<Sponsor[]>([]);
  const [message,setMessage]=useState("");

  useEffect(()=>{load()},[]);
  async function load(){
    const qs=new URLSearchParams(window.location.search);const tid=qs.get("id");if(!tid)return;
    setId(tid);
    const {data:t}=await supabase.from("tournaments").select("*").eq("id",tid).single();if(!t)return;
    setName(t.name);setStack(t.starting_stack);setEntries(t.total_entries);setFee(Number(t.entry_fee));setBrandName(t.brand_name||"");setBrandImage(t.brand_image_url||"");
    const {data:l}=await supabase.from("tournament_levels").select("*").eq("tournament_id",tid).order("position");setLevels(l||[]);
    const {data:p}=await supabase.from("payouts").select("*").eq("tournament_id",tid).order("place");setPayouts(p||[]);
    const {data:s}=await supabase.from("sponsors").select("*").eq("tournament_id",tid).order("display_order");setSponsors(s||[]);
  }

  async function save(){
    setMessage("");
    await supabase.from("tournaments").update({name,starting_stack:stack,total_entries:entries,entry_fee:fee,brand_name:brandName||null,brand_image_url:brandImage||null,updated_at:new Date().toISOString()}).eq("id",id);
    await supabase.from("tournament_levels").delete().eq("tournament_id",id);
    await supabase.from("tournament_levels").insert(levels.map((x,i)=>({tournament_id:id,position:i+1,kind:x.kind,minutes:x.minutes,sb:x.kind==="level"?x.sb:null,bb:x.kind==="level"?x.bb:null,ante:x.kind==="level"?x.ante:0})));
    await supabase.from("payouts").delete().eq("tournament_id",id);
    await supabase.from("payouts").insert(payouts.map(x=>({tournament_id:id,place:x.place,prize:x.prize,visible:x.visible})));
    await supabase.from("sponsors").delete().eq("tournament_id",id);
    await supabase.from("sponsors").insert(sponsors.map((x,i)=>({tournament_id:id,name:x.name,image_url:x.image_url,enabled:x.enabled,display_order:i+1,interval_seconds:x.interval_seconds||10,duration_seconds:x.duration_seconds||8})));
    setMessage("Tournament saved.");
  }

  function updateLevel(i:number,key:keyof Level,value:string){
    setLevels(prev=>prev.map((x,j)=>j===i?{...x,[key]:key==="kind"?value:(Number(value)||0)}:x));
  }
  function addLevel(){
    const last=levels.filter(x=>x.kind==="level").at(-1);const bb=Math.max(100,Math.round((last?.bb||50)*1.5/50)*50);
    setLevels(prev=>[...prev,{position:prev.length+1,kind:"level",minutes:10,sb:Math.max(25,Math.round(bb/2/25)*25),bb,ante:bb},]);
  }
  function addBreak(){setLevels(prev=>[...prev,{position:prev.length+1,kind:"break",minutes:10,sb:null,bb:null,ante:0}])}

  return <main className="shell">
    <header className="app-header"><div><Link href="/dashboard" className="back-link">← Organizer</Link><h1>{name||"Tournament editor"}</h1><p className="muted">Unlimited Platinum tournament configuration</p></div><button className="button primary" onClick={save}>Save tournament</button></header>
    {message&&<div className="notice">{message}</div>}
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-head"><h2>Tournament</h2></div><div className="panel-body"><div className="form-grid">
        <label className="full">Name<input value={name} onChange={e=>setName(e.target.value)}/></label>
        <label>Players / entries<input type="number" value={entries} onChange={e=>setEntries(Number(e.target.value)||2)}/></label>
        <label>Starting stack<input type="number" value={stack} onChange={e=>setStack(Number(e.target.value)||100)}/></label>
        <label>Entry fee (€)<input type="number" value={fee} onChange={e=>setFee(Number(e.target.value)||0)}/></label>
      </div></div></section>
      <section className="panel"><div className="panel-head"><h2>Branding</h2></div><div className="panel-body form-stack">
        <label>Club / event name<input value={brandName} onChange={e=>setBrandName(e.target.value)} /></label>
        <label>Logo image URL<input value={brandImage} onChange={e=>setBrandImage(e.target.value)} placeholder="https://..." /></label>
      </div></section>
    </div>
    <section className="panel" style={{marginTop:18}}><div className="panel-head"><h2>Blind structure</h2><div className="header-actions"><button className="button small" onClick={addBreak}>Add break</button><button className="button small" onClick={addLevel}>Add level</button></div></div><div className="panel-body list">
      {levels.map((x,i)=><div className="tournament-card" key={i}>
        <b>{i+1}</b>
        <select value={x.kind} onChange={e=>updateLevel(i,"kind",e.target.value)}><option value="level">Level</option><option value="break">Break</option></select>
        <input type="number" value={x.minutes} onChange={e=>updateLevel(i,"minutes",e.target.value)} />
        {x.kind==="level" && <>
          <input type="number" value={x.sb||0} onChange={e=>updateLevel(i,"sb",e.target.value)} />
          <input type="number" value={x.bb||0} onChange={e=>updateLevel(i,"bb",e.target.value)} />
          <input type="number" value={x.ante||0} onChange={e=>updateLevel(i,"ante",e.target.value)} />
        </>}
        <button className="button small danger" onClick={()=>setLevels(levels.filter((_,j)=>j!==i))}>Delete</button>
      </div>)}
    </div></section>
    <div className="dashboard-grid" style={{marginTop:18}}>
      <section className="panel"><div className="panel-head"><h2>Payouts</h2><button className="button small" onClick={()=>setPayouts([...payouts,{place:payouts.length+1,prize:"",visible:true}])}>Add payout</button></div><div className="panel-body list">
        {payouts.map((p,i)=><div className="tournament-card" key={i}><input aria-label="Place" type="number" min={1} value={p.place} onChange={e=>setPayouts(payouts.map((x,j)=>j===i?{...x,place:Number(e.target.value)||1}:x))}/><input aria-label="Prize" value={p.prize} onChange={e=>setPayouts(payouts.map((x,j)=>j===i?{...x,prize:e.target.value}:x))}/><label><input type="checkbox" checked={p.visible} onChange={e=>setPayouts(payouts.map((x,j)=>j===i?{...x,visible:e.target.checked}:x))}/> Show</label><button className="button small danger" onClick={()=>setPayouts(payouts.filter((_,j)=>j!==i))}>Delete</button></div>)}
      </div></section>
      <section className="panel"><div className="panel-head"><h2>Sponsors</h2><button className="button small" onClick={()=>setSponsors([...sponsors,{name:"Sponsor "+(sponsors.length+1),image_url:"",enabled:true,display_order:sponsors.length+1,interval_seconds:10,duration_seconds:8}])}>Add sponsor</button></div><div className="panel-body list">
        {sponsors.map((s,i)=><div className="tournament-card" key={i}><div style={{flex:1}}><input value={s.name} onChange={e=>setSponsors(sponsors.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/><input style={{marginTop:7}} value={s.image_url||""} onChange={e=>setSponsors(sponsors.map((x,j)=>j===i?{...x,image_url:e.target.value}:x))} placeholder="Image URL"/></div><button className="button small danger" onClick={()=>setSponsors(sponsors.filter((_,j)=>j!==i))}>Delete</button></div>)}
      </div></section>
    </div>
  </main>;
}