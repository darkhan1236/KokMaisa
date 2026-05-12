// src/app/components/AdminPanel.jsx
// KokMaisa 2025 — Admin Dashboard: полный CRUD + мультиязычность + адаптив

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users, Wheat, BarChart3, Shield, LogOut, Search, Trash2,
  ToggleLeft, ToggleRight, Edit3, X, Leaf, Sun, Moon,
  RefreshCw, Plus, Menu, Globe, Check, MapPin, Activity,
  Cpu, ChevronDown, MessageSquareText,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/app/utils/apiErrors";

const API = "/api";

/* ── CSS ───────────────────────────────────────────────────────────────── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
*{box-sizing:border-box;}
.adm{font-family:'DM Sans',sans-serif;min-height:100vh;display:flex;}
.adm-d{background:#040d06;color:#fff;}
.adm-l{background:#f5fcf2;color:#1a3d20;}

.sidebar{width:230px;flex-shrink:0;display:flex;flex-direction:column;padding:20px 14px;
  position:fixed;top:0;left:0;height:100vh;overflow-y:auto;
  transition:transform .3s cubic-bezier(.22,1,.36,1);z-index:100;}
.sidebar-d{background:#061309;border-right:1px solid rgba(255,255,255,.07);}
.sidebar-l{background:#fff;border-right:1px solid rgba(34,197,94,.15);box-shadow:2px 0 16px rgba(34,197,94,.06);}
.sid-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:99;}
.sid-ov.open{display:block;}
@media(max-width:768px){
  .sidebar{transform:translateX(-100%);}
  .sidebar.open{transform:translateX(0);}
  .adm-wrap{margin-left:0!important;}
}
.adm-wrap{flex:1;margin-left:230px;display:flex;flex-direction:column;min-width:0;min-height:100vh;}
.adm-main{flex:1;overflow-y:auto;padding:28px;}

.logo-btn{display:flex;align-items:center;gap:10px;margin-bottom:24px;padding:6px 2px;
  border-radius:12px;cursor:pointer;border:none;background:transparent;width:100%;
  transition:opacity .15s;}
.logo-btn:hover{opacity:.75;}

.ni{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;
  font-size:13px;font-weight:500;transition:background .15s;border:none;width:100%;
  text-align:left;font-family:'DM Sans',sans-serif;}
.ni-d{color:rgba(255,255,255,.55);background:transparent;}
.ni-d:hover{background:rgba(255,255,255,.07);color:#fff;}
.ni-d.act{background:rgba(74,222,128,.1);color:#4ade80;}
.ni-l{color:rgba(20,55,20,.6);background:transparent;}
.ni-l:hover{background:rgba(34,197,94,.08);color:#166534;}
.ni-l.act{background:rgba(34,197,94,.1);color:#16a34a;font-weight:600;}

.sc{border-radius:18px;padding:18px;transition:transform .25s,box-shadow .25s;cursor:default;}
.sc-d{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);}
.sc-l{background:#fff;border:1px solid rgba(34,197,94,.14);box-shadow:0 4px 14px rgba(34,197,94,.07);}
.sc:hover{transform:translateY(-3px);}
.sc:hover.sc-l{box-shadow:0 8px 28px rgba(34,197,94,.12);}

.tbl{width:100%;border-collapse:collapse;font-size:13px;}
.tbl th{padding:11px 14px;text-align:left;font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;white-space:nowrap;}
.tbl td{padding:10px 14px;vertical-align:middle;}
.tbl-d th{color:rgba(255,255,255,.3);border-bottom:1px solid rgba(255,255,255,.06);}
.tbl-d td{border-bottom:1px solid rgba(255,255,255,.04);color:rgba(255,255,255,.75);}
.tbl-d tr:hover td{background:rgba(255,255,255,.025);}
.tbl-l th{color:rgba(20,55,20,.4);border-bottom:1px solid rgba(34,197,94,.1);}
.tbl-l td{border-bottom:1px solid rgba(34,197,94,.06);color:rgba(20,55,20,.8);}
.tbl-l tr:hover td{background:rgba(34,197,94,.025);}
.tbl-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}

.mc{border-radius:14px;padding:15px;margin-bottom:10px;}
.mc-d{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);}
.mc-l{background:#fff;border:1px solid rgba(34,197,94,.12);box-shadow:0 2px 8px rgba(34,197,94,.05);}

.inp-d{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;
  border-radius:10px;padding:9px 14px;font-size:13px;outline:none;font-family:'DM Sans',sans-serif;width:100%;}
.inp-d::placeholder{color:rgba(255,255,255,.3);}
.inp-d:focus{border-color:rgba(74,222,128,.5);box-shadow:0 0 0 3px rgba(74,222,128,.07);}
.inp-d option{background:#061309;color:#f8fff9;}
.inp-d option:checked,.inp-d option:hover{background:#0f2d1a;color:#fff;}
.inp-l{background:#f8fdf8;border:1px solid rgba(34,197,94,.22);color:#1a3d20;
  border-radius:10px;padding:9px 14px;font-size:13px;outline:none;font-family:'DM Sans',sans-serif;width:100%;}
.inp-l::placeholder{color:rgba(20,55,20,.35);}
.inp-l:focus{border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.1);}
.inp-l option{background:#ffffff;color:#12381b;}
.inp-l option:checked,.inp-l option:hover{background:#dcfce7;color:#14532d;}

.bdg{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;
  font-size:10px;font-weight:700;letter-spacing:.05em;white-space:nowrap;}
.bdg-fa-d{background:rgba(74,222,128,.12);color:#4ade80;}
.bdg-fa-l{background:rgba(22,163,74,.1);color:#16a34a;}
.bdg-ad-d{background:rgba(139,92,246,.15);color:#a78bfa;}
.bdg-ad-l{background:rgba(109,40,217,.08);color:#7c3aed;}
.bdg-on-d{background:rgba(74,222,128,.1);color:#4ade80;}
.bdg-on-l{background:rgba(22,163,74,.08);color:#15803d;}
.bdg-off-d{background:rgba(239,68,68,.1);color:#f87171;}
.bdg-off-l{background:rgba(239,68,68,.07);color:#dc2626;}
.bdg-me-d{background:rgba(34,211,238,.1);color:#67e8f9;}
.bdg-me-l{background:rgba(8,145,178,.08);color:#0e7490;}
.bdg-yw-d{background:rgba(251,191,36,.1);color:#fbbf24;}
.bdg-yw-l{background:rgba(217,119,6,.08);color:#b45309;}

.btn-p{padding:8px 16px;border-radius:10px;border:none;cursor:pointer;font-size:13px;
  font-weight:600;font-family:'DM Sans',sans-serif;
  background:linear-gradient(135deg,#22c55e,#0d9488);color:#fff;
  transition:transform .2s,box-shadow .2s;display:inline-flex;align-items:center;gap:6px;}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(34,197,94,.35);}
.btn-g-d{padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.11);
  background:transparent;color:rgba(255,255,255,.55);cursor:pointer;
  transition:background .15s;display:inline-flex;align-items:center;gap:4px;
  font-size:12px;font-family:'DM Sans',sans-serif;}
.btn-g-d:hover{background:rgba(255,255,255,.08);color:#fff;}
.btn-g-l{padding:6px 10px;border-radius:8px;border:1px solid rgba(34,197,94,.2);
  background:transparent;color:rgba(20,55,20,.6);cursor:pointer;
  transition:background .15s;display:inline-flex;align-items:center;gap:4px;
  font-size:12px;font-family:'DM Sans',sans-serif;}
.btn-g-l:hover{background:rgba(34,197,94,.07);color:#166534;}
.btn-del{padding:6px 10px;border-radius:8px;border:1px solid rgba(239,68,68,.2);
  background:transparent;color:#f87171;cursor:pointer;
  display:inline-flex;align-items:center;gap:4px;font-size:12px;
  font-family:'DM Sans',sans-serif;transition:background .15s;}
.btn-del:hover{background:rgba(239,68,68,.08);}

.mo-ov{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(5px);
  z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;}
.mo{border-radius:20px;padding:28px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;}
.mo-d{background:#061309;border:1px solid rgba(255,255,255,.1);box-shadow:0 24px 80px rgba(0,0,0,.7);}
.mo-l{background:#fff;border:1px solid rgba(34,197,94,.15);box-shadow:0 24px 60px rgba(0,0,0,.12);}

.lang-dd{position:relative;}
.lang-menu{position:absolute;right:0;top:calc(100%+6px);min-width:148px;border-radius:12px;overflow:hidden;z-index:300;}
.lang-menu-d{background:#061309;border:1px solid rgba(255,255,255,.1);box-shadow:0 12px 40px rgba(0,0,0,.5);}
.lang-menu-l{background:#fff;border:1px solid rgba(34,197,94,.15);box-shadow:0 12px 32px rgba(0,0,0,.1);}
.lang-item{display:flex;align-items:center;gap:8px;padding:9px 14px;font-size:13px;cursor:pointer;transition:background .12s;}
.lang-item-d{color:rgba(255,255,255,.7);}
.lang-item-d:hover,.lang-item-d.cur{background:rgba(255,255,255,.07);color:#fff;}
.lang-item-l{color:rgba(20,55,20,.75);}
.lang-item-l:hover,.lang-item-l.cur{background:rgba(34,197,94,.07);color:#166534;}

.adm-hdr{position:sticky;top:0;z-index:80;display:flex;align-items:center;gap:8px;padding:10px 20px;border-bottom:1px solid transparent;}
.adm-hdr-d{background:#061309;border-color:rgba(255,255,255,.07);}
.adm-hdr-l{background:#fff;border-color:rgba(34,197,94,.12);box-shadow:0 2px 10px rgba(34,197,94,.06);}
.hdr-title{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hdr-sep{width:1px;height:20px;background:rgba(128,128,128,.18);flex-shrink:0;}
.hdr-burger{display:none;padding:7px;border-radius:8px;cursor:pointer;align-items:center;justify-content:center;}
.hdr-add-btn-txt{display:inline;}
@media(max-width:768px){
  .hdr-burger{display:flex;}
  .adm-hdr{padding:9px 12px;gap:5px;}
  .hdr-sep{display:none;}
  .adm-main{padding:12px!important;}
}
@media(max-width:480px){
  .hdr-title{font-size:12px;}
  .hdr-add-btn-txt{display:none;}
  .adm-main{padding:8px!important;}
}

.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
@media(max-width:900px){.stat-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:480px){.stat-grid{grid-template-columns:repeat(2,1fr);gap:8px;}}

.filter-bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;align-items:center;}

::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:rgba(34,197,94,.25);border-radius:8px;}
@keyframes afu{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.afu{animation:afu .32s cubic-bezier(.22,1,.36,1) both;}
@keyframes spin{to{transform:rotate(360deg);}}
.spin{animation:spin 1s linear infinite;}
`;

/* ── Langs ─────────────────────────────────────────────────────────────── */
const LANGS = [
  {code:"kk",name:"Қазақша",flag:"🇰🇿"},
  {code:"ru",name:"Русский",flag:"🇷🇺"},
  {code:"en",name:"English",flag:"🇬🇧"},
];

