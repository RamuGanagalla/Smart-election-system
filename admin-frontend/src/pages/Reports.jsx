import { BarChart3, Download, Trophy, Users, CheckCircle2, TrendingUp } from "lucide-react";
import { candidates } from "../data/mockData";

export default function Reports() {
  const total = candidates.reduce((s,c)=>s+c.votes,0);
  const sorted = [...candidates].sort((a,b)=>b.votes-a.votes);

  return (
    <>
      <div className="page-heading"><div><h1>Election Reports</h1><p>Analyze turnout and candidate performance.</p></div><button className="secondary-btn"><Download size={17}/> Export Report</button></div>
      <div className="report-select"><div><span>Election</span><strong>College Student Council Election 2026</strong></div><span className="status-badge active"><i/>Active</span></div>
      <div className="stats-grid">
        <Stat icon={Users} title="Registered Voters" value="850" tone="blue"/>
        <Stat icon={CheckCircle2} title="Votes Cast" value="632" tone="green"/>
        <Stat icon={TrendingUp} title="Turnout" value="74.35%" tone="orange"/>
        <Stat icon={Trophy} title="Leading Candidate" value={sorted[0].name} tone="purple"/>
      </div>
      <div className="report-grid">
        <section className="panel"><div className="panel-header"><div><h3>Candidate Results</h3><p>Current vote distribution</p></div><BarChart3 size={20}/></div><div className="result-list">{sorted.map((c,i)=>{const pct=(c.votes/total*100); return <div className="result-row" key={c.id}><div className="result-head"><span><b className="rank">{i+1}</b><span className="result-symbol">{c.symbol}</span><strong>{c.name}</strong></span><strong>{c.votes} <small>({pct.toFixed(2)}%)</small></strong></div><div className="progress-bar"><div style={{width:`${pct}%`}}/></div></div>})}</div></section>
        <section className="panel turnout-panel"><div className="panel-header"><div><h3>Turnout Overview</h3><p>Voters who have cast a vote</p></div></div><div className="donut"><div><strong>74.35%</strong><span>Turnout</span></div></div><div className="turnout-legend"><span><i className="dot green-dot"/> Voted <strong>632</strong></span><span><i className="dot gray-dot"/> Not voted <strong>218</strong></span></div></section>
      </div>
      <div className="integrity-banner"><div className="integrity-check"><CheckCircle2 size={22}/></div><div><strong>Vote integrity status</strong><p>All recorded votes have valid integrity hashes. No inconsistencies detected.</p></div><span>Verified</span></div>
    </>
  );
}

function Stat({icon:Icon,title,value,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={21}/></div><div className="stat-info"><span>{title}</span><strong>{value}</strong></div></div> }