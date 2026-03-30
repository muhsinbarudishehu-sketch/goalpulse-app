import { useState, useEffect, useCallback } from "react";

const FD_KEY  = "cf8d3f6b2fb540d0ba5abcdfd3ee76ce";
const FD_BASE = "https://api.football-data.org/v4";
const NEWS_PROXY = "https://football-proxy-alpha.vercel.app/api/news";

const COMPETITIONS = {
  PL:  { id: "PL",  name: "Premier League",   flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  CL:  { id: "CL",  name: "Champions League", flag: "🏆" },
  PD:  { id: "PD",  name: "La Liga",          flag: "🇪🇸" },
  BL1: { id: "BL1", name: "Bundesliga",       flag: "🇩🇪" },
  SA:  { id: "SA",  name: "Serie A",          flag: "🇮🇹" },
  FL1: { id: "FL1", name: "Ligue 1",          flag: "🇫🇷" },
  EL:  { id: "EL",  name: "Europa League",    flag: "🥈" },
  WC:  { id: "WC",  name: "World Cup",        flag: "🌍" },
  PPL: { id: "PPL", name: "Primeira Liga",    flag: "🇵🇹" },
  DED: { id: "DED", name: "Eredivisie",       flag: "🇳🇱" },
};

const SEASONS = Array.from({ length: 11 }, (_, i) => 2025 - i);
function seasonLabel(y) { return y + "/" + String(y + 1).slice(2); }

const WATCH_ITEMS = [
  { id:1, emoji:"🏆", title:"UCL Quarter-Final Highlights: Bayern 3-2 PSG", views:"2.1M views", time:"Yesterday" },
  { id:2, emoji:"⚽", title:"Premier League Top 10 Goals — March 2026",      views:"890K views", time:"2 days ago" },
  { id:3, emoji:"🎯", title:"Arsenal vs Chelsea — Full Match Highlights",     views:"1.5M views", time:"Today" },
  { id:4, emoji:"🌟", title:"Mbappe's Best 20 Goals of the Season",           views:"4.2M views", time:"3 days ago" },
  { id:5, emoji:"🔥", title:"El Clásico Preview & Predictions 2026",          views:"670K views", time:"5 hours ago" },
  { id:6, emoji:"📊", title:"Tactical Breakdown: How Liverpool Press",         views:"310K views", time:"1 week ago" },
];

const NEWS_TOPICS = [
  { label:"All Football",     q:"football soccer" },
  { label:"Premier League",   q:"Premier League" },
  { label:"Champions League", q:"Champions League" },
  { label:"Transfers",        q:"football transfer" },
  { label:"Injuries",         q:"football injury" },
];

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

// ─── STYLES ────────────────────────────────────────────────────────────────
function buildStyles(dark) {
  const v = dark ? {
    bg:"#0a0f0a", card:"#111811", border:"#1e2b1e",
    text:"#e8f5e8", muted:"#6b8f6b", navBg:"rgba(10,15,10,0.95)"
  } : {
    bg:"#f0f7f0", card:"#ffffff", border:"#d0e8d0",
    text:"#0d1f0d", muted:"#4a7a4a", navBg:"rgba(240,247,240,0.95)"
  };
  return `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    :root{
      --green:#00FF87;--bg:${v.bg};--card:${v.card};--border:${v.border};
      --text:${v.text};--muted:${v.muted};--red:#ff4444;--yellow:#ffd700;
      --nav:${v.navBg};
    }
    body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;}
    .app{min-height:100vh;background:var(--bg);}
    .header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;
      border-bottom:1px solid var(--border);background:var(--nav);
      position:sticky;top:0;z-index:100;backdrop-filter:blur(12px);}
    .logo{font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:var(--green);letter-spacing:2px;}
    .logo span{color:var(--text);}
    .header-right{display:flex;align-items:center;gap:10px;}
    .theme-btn{background:none;border:1px solid var(--border);color:var(--text);
      width:34px;height:34px;border-radius:8px;cursor:pointer;font-size:1rem;
      display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
    .theme-btn:hover{border-color:var(--green);}
    .notif-btn{position:relative;background:none;border:1px solid var(--border);color:var(--text);
      width:34px;height:34px;border-radius:8px;cursor:pointer;font-size:1rem;
      display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
    .notif-btn:hover{border-color:var(--green);}
    .notif-badge{position:absolute;top:-4px;right:-4px;background:var(--red);color:#fff;
      width:16px;height:16px;border-radius:50%;font-size:0.6rem;font-weight:700;
      display:flex;align-items:center;justify-content:center;}
    .nav{display:flex;gap:4px;padding:12px 20px;border-bottom:1px solid var(--border);overflow-x:auto;}
    .nav::-webkit-scrollbar{display:none;}
    .nav-btn{background:none;border:1px solid transparent;color:var(--muted);
      padding:7px 14px;border-radius:6px;cursor:pointer;font-family:'DM Sans',sans-serif;
      font-size:0.82rem;font-weight:500;white-space:nowrap;transition:all 0.2s;}
    .nav-btn:hover{color:var(--text);border-color:var(--border);}
    .nav-btn.active{background:var(--green);color:#0a0f0a;font-weight:600;border-color:var(--green);}
    .main{padding:20px;max-width:1200px;margin:0 auto;}
    .section-title{font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:2px;
      color:var(--muted);margin-bottom:14px;display:flex;align-items:center;gap:10px;}
    .section-title::after{content:'';flex:1;height:1px;background:var(--border);}
    .league-tabs{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;}
    .league-tab{background:var(--card);border:1px solid var(--border);color:var(--muted);
      padding:5px 12px;border-radius:20px;cursor:pointer;font-size:0.78rem;
      font-family:'DM Sans',sans-serif;transition:all 0.2s;white-space:nowrap;}
    .league-tab:hover{border-color:var(--green);color:var(--text);}
    .league-tab.active{background:#00ff8722;border-color:var(--green);color:var(--green);font-weight:600;}
    .scores-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:24px;}
    .score-card{background:var(--card);border:1px solid var(--border);border-radius:12px;
      padding:14px;cursor:pointer;transition:all 0.2s;}
    .score-card:hover{border-color:var(--green);transform:translateY(-2px);}
    .score-card.live{border-color:#ff444433;}
    .score-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
    .league-name{font-size:0.68rem;color:var(--muted);font-weight:600;letter-spacing:1px;text-transform:uppercase;}
    .match-status{font-size:0.68rem;font-weight:700;}
    .match-status.live{color:var(--red);}
    .match-status.ft{color:var(--muted);}
    .match-status.upcoming{color:var(--green);}
    .teams{display:flex;flex-direction:column;gap:8px;}
    .team-row{display:flex;justify-content:space-between;align-items:center;}
    .team-name{font-size:0.9rem;font-weight:500;display:flex;align-items:center;gap:6px;}
    .team-score{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;color:var(--text);}
    .team-score.winning{color:var(--green);}
    .crest{width:18px;height:18px;object-fit:contain;}
    .news-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;}
    .news-card{background:var(--card);border:1px solid var(--border);border-radius:12px;
      overflow:hidden;cursor:pointer;transition:all 0.2s;}
    .news-card:hover{border-color:var(--green);transform:translateY(-2px);}
    .news-img{width:100%;height:150px;background:var(--border);
      display:flex;align-items:center;justify-content:center;font-size:2.2rem;
      position:relative;overflow:hidden;}
    .news-img::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,var(--card));}
    .news-body{padding:12px;}
    .news-tag{font-size:0.62rem;color:var(--green);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px;}
    .news-title{font-size:0.9rem;font-weight:600;line-height:1.4;margin-bottom:6px;}
    .news-summary{font-size:0.78rem;color:var(--muted);line-height:1.5;}
    .news-meta{font-size:0.68rem;color:var(--muted);margin-top:8px;}
    .watch-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;}
    .watch-card{background:var(--card);border:1px solid var(--border);border-radius:12px;
      overflow:hidden;cursor:pointer;transition:all 0.2s;}
    .watch-card:hover{border-color:var(--green);transform:translateY(-2px);}
    .watch-thumb{width:100%;height:140px;background:linear-gradient(135deg,#0d2b0d,#1a1a0d);
      display:flex;align-items:center;justify-content:center;font-size:2.8rem;position:relative;}
    .play-btn{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.4);transition:all 0.2s;}
    .play-btn svg{width:44px;height:44px;fill:var(--green);}
    .watch-card:hover .play-btn{background:rgba(0,255,135,0.1);}
    .watch-info{padding:12px;}
    .watch-title{font-size:0.88rem;font-weight:600;margin-bottom:5px;}
    .watch-meta{font-size:0.72rem;color:var(--muted);display:flex;gap:10px;}
    .standings-wrap{overflow-x:auto;}
    .standings-table{width:100%;border-collapse:collapse;min-width:480px;}
    .standings-table th{text-align:left;font-size:0.68rem;color:var(--muted);font-weight:600;
      letter-spacing:1px;text-transform:uppercase;padding:9px 10px;border-bottom:1px solid var(--border);}
    .standings-table td{padding:10px;font-size:0.83rem;border-bottom:1px solid var(--border);}
    .standings-table tr:hover td{background:var(--border);}
    .pos{color:var(--muted);font-weight:600;}
    .pos.cl{color:var(--green);}
    .pos.el{color:var(--yellow);}
    .pos.rel{color:var(--red);}
    .form-badge{display:inline-block;width:17px;height:17px;border-radius:3px;font-size:0.62rem;
      font-weight:700;text-align:center;line-height:17px;margin-right:2px;}
    .form-W{background:#00ff8722;color:var(--green);}
    .form-D{background:#ffffff11;color:var(--muted);}
    .form-L{background:#ff444422;color:var(--red);}
    .loader{display:flex;gap:6px;align-items:center;padding:28px 0;color:var(--muted);font-size:0.85rem;}
    .loader-dot{width:7px;height:7px;background:var(--green);border-radius:50%;animation:bounce 1s infinite;}
    .loader-dot:nth-child(2){animation-delay:0.15s;}
    .loader-dot:nth-child(3){animation-delay:0.3s;}
    @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    .error-box{background:#1a0a0a;border:1px solid #ff444433;border-radius:8px;padding:14px;
      color:var(--muted);font-size:0.83rem;line-height:1.6;}
    .retry-btn{color:var(--green);background:none;border:none;cursor:pointer;font-size:0.83rem;margin-left:8px;text-decoration:underline;}
    .empty{color:var(--muted);padding:28px 0;font-size:0.88rem;}
    .refresh-btn{background:none;border:1px solid var(--border);color:var(--muted);
      padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.78rem;
      font-family:'DM Sans',sans-serif;transition:all 0.2s;}
    .refresh-btn:hover{border-color:var(--green);color:var(--green);}
    /* PLAYER STATS */
    .search-bar{display:flex;gap:8px;margin-bottom:20px;}
    .search-input{flex:1;background:var(--card);border:1px solid var(--border);color:var(--text);
      padding:10px 14px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:0.9rem;outline:none;}
    .search-input:focus{border-color:var(--green);}
    .search-input::placeholder{color:var(--muted);}
    .search-btn{background:var(--green);color:#0a0f0a;border:none;padding:10px 18px;
      border-radius:8px;cursor:pointer;font-weight:700;font-family:'DM Sans',sans-serif;font-size:0.85rem;}
    .player-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;margin-bottom:16px;}
    .player-header{display:flex;align-items:center;gap:16px;margin-bottom:20px;}
    .player-avatar{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#00ff8733,#00ff8711);
      display:flex;align-items:center;justify-content:center;font-size:2rem;border:2px solid var(--green);}
    .player-name{font-family:'Bebas Neue',sans-serif;font-size:1.6rem;letter-spacing:1px;}
    .player-meta{font-size:0.8rem;color:var(--muted);margin-top:2px;}
    .stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;}
    .stat-box{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center;}
    .stat-val{font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:var(--green);}
    .stat-lbl{font-size:0.68rem;color:var(--muted);font-weight:600;letter-spacing:0.5px;text-transform:uppercase;margin-top:2px;}
    .player-list{display:flex;flex-direction:column;gap:8px;margin-top:8px;}
    .player-row{background:var(--card);border:1px solid var(--border);border-radius:10px;
      padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all 0.2s;}
    .player-row:hover{border-color:var(--green);}
    .player-row-name{font-weight:600;font-size:0.9rem;}
    .player-row-meta{font-size:0.75rem;color:var(--muted);}
    /* FAVOURITES */
    .fav-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:20px;}
    .fav-card{background:var(--card);border:1px solid var(--border);border-radius:12px;
      padding:16px;text-align:center;cursor:pointer;transition:all 0.2s;position:relative;}
    .fav-card:hover{border-color:var(--green);transform:translateY(-2px);}
    .fav-card.selected{border-color:var(--green);background:#00ff8711;}
    .fav-crest{width:48px;height:48px;object-fit:contain;margin:0 auto 8px;}
    .fav-name{font-size:0.82rem;font-weight:600;}
    .fav-check{position:absolute;top:8px;right:8px;color:var(--green);font-size:1rem;}
    .fav-matches{display:flex;flex-direction:column;gap:8px;}
    /* NOTIFICATIONS */
    .notif-panel{position:fixed;top:0;right:0;bottom:0;width:min(340px,100vw);
      background:var(--card);border-left:1px solid var(--border);z-index:200;
      display:flex;flex-direction:column;box-shadow:-4px 0 20px rgba(0,0,0,0.3);}
    .notif-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:199;}
    .notif-header{padding:18px 20px;border-bottom:1px solid var(--border);
      display:flex;align-items:center;justify-content:space-between;}
    .notif-title{font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:1px;}
    .notif-close{background:none;border:none;color:var(--muted);font-size:1.4rem;cursor:pointer;}
    .notif-list{flex:1;overflow-y:auto;padding:12px;}
    .notif-item{background:var(--bg);border:1px solid var(--border);border-radius:10px;
      padding:12px 14px;margin-bottom:8px;}
    .notif-item.unread{border-color:var(--green);background:#00ff8708;}
    .notif-item-title{font-size:0.88rem;font-weight:600;margin-bottom:3px;}
    .notif-item-body{font-size:0.78rem;color:var(--muted);line-height:1.4;}
    .notif-item-time{font-size:0.68rem;color:var(--muted);margin-top:5px;}
    .notif-empty{text-align:center;color:var(--muted);padding:40px 20px;font-size:0.88rem;}
    .notif-settings{padding:14px 20px;border-top:1px solid var(--border);}
    .notif-settings-title{font-size:0.72rem;color:var(--muted);font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;}
    .toggle-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
    .toggle-label{font-size:0.85rem;}
    .toggle{width:38px;height:22px;background:var(--border);border-radius:11px;position:relative;cursor:pointer;transition:all 0.2s;border:none;}
    .toggle.on{background:var(--green);}
    .toggle::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;
      background:#fff;border-radius:50%;transition:all 0.2s;}
    .toggle.on::after{transform:translateX(16px);}
  `;
}

// ─── HOOKS ─────────────────────────────────────────────────────────────────
function useFD(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setLoading(true); setError("");
    fetch(FD_BASE + path, { headers: { "X-Auth-Token": FD_KEY } })
      .then(r => { if (!r.ok) throw new Error("API error " + r.status); return r.json(); })
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [...deps, tick]);
  return { data, loading, error, refresh: () => setTick(t => t + 1) };
}