/* ── Helpers ────────────────────────────────────────────────────────────── */
function fmt(v, unit="") { return (v==null)?"—":`${Number(v).toFixed(2)}${unit}`; }
function fmtD(dt,lang="ru") { return dt ? new Date(dt).toLocaleDateString(lang) : "—"; }
function Spin({c="#4ade80"}){ return <div style={{width:22,height:22,border:`3px solid ${c}28`,borderTopColor:c,borderRadius:"50%"}} className="spin"/>; }

/* ── LangSwitcher ───────────────────────────────────────────────────────── */
function LangSwitcher({d}){
  const {i18n} = useTranslation();
  const [open,setOpen] = useState(false);
  const ref = useRef(null);
  const cur = LANGS.find(l=>l.code===i18n.language)||LANGS[1];
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);
  return(
    <div className="lang-dd" ref={ref}>
      <button onClick={()=>setOpen(o=>!o)} className={`ni ${d?"ni-d":"ni-l"}`} style={{justifyContent:"space-between"}}>
        <span style={{display:"flex",alignItems:"center",gap:8}}>
          <Globe className="w-4 h-4 flex-shrink-0"/>
          <span>{cur.flag} {cur.name}</span>
        </span>
        <ChevronDown className="w-3 h-3" style={{transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}/>
      </button>
      {open&&(
        <div className={`lang-menu ${d?"lang-menu-d":"lang-menu-l"}`}>
          {LANGS.map(l=>(
            <div key={l.code} className={`lang-item ${d?"lang-item-d":"lang-item-l"} ${i18n.language===l.code?"cur":""}`}
              onClick={()=>{i18n.changeLanguage(l.code);setOpen(false);}}>
              <span>{l.flag}</span><span>{l.name}</span>
              {i18n.language===l.code&&<Check className="w-3 h-3 ml-auto" style={{color:"#22c55e"}}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── API hook ───────────────────────────────────────────────────────────── */
function useAPI(){
  const getH = () => {
    const token = localStorage.getItem('token')||'';
    return {Authorization:`Bearer ${token}`,"Content-Type":"application/json"};
  };
  const r = async (url, opts={}) => {
    const res = await fetch(`${API}${url}`, {headers:getH(), ...opts});
    if (!res.ok) {
      const err = await res.json().catch(()=>({}));
      throw Object.assign(new Error(err.detail||res.statusText), {status:res.status, data:err});
    }
    return res.json().catch(()=>({}));
  };
  const safe = (fn) => fn().then(d => Array.isArray(d) ? d : []).catch(() => []);
  return {
    stats:        ()      => r("/admin/stats").catch(()=>({})),
    users:        q       => safe(()=>r(`/admin/users${q}`)),
    userToggle:   id      => r(`/admin/users/${id}/toggle-active`,{method:"POST"}),
    userDelete:   id      => r(`/admin/users/${id}`,{method:"DELETE"}),
    userUpdate:   (id,d)  => r(`/admin/users/${id}`,{method:"PUT",body:JSON.stringify(d)}),
    userCreate:   d       => r("/admin/users",{method:"POST",body:JSON.stringify(d)}),
    farms:        q       => safe(()=>r(`/admin/farms${q}`)),
    farmUpdate:   (id,d)  => r(`/admin/farms/${id}`,{method:"PUT",body:JSON.stringify(d)}),
    farmDelete:   id      => r(`/admin/farms/${id}`,{method:"DELETE"}),
    pastures:     q       => safe(()=>r(`/admin/pastures${q}`)),
    pastureUpdate:(id,d)  => r(`/admin/pastures/${id}`,{method:"PUT",body:JSON.stringify(d)}),
    pastureDelete:id      => r(`/admin/pastures/${id}`,{method:"DELETE"}),
    drones:       ()      => safe(()=>r("/admin/drones")),
    droneUpdate:  (id,d)  => r(`/admin/drones/${id}`,{method:"PUT",body:JSON.stringify(d)}),
    droneDelete:  id      => r(`/admin/drones/${id}`,{method:"DELETE"}),
    measurements: q       => safe(()=>r(`/admin/measurements${q}`)),
    measDelete:   id      => r(`/admin/measurements/${id}`,{method:"DELETE"}),
    suggestions:  q       => safe(()=>r(`/suggestions${q}`)),
    suggStats:    ()      => r("/suggestions/stats").catch(()=>({})),
    suggUpdate:   (id,d)  => r(`/suggestions/${id}`,{method:"PUT",body:JSON.stringify(d)}),
    suggDelete:   id      => r(`/suggestions/${id}`,{method:"DELETE"}),
  };
}

/* ══════════════════════════════ MAIN ══════════════════════════════════════ */
export default function AdminPanel(){
  const {t,i18n} = useTranslation();
  const {theme,toggleTheme} = useTheme();
  const {user,logout} = useAuth();
  const navigate = useNavigate();
  const d = theme==="dark";
  const api = useAPI();

  const tc = d?"#fff":"#1a3d20";
  const sc = d?"rgba(255,255,255,.45)":"rgba(20,55,20,.5)";
  const cls = d?"inp-d":"inp-l";
  const gg  = d?"btn-g-d":"btn-g-l";
  const pBg = d?{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)"}
                :{background:"#fff",border:"1px solid rgba(34,197,94,.1)",boxShadow:"0 4px 16px rgba(34,197,94,.06)"};

  /* ─ State ─ */
  const [tab,      setTab]      = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(false);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  const [users,   setUsers]   = useState([]); const [uSearch,setUSearch]=useState(""); const [uFilter,setUFilter]=useState("all");
  const [farms,   setFarms]   = useState([]); const [fSearch,setFSearch]=useState(""); const [fStatus,setFStatus]=useState("all");
  const [pastures,setPastures]= useState([]);
  const [drones,  setDrones]  = useState([]);
  const [meas,    setMeas]    = useState([]);
  const [suggestions,setSuggestions]=useState([]);
  const [suggStats,setSuggStats]=useState({});
  const [sSearch,setSSearch]=useState("");
  const [sStatus,setSStatus]=useState("all");

  /* Modals */
  const [editU,      setEditU]      = useState(null); const [editUF,setEditUF] = useState({});
  const [newU,       setNewU]       = useState(false);
  const [newUF,      setNewUF]      = useState({full_name:"",email:"",phone:"",password:"",account_type:"farmer",country:"",city:""});
  const [newUErr,    setNewUErr]    = useState(""); const [newUOk,setNewUOk]=useState(false);
  const [delU,       setDelU]       = useState(null);
  const [editFarm,   setEditFarm]   = useState(null); const [editFarmF,setEditFarmF]=useState({});
  const [delFarm,    setDelFarm]    = useState(null);
  const [delPasture, setDelPasture] = useState(null);
  const [editDrone,  setEditDrone]  = useState(null); const [editDroneF,setEditDroneF]=useState({});
  const [delDrone,   setDelDrone]   = useState(null);
  const [editPasture,setEditPasture]= useState(null); const [editPastureF,setEditPastureF]=useState({});
  const [delMeas,    setDelMeas]    = useState(null);
  const [delSugg,    setDelSugg]    = useState(null);
  const [saving,     setSaving]     = useState(false);

  /* ─ Loaders ─ */
  const loadStats    = useCallback(()=>api.stats().then(setStats).catch(()=>{}), []);
  const loadUsers    = useCallback(async()=>{
    setLoading(true);
    try{ let q="?limit=200"; if(uFilter!=="all")q+=`&account_type=${uFilter}`; if(uSearch)q+=`&search=${encodeURIComponent(uSearch)}`; setUsers(await api.users(q)); }
    catch{setUsers([]);} finally{setLoading(false);}
  },[uFilter,uSearch]);
  const loadFarms    = useCallback(async()=>{
    setLoading(true);
    try{ let q="?limit=100"; if(fSearch)q+=`&search=${encodeURIComponent(fSearch)}`; if(fStatus!=="all")q+=`&status=${fStatus}`; setFarms(await api.farms(q)); }
    catch{setFarms([]);} finally{setLoading(false);}
  },[fSearch,fStatus]);
  const loadPastures = useCallback(async()=>{ setLoading(true); try{setPastures(await api.pastures("?limit=200"));}catch{setPastures([]);} finally{setLoading(false);} },[]);
  const loadDrones   = useCallback(async()=>{ setLoading(true); try{setDrones(await api.drones());}catch{setDrones([]);} finally{setLoading(false);} },[]);
  const loadMeas     = useCallback(async()=>{ setLoading(true); try{setMeas(await api.measurements("?limit=100"));}catch{setMeas([]);} finally{setLoading(false);} },[]);
  const loadSuggestions = useCallback(async()=>{
    setLoading(true);
    try{
      let q="?limit=200";
      if(sStatus!=="all") q+=`&status=${sStatus}`;
      if(sSearch) q+=`&search=${encodeURIComponent(sSearch)}`;
      const [items, stats] = await Promise.all([api.suggestions(q), api.suggStats()]);
      setSuggestions(items);
      setSuggStats(stats||{});
    }catch{setSuggestions([]);} finally{setLoading(false);}
  },[sStatus,sSearch]);

  useEffect(()=>{ loadStats(); },[]);
  useEffect(()=>{
    if(tab==="users")        loadUsers();
    if(tab==="farms")        loadFarms();
    if(tab==="pastures")     loadPastures();
    if(tab==="drones")       loadDrones();
    if(tab==="measurements") loadMeas();
    if(tab==="suggestions")  loadSuggestions();
  },[tab,loadUsers,loadFarms,loadPastures,loadDrones,loadMeas,loadSuggestions]);

  /* ─ Actions ─ */
  const doRefresh = ()=>{ loadStats(); if(tab==="users")loadUsers(); if(tab==="farms")loadFarms(); if(tab==="pastures")loadPastures(); if(tab==="drones")loadDrones(); if(tab==="measurements")loadMeas(); if(tab==="suggestions")loadSuggestions(); };

  const doUserToggle  = async id  =>{ await api.userToggle(id); loadUsers(); };
  const doUserDelete  = async()   =>{ if(!delU)return; await api.userDelete(delU.id); setDelU(null); loadUsers(); loadStats(); };
  const doUserEdit    = async()   =>{ if(!editU)return; setSaving(true); await api.userUpdate(editU.id,editUF); setSaving(false); setEditU(null); loadUsers(); };
  const doUserCreate  = async()   =>{
    setNewUErr("");
    try{
      const res = await api.userCreate(newUF);
      if(res.id){ setNewUOk(true); setTimeout(()=>{ setNewU(false);setNewUOk(false);setNewUF({full_name:"",email:"",phone:"",password:"",account_type:"farmer",country:"",city:""})},1300); loadUsers();loadStats(); }
      else setNewUErr(res.detail||"Error");
    }catch(e){ setNewUErr(apiErrorMessage(e, i18n)); }
  };

  const doFarmEdit    = async()   =>{ if(!editFarm)return; setSaving(true); await api.farmUpdate(editFarm.id,editFarmF); setSaving(false); setEditFarm(null); loadFarms(); };
  const doFarmDelete  = async()   =>{ if(!delFarm)return; await api.farmDelete(delFarm.id); setDelFarm(null); loadFarms(); loadStats(); };
  const doPastureEdit  =async()   =>{ if(!editPasture)return; setSaving(true); try{ await api.pastureUpdate(editPasture.id,editPastureF); }catch{} setSaving(false); setEditPasture(null); loadPastures(); };
  const doPastureDelete=async()   =>{ if(!delPasture)return; await api.pastureDelete(delPasture.id); setDelPasture(null); loadPastures(); loadStats(); };
  const doDroneEdit   = async()   =>{ if(!editDrone)return; setSaving(true); await api.droneUpdate(editDrone.id,editDroneF); setSaving(false); setEditDrone(null); loadDrones(); };
  const doDroneDelete = async()   =>{ if(!delDrone)return; await api.droneDelete(delDrone.id); setDelDrone(null); loadDrones(); loadStats(); };
  const doMeasDelete  = async()   =>{ if(!delMeas)return; await api.measDelete(delMeas.id); setDelMeas(null); loadMeas(); loadStats(); };
  const doSuggStatus  = async(id,status)=>{ await api.suggUpdate(id,{status}); loadSuggestions(); loadStats(); };
  const doSuggNote    = async(item,note)=>{ await api.suggUpdate(item.id,{admin_note:note}); loadSuggestions(); };
  const doSuggDelete  = async()   =>{ if(!delSugg)return; await api.suggDelete(delSugg.id); setDelSugg(null); loadSuggestions(); loadStats(); };

  const goTab = id=>{ setTab(id); setSideOpen(false); };
  const nc    = id=>`ni ${d?`ni-d${tab===id?" act":""}` :`ni-l${tab===id?" act":""}`}`;

  if(user?.account_type!=="admin") return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:d?"#040d06":"#f5fcf2"}}>
      <div style={{textAlign:"center"}}><Shield className="w-16 h-16 mx-auto mb-4" style={{color:sc}}/><p style={{color:sc}}>{t("admin.accessDenied")}</p></div>
    </div>
  );

  const statCards = stats?[
    {icon:Users,   val:stats.users?.total,   lbl:t("admin.totalUsers"),    a:"#4ade80"},
    {icon:Users,   val:stats.users?.farmers, lbl:t("admin.totalFarmers"),  a:"#22d3ee"},
    {icon:Shield,  val:stats.users?.admins,  lbl:t("admin.totalAdmins"),   a:"#a78bfa"},
    {icon:Users,   val:stats.users?.active,  lbl:t("admin.activeUsers"),   a:"#34d399"},
    {icon:Wheat,   val:stats.farms,          lbl:t("admin.totalFarms"),    a:"#fbbf24"},
    {icon:MapPin,  val:stats.pastures,       lbl:t("admin.totalPastures"), a:"#f97316"},
    {icon:Activity,val:stats.analyses,       lbl:t("admin.totalAnalyses"), a:"#f472b6"},
    {icon:MessageSquareText,val:stats.suggestions?.new, lbl:t("admin.newSuggestions"), a:"#2dd4bf"},
  ]:[];

  const navItems = [
    {id:"dashboard",    icon:BarChart3, lbl:t("admin.dashboard")},
    {id:"users",        icon:Users,     lbl:t("admin.users")},
    {id:"farms",        icon:Wheat,     lbl:t("admin.farms")},
    {id:"pastures",     icon:MapPin,    lbl:t("admin.pastures","Пастбища")},
    {id:"measurements", icon:Activity,  lbl:t("admin.measurements")},
    {id:"suggestions",  icon:MessageSquareText, lbl:t("admin.suggestions")},
  ];

  const Empty = ({icon:Icon,text})=>(
    <div style={{padding:"56px 24px",textAlign:"center",color:sc}}>
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-40"/><p style={{fontSize:14}}>{text}</p>
    </div>
  );
  const LoadRow = ()=>(
    <div style={{padding:"48px",display:"flex",justifyContent:"center"}}><Spin c={d?"#4ade80":"#22c55e"}/></div>
  );
  const Panel = ({children})=>(
    <div style={{...pBg,borderRadius:16,overflow:"hidden"}}>{children}</div>
  );

  /* ─── Sidebar ─── */
  const SideContent = ()=>(
    <>
      {/* Кликабельный логотип → главная */}
      <button className="logo-btn" onClick={()=>navigate("/")}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{background:"linear-gradient(135deg,#22c55e,#0d9488)"}}>
          <Leaf className="w-4 h-4 text-white"/>
        </div>
        <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:14,color:tc}}>KokMaisa</span>
      </button>

      <p style={{fontSize:10,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase",color:sc,padding:"0 6px",marginBottom:6}}>Admin</p>

      <nav style={{display:"flex",flexDirection:"column",gap:2,flex:1}}>
        {navItems.map(({id,icon:Icon,lbl})=>(
          <button key={id} onClick={()=>goTab(id)} className={nc(id)}>
            <Icon className="w-4 h-4 flex-shrink-0"/>{lbl}
          </button>
        ))}
      </nav>

    </>
  );

  /* ══════════════ RENDER ══════════════════════════════════════════════════ */
  return(
    <>
      <style>{STYLE}</style>
      <div className={`sid-ov ${sideOpen?"open":""}`} onClick={()=>setSideOpen(false)}/>
      <div className={`adm ${d?"adm-d":"adm-l"}`}>

        <aside className={`sidebar ${d?"sidebar-d":"sidebar-l"} ${sideOpen?"open":""}`}>
          <SideContent/>
        </aside>

        <div className="adm-wrap">

          {/* ── Top header ── */}
          <div className={`adm-hdr ${d?"adm-hdr-d":"adm-hdr-l"}`}>

            {/* Burger — только мобилка */}
            <button onClick={()=>setSideOpen(o=>!o)} className="hdr-burger"
              style={{background:"none",border:`1px solid ${d?"rgba(255,255,255,.12)":"rgba(34,197,94,.2)"}`,color:d?"rgba(255,255,255,.7)":"rgba(20,55,20,.7)"}}>
              <Menu style={{width:18,height:18}}/>
            </button>

            {/* Заголовок страницы */}
            <span className="hdr-title" style={{color:tc}}>
              {navItems.find(n=>n.id===tab)?.lbl||t("admin.title")}
            </span>

            {/* Кнопка добавить пользователя */}
            {tab==="users"&&(
              <button className="btn-p" style={{padding:"6px 12px",fontSize:12,flexShrink:0}} onClick={()=>setNewU(true)}>
                <Plus style={{width:13,height:13}}/>
                <span className="hdr-add-btn-txt">{t("admin.addUser")}</span>
              </button>
            )}

            {/* Обновить */}
            <button onClick={doRefresh} className={gg} style={{padding:"6px",flexShrink:0}} title={t("common.refresh","Обновить")}>
              <RefreshCw style={{width:14,height:14}}/>
            </button>

            <div className="hdr-sep"/>

            {/* Язык */}
            <LangSwitcher d={d}/>

            {/* Тема */}
            <button onClick={toggleTheme} className={gg} style={{padding:"6px",flexShrink:0}}>
              {d?<Sun style={{width:14,height:14}}/>:<Moon style={{width:14,height:14}}/>}
            </button>

            {/* Выход */}
            <button onClick={()=>{logout?.();navigate("/");}} className={gg} style={{padding:"6px",flexShrink:0}} title={t("nav.logout")}>
              <LogOut style={{width:14,height:14}}/>
            </button>

          </div>

          <main className="adm-main">

            {/* ═══ DASHBOARD ═══ */}
            {tab==="dashboard"&&(
              <div className="afu">
                <div className="stat-grid" style={{marginBottom:20}}>
                  {statCards.map(({icon:Icon,val,lbl,a})=>(
                    <div key={lbl} className={`sc ${d?"sc-d":"sc-l"}`}>
                      <div style={{width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,background:`${a}18`,border:`1px solid ${a}28`}}>
                        <Icon className="w-4 h-4" style={{color:a}}/>
                      </div>
                      <div style={{fontSize:26,fontWeight:800,fontFamily:"Syne,sans-serif",color:tc,lineHeight:1}}>{val??"—"}</div>
                      <div style={{fontSize:11,color:sc,marginTop:4}}>{lbl}</div>
                    </div>
                  ))}
                </div>
                <div style={{...pBg,borderRadius:16,padding:20}}>
                  <h2 style={{fontFamily:"Syne,sans-serif",color:tc,fontWeight:700,fontSize:14,marginBottom:14}}>{t("admin.quickActions","Быстрые действия")}</h2>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {navItems.filter(n=>n.id!=="dashboard").map(({id,icon:Icon,lbl})=>(
                      <button key={id} onClick={()=>goTab(id)} className="btn-p" style={{fontSize:12,padding:"7px 14px"}}><Icon className="w-3.5 h-3.5"/>{lbl}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ USERS ═══ */}
            {tab==="users"&&(
              <div className="afu">
                <div className="filter-bar">
                  <div style={{position:"relative"}}>
                    <Search style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",width:14,height:14,color:sc}}/>
                    <input className={cls} style={{paddingLeft:32,width:185}} placeholder={t("admin.search")} value={uSearch} onChange={e=>setUSearch(e.target.value)}/>
                  </div>
                  {["all","farmer","admin"].map(f=>(
                    <button key={f} onClick={()=>setUFilter(f)} className={uFilter===f?"btn-p":gg} style={{padding:"7px 12px"}}>
                      {f==="all"?t("admin.filterAll"):f==="farmer"?t("admin.filterFarmer"):t("admin.filterAdmin")}
                    </button>
                  ))}
                </div>
                <Panel>
                  {loading?<LoadRow/>:users.length===0?<Empty icon={Users} text={t("admin.noUsers")}/>:(
                    <div className="tbl-scroll">
                      <table className={`tbl ${d?"tbl-d":"tbl-l"}`}>
                        <thead><tr>
                          <th>#</th><th>{t("admin.name")}</th><th>{t("admin.email")}</th>
                          <th>{t("admin.phone")}</th><th>{t("admin.role")}</th>
                          <th>{t("admin.status")}</th><th>{t("admin.actions")}</th>
                        </tr></thead>
                        <tbody>{users.map(u=>(
                          <tr key={u.id}>
                            <td style={{color:sc,fontSize:11,fontFamily:"monospace"}}>#{u.id}</td>
                            <td>
                              <div style={{fontWeight:600,color:tc}}>{u.full_name}</div>
                              <div style={{fontSize:11,color:sc}}>{u.city}, {u.country}</div>
                            </td>
                            <td style={{fontSize:12,color:sc}}>{u.email}</td>
                            <td style={{fontSize:12,color:sc}}>{u.phone||"—"}</td>
                            <td><span className={`bdg ${u.account_type==="admin"?(d?"bdg-ad-d":"bdg-ad-l"):(d?"bdg-fa-d":"bdg-fa-l")}`}>{u.account_type==="admin"?"Admin":"Farmer"}</span></td>
                            <td><span className={`bdg ${u.is_active?(d?"bdg-on-d":"bdg-on-l"):(d?"bdg-off-d":"bdg-off-l")}`}>{u.is_active?t("common.active"):t("common.inactive")}</span></td>
                            <td>
                              <div style={{display:"flex",gap:5}}>
                                <button className={gg} title={t("common.edit")} onClick={()=>{setEditU(u);setEditUF({account_type:u.account_type,full_name:u.full_name,email:u.email||"",phone:u.phone||"",city:u.city||"",country:u.country||""});}}><Edit3 className="w-3.5 h-3.5"/></button>
                                <button className={gg} onClick={()=>doUserToggle(u.id)}>
                                  {u.is_active?<ToggleRight className="w-3.5 h-3.5" style={{color:"#4ade80"}}/>:<ToggleLeft className="w-3.5 h-3.5"/>}
                                </button>
                                <button className="btn-del" onClick={()=>setDelU(u)}><Trash2 className="w-3.5 h-3.5"/></button>
                              </div>
                            </td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </Panel>
                <p style={{color:sc,fontSize:11,marginTop:8}}>{t("admin.total","Всего")}: {users.length}</p>
              </div>
            )}

            {/* ═══ FARMS ═══ */}
            {tab==="farms"&&(
              <div className="afu">
                <div className="filter-bar">
                  <div style={{position:"relative"}}>
                    <Search style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",width:14,height:14,color:sc}}/>
                    <input className={cls} style={{paddingLeft:32,width:185}} placeholder={t("admin.search")} value={fSearch} onChange={e=>setFSearch(e.target.value)}/>
                  </div>
                  {["all","active","inactive"].map(s=>(
                    <button key={s} onClick={()=>setFStatus(s)} className={fStatus===s?"btn-p":gg} style={{padding:"7px 12px",fontSize:12}}>
                      {s==="all"?t("admin.filterAll"):s==="active"?t("common.active"):t("common.inactive")}
                    </button>
                  ))}
                </div>
                <Panel>
                  {loading?<LoadRow/>:farms.length===0?<Empty icon={Wheat} text={t("admin.noFarms","Нет ферм")}/>:(
                    <div className="tbl-scroll">
                      <table className={`tbl ${d?"tbl-d":"tbl-l"}`}>
                        <thead><tr>
                          <th>#</th><th>{t("admin.name")}</th><th>{t("admin.region")}</th>
                          <th>{t("admin.area")} (га)</th><th>{t("admin.farmOwner","Владелец")}</th>
                          <th>{t("admin.farmType")}</th><th>{t("admin.pastures","Пастбища")}</th>
                          <th>{t("admin.status")}</th><th>{t("admin.actions")}</th>
                        </tr></thead>
                        <tbody>{farms.map(f=>(
                          <tr key={f.id}>
                            <td style={{color:sc,fontSize:11,fontFamily:"monospace"}}>#{f.id}</td>
                            <td>
                              <div style={{fontWeight:600,color:tc}}>{f.name}</div>
                              <div style={{fontSize:11,color:sc}}>{f.address||"—"}</div>
                            </td>
                            <td style={{color:sc,fontSize:12}}>{f.region||"—"}</td>
                            <td style={{color:tc,fontWeight:600,fontSize:13}}>{f.area} га</td>
                            <td>
                              <div style={{color:tc,fontSize:12,fontWeight:500}}>{f.owner_name||"—"}</div>
                              <div style={{fontSize:11,color:sc}}>{f.owner_email||""}</div>
                            </td>
                            <td style={{color:sc,fontSize:12}}>{f.farm_type||"—"}</td>
                            <td style={{textAlign:"center",color:sc,fontSize:12}}>{f.pasture_count??0}</td>
                            <td><span className={`bdg ${f.status==="active"?(d?"bdg-on-d":"bdg-on-l"):(d?"bdg-off-d":"bdg-off-l")}`}>{f.status}</span></td>
                            <td>
                              <div style={{display:"flex",gap:5}}>
                                <button className={gg} onClick={()=>{setEditFarm(f);setEditFarmF({name:f.name,region:f.region,area:f.area,status:f.status,farm_type:f.farm_type||"",address:f.address||""});}}><Edit3 className="w-3.5 h-3.5"/></button>
                                <button className="btn-del" onClick={()=>setDelFarm(f)}><Trash2 className="w-3.5 h-3.5"/></button>
                              </div>
                            </td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </Panel>
                <p style={{color:sc,fontSize:11,marginTop:8}}>{t("admin.total","Всего")}: {farms.length}</p>
              </div>
            )}

            {/* ═══ PASTURES ═══ */}
            {tab==="pastures"&&(
              <div className="afu">
                <Panel>
                  {loading?<LoadRow/>:pastures.length===0?<Empty icon={MapPin} text={t("admin.noPastures","Нет пастбищ")}/>:(
                    <div className="tbl-scroll">
                      <table className={`tbl ${d?"tbl-d":"tbl-l"}`}>
                        <thead><tr>
                          <th>#</th><th>{t("admin.name")}</th><th>{t("admin.farms","Ферма")}</th>
                          <th>{t("admin.area")} (га)</th><th>{t("admin.pastureType","Тип")}</th>
                          <th>{t("admin.measurements","Измерения")}</th>
                          <th>{t("admin.status")}</th><th>{t("admin.actions")}</th>
                        </tr></thead>
                        <tbody>{pastures.map(p=>(
                          <tr key={p.id}>
                            <td style={{color:sc,fontSize:11,fontFamily:"monospace"}}>#{p.id}</td>
                            <td style={{fontWeight:600,color:tc}}>{p.name}</td>
                            <td style={{fontSize:12,color:sc}}>
                              <div>{p.farm_name}</div>
                              <div style={{fontSize:10,color:sc}}>ID #{p.farm_id}</div>
                            </td>
                            <td style={{color:tc,fontWeight:600,fontSize:13}}>{p.area} га</td>
                            <td style={{fontSize:12,color:sc}}>{p.pasture_type||"—"}</td>
                            <td style={{textAlign:"center"}}>
                              <span className={`bdg ${d?"bdg-me-d":"bdg-me-l"}`}>{p.measurement_count??0}</span>
                            </td>
                            <td><span className={`bdg ${p.status==="active"?(d?"bdg-on-d":"bdg-on-l"):(d?"bdg-off-d":"bdg-off-l")}`}>{p.status}</span></td>
                            <td>
                              <div style={{display:"flex",gap:5}}>
                                <button className={gg} onClick={()=>{setEditPasture(p);setEditPastureF({name:p.name,area:p.area,status:p.status,pasture_type:p.pasture_type||"",description:p.description||""});}}><Edit3 style={{width:13,height:13}}/></button>
                                <button className="btn-del" onClick={()=>setDelPasture(p)}><Trash2 style={{width:13,height:13}}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </Panel>
                <p style={{color:sc,fontSize:11,marginTop:8}}>{t("admin.total","Всего")}: {pastures.length}</p>
              </div>
            )}

            {/* ═══ DRONES ═══ */}
            {tab==="drones"&&(
              <div className="afu">
                <Panel>
                  {loading?<LoadRow/>:drones.length===0?<Empty icon={Cpu} text={t("admin.noDrones","Нет дронов")}/>:(
                    <div className="tbl-scroll">
                      <table className={`tbl ${d?"tbl-d":"tbl-l"}`}>
                        <thead><tr>
                          <th>#</th><th>{t("admin.droneModel","Модель")}</th>
                          <th>{t("admin.droneSerial","Серийный №")}</th>
                          <th>{t("admin.farms","Ферма")}</th>
                          <th>{t("admin.status")}</th><th>{t("admin.date")}</th>
                          <th>{t("admin.actions")}</th>
                        </tr></thead>
                        <tbody>{drones.map(dr=>(
                          <tr key={dr.id}>
                            <td style={{color:sc,fontSize:11,fontFamily:"monospace"}}>#{dr.id}</td>
                            <td style={{fontWeight:600,color:tc}}>{dr.model}</td>
                            <td style={{fontSize:12,fontFamily:"monospace",color:sc}}>{dr.serial_number}</td>
                            <td style={{fontSize:12,color:sc}}>
                              <div>{dr.farm_name}</div>
                              <div style={{fontSize:10}}>ID #{dr.farm_id}</div>
                            </td>
                            <td>
                              <span className={`bdg ${dr.status==="active"?(d?"bdg-on-d":"bdg-on-l"):dr.status==="maintenance"?(d?"bdg-yw-d":"bdg-yw-l"):(d?"bdg-off-d":"bdg-off-l")}`}>
                                {dr.status}
                              </span>
                            </td>
                            <td style={{color:sc,fontSize:12}}>{fmtD(dr.created_at,i18n.language)}</td>
                            <td>
                              <div style={{display:"flex",gap:5}}>
                                <button className={gg} onClick={()=>{setEditDrone(dr);setEditDroneF({model:dr.model,serial_number:dr.serial_number,status:dr.status,description:dr.description||""});}}><Edit3 className="w-3.5 h-3.5"/></button>
                                <button className="btn-del" onClick={()=>setDelDrone(dr)}><Trash2 className="w-3.5 h-3.5"/></button>
                              </div>
                            </td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </Panel>
                <p style={{color:sc,fontSize:11,marginTop:8}}>{t("admin.total","Всего")}: {drones.length}</p>
              </div>
            )}

            {/* ═══ MEASUREMENTS ═══ */}
            {tab==="measurements"&&(
              <div className="afu">
                <Panel>
                  {loading?<LoadRow/>:meas.length===0?<Empty icon={Activity} text={t("admin.noMeasurements","Нет измерений")}/>:(
                    <div className="tbl-scroll">
                      <table className={`tbl ${d?"tbl-d":"tbl-l"}`}>
                        <thead><tr>
                          <th>#</th><th>{t("admin.pasture","Пастбище")}</th>
                          <th>{t("admin.farms","Ферма")}</th>
                          <th>{t("admin.method")}</th>
                          <th>{t("admin.biomassValue","Биомасса")}</th>
                          <th>{t("admin.status")}</th>
                          <th>{t("admin.date")}</th>
                          <th>{t("admin.actions")}</th>
                        </tr></thead>
                        <tbody>{meas.map(m=>(
                          <tr key={m.id}>
                            <td style={{color:sc,fontSize:11,fontFamily:"monospace"}}>#{m.id}</td>
                            <td>
                              <div style={{fontWeight:500,color:tc,fontSize:12}}>{m.pasture_name}</div>
                              <div style={{fontSize:10,color:sc}}>ID #{m.pasture_id}</div>
                            </td>
                            <td style={{fontSize:12,color:sc}}>{m.farm_name}</td>
                            <td><span className={`bdg ${d?"bdg-fa-d":"bdg-fa-l"}`}>{m.method}</span></td>
                            <td style={{color:tc,fontWeight:600,fontSize:12}}>{fmt(m.biomass_value," т/га")}</td>
                            <td>
                              <span className={`bdg ${m.status==="completed"||m.status==="done"?(d?"bdg-on-d":"bdg-on-l"):m.status==="processing"?(d?"bdg-yw-d":"bdg-yw-l"):(d?"bdg-me-d":"bdg-me-l")}`}>
                                {m.status}
                              </span>
                            </td>
                            <td style={{color:sc,fontSize:11,whiteSpace:"nowrap"}}>{fmtD(m.created_at,i18n.language)}</td>
                            <td>
                              <button className="btn-del" onClick={()=>setDelMeas(m)}><Trash2 className="w-3.5 h-3.5"/></button>
                            </td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </Panel>
                <p style={{color:sc,fontSize:11,marginTop:8}}>{t("admin.total","Всего")}: {meas.length}</p>
              </div>
            )}

            {tab==="suggestions"&&(
              <div className="afu">
                <div className="filter-bar">
                  <div style={{position:"relative"}}>
                    <Search style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",width:14,height:14,color:sc}}/>
                    <input className={cls} style={{paddingLeft:32,width:220}} placeholder={t("admin.search")} value={sSearch} onChange={e=>setSSearch(e.target.value)}/>
                  </div>
                  {["all","new","in_review","planned","done","rejected"].map(status=>(
                    <button key={status} onClick={()=>setSStatus(status)} className={sStatus===status?"btn-p":gg} style={{padding:"7px 12px"}}>
                      {status==="all"?t("admin.filterAll"):t(`suggestions.status.${status}`)}
                    </button>
                  ))}
                </div>
                <div className="stat-grid" style={{marginBottom:14}}>
                  {["total","new","in_review","planned"].map(key=>(
                    <div key={key} className={`sc ${d?"sc-d":"sc-l"}`}>
                      <div style={{fontSize:24,fontWeight:800,fontFamily:"Syne,sans-serif",color:tc,lineHeight:1}}>{suggStats?.[key]??0}</div>
                      <div style={{fontSize:11,color:sc,marginTop:4}}>{key==="total"?t("admin.total"):t(`suggestions.status.${key}`)}</div>
                    </div>
                  ))}
                </div>
                <Panel>
                  {loading?<LoadRow/>:suggestions.length===0?<Empty icon={MessageSquareText} text={t("admin.noSuggestions")}/> : (
                    <div className="tbl-scroll">
                      <table className={`tbl ${d?"tbl-d":"tbl-l"}`}>
                        <thead><tr>
                          <th>#</th><th>{t("admin.message")}</th><th>{t("admin.contact")}</th>
                          <th>{t("admin.category")}</th><th>{t("admin.status")}</th><th>{t("admin.note")}</th><th>{t("admin.date")}</th><th>{t("admin.actions")}</th>
                        </tr></thead>
                        <tbody>{suggestions.map(item=>(
                          <tr key={item.id}>
                            <td style={{color:sc,fontSize:11,fontFamily:"monospace"}}>#{item.id}</td>
                            <td style={{minWidth:240}}><div style={{color:tc,fontSize:12,lineHeight:1.45,whiteSpace:"pre-wrap"}}>{item.message}</div></td>
                            <td style={{fontSize:12,color:sc,whiteSpace:"nowrap"}}><div style={{color:tc}}>{item.name||"—"}</div><div>{item.email||"—"}</div></td>
                            <td><span className={`bdg ${d?"bdg-me-d":"bdg-me-l"}`}>{t(`suggestions.categories.${item.category}`)}</span></td>
                            <td>
                              <select className={cls} value={item.status} onChange={e=>doSuggStatus(item.id,e.target.value)} style={{minWidth:125}}>
                                {["new","in_review","planned","done","rejected"].map(status=><option key={status} value={status}>{t(`suggestions.status.${status}`)}</option>)}
                              </select>
                            </td>
                            <td style={{minWidth:220}}>
                              <input className={cls} defaultValue={item.admin_note||""} maxLength={2000}
                                onBlur={e=>{ if(e.target.value!==(item.admin_note||"")) doSuggNote(item,e.target.value); }}
                                placeholder={t("admin.notePlaceholder")}/>
                            </td>
                            <td style={{color:sc,fontSize:11,whiteSpace:"nowrap"}}>{fmtD(item.created_at,i18n.language)}</td>
                            <td><button className="btn-del" onClick={()=>setDelSugg(item)}><Trash2 className="w-3.5 h-3.5"/></button></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </Panel>
                <p style={{color:sc,fontSize:11,marginTop:8}}>{t("admin.total","Р’СЃРµРіРѕ")}: {suggestions.length}</p>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* ══ MODAL: Редактировать пользователя ══ */}
      {editU&&(
        <div className="mo-ov" onClick={e=>e.target===e.currentTarget&&setEditU(null)}>
          <div className={`mo ${d?"mo-d":"mo-l"} afu`}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{fontFamily:"Syne,sans-serif",color:tc,fontWeight:700,fontSize:17}}>{t("admin.editUser")}</h3>
              <button onClick={()=>setEditU(null)} style={{background:"none",border:"none",cursor:"pointer",color:sc}}><X className="w-5 h-5"/></button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                {k:"full_name",l:t("admin.name"),    type:"text",  span:2},
                {k:"email",    l:t("admin.email"),   type:"email", span:1},
                {k:"phone",    l:t("admin.phone"),   type:"text",  span:1},
                {k:"city",     l:t("admin.city","Город"),   type:"text",  span:1},
                {k:"country",  l:t("admin.country","Страна"), type:"text",  span:1},
              ].map(({k,l,type,span})=>(
                <div key={k} style={{gridColumn:`span ${span}`}}>
                  <label style={{fontSize:11,fontWeight:600,color:sc,display:"block",marginBottom:4}}>{l}</label>
                  <input className={cls} type={type} value={editUF[k]||""} onChange={e=>setEditUF(f=>({...f,[k]:e.target.value}))}/>
                </div>
              ))}
              <div style={{gridColumn:"span 2"}}>
                <label style={{fontSize:11,fontWeight:600,color:sc,display:"block",marginBottom:4}}>{t("admin.role")}</label>
                <select className={cls} value={editUF.account_type||"farmer"} onChange={e=>setEditUF(f=>({...f,account_type:e.target.value}))}>
                  <option value="farmer">Farmer</option><option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:18}}>
              <button onClick={()=>setEditU(null)} className={gg} style={{flex:1,justifyContent:"center",padding:10}}>{t("common.cancel")}</button>
              <button onClick={doUserEdit} className="btn-p" style={{flex:1,justifyContent:"center"}} disabled={saving}>
                {saving?<Spin c="#fff"/>:t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Создать пользователя ══ */}
      {newU&&(
        <div className="mo-ov" onClick={e=>e.target===e.currentTarget&&setNewU(false)}>
          <div className={`mo ${d?"mo-d":"mo-l"} afu`} style={{maxWidth:500}}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{fontFamily:"Syne,sans-serif",color:tc,fontWeight:700,fontSize:17}}>{t("admin.createUser")}</h3>
              <button onClick={()=>setNewU(false)} style={{background:"none",border:"none",cursor:"pointer",color:sc}}><X className="w-5 h-5"/></button>
            </div>
            {newUErr&&<div style={{background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"9px 14px",marginBottom:12,color:"#f87171",fontSize:13}}>{newUErr}</div>}
            {newUOk&&<div style={{background:"rgba(34,197,94,.1)",borderRadius:10,padding:"9px 14px",marginBottom:12,color:"#4ade80",fontSize:13}}>✓ {t("admin.createUser")}!</div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{k:"full_name",l:t("admin.name"),type:"text"},{k:"email",l:t("admin.email"),type:"email"},
                {k:"phone",l:t("admin.phone"),type:"text"},{k:"password",l:t("admin.password"),type:"password"},
                {k:"country",l:t("admin.country","Страна"),type:"text"},{k:"city",l:t("admin.city","Город"),type:"text"}
              ].map(({k,l,type})=>(
                <div key={k}><label style={{fontSize:11,fontWeight:600,color:sc,display:"block",marginBottom:4}}>{l}</label>
                  <input className={cls} type={type} value={newUF[k]||""} onChange={e=>setNewUF(f=>({...f,[k]:e.target.value}))}/></div>
              ))}
              <div style={{gridColumn:"span 2"}}>
                <label style={{fontSize:11,fontWeight:600,color:sc,display:"block",marginBottom:4}}>{t("admin.role")}</label>
                <select className={cls} value={newUF.account_type} onChange={e=>setNewUF(f=>({...f,account_type:e.target.value}))}>
                  <option value="farmer">Farmer</option><option value="admin">Admin</option>
                </select></div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:18}}>
              <button onClick={()=>setNewU(false)} className={gg} style={{flex:1,justifyContent:"center",padding:10}}>{t("common.cancel")}</button>
              <button onClick={doUserCreate} className="btn-p" style={{flex:1,justifyContent:"center"}}><Plus className="w-4 h-4"/>{t("admin.createUser")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Редактировать ферму ══ */}
      {editFarm&&(
        <div className="mo-ov" onClick={e=>e.target===e.currentTarget&&setEditFarm(null)}>
          <div className={`mo ${d?"mo-d":"mo-l"} afu`}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{fontFamily:"Syne,sans-serif",color:tc,fontWeight:700,fontSize:17}}>{t("admin.editFarm","Редактировать ферму")}</h3>
              <button onClick={()=>setEditFarm(null)} style={{background:"none",border:"none",cursor:"pointer",color:sc}}><X className="w-5 h-5"/></button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{k:"name",l:t("admin.name")},{k:"region",l:t("admin.region")},
                {k:"area",l:t("admin.area")+" (га)",n:true},{k:"farm_type",l:t("admin.farmType")},
                {k:"address",l:t("admin.address","Адрес")}
              ].map(({k,l,n})=>(
                <div key={k} style={{gridColumn:k==="address"?"span 2":"auto"}}>
                  <label style={{fontSize:11,fontWeight:600,color:sc,display:"block",marginBottom:4}}>{l}</label>
                  <input className={cls} type={n?"number":"text"} value={editFarmF[k]||""} onChange={e=>setEditFarmF(f=>({...f,[k]:n?Number(e.target.value):e.target.value}))}/></div>
              ))}
              <div><label style={{fontSize:11,fontWeight:600,color:sc,display:"block",marginBottom:4}}>{t("admin.status")}</label>
                <select className={cls} value={editFarmF.status||"active"} onChange={e=>setEditFarmF(f=>({...f,status:e.target.value}))}>
                  <option value="active">active</option><option value="inactive">inactive</option>
                </select></div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:18}}>
              <button onClick={()=>setEditFarm(null)} className={gg} style={{flex:1,justifyContent:"center",padding:10}}>{t("common.cancel")}</button>
              <button onClick={doFarmEdit} className="btn-p" style={{flex:1,justifyContent:"center"}} disabled={saving}>
                {saving?<Spin c="#fff"/>:t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Редактировать пастбище ══ */}
      {editPasture&&(
        <div className="mo-ov" onClick={e=>e.target===e.currentTarget&&setEditPasture(null)}>
          <div className={`mo ${d?"mo-d":"mo-l"} afu`}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <h3 style={{fontFamily:"Syne,sans-serif",color:tc,fontWeight:700,fontSize:17}}>{t("admin.editPasture","Редактировать пастбище")}</h3>
              <button onClick={()=>setEditPasture(null)} style={{background:"none",border:"none",cursor:"pointer",color:sc}}><X style={{width:18,height:18}}/></button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                {k:"name",         l:t("admin.name"),                   span:2},
                {k:"area",         l:t("admin.area")+" (га)",           span:1, num:true},
                {k:"pasture_type", l:t("admin.pastureType","Тип"),      span:1},
                {k:"description",  l:t("admin.description","Описание"), span:2},
              ].map(({k,l,span,num})=>(
                <div key={k} style={{gridColumn:`span ${span}`}}>
                  <label style={{fontSize:11,fontWeight:600,color:sc,display:"block",marginBottom:4}}>{l}</label>
                  <input className={cls} type={num?"number":"text"} value={editPastureF[k]||""} onChange={e=>setEditPastureF(f=>({...f,[k]:num?Number(e.target.value):e.target.value}))}/>
                </div>
              ))}
              <div style={{gridColumn:"span 2"}}>
                <label style={{fontSize:11,fontWeight:600,color:sc,display:"block",marginBottom:4}}>{t("admin.status")}</label>
                <select className={cls} value={editPastureF.status||"active"} onChange={e=>setEditPastureF(f=>({...f,status:e.target.value}))}>
                  <option value="active">active</option><option value="inactive">inactive</option>
                </select>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:18}}>
              <button onClick={()=>setEditPasture(null)} className={gg} style={{flex:1,justifyContent:"center",padding:10}}>{t("common.cancel")}</button>
              <button onClick={doPastureEdit} className="btn-p" style={{flex:1,justifyContent:"center"}} disabled={saving}>
                {saving?<Spin c="#fff"/>:t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Редактировать дрон ══ */}
      {editDrone&&(
        <div className="mo-ov" onClick={e=>e.target===e.currentTarget&&setEditDrone(null)}>
          <div className={`mo ${d?"mo-d":"mo-l"} afu`}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{fontFamily:"Syne,sans-serif",color:tc,fontWeight:700,fontSize:17}}>{t("admin.editDrone","Редактировать дрон")}</h3>
              <button onClick={()=>setEditDrone(null)} style={{background:"none",border:"none",cursor:"pointer",color:sc}}><X className="w-5 h-5"/></button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[{k:"model",l:t("admin.droneModel","Модель")},{k:"serial_number",l:t("admin.droneSerial","Серийный №")}].map(({k,l})=>(
                <div key={k}><label style={{fontSize:11,fontWeight:600,color:sc,display:"block",marginBottom:4}}>{l}</label>
                  <input className={cls} value={editDroneF[k]||""} onChange={e=>setEditDroneF(f=>({...f,[k]:e.target.value}))}/></div>
              ))}
              <div><label style={{fontSize:11,fontWeight:600,color:sc,display:"block",marginBottom:4}}>{t("admin.status")}</label>
                <select className={cls} value={editDroneF.status||"active"} onChange={e=>setEditDroneF(f=>({...f,status:e.target.value}))}>
                  <option value="active">active</option><option value="maintenance">maintenance</option><option value="inactive">inactive</option>
                </select></div>
              <div><label style={{fontSize:11,fontWeight:600,color:sc,display:"block",marginBottom:4}}>{t("admin.description","Описание")}</label>
                <textarea className={cls} rows={2} value={editDroneF.description||""} onChange={e=>setEditDroneF(f=>({...f,description:e.target.value}))} style={{resize:"vertical"}}/></div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:18}}>
              <button onClick={()=>setEditDrone(null)} className={gg} style={{flex:1,justifyContent:"center",padding:10}}>{t("common.cancel")}</button>
              <button onClick={doDroneEdit} className="btn-p" style={{flex:1,justifyContent:"center"}} disabled={saving}>
                {saving?<Spin c="#fff"/>:t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODALS: Delete confirmations ══ */}
      {[
        {state:delU,       onClose:()=>setDelU(null),       onConfirm:doUserDelete,    name:delU?.full_name,  label:t("admin.deleteUser")},
        {state:delFarm,    onClose:()=>setDelFarm(null),    onConfirm:doFarmDelete,    name:delFarm?.name,    label:t("admin.deleteFarm","Удалить ферму")},
        {state:delPasture, onClose:()=>setDelPasture(null), onConfirm:doPastureDelete, name:delPasture?.name, label:t("admin.deletePasture","Удалить пастбище")},
        {state:delDrone,   onClose:()=>setDelDrone(null),   onConfirm:doDroneDelete,   name:delDrone?.model,  label:t("admin.deleteDrone","Удалить дрон")},
        {state:delMeas,    onClose:()=>setDelMeas(null),    onConfirm:doMeasDelete,    name:`#${delMeas?.id}`,label:t("admin.deleteMeas","Удалить измерение")},
        {state:delSugg,    onClose:()=>setDelSugg(null),    onConfirm:doSuggDelete,    name:`#${delSugg?.id}`,label:t("admin.deleteSuggestion")},
      ].filter(x=>x.state).map(({state,onClose,onConfirm,name,label})=>(
        <div key={label} className="mo-ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
          <div className={`mo ${d?"mo-d":"mo-l"} afu`} style={{maxWidth:400}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <div style={{width:42,height:42,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(239,68,68,.12)",flexShrink:0}}>
                <Trash2 style={{width:20,height:20,color:"#f87171"}}/>
              </div>
              <h3 style={{fontFamily:"Syne,sans-serif",color:tc,fontWeight:700,fontSize:17}}>{label}</h3>
            </div>
            <p style={{color:sc,fontSize:13,lineHeight:1.6,marginBottom:20}}>
              {t("admin.confirmDelete")} <strong style={{color:tc}}>{name}</strong>
            </p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={onClose} className={gg} style={{flex:1,justifyContent:"center",padding:10}}>{t("common.cancel")}</button>
              <button onClick={onConfirm}
                style={{flex:1,padding:10,borderRadius:10,border:"none",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <Trash2 style={{width:14,height:14}}/>{t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
