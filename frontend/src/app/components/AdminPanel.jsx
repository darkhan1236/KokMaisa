// src/app/components/AdminPanel.jsx
// KokMaisa 2025 — Admin Dashboard: stats + user management, light/dark

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, Wheat, BarChart3, Shield, LogOut, Search, Trash2, ToggleLeft, ToggleRight, Edit3, X, Leaf, Sun, Moon, TrendingUp, RefreshCw } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const API = "http://127.0.0.1:8000/api";

const ADM_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
.adm{font-family:'DM Sans',sans-serif;min-height:100vh;}
.adm-d{background:#040d06;color:#fff;}
.adm-l{background:#f5fcf2;color:#1a3d20;}
.sidebar{width:230px;flex-shrink:0;display:flex;flex-direction:column;padding:20px 14px;position:sticky;top:0;height:100vh;overflow-y:auto;}
.sidebar-d{background:#061309;border-right:1px solid rgba(255,255,255,.07);}
.sidebar-l{background:#fff;border-right:1px solid rgba(34,197,94,.15);box-shadow:2px 0 16px rgba(34,197,94,.06);}
@media(max-width:768px){.sidebar{display:none;}}
.ni{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:500;transition:background .15s;text-decoration:none;border:none;width:100%;text-align:left;font-family:'DM Sans',sans-serif;}
.ni-d{color:rgba(255,255,255,.55);background:transparent;}
.ni-d:hover,.ni-d.act{background:rgba(255,255,255,.07);color:#fff;}
.ni-d.act{color:#4ade80;}
.ni-l{color:rgba(20,55,20,.6);background:transparent;}
.ni-l:hover,.ni-l.act{background:rgba(34,197,94,.08);color:#166534;}
.ni-l.act{color:#16a34a;}
.sc{border-radius:18px;padding:20px;}
.sc-d{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);}
.sc-l{background:#fff;border:1px solid rgba(34,197,94,.14);box-shadow:0 4px 14px rgba(34,197,94,.07);}
.sc:hover{transform:translateY(-3px);transition:transform .25s;}
.tbl{width:100%;border-collapse:collapse;font-size:13px;}
.tbl th{padding:11px 14px;text-align:left;font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;}
.tbl td{padding:11px 14px;vertical-align:middle;}
.tbl-d th{color:rgba(255,255,255,.3);border-bottom:1px solid rgba(255,255,255,.06);}
.tbl-d td{border-bottom:1px solid rgba(255,255,255,.04);color:rgba(255,255,255,.75);}
.tbl-d tr:hover td{background:rgba(255,255,255,.025);}
.tbl-l th{color:rgba(20,55,20,.4);border-bottom:1px solid rgba(34,197,94,.1);}
.tbl-l td{border-bottom:1px solid rgba(34,197,94,.06);color:rgba(20,55,20,.8);}
.tbl-l tr:hover td{background:rgba(34,197,94,.025);}
.inp-d{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;border-radius:10px;padding:9px 14px;font-size:13px;outline:none;font-family:'DM Sans',sans-serif;}
.inp-d::placeholder{color:rgba(255,255,255,.3);}
.inp-d:focus{border-color:rgba(74,222,128,.5);}
.inp-l{background:#f8fdf8;border:1px solid rgba(34,197,94,.22);color:#1a3d20;border-radius:10px;padding:9px 14px;font-size:13px;outline:none;font-family:'DM Sans',sans-serif;}
.inp-l::placeholder{color:rgba(20,55,20,.35);}
.inp-l:focus{border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.1);}
.bdg{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.05em;}
.bdg-fa-d{background:rgba(74,222,128,.12);color:#4ade80;}
.bdg-fa-l{background:rgba(22,163,74,.1);color:#16a34a;}
.bdg-ad-d{background:rgba(139,92,246,.15);color:#a78bfa;}
.bdg-ad-l{background:rgba(109,40,217,.08);color:#7c3aed;}
.bdg-on-d{background:rgba(74,222,128,.1);color:#4ade80;}
.bdg-on-l{background:rgba(22,163,74,.08);color:#15803d;}
.bdg-off-d{background:rgba(239,68,68,.1);color:#f87171;}
.bdg-off-l{background:rgba(239,68,68,.07);color:#dc2626;}
.btn-p{padding:8px 16px;border-radius:10px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;background:linear-gradient(135deg,#22c55e,#0d9488);color:#fff;transition:transform .2s,box-shadow .2s;display:inline-flex;align-items:center;gap:6px;}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(34,197,94,.35);}
.btn-g-d{padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.11);background:transparent;color:rgba(255,255,255,.55);cursor:pointer;transition:background .15s;display:inline-flex;align-items:center;gap:4px;font-size:12px;}
.btn-g-d:hover{background:rgba(255,255,255,.08);color:#fff;}
.btn-g-l{padding:6px 10px;border-radius:8px;border:1px solid rgba(34,197,94,.2);background:transparent;color:rgba(20,55,20,.6);cursor:pointer;transition:background .15s;display:inline-flex;align-items:center;gap:4px;font-size:12px;}
.btn-g-l:hover{background:rgba(34,197,94,.07);color:#166534;}
.mo-ov{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;}
.mo-d{background:#061309;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:28px;width:100%;max-width:420px;}
.mo-l{background:#fff;border:1px solid rgba(34,197,94,.15);border-radius:20px;padding:28px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.12);}
.adm-main{flex:1;overflow-y:auto;padding:28px;}
@media(max-width:640px){.adm-main{padding:14px;}}
@keyframes afu{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.afu{animation:afu .35s cubic-bezier(.22,1,.36,1) both;}
`;

function useAdminAPI() {
  const token = localStorage.getItem("access_token") || "";
  const H = { Authorization: `Bearer ${token}`, "Content-Type":"application/json" };
  return {
    stats:       () => fetch(`${API}/admin/stats`,{headers:H}).then(r=>r.json()),
    users:       (q) => fetch(`${API}/admin/users${q}`,{headers:H}).then(r=>r.json()),
    toggle:      (id) => fetch(`${API}/admin/users/${id}/toggle-active`,{method:"POST",headers:H}).then(r=>r.json()),
    del:         (id) => fetch(`${API}/admin/users/${id}`,{method:"DELETE",headers:H}).then(r=>r.json()),
    update:      (id,d) => fetch(`${API}/admin/users/${id}`,{method:"PUT",headers:H,body:JSON.stringify(d)}).then(r=>r.json()),
  };
}

export default function AdminPanel() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const d = theme === "dark";
  const api = useAdminAPI();

  const [tab, setTab]     = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [editU, setEditU] = useState(null);
  const [editF, setEditF] = useState({});
  const [delU,  setDelU]  = useState(null);

  const tc = d ? "#fff" : "#1a3d20";
  const sc = d ? "rgba(255,255,255,.45)" : "rgba(20,55,20,.5)";

  useEffect(() => { api.stats().then(setStats).catch(()=>{}); }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      let q = "?limit=200";
      if (filter !== "all") q += `&account_type=${filter}`;
      if (search) q += `&search=${encodeURIComponent(search)}`;
      const data = await api.users(q);
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { if (tab === "users") loadUsers(); }, [tab, loadUsers]);

  const handleToggle = async (id) => { await api.toggle(id); loadUsers(); };
  const handleDel    = async () => { if (!delU) return; await api.del(delU.id); setDelU(null); loadUsers(); api.stats().then(setStats); };
  const handleEdit   = async () => { if (!editU) return; await api.update(editU.id, editF); setEditU(null); loadUsers(); };

  if (user?.account_type !== "admin") return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background: d?"#040d06":"#f5fcf2" }}>
      <div className="text-center">
        <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: sc }} />
        <p style={{ color: sc }}>{t("admin.accessDenied","Admin only")}</p>
      </div>
    </div>
  );

  const nc = (id) => `ni ${d?`ni-d${tab===id?" act":""}` :`ni-l${tab===id?" act":""}`}`;
  const cls = d ? "inp-d" : "inp-l";

  const statCards = stats ? [
    { icon:Users,     val:stats.users?.total,   lbl:t("admin.totalUsers"),   a:"#4ade80" },
    { icon:Wheat,     val:stats.users?.farmers,  lbl:t("admin.totalFarmers"), a:"#22d3ee" },
    { icon:Shield,    val:stats.users?.admins,   lbl:t("admin.totalAdmins"),  a:"#a78bfa" },
    { icon:BarChart3, val:stats.farms,           lbl:t("admin.totalFarms"),   a:"#fbbf24" },
    { icon:TrendingUp,val:stats.analyses,        lbl:t("admin.totalAnalyses"),a:"#f472b6" },
    { icon:Users,     val:stats.users?.active,   lbl:t("admin.activeUsers"),  a:"#34d399" },
  ] : [];

  return (
    <>
      <style>{ADM_STYLE}</style>
      <div className={`adm flex ${d?"adm-d":"adm-l"}`}>

        {/* Sidebar */}
        <aside className={`sidebar ${d?"sidebar-d":"sidebar-l"}`}>
          <div className="flex items-center gap-2 mb-8 px-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"linear-gradient(135deg,#22c55e,#0d9488)" }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm" style={{ fontFamily:"Syne,sans-serif", color:tc }}>KokMaisa</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2 px-2" style={{ color:sc, letterSpacing:".15em" }}>Admin</p>
          <nav className="space-y-0.5 flex-1">
            {[
              { id:"dashboard", icon:BarChart3, lbl:t("admin.dashboard","Dashboard") },
              { id:"users",     icon:Users,     lbl:t("admin.users","Users") },
              { id:"farms",     icon:Wheat,     lbl:t("admin.farms","Farms") },
            ].map(({ id, icon:Icon, lbl }) => (
              <button key={id} onClick={()=>setTab(id)} className={nc(id)}>
                <Icon className="w-4 h-4 flex-shrink-0" />{lbl}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-0.5 pt-4 border-t" style={{ borderColor: d?"rgba(255,255,255,.06)":"rgba(34,197,94,.12)" }}>
            <button onClick={toggleTheme} className={`ni ${d?"ni-d":"ni-l"}`}>
              {d?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}
              {d?"Light":"Dark"}
            </button>
            <button onClick={()=>{logout?.();navigate("/");}} className={`ni ${d?"ni-d":"ni-l"}`}>
              <LogOut className="w-4 h-4"/>{t("nav.logout")}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="adm-main">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 className="text-2xl font-extrabold" style={{ fontFamily:"Syne,sans-serif", color:tc }}>{t("admin.title","Admin Panel")}</h1>
              <p className="text-xs mt-0.5" style={{ color:sc }}>{user?.email}</p>
            </div>
            <button onClick={()=>api.stats().then(setStats)} className={d?"btn-g-d":"btn-g-l"}>
              <RefreshCw className="w-3.5 h-3.5"/>
            </button>
          </div>

          {/* Dashboard */}
          {tab==="dashboard" && (
            <div className="afu">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {statCards.map(({ icon:Icon, val, lbl, a }) => (
                  <div key={lbl} className={`sc ${d?"sc-d":"sc-l"}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background:`${a}18`, border:`1px solid ${a}28` }}>
                      <Icon className="w-4 h-4" style={{ color:a }} />
                    </div>
                    <div className="text-2xl font-extrabold" style={{ fontFamily:"Syne,sans-serif", color:tc }}>{val??"-"}</div>
                    <div className="text-xs mt-0.5" style={{ color:sc }}>{lbl}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl p-5" style={{ background:d?"rgba(255,255,255,.03)":"#fff", border:d?"1px solid rgba(255,255,255,.07)":"1px solid rgba(34,197,94,.12)" }}>
                <h2 className="font-bold mb-4" style={{ fontFamily:"Syne,sans-serif", color:tc }}>Quick Actions</h2>
                <button className="btn-p" onClick={()=>setTab("users")}><Users className="w-4 h-4"/>Manage Users</button>
              </div>
            </div>
          )}

          {/* Users */}
          {tab==="users" && (
            <div className="afu">
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:sc }} />
                  <input className={`${cls} pl-9 w-48`} placeholder={t("admin.search","Search...")} value={search} onChange={e=>setSearch(e.target.value)} />
                </div>
                {["all","farmer","admin"].map(f=>(
                  <button key={f} onClick={()=>setFilter(f)} className={filter===f?"btn-p":(d?"btn-g-d":"btn-g-l")} style={{ padding:"7px 12px" }}>
                    {f==="all"?t("admin.filterAll","All"):f==="farmer"?t("admin.filterFarmer","Farmers"):t("admin.filterAdmin","Admins")}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ background:d?"rgba(255,255,255,.03)":"#fff", border:d?"1px solid rgba(255,255,255,.06)":"1px solid rgba(34,197,94,.1)" }}>
                {loading ? (
                  <div className="p-10 text-center" style={{ color:sc }}>Loading...</div>
                ) : users.length===0 ? (
                  <div className="p-10 text-center" style={{ color:sc }}>{t("admin.noUsers","No users found")}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className={`tbl ${d?"tbl-d":"tbl-l"}`}>
                      <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {users.map(u=>(
                          <tr key={u.id}>
                            <td className="font-mono text-xs" style={{ color:sc }}>#{u.id}</td>
                            <td>
                              <div className="font-medium" style={{ color:tc }}>{u.full_name}</div>
                              <div className="text-xs" style={{ color:sc }}>{u.city}, {u.country}</div>
                            </td>
                            <td style={{ color:sc, fontSize:12 }}>{u.email}</td>
                            <td>
                              <span className={`bdg ${u.account_type==="admin"?(d?"bdg-ad-d":"bdg-ad-l"):(d?"bdg-fa-d":"bdg-fa-l")}`}>
                                {u.account_type==="admin"?"Admin":"Farmer"}
                              </span>
                            </td>
                            <td>
                              <span className={`bdg ${u.is_active?(d?"bdg-on-d":"bdg-on-l"):(d?"bdg-off-d":"bdg-off-l")}`}>
                                {u.is_active?"Active":"Inactive"}
                              </span>
                            </td>
                            <td>
                              <div className="flex gap-1.5">
                                <button onClick={()=>{setEditU(u);setEditF({account_type:u.account_type,full_name:u.full_name});}} className={d?"btn-g-d":"btn-g-l"} title="Edit">
                                  <Edit3 className="w-3.5 h-3.5"/>
                                </button>
                                <button onClick={()=>handleToggle(u.id)} className={d?"btn-g-d":"btn-g-l"} title="Toggle active">
                                  {u.is_active?<ToggleRight className="w-3.5 h-3.5" style={{ color:"#4ade80" }}/>:<ToggleLeft className="w-3.5 h-3.5"/>}
                                </button>
                                <button onClick={()=>setDelU(u)} className={d?"btn-g-d":"btn-g-l"} title="Delete" style={{ color:"#f87171" }}>
                                  <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab==="farms" && (
            <div className="afu rounded-2xl p-8 text-center" style={{ background:d?"rgba(255,255,255,.03)":"#fff", border:d?"1px solid rgba(255,255,255,.06)":"1px solid rgba(34,197,94,.1)" }}>
              <Wheat className="w-12 h-12 mx-auto mb-3" style={{ color:sc }} />
              <p style={{ color:sc }}>Farm management — coming soon</p>
            </div>
          )}
        </main>

        {/* Edit Modal */}
        {editU && (
          <div className="mo-ov" onClick={e=>e.target===e.currentTarget&&setEditU(null)}>
            <div className={`${d?"mo-d":"mo-l"} afu`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold" style={{ fontFamily:"Syne,sans-serif", color:tc }}>Edit User</h3>
                <button onClick={()=>setEditU(null)} style={{ background:"none", border:"none", cursor:"pointer", color:sc }}><X className="w-5 h-5"/></button>
              </div>
              <div className="space-y-3">
                <div><label className="text-xs font-semibold mb-1 block" style={{ color:sc }}>Full Name</label><input className={`${cls} w-full`} value={editF.full_name||""} onChange={e=>setEditF(f=>({...f,full_name:e.target.value}))}/></div>
                <div><label className="text-xs font-semibold mb-1 block" style={{ color:sc }}>Role</label>
                  <select className={`${cls} w-full`} value={editF.account_type||"farmer"} onChange={e=>setEditF(f=>({...f,account_type:e.target.value}))}>
                    <option value="farmer">Farmer</option><option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={()=>setEditU(null)} className={d?"btn-g-d":"btn-g-l"} style={{ flex:1, justifyContent:"center", padding:"9px" }}>Cancel</button>
                <button onClick={handleEdit} className="btn-p" style={{ flex:1, justifyContent:"center" }}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {delU && (
          <div className="mo-ov" onClick={e=>e.target===e.currentTarget&&setDelU(null)}>
            <div className={`${d?"mo-d":"mo-l"} afu`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"rgba(239,68,68,.12)" }}>
                  <Trash2 className="w-5 h-5 text-red-400"/>
                </div>
                <h3 className="font-bold" style={{ fontFamily:"Syne,sans-serif", color:tc }}>Delete User</h3>
              </div>
              <p className="text-sm mb-6" style={{ color:sc }}>
                {t("admin.confirmDelete","Are you sure?")} <br/>
                <strong style={{ color:tc }}>{delU.full_name}</strong>
              </p>
              <div className="flex gap-3">
                <button onClick={()=>setDelU(null)} className={d?"btn-g-d":"btn-g-l"} style={{ flex:1, justifyContent:"center", padding:"9px" }}>Cancel</button>
                <button onClick={handleDel} style={{ flex:1, padding:"9px", borderRadius:"9px", border:"none", background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff", cursor:"pointer", fontWeight:600, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <Trash2 className="w-4 h-4"/> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}