// ─── SHARED COMPONENTS ─────────────────────────────────────────────────────
function Loader({ text = "Loading..." }) {
  return <div className="loader"><div className="loader-dot"/><div className="loader-dot"/><div className="loader-dot"/>{text}</div>;
}

function getStatusInfo(match) {
  const s = match.status;
  if (s === "IN_PLAY" || s === "PAUSED") return { label:"🔴 LIVE", cls:"live", isLive:true };
  if (s === "FINISHED") return { label:"FT", cls:"ft", isLive:false };
  const d = new Date(match.utcDate);
  return { label:"🕐 " + d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), cls:"upcoming", isLive:false };
}

function MatchCard({ match }) {
  const { label, cls, isLive } = getStatusInfo(match);
  const home = match.homeTeam, away = match.awayTeam;
  const hs = match.score?.fullTime?.home ?? match.score?.halfTime?.home;
  const as_ = match.score?.fullTime?.away ?? match.score?.halfTime?.away;
  return (
    <div className={"score-card " + (isLive ? "live" : "")}>
      <div className="score-header">
        <span className="league-name">{match.competition?.name}</span>
        <span className={"match-status " + cls}>{label}</span>
      </div>
      <div className="teams">
        {[{team:home,score:hs,win:hs>as_},{team:away,score:as_,win:as_>hs}].map(({team,score,win},i) => (
          <div key={i} className="team-row">
            <span className="team-name">
              {team.crest && <img src={team.crest} className="crest" alt="" onError={e=>e.target.style.display='none'}/>}
              {team.shortName || team.name}
            </span>
            <span className={"team-score " + (win?"winning":"")}>{score !== null && score !== undefined ? score : "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SCORES TAB ────────────────────────────────────────────────────────────
function ScoresTab() {
  const [league, setLeague] = useState("PL");
  const [season, setSeason] = useState(2025);
  const [filter, setFilter] = useState("all");
  const { data, loading, error, refresh } = useFD("/competitions/" + league + "/matches?season=" + season, [league, season]);
  const all = data?.matches || [];
  const matches = filter === "results" ? all.filter(m=>m.status==="FINISHED")
    : filter === "upcoming" ? all.filter(m=>m.status==="SCHEDULED"||m.status==="TIMED")
    : all;
  const sorted = filter === "upcoming" ? matches : [...matches].reverse();

  return <>
    <div className="section-title">MATCHES</div>
    <div className="league-tabs">
      {Object.values(COMPETITIONS).map(c => (
        <button key={c.id} className={"league-tab "+(league===c.id?"active":"")} onClick={()=>setLeague(c.id)}>
          {c.flag} {c.name}
        </button>
      ))}
    </div>
    <div style={{marginBottom:14}}>
      <div style={{fontSize:"0.68rem",color:"var(--muted)",fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",marginBottom:7}}>Season</div>
      <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
        {SEASONS.map(y=>(
          <button key={y} className={"league-tab "+(season===y?"active":"")} onClick={()=>setSeason(y)}>{seasonLabel(y)}</button>
        ))}
      </div>
    </div>
    <div style={{display:"flex",gap:"6px",marginBottom:"14px",alignItems:"center",flexWrap:"wrap"}}>
      {[["all","📋 All"],["results","✅ Results"],["upcoming","🗓 Upcoming"]].map(([f,l])=>(
        <button key={f} className={"league-tab "+(filter===f?"active":"")} onClick={()=>setFilter(f)}>{l}</button>
      ))}
      <button className="refresh-btn" style={{marginLeft:"auto"}} onClick={refresh}>↻ Refresh</button>
    </div>
    <div style={{fontSize:"0.72rem",color:"var(--muted)",marginBottom:"14px"}}>Season {seasonLabel(season)} · {sorted.length} matches</div>
    {loading && <Loader text={"Loading " + seasonLabel(season) + " season…"}/>}
    {error && <div className="error-box">⚠️ {error}<button className="retry-btn" onClick={refresh}>Retry</button></div>}
    {!loading && !error && sorted.length === 0 && <div className="empty">No matches found.</div>}
    {!loading && !error && <div className="scores-grid">{sorted.map(m=><MatchCard key={m.id} match={m}/>)}</div>}
  </>;
}

// ─── STANDINGS TAB ─────────────────────────────────────────────────────────
function StandingsTab() {
  const [league, setLeague] = useState("PL");
  const { data, loading, error, refresh } = useFD("/competitions/" + league + "/standings", [league]);
  const table = data?.standings?.find(s=>s.type==="TOTAL")?.table || [];
  const posClass = (p,t) => p<=4?"cl":p===5||p===6?"el":p>t-3?"rel":"";

  return <>
    <div className="section-title">STANDINGS</div>
    <div className="league-tabs">
      {Object.values(COMPETITIONS).map(c=>(
        <button key={c.id} className={"league-tab "+(league===c.id?"active":"")} onClick={()=>setLeague(c.id)}>
          {c.flag} {c.name}
        </button>
      ))}
    </div>
    {loading && <Loader text="Fetching standings…"/>}
    {error && <div className="error-box">⚠️ {error}<button className="retry-btn" onClick={refresh}>Retry</button></div>}
    {!loading && !error && (
      <div className="standings-wrap">
        <table className="standings-table">
          <thead><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th><th>Form</th></tr></thead>
          <tbody>
            {table.map(row=>{
              const gd = row.goalDifference>=0?"+"+row.goalDifference:String(row.goalDifference);
              const form = (row.form||"").split(",").filter(Boolean).slice(-5);
              return (
                <tr key={row.position}>
                  <td className={"pos "+posClass(row.position,table.length)}>{row.position}</td>
                  <td style={{fontWeight:600}}>
                    {row.team.crest&&<img src={row.team.crest} className="crest" style={{marginRight:7}} alt="" onError={e=>e.target.style.display='none'}/>}
                    {row.team.shortName||row.team.name}
                  </td>
                  <td>{row.playedGames}</td><td>{row.won}</td><td>{row.draw}</td><td>{row.lost}</td>
                  <td style={{color:row.goalDifference>=0?"var(--green)":"var(--red)"}}>{gd}</td>
                  <td style={{fontWeight:700,color:"var(--green)"}}>{row.points}</td>
                  <td>{form.map((f,i)=><span key={i} className={"form-badge form-"+f}>{f}</span>)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{fontSize:"0.68rem",color:"var(--muted)",marginTop:10,display:"flex",gap:14}}>
          <span><span style={{color:"var(--green)"}}>■</span> Champions League</span>
          <span><span style={{color:"var(--yellow)"}}>■</span> Europa League</span>
          <span><span style={{color:"var(--red)"}}>■</span> Relegation</span>
        </div>
      </div>
    )}
  </>;
}

// ─── PLAYER STATS TAB ──────────────────────────────────────────────────────
function PlayerStatsTab() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [teamId, setTeamId] = useState(null);
  const [playerId, setPlayerId] = useState(null);

  const { data: teamData, loading: teamLoading, error: teamError } = useFD(
    search ? "/teams?name=" + encodeURIComponent(search) : null, [search]
  );
  const { data: squadData, loading: squadLoading } = useFD(
    teamId ? "/teams/" + teamId : null, [teamId]
  );
  const { data: playerData, loading: playerLoading } = useFD(
    playerId ? "/persons/" + playerId : null, [playerId]
  );

  const teams = teamData?.teams || [];
  const squad = squadData?.squad || [];
  const player = playerData;

  function doSearch() { if (query.trim()) setSearch(query.trim()); }

  const statItems = player ? [
    { val: player.dateOfBirth ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear() : "—", lbl:"Age" },
    { val: player.nationality || "—", lbl:"Nation" },
    { val: player.position || "—", lbl:"Position" },
    { val: player.shirtNumber || "—", lbl:"Shirt No." },
    { val: player.currentTeam?.name || "—", lbl:"Club" },
    { val: player.currentTeam?.area?.name || "—", lbl:"League" },
  ] : [];

  return <>
    <div className="section-title">PLAYER STATS</div>
    <div className="search-bar">
      <input className="search-input" placeholder="Search team name (e.g. Arsenal)…"
        value={query} onChange={e=>setQuery(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&doSearch()}/>
      <button className="search-btn" onClick={doSearch}>Search</button>
    </div>

    {/* Back buttons */}
    {(teamId || playerId) && (
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {playerId && <button className="league-tab active" onClick={()=>setPlayerId(null)}>← Back to Squad</button>}
        {teamId && !playerId && <button className="league-tab active" onClick={()=>{setTeamId(null);}}>← Back to Teams</button>}
      </div>
    )}

    {/* Team search results */}
    {!teamId && !playerId && (
      <>
        {teamLoading && <Loader text="Searching teams…"/>}
        {teamError && <div className="error-box">⚠️ {teamError}</div>}
        {teams.length > 0 && (
          <div className="player-list">
            {teams.map(t=>(
              <div key={t.id} className="player-row" onClick={()=>setTeamId(t.id)}>
                {t.crest&&<img src={t.crest} style={{width:32,height:32,objectFit:"contain"}} alt="" onError={e=>e.target.style.display='none'}/>}
                <div>
                  <div className="player-row-name">{t.name}</div>
                  <div className="player-row-meta">{t.area?.name} · Founded {t.founded||"N/A"}</div>
                </div>
                <span style={{marginLeft:"auto",color:"var(--muted)"}}>›</span>
              </div>
            ))}
          </div>
        )}
        {!teamLoading && teams.length === 0 && search && <div className="empty">No teams found. Try "Arsenal", "Barcelona" etc.</div>}
        {!search && <div className="empty" style={{paddingTop:16}}>Search for a team to browse their squad and player profiles.</div>}
      </>
    )}

    {/* Squad list */}
    {teamId && !playerId && (
      <>
        {squadLoading && <Loader text="Loading squad…"/>}
        {!squadLoading && squad.length > 0 && (
          <>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              {squadData?.crest&&<img src={squadData.crest} style={{width:44,height:44,objectFit:"contain"}} alt=""/>}
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.4rem",letterSpacing:1}}>{squadData?.name}</div>
                <div style={{fontSize:"0.75rem",color:"var(--muted)"}}>{squadData?.area?.name} · {squad.length} players</div>
              </div>
            </div>
            <div className="player-list">
              {squad.map(p=>(
                <div key={p.id} className="player-row" onClick={()=>setPlayerId(p.id)}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:"var(--bg)",border:"1px solid var(--border)",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem"}}>
                    {p.position==="Goalkeeper"?"🧤":p.position?.includes("Defender")?"🛡️":p.position?.includes("Midfielder")?"⚙️":"⚡"}
                  </div>
                  <div>
                    <div className="player-row-name">{p.name}</div>
                    <div className="player-row-meta">{p.position||"—"} · {p.nationality||"—"}</div>
                  </div>
                  <span style={{marginLeft:"auto",color:"var(--muted)"}}>›</span>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    )}

    {/* Player profile */}
    {playerId && (
      <>
        {playerLoading && <Loader text="Loading player…"/>}
        {player && !playerLoading && (
          <div className="player-card">
            <div className="player-header">
              <div className="player-avatar">
                {player.position==="Goalkeeper"?"🧤":player.position?.includes("Defender")?"🛡️":player.position?.includes("Midfielder")?"⚙️":"⚡"}
              </div>
              <div>
                <div className="player-name">{player.name}</div>
                <div className="player-meta">{player.section||player.position} · #{player.shirtNumber||"—"}</div>
              </div>
            </div>
            <div className="stats-grid">
              {statItems.map((s,i)=>(
                <div key={i} className="stat-box">
                  <div className="stat-val" style={{fontSize:typeof s.val==="string"&&s.val.length>6?"1rem":"1.8rem"}}>{s.val}</div>
                  <div className="stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
            {player.currentTeam && (
              <div style={{marginTop:14,padding:12,background:"var(--bg)",borderRadius:10,border:"1px solid var(--border)"}}>
                <div style={{fontSize:"0.7rem",color:"var(--muted)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Current Contract</div>
                <div style={{fontSize:"0.85rem"}}>
                  {player.currentTeam.contract?.start||"—"} → {player.currentTeam.contract?.until||"—"}
                </div>
              </div>
            )}
          </div>
        )}
      </>
    )}
  </>;
}

// ─── FAVOURITES TAB ────────────────────────────────────────────────────────
function FavouritesTab({ favTeams, setFavTeams }) {
  const [league, setLeague] = useState("PL");
  const { data, loading, error } = useFD("/competitions/" + league + "/teams?season=2025", [league]);
  const teams = data?.teams || [];
  const { data: matchData, loading: matchLoading } = useFD(
    favTeams.length > 0 ? "/matches?status=SCHEDULED,IN_PLAY,FINISHED" : null, [favTeams.length]
  );

  function toggleFav(team) {
    setFavTeams(prev =>
      prev.find(t=>t.id===team.id) ? prev.filter(t=>t.id!==team.id) : [...prev, team]
    );
  }

  const favMatches = (matchData?.matches||[]).filter(m=>
    favTeams.some(t=>t.id===m.homeTeam?.id||t.id===m.awayTeam?.id)
  ).slice(0,10);

  return <>
    <div className="section-title">FAVOURITE TEAMS</div>

    {favTeams.length > 0 && (
      <>
        <div style={{marginBottom:8,fontSize:"0.72rem",color:"var(--muted)",fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>
          Your Teams ({favTeams.length})
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
          {favTeams.map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:6,background:"var(--card)",
              border:"1px solid var(--green)",borderRadius:20,padding:"5px 12px"}}>
              {t.crest&&<img src={t.crest} style={{width:18,height:18,objectFit:"contain"}} alt="" onError={e=>e.target.style.display='none'}/>}
              <span style={{fontSize:"0.82rem",fontWeight:600}}>{t.shortName||t.name}</span>
              <button onClick={()=>toggleFav(t)} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:"0.9rem",marginLeft:2}}>×</button>
            </div>
          ))}
        </div>

        {matchLoading && <Loader text="Loading your team's matches…"/>}
        {favMatches.length > 0 && (
          <>
            <div className="section-title">UPCOMING & RECENT</div>
            <div className="scores-grid">
              {favMatches.map(m=><MatchCard key={m.id} match={m}/>)}
            </div>
          </>
        )}
      </>
    )}

    <div className="section-title">ADD TEAMS</div>
    <div className="league-tabs" style={{marginBottom:14}}>
      {Object.values(COMPETITIONS).map(c=>(
        <button key={c.id} className={"league-tab "+(league===c.id?"active":"")} onClick={()=>setLeague(c.id)}>
          {c.flag} {c.name}
        </button>
      ))}
    </div>
    {loading && <Loader text="Loading teams…"/>}
    {error && <div className="error-box">⚠️ {error}</div>}
    {!loading && !error && (
      <div className="fav-grid">
        {teams.map(t=>{
          const isFav = favTeams.some(f=>f.id===t.id);
          return (
            <div key={t.id} className={"fav-card "+(isFav?"selected":"")} onClick={()=>toggleFav(t)}>
              {isFav && <span className="fav-check">★</span>}
              {t.crest
                ? <img src={t.crest} className="fav-crest" alt="" onError={e=>e.target.style.display='none'}/>
                : <div className="fav-crest" style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.6rem"}}>⚽</div>
              }
              <div className="fav-name">{t.shortName||t.name}</div>
            </div>
          );
        })}
      </div>
    )}
  </>;
}

// ─── NEWS TAB ──────────────────────────────────────────────────────────────
const NEWS_KEY = "d13aab8321c0413093a847dee277afdf";
function NewsTab() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [topic, setTopic] = useState(0);
  useEffect(()=>{ fetchNews(topic); }, [topic]);
  async function fetchNews(t) {
    setLoading(true); setError(""); setArticles([]);
    const q = encodeURIComponent(NEWS_TOPICS[t].q);
    try {
      const res = await fetch(NEWS_PROXY + "?q=" + q);
      const d = await res.json();
      if (d.status !== "ok") throw new Error(d.message||"NewsAPI error");
      setArticles(d.articles.filter(a=>a.title&&a.title!=="[Removed]"));
    } catch(e) { setError(e.message); }
    setLoading(false);
  }
  return <>
    <div className="section-title">LATEST NEWS</div>
    <div className="league-tabs" style={{marginBottom:16}}>
      {NEWS_TOPICS.map((t,i)=>(
        <button key={i} className={"league-tab "+(topic===i?"active":"")} onClick={()=>setTopic(i)}>{t.label}</button>
      ))}
    </div>
    {loading && <Loader text="Fetching real headlines…"/>}
    {error && <div className="error-box">⚠️ {error}<button className="retry-btn" onClick={()=>fetchNews(topic)}>Retry</button></div>}
    {!loading && !error && articles.length===0 && <div className="empty">No articles found.</div>}
    {!loading && !error && articles.length>0 && (
      <div className="news-grid">
        {articles.map((a,i)=>(
          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",color:"inherit"}}>
            <div className="news-card">
              <div className="news-img" style={{
                backgroundImage:a.urlToImage?"url("+a.urlToImage+")":"none",
                backgroundSize:"cover",backgroundPosition:"center",
                fontSize:a.urlToImage?"0":"2.2rem"
              }}>{!a.urlToImage&&"📰"}</div>
              <div className="news-body">
                <div className="news-tag">{a.source?.name||"Football News"}</div>
                <div className="news-title">{a.title}</div>
                {a.description&&<div className="news-summary">{a.description.slice(0,110)}{a.description.length>110?"…":""}</div>}
                <div className="news-meta">{timeAgo(a.publishedAt)} · Read full article ↗</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    )}
  </>;
}

// ─── WATCH TAB ─────────────────────────────────────────────────────────────
function WatchTab() {
  return <>
    <div className="section-title">HIGHLIGHTS & VIDEO</div>
    <div className="watch-grid">
      {WATCH_ITEMS.map(v=>(
        <div key={v.id} className="watch-card">
          <div className="watch-thumb">
            <span>{v.emoji}</span>
            <div className="play-btn"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
          </div>
          <div className="watch-info">
            <div className="watch-title">{v.title}</div>
            <div className="watch-meta"><span>{v.views}</span><span>{v.time}</span></div>
          </div>
        </div>
      ))}
    </div>
  </>;
}

// ─── NOTIFICATIONS PANEL ───────────────────────────────────────────────────
const INITIAL_NOTIFS = [
  { id:1, title:"🔴 Match Started", body:"Arsenal vs Chelsea has kicked off in the Premier League!", time:"2m ago", read:false },
  { id:2, title:"⚽ Goal Alert", body:"GOAL! Saka scores for Arsenal — Arsenal 1-0 Chelsea (23')", time:"8m ago", read:false },
  { id:3, title:"📰 Transfer News", body:"Breaking: Real Madrid set to sign new striker this summer.", time:"1h ago", read:true },
  { id:4, title:"🏆 Match Result", body:"Bayern Munich 3-2 PSG — Full Time", time:"3h ago", read:true },
  { id:5, title:"🗓 Upcoming Match", body:"El Clásico tomorrow at 20:00 — Real Madrid vs Barcelona", time:"5h ago", read:true },
];

function NotificationsPanel({ onClose, notifSettings, setNotifSettings }) {
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);
  const unread = notifs.filter(n=>!n.read).length;
  function markAll() { setNotifs(n=>n.map(x=>({...x,read:true}))); }
  function toggleSetting(key) { setNotifSettings(s=>({...s,[key]:!s[key]})); }

  return <>
    <div className="notif-overlay" onClick={onClose}/>
    <div className="notif-panel">
      <div className="notif-header">
        <span className="notif-title">NOTIFICATIONS {unread>0&&<span style={{color:"var(--green)",fontSize:"0.9rem"}}>({unread})</span>}</span>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {unread>0&&<button className="retry-btn" onClick={markAll} style={{fontSize:"0.75rem"}}>Mark all read</button>}
          <button className="notif-close" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="notif-list">
        {notifs.length===0 && <div className="notif-empty">No notifications yet.<br/>Enable alerts below to get started!</div>}
        {notifs.map(n=>(
          <div key={n.id} className={"notif-item "+(n.read?"":"unread")} onClick={()=>setNotifs(ns=>ns.map(x=>x.id===n.id?{...x,read:true}:x))}>
            <div className="notif-item-title">{n.title}</div>
            <div className="notif-item-body">{n.body}</div>
            <div className="notif-item-time">{n.time} {!n.read&&<span style={{color:"var(--green)",fontWeight:700}}>· New</span>}</div>
          </div>
        ))}
      </div>
      <div className="notif-settings">
        <div className="notif-settings-title">Alert Settings</div>
        {[
          ["goals","⚽ Goal Alerts"],
          ["kickoff","🔴 Kick-off Alerts"],
          ["results","🏁 Final Results"],
          ["transfers","💸 Transfer News"],
        ].map(([key,label])=>(
          <div key={key} className="toggle-row">
            <span className="toggle-label">{label}</span>
            <button className={"toggle "+(notifSettings[key]?"on":"")} onClick={()=>toggleSetting(key)}/>
          </div>
        ))}
      </div>
    </div>
  </>;
}

// ─── APP ROOT ──────────────────────────────────────────────────────────────
export default function GoalPulse() {
  const [tab, setTab] = useState("scores");
  const [dark, setDark] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);
  const [favTeams, setFavTeams] = useState([]);
  const [notifSettings, setNotifSettings] = useState({ goals:true, kickoff:true, results:true, transfers:false });
  const unreadCount = 2;

  const TABS = [
    { id:"scores",    label:"⚽ Scores" },
    { id:"standings", label:"🏆 Standings" },
    { id:"players",   label:"👤 Players" },
    { id:"favourites",label:"★ Favourites" + (favTeams.length>0?" ("+favTeams.length+")":"") },
    { id:"news",      label:"📰 News" },
    { id:"watch",     label:"▶️ Watch" },
  ];

  return <>
    <style>{buildStyles(dark)}</style>
    <div className="app">
      <header className="header">
        <div className="logo" style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="44" height="44">
            <defs>
              <radialGradient id="bg3" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#1a2e1a"/>
                <stop offset="100%" stopColor="#0a0f0a"/>
              </radialGradient>
              <filter id="glow3">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <clipPath id="clip3"><circle cx="120" cy="110" r="90"/></clipPath>
            </defs>
            <circle cx="120" cy="110" r="90" fill="url(#bg3)"/>
            <g clipPath="url(#clip3)" fill="none" stroke="#00FF87" strokeWidth="1.4" opacity="0.2">
              <polygon points="120,76 140,91 133,113 107,113 100,91"/>
              <line x1="120" y1="76" x2="120" y2="42"/><line x1="140" y1="91" x2="162" y2="72"/>
              <line x1="133" y1="113" x2="158" y2="128"/><line x1="107" y1="113" x2="82" y2="128"/>
              <line x1="100" y1="91" x2="78" y2="72"/>
            </g>
            <g filter="url(#glow3)">
              <polyline points="30,110 62,110 70,88 78,132 86,110 102,72 110,148 118,110 134,94 140,126 148,110 210,110"
                fill="none" stroke="#00FF87" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" clipPath="url(#clip3)"/>
            </g>
            <circle cx="102" cy="72" r="3.5" fill="#00FF87" filter="url(#glow3)" clipPath="url(#clip3)"/>
            <circle cx="110" cy="148" r="3.5" fill="#00FF87" filter="url(#glow3)" clipPath="url(#clip3)"/>
            <text x="120" y="100" fontFamily="'Bebas Neue',Impact,sans-serif" fontSize="38"
              fill="#00FF87" textAnchor="middle" letterSpacing="6" filter="url(#glow3)" clipPath="url(#clip3)">GOAL</text>
            <text x="120" y="136" fontFamily="'Bebas Neue',Impact,sans-serif" fontSize="28"
              fill="#ffffff" textAnchor="middle" letterSpacing="8" opacity="0.9" clipPath="url(#clip3)">PULSE</text>
            <circle cx="120" cy="110" r="90" fill="none" stroke="#00FF87" strokeWidth="2.5" opacity="0.7"/>
          </svg>
        </div>
        <div className="header-right">
          <button className="theme-btn" onClick={()=>setDark(d=>!d)} title="Toggle theme">
            {dark?"☀️":"🌙"}
          </button>
          <button className="notif-btn" onClick={()=>setShowNotifs(true)}>
            🔔
            {unreadCount>0&&<span className="notif-badge">{unreadCount}</span>}
          </button>
        </div>
      </header>

      <nav className="nav">
        {TABS.map(t=>(
          <button key={t.id} className={"nav-btn "+(tab===t.id?"active":"")} onClick={()=>setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab==="scores"     && <ScoresTab/>}
        {tab==="standings"  && <StandingsTab/>}
        {tab==="players"    && <PlayerStatsTab/>}
        {tab==="favourites" && <FavouritesTab favTeams={favTeams} setFavTeams={setFavTeams}/>}
        {tab==="news"       && <NewsTab/>}
        {tab==="watch"      && <WatchTab/>}
      </main>
    </div>

    {showNotifs && (
      <NotificationsPanel
        onClose={()=>setShowNotifs(false)}
        notifSettings={notifSettings}
        setNotifSettings={setNotifSettings}
      />
    )}
  </>;
}
