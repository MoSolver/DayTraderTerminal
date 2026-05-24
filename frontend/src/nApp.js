import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, Globe, Newspaper,
  Search, RefreshCw, ChevronRight, ChevronDown, AlertTriangle,
  BarChart2, Layers, Zap, Target, Eye, Radio
} from 'lucide-react';

const API = 'http://localhost:8080/api';

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg0: #020408;
    --bg1: #060d14;
    --bg2: #0a1520;
    --bg3: #0f1e2e;
    --border: #1a3040;
    --border2: #243d52;
    --text0: #e8f4fd;
    --text1: #8bb4c8;
    --text2: #4a7a94;
    --green: #00e5a0;
    --green2: #00b87a;
    --red: #ff4466;
    --red2: #cc2244;
    --yellow: #ffd93d;
    --cyan: #00d4ff;
    --orange: #ff8c42;
    --purple: #b06cff;
    --accent: #00d4ff;
    --glow: rgba(0,212,255,0.15);
    --mono: 'Space Mono', monospace;
    --sans: 'Syne', sans-serif;
  }

  html, body { background: var(--bg0); color: var(--text0); font-family: var(--mono); overflow: hidden; height: 100%; }

  #root { height: 100vh; display: flex; flex-direction: column; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg1); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .terminal-header {
    display: flex; align-items: center; gap: 16px;
    padding: 8px 20px;
    background: var(--bg1);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .terminal-logo {
    font-family: var(--sans);
    font-weight: 800;
    font-size: 18px;
    letter-spacing: 4px;
    color: var(--accent);
    text-shadow: 0 0 20px var(--accent);
  }

  .status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 8px var(--green);
    animation: pulse 2s infinite;
  }

  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .header-time {
    margin-left: auto;
    font-size: 11px;
    color: var(--text2);
    letter-spacing: 1px;
  }

  .tab-bar {
    display: flex; gap: 2px;
    padding: 0 20px;
    background: var(--bg1);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .tab {
    padding: 8px 18px;
    font-size: 10px;
    letter-spacing: 2px;
    font-family: var(--sans);
    font-weight: 600;
    cursor: pointer;
    color: var(--text2);
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
    display: flex; align-items: center; gap: 6px;
    white-space: nowrap;
  }
  .tab:hover { color: var(--text0); }
  .tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
    text-shadow: 0 0 10px var(--accent);
  }

  .search-bar {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 20px;
    background: var(--bg1);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .search-input {
    background: var(--bg2);
    border: 1px solid var(--border);
    color: var(--text0);
    font-family: var(--mono);
    font-size: 12px;
    padding: 5px 12px;
    width: 180px;
    outline: none;
    letter-spacing: 1px;
    transition: border 0.15s;
  }
  .search-input:focus { border-color: var(--accent); }
  .search-input::placeholder { color: var(--text2); }

  .btn {
    background: var(--bg2);
    border: 1px solid var(--border2);
    color: var(--text1);
    font-family: var(--mono);
    font-size: 10px;
    padding: 5px 12px;
    cursor: pointer;
    letter-spacing: 1px;
    transition: all 0.15s;
    display: flex; align-items: center; gap: 5px;
  }
  .btn:hover { border-color: var(--accent); color: var(--accent); }
  .btn.primary { background: rgba(0,212,255,0.1); border-color: var(--accent); color: var(--accent); }

  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .sidebar {
    width: 220px;
    flex-shrink: 0;
    background: var(--bg1);
    border-right: 1px solid var(--border);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .sidebar-section { border-bottom: 1px solid var(--border); padding: 10px 0; }
  .sidebar-label {
    font-size: 9px;
    letter-spacing: 3px;
    color: var(--text2);
    padding: 4px 14px 8px;
    font-family: var(--sans);
    font-weight: 700;
  }

  .asset-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 5px 14px;
    cursor: pointer;
    transition: background 0.1s;
    font-size: 11px;
  }
  .asset-row:hover { background: var(--bg2); }
  .asset-name { color: var(--text1); font-size: 10px; letter-spacing: 0.5px; max-width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .asset-sym { color: var(--text0); font-size: 11px; font-weight: 700; }
  .asset-price { color: var(--text0); font-size: 10px; }
  .asset-chg { font-size: 10px; font-weight: 700; }
  .pos { color: var(--green); }
  .neg { color: var(--red); }
  .neu { color: var(--text2); }

  .panel { background: var(--bg1); border: 1px solid var(--border); padding: 14px; }
  .panel-title {
    font-family: var(--sans);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--text2);
    margin-bottom: 12px;
    display: flex; align-items: center; gap: 6px;
  }
  .panel-title .dot { width: 5px; height: 5px; background: var(--accent); border-radius: 50%; }

  .content-area {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }

  .stat-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .stat-label { font-size: 9px; letter-spacing: 2px; color: var(--text2); font-family: var(--sans); }
  .stat-value { font-size: 20px; font-weight: 700; color: var(--text0); font-family: var(--sans); letter-spacing: -0.5px; }
  .stat-sub { font-size: 10px; }

  .price-big {
    font-family: var(--sans);
    font-size: 36px;
    font-weight: 800;
    letter-spacing: -1px;
    color: var(--text0);
    line-height: 1;
  }
  .change-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px;
    font-size: 12px;
    font-weight: 700;
    border-radius: 2px;
  }
  .change-badge.up { background: rgba(0,229,160,0.15); color: var(--green); }
  .change-badge.down { background: rgba(255,68,102,0.15); color: var(--red); }
  .change-badge.flat { background: rgba(74,122,148,0.15); color: var(--text2); }

  .news-item {
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: all 0.15s;
  }
  .news-item:hover .news-title { color: var(--accent); }
  .news-item:last-child { border-bottom: none; }
  .news-title { font-size: 11px; color: var(--text0); line-height: 1.5; margin-bottom: 4px; }
  .news-meta { font-size: 9px; color: var(--text2); letter-spacing: 1px; }
  .news-source { color: var(--accent); }

  .options-table { width: 100%; border-collapse: collapse; font-size: 10px; }
  .options-table th {
    text-align: right; padding: 4px 8px;
    color: var(--text2); font-size: 9px; letter-spacing: 1px;
    border-bottom: 1px solid var(--border);
    font-weight: 400;
  }
  .options-table th:first-child { text-align: left; }
  .options-table td {
    text-align: right; padding: 4px 8px;
    border-bottom: 1px solid rgba(26,48,64,0.5);
    color: var(--text1);
  }
  .options-table td:first-child { text-align: left; }
  .options-table tr:hover td { background: var(--bg2); }
  .itm { color: var(--yellow) !important; }
  .iv-high { color: var(--red); }
  .iv-med { color: var(--orange); }
  .iv-low { color: var(--green); }

  .tech-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 5px 0; border-bottom: 1px solid rgba(26,48,64,0.4);
    font-size: 11px;
  }
  .tech-label { color: var(--text2); font-size: 10px; letter-spacing: 1px; }
  .tech-val { font-weight: 700; }

  .signal-badge {
    padding: 2px 10px; font-size: 10px; font-weight: 700;
    letter-spacing: 2px; font-family: var(--sans);
  }
  .signal-BUY { background: rgba(0,229,160,0.2); color: var(--green); border: 1px solid var(--green2); }
  .signal-SELL { background: rgba(255,68,102,0.2); color: var(--red); border: 1px solid var(--red2); }
  .signal-NEUTRAL { background: rgba(74,122,148,0.1); color: var(--text2); border: 1px solid var(--border); }

  .screener-row {
    display: grid;
    grid-template-columns: 80px 1fr 80px 70px 70px 70px 60px;
    gap: 8px;
    padding: 6px 10px;
    font-size: 10px;
    border-bottom: 1px solid var(--border);
    align-items: center;
    transition: background 0.1s;
    cursor: pointer;
  }
  .screener-row:hover { background: var(--bg2); }
  .screener-header { color: var(--text2); font-size: 9px; letter-spacing: 1px; }

  .mover-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 10px;
    border-bottom: 1px solid rgba(26,48,64,0.4);
    font-size: 10px;
  }

  .tooltip-box {
    background: var(--bg3);
    border: 1px solid var(--border2);
    padding: 8px 12px;
    font-size: 10px;
    font-family: var(--mono);
    color: var(--text0);
  }

  .loading {
    display: flex; align-items: center; justify-content: center;
    height: 120px; color: var(--text2); font-size: 11px; letter-spacing: 2px;
    gap: 8px;
  }
  .loading .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .error-msg {
    color: var(--red); font-size: 10px; padding: 8px;
    border: 1px solid var(--red2); background: rgba(255,68,102,0.05);
    letter-spacing: 0.5px;
  }

  .ticker-tape {
    display: flex; gap: 0; overflow: hidden; flex-shrink: 0;
    background: var(--bg1);
    border-bottom: 1px solid var(--border);
    padding: 4px 0;
  }
  .ticker-inner {
    display: flex; gap: 28px;
    animation: scroll 60s linear infinite;
    white-space: nowrap;
    padding: 0 20px;
  }
  @keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .ticker-item { font-size: 10px; display: flex; gap: 6px; align-items: center; }
  .ticker-sym { color: var(--text1); font-weight: 700; }
  .ticker-val { color: var(--text0); }

  .vol-bar {
    height: 3px; background: var(--border);
    position: relative; overflow: hidden; border-radius: 1px;
  }
  .vol-fill { height: 100%; background: var(--accent); transition: width 0.3s; }

  .rsi-bar-wrap { display: flex; align-items: center; gap: 8px; }
  .rsi-bar { flex: 1; height: 6px; background: var(--border); border-radius: 3px; position: relative; overflow: visible; }
  .rsi-needle { position: absolute; top: -2px; width: 2px; height: 10px; background: var(--accent); border-radius: 1px; }

  .bb-viz { position: relative; height: 40px; margin: 6px 0; }

  .index-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 6px;
  }
  .index-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    padding: 8px 10px;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .index-card:hover { border-color: var(--border2); }
  .index-name { font-size: 9px; color: var(--text2); letter-spacing: 1px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .index-price { font-size: 14px; font-weight: 700; font-family: var(--sans); color: var(--text0); }
  .index-chg { font-size: 10px; font-weight: 700; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n, dec = 2) => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtK = (n) => n == null ? '—' : n >= 1e12 ? `${(n/1e12).toFixed(2)}T` : n >= 1e9 ? `${(n/1e9).toFixed(2)}B` : n >= 1e6 ? `${(n/1e6).toFixed(2)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(n);
const chgClass = (v) => v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu';
const chgSign = (v) => v > 0 ? '+' : '';

function useApi(url, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(async () => {
    if (!url) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line
  }, [url, ...deps]);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { data, loading, error, refetch: fetch_ };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LoadingBox({ text = 'LOADING' }) {
  return (
    <div className="loading">
      <RefreshCw size={12} className="spin" />
      <span>{text}</span>
    </div>
  );
}

function Tooltip_({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-box">
      <div style={{ color: 'var(--text2)', fontSize: 9, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text0)' }}>
          {p.name}: {fmt(p.value, 4)}
        </div>
      ))}
    </div>
  );
}

function ChangeBadge({ value }) {
  const cls = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Activity;
  return (
    <span className={`change-badge ${cls}`}>
      <Icon size={10} />
      {chgSign(value)}{fmt(value)}%
    </span>
  );
}

// ── Views ─────────────────────────────────────────────────────────────────────

function MarketOverview({ onSelectSymbol }) {
  const { data, loading, error, refetch } = useApi(`${API}/market/overview`);
  const { data: movers } = useApi(`${API}/market/movers`);

  if (loading) return <LoadingBox text="FETCHING GLOBAL MARKETS" />;
  if (error) return <div className="error-msg">⚠ {error} — Is the backend running?</div>;

  const sections = [
    { label: 'GLOBAL INDICES', key: 'indices' },
    { label: 'FX RATES', key: 'forex' },
    { label: 'COMMODITIES & RATES', key: 'commodities' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sections.map(({ label, key }) => (
        <div key={key} className="panel">
          <div className="panel-title"><span className="dot" />  {label}</div>
          <div className="index-grid">
            {(data?.[key] || []).map(item => (
              <div key={item.symbol} className="index-card" onClick={() => onSelectSymbol(item.symbol)}>
                <div className="index-name">{item.name}</div>
                <div className="index-price">{fmt(item.price, item.price > 100 ? 2 : 4)}</div>
                <div className={`index-chg ${chgClass(item.change_pct)}`}>
                  {chgSign(item.change_pct)}{fmt(item.change_pct)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {movers && (
        <div className="grid-3">
          {[
            { label: 'TOP GAINERS', key: 'gainers', color: 'var(--green)' },
            { label: 'TOP LOSERS', key: 'losers', color: 'var(--red)' },
            { label: 'MOST ACTIVE', key: 'most_active', color: 'var(--cyan)' },
          ].map(({ label, key, color }) => (
            <div key={key} className="panel">
              <div className="panel-title" style={{ color }}><span className="dot" style={{ background: color }} /> {label}</div>
              {(movers[key] || []).map(m => (
                <div key={m.symbol} className="mover-item" onClick={() => onSelectSymbol(m.symbol)} style={{ cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--text0)' }}>{m.symbol}</div>
                    <div style={{ fontSize: 9, color: 'var(--text2)' }}>{m.name?.slice(0, 20)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text0)' }}>${fmt(m.price)}</div>
                    <div className={chgClass(m.change_pct)} style={{ fontSize: 10, fontWeight: 700 }}>
                      {chgSign(m.change_pct)}{fmt(m.change_pct)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuoteView({ symbol }) {
  const { data: quote, loading: qLoading } = useApi(symbol ? `${API}/quote/${symbol}` : null, [symbol]);
  const [period, setPeriod] = useState('3mo');
  const [interval, setInterval] = useState('1d');
  const { data: hist, loading: hLoading } = useApi(
    symbol ? `${API}/history/${symbol}?period=${period}&interval=${interval}` : null,
    [symbol, period, interval]
  );
  const { data: tech } = useApi(symbol ? `${API}/technicals/${symbol}` : null, [symbol]);

  if (!symbol) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text2)', flexDirection: 'column', gap: 12 }}>
      <Search size={32} strokeWidth={1} />
      <div style={{ fontSize: 11, letterSpacing: 3 }}>ENTER A SYMBOL TO BEGIN</div>
    </div>
  );

  const periods = [
    { label: '1D', period: '1d', interval: '5m' },
    { label: '5D', period: '5d', interval: '30m' },
    { label: '1M', period: '1mo', interval: '1d' },
    { label: '3M', period: '3mo', interval: '1d' },
    { label: '6M', period: '6mo', interval: '1d' },
    { label: '1Y', period: '1y', interval: '1wk' },
    { label: '2Y', period: '2y', interval: '1wk' },
    { label: '5Y', period: '5y', interval: '1mo' },
  ];

  const isPos = quote?.change_pct >= 0;
  const chartColor = isPos ? '#00e5a0' : '#ff4466';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div className="panel">
        {qLoading ? <LoadingBox /> : quote ? (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', letterSpacing: 2, marginBottom: 4 }}>{quote.exchange} · {quote.currency}</div>
              <div style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: 22, color: 'var(--text0)', marginBottom: 2 }}>{quote.symbol}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 12 }}>{quote.name}</div>
              <div className="price-big">{fmt(quote.price, quote.price > 100 ? 2 : 4)}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <ChangeBadge value={quote.change_pct} />
                <span style={{ fontSize: 11, color: 'var(--text2)' }}>{chgSign(quote.change)}{fmt(quote.change, 4)} today</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 24px', marginLeft: 'auto', fontSize: 10 }}>
              {[
                ['Volume', fmtK(quote.volume)],
                ['Avg Volume', fmtK(quote.avg_volume)],
                ['Market Cap', fmtK(quote.market_cap)],
                ['P/E Ratio', quote.pe_ratio ? fmt(quote.pe_ratio) : '—'],
                ['52W High', fmt(quote['52w_high'])],
                ['52W Low', fmt(quote['52w_low'])],
                ['Beta', quote.beta ? fmt(quote.beta) : '—'],
                ['Sector', quote.sector || '—'],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ color: 'var(--text2)', fontSize: 9, letterSpacing: 1, marginBottom: 2 }}>{l}</div>
                  <div style={{ color: 'var(--text0)', fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Chart */}
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="panel-title" style={{ margin: 0 }}><span className="dot" /> PRICE CHART</div>
          <div style={{ display: 'flex', gap: 2 }}>
            {periods.map(p => (
              <button key={p.label}
                className={`btn ${period === p.period ? 'primary' : ''}`}
                style={{ padding: '3px 8px', fontSize: 9 }}
                onClick={() => { setPeriod(p.period); setInterval(p.interval); }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {hLoading ? <LoadingBox /> : hist?.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hist} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(26,48,64,0.8)" />
              <XAxis dataKey="date" tick={{ fill: '#4a7a94', fontSize: 9 }}
                tickFormatter={v => v.slice(5, 10)} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#4a7a94', fontSize: 9 }} width={60}
                domain={['auto', 'auto']} tickFormatter={v => fmt(v, 2)} />
              <Tooltip content={<Tooltip_ />} />
              <Area type="monotone" dataKey="close" stroke={chartColor}
                strokeWidth={1.5} fill="url(#cg)" dot={false} name="Close" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div className="loading"><AlertTriangle size={12} /> NO DATA</div>}
      </div>

      {/* Volume */}
      {hist?.length > 0 && (
        <div className="panel">
          <div className="panel-title"><span className="dot" /> VOLUME</div>
          <ResponsiveContainer width="100%" height={70}>
            <BarChart data={hist.slice(-60)} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <XAxis hide />
              <YAxis hide />
              <Tooltip content={<Tooltip_ />} />
              <Bar dataKey="volume" fill="rgba(0,212,255,0.3)" name="Volume" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Technicals */}
      {tech && Object.keys(tech).length > 0 && (
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="panel-title" style={{ margin: 0 }}><span className="dot" /> TECHNICAL ANALYSIS</div>
            {tech.signal && <div className={`signal-badge signal-${tech.signal}`}>{tech.signal}</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            {[
              ['RSI (14)', fmt(tech.rsi), tech.rsi < 35 ? 'pos' : tech.rsi > 65 ? 'neg' : 'neu'],
              ['MACD', fmt(tech.macd, 4), tech.macd > 0 ? 'pos' : 'neg'],
              ['MACD Signal', fmt(tech.macd_signal, 4), 'neu'],
              ['SMA 20', fmt(tech.sma20), tech.price > tech.sma20 ? 'pos' : 'neg'],
              ['SMA 50', fmt(tech.sma50) || '—', tech.sma50 ? tech.price > tech.sma50 ? 'pos' : 'neg' : 'neu'],
              ['BB Upper', fmt(tech.bb_upper), 'neu'],
              ['BB Lower', fmt(tech.bb_lower), 'neu'],
              ['ATR (14)', fmt(tech.atr, 4), 'neu'],
            ].map(([l, v, cls]) => (
              <div key={l} className="tech-row">
                <span className="tech-label">{l}</span>
                <span className={`tech-val ${cls}`}>{v}</span>
              </div>
            ))}
          </div>
          {/* RSI gauge */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text2)', marginBottom: 4 }}>
              <span>OVERSOLD</span><span>RSI</span><span>OVERBOUGHT</span>
            </div>
            <div className="rsi-bar">
              <div className="rsi-needle" style={{ left: `${Math.min(100, Math.max(0, tech.rsi))}%` }} />
              <div style={{ height: 6, background: 'linear-gradient(to right, var(--green), var(--yellow), var(--red))', borderRadius: 3 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function IVSurface3D({ callsData, putsData }) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});
  const [surfaceMode, setSurfaceMode] = useState('calls');
  const [rotating, setRotating] = useState(true);

  // Build surface grid from options chain slices
  // X = strike index, Z = expiration index, Y = IV
  // We simulate multiple expirations by scaling the single chain IV
  // with realistic term-structure factors
  function buildSurface(rows) {
    if (!rows || rows.length < 4) return null;
    const sorted = [...rows].filter(r => r.impliedVolatility > 0).sort((a,b) => a.strike - b.strike);
    if (sorted.length < 4) return null;

    // Sample up to 20 strikes evenly
    const N_STRIKES = Math.min(20, sorted.length);
    const N_EXPIRIES = 8;
    const step = Math.max(1, Math.floor(sorted.length / N_STRIKES));
    const strikes = [];
    for (let i = 0; i < sorted.length && strikes.length < N_STRIKES; i += step) {
      strikes.push(sorted[i]);
    }

    // Term structure multipliers (short-term IV spikes, long-term mean-reverts)
    const termMult = [1.35, 1.18, 1.08, 1.0, 0.94, 0.90, 0.87, 0.85];
    const termDays = [7, 14, 30, 60, 90, 120, 180, 360];

    const grid = [];
    for (let zi = 0; zi < N_EXPIRIES; zi++) {
      const row = [];
      for (let xi = 0; xi < strikes.length; xi++) {
        const baseIV = strikes[xi].impliedVolatility;
        // Add slight smile distortion that varies by expiry
        const smileDecay = 0.6 + 0.4 * (zi / N_EXPIRIES);
        const atm = strikes[Math.floor(strikes.length / 2)].impliedVolatility;
        const skew = (strikes[xi].inTheMoney ? 0.05 : -0.02) * smileDecay;
        const iv = Math.max(0.01, (baseIV + skew) * termMult[zi]);
        row.push(iv);
      }
      grid.push(row);
    }
    return { grid, strikes: strikes.map(s => s.strike), termDays, N_STRIKES: strikes.length, N_EXPIRIES };
  }

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth || 600;
    const H = 380;

    // Lazy-load Three.js
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => initScene();
    document.head.appendChild(script);
    sceneRef.current._script = script;

    function initScene() {
      const THREE = window.THREE;
      if (!THREE) return;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);
      sceneRef.current.renderer = renderer;

      // Scene + camera
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
      camera.position.set(3.5, 2.8, 3.5);
      camera.lookAt(0, 0.3, 0);
      sceneRef.current.scene = scene;
      sceneRef.current.camera = camera;

      // Lights
      const amb = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(amb);
      const dir = new THREE.DirectionalLight(0x00d4ff, 0.8);
      dir.position.set(3, 5, 3);
      scene.add(dir);
      const dir2 = new THREE.DirectionalLight(0xb06cff, 0.4);
      dir2.position.set(-3, 2, -3);
      scene.add(dir2);

      // Grid helper (floor)
      const grid = new THREE.GridHelper(4, 16, 0x1a3040, 0x0f1e2e);
      grid.position.y = -0.01;
      scene.add(grid);

      // Axes labels via canvas sprites
      function makeLabel(text, color) {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 40;
        const ctx = c.getContext('2d');
        ctx.fillStyle = color;
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, 64, 28);
        const tex = new THREE.CanvasTexture(c);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        return new THREE.Sprite(mat);
      }
      const xLbl = makeLabel('STRIKE →', '#4a7a94');
      xLbl.scale.set(1.0, 0.3, 1); xLbl.position.set(1.8, -0.15, -1.8);
      scene.add(xLbl);
      const zLbl = makeLabel('← EXPIRY (days)', '#4a7a94');
      zLbl.scale.set(1.2, 0.3, 1); zLbl.position.set(-1.8, -0.15, 1.4);
      scene.add(zLbl);
      const yLbl = makeLabel('IV %', '#00d4ff');
      yLbl.scale.set(0.6, 0.25, 1); yLbl.position.set(-2.1, 1.2, -2.1);
      scene.add(yLbl);

      sceneRef.current.THREE = THREE;
      sceneRef.current.scene = scene;
      sceneRef.current.camera = camera;
      sceneRef.current.renderer = renderer;
      sceneRef.current.inited = true;

      buildMesh();
      animate();
    }

    function buildMesh() {
      const { THREE, scene, inited } = sceneRef.current;
      if (!inited) return;

      // Remove old mesh
      if (sceneRef.current.mesh) { scene.remove(sceneRef.current.mesh); sceneRef.current.mesh.geometry.dispose(); }
      if (sceneRef.current.wireframe) { scene.remove(sceneRef.current.wireframe); }

      const rows = surfaceMode === 'calls' ? callsData : putsData;
      const surface = buildSurface(rows);
      if (!surface) return;

      const { grid, N_STRIKES, N_EXPIRIES } = surface;

      // Find IV range for color mapping
      let minIV = Infinity, maxIV = -Infinity;
      grid.forEach(row => row.forEach(v => { minIV = Math.min(minIV, v); maxIV = Math.max(maxIV, v); }));
      const ivRange = maxIV - minIV || 1;

      // Build BufferGeometry
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const colors = [];
      const indices = [];

      // Color ramp: low IV = teal/green → high IV = red/orange
      function ivToColor(iv) {
        const t = (iv - minIV) / ivRange;
        // teal(0,212,255) → yellow(255,217,61) → red(255,68,102)
        let r, g, b;
        if (t < 0.5) {
          const s = t * 2;
          r = Math.round(0 + s * 255);
          g = Math.round(212 - s * (212 - 217));
          b = Math.round(255 - s * (255 - 61));
        } else {
          const s = (t - 0.5) * 2;
          r = 255;
          g = Math.round(217 - s * (217 - 68));
          b = Math.round(61 - s * (61 - 102));
        }
        return [r/255, g/255, b/255];
      }

      for (let zi = 0; zi < N_EXPIRIES; zi++) {
        for (let xi = 0; xi < N_STRIKES; xi++) {
          const iv = grid[zi][xi];
          const x = (xi / (N_STRIKES - 1)) * 3.6 - 1.8;
          const z = (zi / (N_EXPIRIES - 1)) * 3.6 - 1.8;
          const y = ((iv - minIV) / ivRange) * 1.8;
          positions.push(x, y, z);
          const [r, g, b] = ivToColor(iv);
          colors.push(r, g, b);
        }
      }

      // Indices for triangle mesh
      for (let zi = 0; zi < N_EXPIRIES - 1; zi++) {
        for (let xi = 0; xi < N_STRIKES - 1; xi++) {
          const a = zi * N_STRIKES + xi;
          const b = a + 1;
          const c = a + N_STRIKES;
          const d = c + 1;
          indices.push(a, c, b);
          indices.push(b, c, d);
        }
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      const material = new THREE.MeshPhongMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        shininess: 60,
        transparent: true,
        opacity: 0.88,
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      sceneRef.current.mesh = mesh;

      // Wireframe overlay
      const wfGeo = new THREE.WireframeGeometry(geometry);
      const wfMat = new THREE.LineBasicMaterial({ color: 0x1a3040, transparent: true, opacity: 0.35 });
      const wf = new THREE.LineSegments(wfGeo, wfMat);
      scene.add(wf);
      sceneRef.current.wireframe = wf;
    }

    sceneRef.current._buildMesh = buildMesh;

    let frameId;
    let angle = 0;
    function animate() {
      frameId = requestAnimationFrame(animate);
      const { renderer, scene, camera } = sceneRef.current;
      if (!renderer) return;
      if (sceneRef.current._rotating) {
        angle += 0.004;
        camera.position.x = Math.sin(angle) * 5;
        camera.position.z = Math.cos(angle) * 5;
        camera.position.y = 2.8;
        camera.lookAt(0, 0.3, 0);
      }
      renderer.render(scene, camera);
    }
    sceneRef.current._rotating = true;
    sceneRef.current._frameId = null;
    sceneRef.current._animate = animate;

    return () => {
      cancelAnimationFrame(frameId);
      const { renderer } = sceneRef.current;
      if (renderer && el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
        renderer.dispose();
      }
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  // eslint-disable-next-line
  }, []);

  // Rebuild mesh when mode changes
  useEffect(() => {
    if (sceneRef.current._buildMesh) sceneRef.current._buildMesh();
  }, [surfaceMode, callsData, putsData]);

  // Toggle rotation
  useEffect(() => {
    sceneRef.current._rotating = rotating;
  }, [rotating]);

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="panel-title" style={{ margin: 0 }}><span className="dot" style={{ background: 'var(--purple)' }} /> IMPLIED VOLATILITY SURFACE (3D)</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['calls', 'puts'].map(m => (
            <button key={m} className={`btn ${surfaceMode === m ? 'primary' : ''}`} onClick={() => setSurfaceMode(m)}>
              {m.toUpperCase()}
            </button>
          ))}
          <button className={`btn ${rotating ? 'primary' : ''}`} onClick={() => setRotating(r => !r)}
            style={{ marginLeft: 4 }}>
            {rotating ? '⏸ PAUSE' : '▶ ROTATE'}
          </button>
        </div>
      </div>
      <div style={{ fontSize: 9, color: 'var(--text2)', marginBottom: 8, letterSpacing: 1 }}>
        X: STRIKE PRICE &nbsp;·&nbsp; Z: DAYS TO EXPIRY (7→360) &nbsp;·&nbsp; Y: IMPLIED VOLATILITY &nbsp;·&nbsp;
        <span style={{ color: 'var(--cyan)' }}>■</span> LOW IV &nbsp;
        <span style={{ color: 'var(--yellow)' }}>■</span> MID &nbsp;
        <span style={{ color: 'var(--red)' }}>■</span> HIGH IV
      </div>
      <div ref={mountRef} style={{ width: '100%', height: 380, background: 'var(--bg0)', border: '1px solid var(--border)', overflow: 'hidden' }} />
    </div>
  );
}

function OptionsView({ symbol }) {
  const { data, loading, error } = useApi(symbol ? `${API}/options/${symbol}` : null, [symbol]);
  const [mode, setMode] = useState('calls');

  if (!symbol) return <div className="loading"><Eye size={12} /> SELECT A SYMBOL FIRST</div>;
  if (loading) return <LoadingBox text="LOADING OPTIONS CHAIN" />;
  if (error) return <div className="error-msg">⚠ {error}</div>;
  if (data?.error) return (
    <div className="panel">
      <div className="panel-title"><span className="dot" style={{background:'var(--red)'}} /> OPTIONS CHAIN — {symbol}</div>
      <div className="error-msg" style={{marginTop:8}}>
        ⚠ Options data unavailable: {data.error}
        <div style={{marginTop:8,color:'var(--text2)',fontSize:10}}>
          Options require a valid optionable US equity ticker (e.g. AAPL, SPY, TSLA, NVDA).
          Crypto, forex, and indices do not have options chains via this data source.
        </div>
      </div>
    </div>
  );
  if (!data?.calls?.length && !data?.puts?.length) return (
    <div className="panel">
      <div className="panel-title"><span className="dot" /> OPTIONS CHAIN — {symbol}</div>
      <div className="loading" style={{marginTop:8}}><AlertTriangle size={12} /> NO OPTIONS DATA FOR THIS SYMBOL</div>
    </div>
  );

  const rows = data[mode] || [];
  const ivColor = (iv) => iv > 0.8 ? 'iv-high' : iv > 0.4 ? 'iv-med' : 'iv-low';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div className="panel-title" style={{ margin: 0 }}><span className="dot" /> OPTIONS CHAIN — {symbol}</div>
            <div style={{ fontSize: 9, color: 'var(--text2)', marginTop: 4 }}>
              EXP: {data.expiration} &nbsp;|&nbsp; AVAILABLE: {data.expirations?.join(' · ')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {['calls', 'puts'].map(m => (
              <button key={m} className={`btn ${mode === m ? 'primary' : ''}`} onClick={() => setMode(m)}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <table className="options-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>STRIKE</th>
              <th>LAST</th>
              <th>BID</th>
              <th>ASK</th>
              <th>VOLUME</th>
              <th>OI</th>
              <th>IV</th>
              <th>ITM</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 30).map((r, i) => (
              <tr key={i}>
                <td className={r.inTheMoney ? 'itm' : ''}>{fmt(r.strike)}</td>
                <td>{fmt(r.lastPrice)}</td>
                <td>{fmt(r.bid)}</td>
                <td>{fmt(r.ask)}</td>
                <td>{fmtK(r.volume)}</td>
                <td>{fmtK(r.openInterest)}</td>
                <td className={ivColor(r.impliedVolatility)}>{(r.impliedVolatility * 100).toFixed(1)}%</td>
                <td>{r.inTheMoney ? <span style={{ color: 'var(--yellow)' }}>✓</span> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 10, padding: 8, background: 'var(--bg0)', border: '1px solid var(--border)', fontSize: 9, color: 'var(--text2)' }}>
          <span style={{ color: 'var(--yellow)' }}>■</span> IN THE MONEY &nbsp;·&nbsp;
          <span style={{ color: 'var(--red)' }}>■</span> HIGH IV (&gt;80%) &nbsp;·&nbsp;
          <span style={{ color: 'var(--orange)' }}>■</span> MED IV (40–80%) &nbsp;·&nbsp;
          <span style={{ color: 'var(--green)' }}>■</span> LOW IV (&lt;40%)
        </div>
      </div>

      <IVSurface3D callsData={data?.calls || []} putsData={data?.puts || []} />
    </div>
  );
}

function NewsView() {
  const { data, loading, error, refetch } = useApi(`${API}/news`);

  return (
    <div className="panel" style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="panel-title" style={{ margin: 0 }}>
          <span className="dot" /> MARKET INTELLIGENCE FEED
          {data && <span style={{ color: 'var(--text2)', marginLeft: 8, fontSize: 9 }}>({data.count} items)</span>}
        </div>
        <button className="btn" onClick={refetch}><RefreshCw size={10} /> REFRESH</button>
      </div>
      {loading ? <LoadingBox text="SCRAPING FINANCIAL NEWS" /> :
       error ? <div className="error-msg">⚠ {error}</div> :
       (data?.articles || []).map((a, i) => (
        <a key={i} href={a.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          <div className="news-item">
            <div className="news-title">{a.title}</div>
            <div className="news-meta">
              <span className="news-source">{a.source}</span>
              {' · '}{new Date(a.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function ScreenerView({ onSelectSymbol }) {
  const { data, loading, error, refetch } = useApi(`${API}/screener`);

  return (
    <div className="panel" style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div className="panel-title" style={{ margin: 0 }}><span className="dot" /> ALPHA SCREENER</div>
          <div style={{ fontSize: 9, color: 'var(--text2)', marginTop: 3 }}>CAPACITY-CONSTRAINED OPPORTUNITIES · SMALL/MID CAP · HIGH ACTIVITY</div>
        </div>
        <button className="btn" onClick={refetch}><RefreshCw size={10} /> REFRESH</button>
      </div>

      <div className="screener-row screener-header">
        <div>SYMBOL</div><div>NAME</div><div>PRICE</div>
        <div>CHG%</div><div>MKTCAP</div><div>VOL/AVG</div><div>BETA</div>
      </div>

      {loading ? <LoadingBox /> : error ? <div className="error-msg">⚠ {error}</div> :
        (data?.results || []).map(r => (
          <div key={r.symbol} className="screener-row" onClick={() => onSelectSymbol(r.symbol)}>
            <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 11 }}>{r.symbol}</div>
            <div style={{ color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
            <div style={{ color: 'var(--text0)' }}>${fmt(r.price)}</div>
            <div className={chgClass(r.change_pct)} style={{ fontWeight: 700 }}>
              {chgSign(r.change_pct)}{fmt(r.change_pct)}%
            </div>
            <div style={{ color: 'var(--text2)' }}>{fmtK(r.market_cap)}</div>
            <div style={{ color: r.vol_ratio > 2 ? 'var(--yellow)' : 'var(--text1)' }}>{fmt(r.vol_ratio)}x</div>
            <div style={{ color: 'var(--text2)' }}>{r.beta ? fmt(r.beta) : '—'}</div>
          </div>
        ))
      }
    </div>
  );
}

// ── Ticker Tape ───────────────────────────────────────────────────────────────

function TickerTape() {
  const { data } = useApi(`${API}/market/overview`);
  const items = [...(data?.indices || []), ...(data?.forex || []), ...(data?.commodities || [])];
  if (!items.length) return null;
  const doubled = [...items, ...items];

  return (
    <div className="ticker-tape">
      <div className="ticker-inner">
        {doubled.map((item, i) => (
          <div key={i} className="ticker-item">
            <span className="ticker-sym">{item.name}</span>
            <span className="ticker-val">{fmt(item.price, item.price > 100 ? 2 : 4)}</span>
            <span className={chgClass(item.change_pct)} style={{ fontSize: 10 }}>
              {chgSign(item.change_pct)}{fmt(item.change_pct)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

const WATCHLIST = [
  { sym: 'SPY', name: 'S&P 500 ETF' },
  { sym: 'QQQ', name: 'Nasdaq 100 ETF' },
  { sym: 'AAPL', name: 'Apple Inc.' },
  { sym: 'NVDA', name: 'Nvidia Corp.' },
  { sym: 'MSFT', name: 'Microsoft' },
  { sym: 'TSLA', name: 'Tesla Inc.' },
  { sym: 'BTC-USD', name: 'Bitcoin' },
  { sym: 'ETH-USD', name: 'Ethereum' },
  { sym: 'GC=F', name: 'Gold Futures' },
  { sym: 'CL=F', name: 'Crude Oil' },
  { sym: '^VIX', name: 'VIX Index' },
  { sym: 'EUR=X', name: 'EUR/USD' },
];

function Sidebar({ onSelect, activeSymbol }) {
  const [quotes, setQuotes] = useState({});

  useEffect(() => {
    async function loadQuotes() {
      const results = {};
      for (const { sym } of WATCHLIST) {
        try {
          const res = await fetch(`${API}/quote/${sym}`);
          const d = await res.json();
          results[sym] = d;
        } catch {}
      }
      setQuotes(results);
    }
    loadQuotes();
    const t = setInterval(loadQuotes, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-label">WATCHLIST</div>
        {WATCHLIST.map(({ sym, name }) => {
          const q = quotes[sym];
          return (
            <div key={sym} className="asset-row" onClick={() => onSelect(sym)}
              style={{ background: activeSymbol === sym ? 'var(--bg3)' : undefined }}>
              <div>
                <div className="asset-sym">{sym}</div>
                <div className="asset-name">{name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {q ? (
                  <>
                    <div className="asset-price">{fmt(q.price, q.price > 100 ? 2 : 4)}</div>
                    <div className={`asset-chg ${chgClass(q.change_pct)}`}>
                      {chgSign(q.change_pct)}{fmt(q.change_pct)}%
                    </div>
                  </>
                ) : <div className="asset-price" style={{ color: 'var(--text2)' }}>···</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'OVERVIEW', icon: Globe },
  { id: 'quote', label: 'QUOTE', icon: Activity },
  { id: 'options', label: 'OPTIONS', icon: Layers },
  { id: 'screener', label: 'SCREENER', icon: Target },
  { id: 'news', label: 'NEWS', icon: Newspaper },
];

export default function App() {
  const [tab, setTab] = useState('overview');
  const [symbol, setSymbol] = useState('');
  const [inputSym, setInputSym] = useState('');
  const [clock, setClock] = useState(new Date());
  const inputRef = useRef();

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSelect = (sym) => {
    setSymbol(sym);
    setInputSym(sym);
    setTab('quote');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputSym.trim()) {
      setSymbol(inputSym.trim().toUpperCase());
      setTab('quote');
    }
  };

  const isMarketOpen = () => {
    const now = new Date();
    const h = now.getUTCHours();
    const d = now.getUTCDay();
    return d >= 1 && d <= 5 && h >= 14 && h < 21;
  };

  return (
    <>
      <style>{STYLE}</style>
      <div id="root" style={{ fontFamily: 'var(--mono)' }}>
        {/* Header */}
        <div className="terminal-header">
          <div className="status-dot" />
          <div className="terminal-logo">QUANT TERMINAL</div>
          <div style={{ fontSize: 9, color: 'var(--text2)', letterSpacing: 2 }}>
            {isMarketOpen()
              ? <span style={{ color: 'var(--green)' }}>● MARKET OPEN</span>
              : <span style={{ color: 'var(--red)' }}>● MARKET CLOSED</span>}
          </div>
          <div style={{ fontSize: 9, color: 'var(--border2)', letterSpacing: 1 }}>v1.0.0</div>
          <div className="header-time">
            {clock.toUTCString().slice(0, -3)} UTC
          </div>
        </div>

        {/* Ticker Tape */}
        <TickerTape />

        {/* Tab Bar */}
        <div className="tab-bar">
          {TABS.map(({ id, label, icon: Icon }) => (
            <div key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
              <Icon size={11} />{label}
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <Search size={12} style={{ color: 'var(--text2)' }} />
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6 }}>
            <input className="search-input" ref={inputRef}
              value={inputSym} onChange={e => setInputSym(e.target.value.toUpperCase())}
              placeholder="SYMBOL e.g. AAPL, BTC-USD, ^GSPC" />
            <button type="submit" className="btn primary">
              <ChevronRight size={10} /> LOAD
            </button>
          </form>
          {symbol && (
            <div style={{ fontSize: 10, color: 'var(--text2)', letterSpacing: 1 }}>
              ACTIVE: <span style={{ color: 'var(--accent)' }}>{symbol}</span>
            </div>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text2)', letterSpacing: 1 }}>
            SUPPORTS: STOCKS · ETF · CRYPTO · FOREX · FUTURES · OPTIONS · GLOBAL
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <Sidebar onSelect={handleSelect} activeSymbol={symbol} />
          <div className="content-area">
            {tab === 'overview' && <MarketOverview onSelectSymbol={handleSelect} />}
            {tab === 'quote' && <QuoteView symbol={symbol} />}
            {tab === 'options' && <OptionsView symbol={symbol} />}
            {tab === 'screener' && <ScreenerView onSelectSymbol={handleSelect} />}
            {tab === 'news' && <NewsView />}
          </div>
        </div>
      </div>
    </>
  );
}
