import { useState, useEffect, useMemo } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// —— CONFIG FROM VERCEL ENV ——
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CRITERIA = [
  { id: "skills_score",      label: "Skills Match"     },
  { id: "experience_score",  label: "Experience"       },
  { id: "seniority_score",   label: "Seniority"        },
  { id: "salary_score",      label: "Salary Range"     },
  { id: "location_score",    label: "Location"         },
  { id: "industry_score",    label: "Industry Fit"     },
];

// —— HELPERS ——
const scoreColor = s => s >= 88 ? "#4ade80" : s >= 72 ? "#facc15" : "#f87171";
const fmtDate = d => new Date(d).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});

function ScoreRing({ value, size=48, stroke=4 }) {
  const r = (size - stroke*2)/2, circ = 2*Math.PI*r;
  const col = scoreColor(value);
  return (
    <svg width={size} height={size} style={{flexShrink:0,transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a2e" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
        strokeDasharray={`${(value/100)*circ} ${circ}`} strokeLinecap="round"
        style={{transition:"stroke-dasharray 0.5s ease"}}/>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        fill={col} fontSize={size*.22} fontWeight="700" fontFamily="monospace"
        style={{transform:`rotate(90deg)`,transformOrigin:`${size/2}px ${size/2}px`}}>
        {value}
      </text>
    </svg>
  );
}

function Bar({ label, value }) {
  const col = scoreColor(value);
  return (
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <span style={{fontSize:10,color:"#444",fontFamily:"monospace"}}>{label}</span>
        <span style={{fontSize:10,color:col,fontFamily:"monospace",fontWeight:700}}>{value}%</span>
      </div>
      <div style={{height:3,background:"#1a1a2e",borderRadius:2}}>
        <div style={{height:"100%",width:`${value}%`,background:col,borderRadius:2,transition:"width 0.4s ease"}}/>
      </div>
    </div>
  );
}

function Chip({ label, hi }) {
  return (
    <span style={{
      fontSize:10,padding:"2px 8px",borderRadius:20,
      background: hi?"rgba(139,92,246,.15)":"rgba(255,255,255,.04)",
      border:`1px solid ${hi?"rgba(139,92,246,.3)":"rgba(255,255,255,.08)"}`,
      color: hi?"#a78bfa":"#555", fontFamily:"monospace",whiteSpace:"nowrap",
    }}>{label}</span>
  );
}

// —— MAIN EXPORT ——
export default function App() {
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: prof } = await supabase.from("profile").select("*").single();
        setProfile(prof);

        const { data: jobData } = await supabase
          .from("jobs")
          .select("*")
          .order("match_score", { ascending: false });

        setJobs(jobData || []);
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) || 
                           j.company.toLowerCase().includes(search.toLowerCase());
      if (view === "saved") return j.saved && matchesSearch;
      if (view === "applied") return j.applied && matchesSearch;
      return matchesSearch;
    });
  }, [jobs, view, search]);

  if (loading) return <div style={{background:"#08080f",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#7c3aed",fontFamily:"monospace"}}>CONNECTING TO SUPABASE...</div>;

  return (
    <div style={{background:"#08080f",color:"#ccc",minHeight:"100vh",fontFamily:"sans-serif",display:"flex"}}>
      {/* Sidebar */}
      <nav style={{width:240,borderRight:"1px solid #1a1a28",padding:20,display:"flex",flexDirection:"column",gap:8}}>
        <div style={{fontSize:18,fontWeight:900,color:"#fff",marginBottom:30}}>JOB<span style={{color:"#7c3aed"}}>TRACKER</span></div>
        <button onClick={() => setView("all")} style={{background:view==="all"?"#1a1a2e":"transparent",border:"none",color:view==="all"?"#a78bfa":"#555",padding:10,textAlign:"left",borderRadius:8,cursor:"pointer"}}>🔍 Discovery</button>
        <button onClick={() => setView("saved")} style={{background:view==="saved"?"#1a1a2e":"transparent",border:"none",color:view==="saved"?"#a78bfa":"#555",padding:10,textAlign:"left",borderRadius:8,cursor:"pointer"}}>⭐ Shortlist</button>
      </nav>

      {/* Main Feed */}
      <main style={{flex:1,display:"flex",flexDirection:"column"}}>
        <header style={{padding:20,borderBottom:"1px solid #1a1a28",display:"flex",justifyContent:"space-between"}}>
          <input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{background:"#0c0c18",border:"1px solid #1e1e30",borderRadius:8,padding:8,color:"#fff",width:250}}
          />
        </header>

        <div style={{flex:1,padding:20,display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",gap:20,overflowY:"auto"}}>
          {filtered.map(job => (
            <div key={job.id} onClick={() => setSelectedJob(job)} style={{background:"#0c0c18",border:"1px solid #1e1e30",borderRadius:12,padding:20,cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{job.title}</div>
                <ScoreRing value={job.match_score} size={36} />
              </div>
              <div style={{fontSize:12,color:"#7c3aed",marginTop:4}}>{job.company}</div>
              <div style={{marginTop:10,display:"flex",gap:5}}>
                {job.tags?.slice(0,2).map(t => <Chip key={t} label={t} />)}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Detail Panel */}
      {selectedJob && (
        <aside style={{width:350,background:"#090912",borderLeft:"1px solid #1a1a28",padding:20,overflowY:"auto"}}>
          <button onClick={() => setSelectedJob(null)} style={{background:"none",border:"none",color:"#444",cursor:"pointer",marginBottom:20}}>✕ Close</button>
          <h2 style={{color:"#fff"}}>{selectedJob.title}</h2>
          <p style={{color:"#7c3aed",fontWeight:600}}>{selectedJob.company}</p>
          <div style={{marginTop:20}}>
            {CRITERIA.map(c => <Bar key={c.id} label={c.label} value={selectedJob[c.id]} />)}
          </div>
          <hr style={{borderColor:"#1a1a28",margin:"20px 0"}} />
          <div style={{fontSize:12,lineHeight:1.6,color:"#888"}}>{selectedJob.description}</div>
        </aside>
      )}
    </div>
  );
}
