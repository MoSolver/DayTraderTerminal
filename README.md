# QUANT TERMINAL

A full-stack quantitative finance information terminal built to exploit the structural edges that large banks and hedge funds miss.

## Architecture

```
quant-terminal/
├── backend/
│   └── server.py          # aiohttp REST API + yfinance + BeautifulSoup
|   └── requirements.txt
└── frontend/
    ├── public/index.html
    └── src/
        ├── index.js
        └── App.js          # React terminal UI
```

## Features

### Market Overview
- **15 Global Indices** (S&P 500, Nasdaq, FTSE, DAX, Nikkei, Hang Seng, Shanghai, ASX, Bovespa, etc.)
- **8 Forex Pairs** (EUR/USD, GBP/USD, USD/JPY, AUD/USD, etc.)
- **8 Commodities & Rates** (Gold, Silver, Crude Oil, Natural Gas, Copper, Wheat, 10Y Treasury)
- Real-time market movers: top gainers, losers, most active

### Quote & Charts
- Full quote data: price, change, volume, market cap, P/E, 52W high/low, beta
- Interactive OHLCV charts with 8 timeframes (1D intraday → 5Y)
- Volume histogram
- Works for: US stocks, ETFs, crypto (BTC-USD), forex (EUR=X), futures (GC=F), global stocks

### Technical Analysis
- RSI (14) with visual gauge
- MACD & Signal Line
- SMA 20 / SMA 50
- EMA 12 / EMA 26
- Bollinger Bands (upper/lower/mid)
- ATR (14)
- Automated BUY/SELL/NEUTRAL signal

### Options Chain
- Full calls & puts chain for nearest expiration with accurate IV data for both modes
- **3D Implied Volatility Surface** — interactive Three.js visualization showing IV structure across strikes and expiration dates
  - Stationary view by default for detailed analysis
  - **ROTATE** button — enable auto-rotation for spatial perspective
  - **RESET** button — return camera to original position
  - Color gradient: teal (low IV) → yellow (mid IV) → red (high IV)
- Separate calls and puts mode toggle — correctly displays IV surface for selected option type
- ITM highlighting, IV color coding (high/med/low)
- Strike, Last, Bid, Ask, Volume, OI, IV

### Alpha Screener
- Curated small/mid cap universe: crypto-adjacent, clean energy, semiconductor, biotech, fintech
- Volume ratio (current vs average) — spots unusual activity
- Beta, market cap, sector filters

### News Feed (BeautifulSoup)
- Reuters Markets (scrapes /markets/)
- Yahoo Finance News
- Investing.com RSS feed
- Deduplication + live timestamp

### Ticker Tape
- Scrolling real-time feed of all global indices, forex, commodities

### Watchlist Sidebar
- 12 default instruments (SPY, QQQ, AAPL, NVDA, BTC-USD, Gold, VIX, etc.)
- Auto-refreshes every 60 seconds
- Click any row to open quote view

---

## Recent Updates

### v1.1.0 – IV Surface & Options Enhancements
- **Fixed IV Surface Data Bug**: Implied volatility surface now correctly displays puts data when switching to puts mode (previously showed only calls)
- **Improved 3D Visualization**: IV surface starts stationary for better data examination; rotation is optional
- **Added Reset Control**: RESET button restores 3D surface camera to original position
- **Better UI Feedback**: Options mode indicators and surface controls

---

## Setup & Running

### Backend (Python 3.9+)

```bash
# Install dependencies
pip install -r requirements.txt

# Start server (port 8080)
cd backend
python server.py
```

### Frontend (Node.js 16+)

```bash
cd frontend
npm install
npm start     # Opens on http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/quote/{symbol}` | Full quote data |
| GET | `/api/history/{symbol}?period=3mo&interval=1d` | OHLCV history |
| GET | `/api/options/{symbol}` | Options chain |
| GET | `/api/technicals/{symbol}` | RSI, MACD, BB, ATR |
| GET | `/api/market/overview` | Global indices, forex, commodities |
| GET | `/api/market/movers` | Gainers, losers, most active |
| GET | `/api/news` | Scraped news feed |
| GET | `/api/search?q=AAPL` | Symbol search |
| GET | `/api/screener` | Alpha screener results |

### Symbol Examples
- US Stocks: `AAPL`, `MSFT`, `NVDA`, `TSLA`
- ETFs: `SPY`, `QQQ`, `GLD`, `TLT`
- Crypto: `BTC-USD`, `ETH-USD`, `SOL-USD`
- Forex: `EURUSD=X`, `JPY=X`, `GBPUSD=X`
- Futures: `GC=F` (Gold), `CL=F` (Oil), `ES=F` (S&P)
- Indices: `^GSPC`, `^VIX`, `^FTSE`, `^N225`
- International: `7203.T` (Toyota), `BABA` (Alibaba), `SAP.DE`

---

## Edge Framework (from document)

| Edge | Implementation |
|------|---------------|
| Capacity-Constrained Alpha | Alpha Screener tab — small/mid caps with volume anomalies |
| Speed of Adaptation | Fast Python scraper + yfinance + aiohttp async API |
| Behavioral Inefficiencies | Market movers + volume ratio highlights unusual flows |
| Cross-Disciplinary Signals | Options chain IV + price technicals combined view |
| Long-Horizon Patience | Multi-timeframe charts (intraday → 5Y) + BB/RSI extremes |
| Alternative Infrastructure | Lean async backend, no legacy systems |
| Ignored Markets | Crypto, futures, global indices, forex all supported |
| Microstructure | Options IV smile, OI/volume ratios, ITM depth |

---

## Extending the Terminal

- **Add more scrapers**: Edit `_scrape_*` functions in `server.py`
- **Add more screener assets**: Extend `candidates` list in `_screen()`
- **Add more watchlist**: Edit `WATCHLIST` array in `App.js`
- **Add more indices**: Edit `GLOBAL_INDICES` dict in `server.py`
- **Add alerts**: Add WebSocket support with `aiohttp` web sockets
- **Add portfolio tracking**: Add POST endpoints + SQLite storage
