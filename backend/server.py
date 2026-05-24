"""
Quantitative Finance Terminal - Backend Server
Uses aiohttp, yfinance, BeautifulSoup for data aggregation
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from aiohttp import web
import aiohttp
import yfinance as yf
import pandas as pd
import numpy as np
from bs4 import BeautifulSoup
import requests
from concurrent.futures import ThreadPoolExecutor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

executor = ThreadPoolExecutor(max_workers=10)

# ─── CORS middleware ───────────────────────────────────────────────────────────

@web.middleware
async def cors_middleware(request, handler):
    if request.method == "OPTIONS":
        response = web.Response()
    else:
        try:
            response = await handler(request)
        except web.HTTPException as ex:
            response = web.Response(status=ex.status, text=ex.text)
        except Exception as e:
            logger.error(f"Handler error: {e}")
            response = web.Response(
                status=500,
                text=json.dumps({"error": str(e)}),
                content_type="application/json"
            )
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


# ─── yfinance helpers (blocking → thread pool) ────────────────────────────────

def _fetch_quote(symbol: str) -> dict:
    ticker = yf.Ticker(symbol)
    try:
        info = ticker.info or {}
    except Exception:
        info = {}
    hist = ticker.history(period="5d", interval="1d")
    
    price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose", 0)
    prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose", price)
    change = price - prev_close if prev_close else 0
    change_pct = (change / prev_close * 100) if prev_close else 0

    return {
        "symbol": symbol.upper(),
        "name": info.get("longName") or info.get("shortName", symbol),
        "price": round(price, 4),
        "change": round(change, 4),
        "change_pct": round(change_pct, 4),
        "volume": info.get("volume") or info.get("regularMarketVolume", 0),
        "market_cap": info.get("marketCap", 0),
        "pe_ratio": info.get("trailingPE") or info.get("forwardPE"),
        "52w_high": info.get("fiftyTwoWeekHigh"),
        "52w_low": info.get("fiftyTwoWeekLow"),
        "avg_volume": info.get("averageVolume"),
        "beta": info.get("beta"),
        "sector": info.get("sector", ""),
        "currency": info.get("currency", "USD"),
        "exchange": info.get("exchange", ""),
        "timestamp": datetime.utcnow().isoformat(),
    }


def _fetch_history(symbol: str, period: str = "1mo", interval: str = "1d") -> list:
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period, interval=interval)
    if hist.empty:
        return []
    records = []
    for ts, row in hist.iterrows():
        records.append({
            "date": ts.isoformat(),
            "open": round(float(row["Open"]), 4),
            "high": round(float(row["High"]), 4),
            "low": round(float(row["Low"]), 4),
            "close": round(float(row["Close"]), 4),
            "volume": int(row["Volume"]),
        })
    return records


def _fetch_options_chain(symbol: str) -> dict:
    try:
        ticker = yf.Ticker(symbol)
        expirations = ticker.options
    except Exception as e:
        logger.warning(f"Options expirations error for {symbol}: {e}")
        return {"calls": [], "puts": [], "expirations": [], "error": str(e)}

    if not expirations:
        return {"calls": [], "puts": [], "expirations": [], "error": "No options data available for this symbol"}

    exp = expirations[0]
    try:
        chain = ticker.option_chain(exp)
    except Exception as e:
        logger.warning(f"option_chain error for {symbol} exp={exp}: {e}")
        return {"calls": [], "puts": [], "expirations": list(expirations[:8]), "error": str(e)}

    def chain_to_list(df):
        if df is None:
            return []
        rows = []
        for _, r in df.iterrows():
            try:
                rows.append({
                    "strike": float(r.get("strike") or 0),
                    "lastPrice": float(r.get("lastPrice") or 0),
                    "bid": float(r.get("bid") or 0),
                    "ask": float(r.get("ask") or 0),
                    "volume": int(r.get("volume") or 0),
                    "openInterest": int(r.get("openInterest") or 0),
                    "impliedVolatility": round(float(r.get("impliedVolatility") or 0), 4),
                    "inTheMoney": bool(r.get("inTheMoney") or False),
                })
            except Exception:
                pass
        return rows

    return {
        "expiration": exp,
        "expirations": list(expirations[:8]),
        "calls": chain_to_list(chain.calls),
        "puts": chain_to_list(chain.puts),
    }


def _safe_info(ticker) -> dict:
    """Safely retrieve ticker.info, returning empty dict on failure."""
    try:
        return ticker.info or {}
    except Exception:
        return {}


def _fetch_market_movers() -> dict:
    """Fetch top gainers, losers, most active from predefined lists."""
    watchlist = [
        "SPY", "QQQ", "IWM", "DIA", "GLD", "SLV", "TLT", "HYG",
        "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "NFLX",
        "JPM", "BAC", "GS", "MS", "XOM", "CVX", "PFE", "JNJ",
        "BTC-USD", "ETH-USD", "SOL-USD",
    ]
    results = []
    for sym in watchlist:
        try:
            t = yf.Ticker(sym)
            info = _safe_info(t)
            price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose", 0)
            prev = info.get("previousClose") or info.get("regularMarketPreviousClose") or price
            chg = (price - prev) / prev * 100 if prev else 0
            results.append({
                "symbol": sym,
                "name": info.get("shortName", sym),
                "price": round(float(price or 0), 4),
                "change_pct": round(float(chg), 2),
                "volume": info.get("volume") or 0,
            })
        except Exception:
            pass

    results.sort(key=lambda x: x["change_pct"], reverse=True)
    return {
        "gainers": results[:5],
        "losers": results[-5:][::-1],
        "most_active": sorted(results, key=lambda x: x["volume"], reverse=True)[:5],
    }


def _compute_technicals(symbol: str) -> dict:
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period="6mo", interval="1d")
    if hist.empty or len(hist) < 20:
        return {}

    close = hist["Close"]
    
    # Moving averages
    sma20 = float(close.rolling(20).mean().iloc[-1])
    sma50 = float(close.rolling(50).mean().iloc[-1]) if len(close) >= 50 else None
    ema12 = float(close.ewm(span=12).mean().iloc[-1])
    ema26 = float(close.ewm(span=26).mean().iloc[-1])
    
    # MACD
    macd_line = ema12 - ema26
    signal_line = float(close.ewm(span=12).mean().subtract(close.ewm(span=26).mean()).ewm(span=9).mean().iloc[-1])
    
    # RSI
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = -delta.clip(upper=0).rolling(14).mean()
    rs = gain / loss
    rsi = float(100 - (100 / (1 + rs)).iloc[-1])
    
    # Bollinger Bands
    bb_mid = sma20
    bb_std = float(close.rolling(20).std().iloc[-1])
    bb_upper = bb_mid + 2 * bb_std
    bb_lower = bb_mid - 2 * bb_std
    
    # ATR
    high = hist["High"]
    low = hist["Low"]
    tr = pd.concat([high - low, abs(high - close.shift()), abs(low - close.shift())], axis=1).max(axis=1)
    atr = float(tr.rolling(14).mean().iloc[-1])
    
    current_price = float(close.iloc[-1])
    
    return {
        "price": round(current_price, 4),
        "sma20": round(sma20, 4),
        "sma50": round(sma50, 4) if sma50 else None,
        "ema12": round(ema12, 4),
        "ema26": round(ema26, 4),
        "macd": round(macd_line, 4),
        "macd_signal": round(signal_line, 4),
        "rsi": round(rsi, 2),
        "bb_upper": round(bb_upper, 4),
        "bb_mid": round(bb_mid, 4),
        "bb_lower": round(bb_lower, 4),
        "atr": round(atr, 4),
        "signal": "BUY" if rsi < 35 and current_price > sma20 else
                  "SELL" if rsi > 65 and current_price < sma20 else "NEUTRAL",
    }


# ─── News scraping ─────────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def _scrape_reuters_markets() -> list[dict]:
    """Scrape Reuters markets news (robots.txt allows /markets/)."""
    articles = []
    try:
        resp = requests.get(
            "https://www.reuters.com/markets/",
            headers=HEADERS, timeout=8
        )
        soup = BeautifulSoup(resp.text, "lxml")
        # Reuters article cards
        for card in soup.select("a[data-testid='Heading']")[:10]:
            text = card.get_text(strip=True)
            href = card.get("href", "")
            if text and href and len(text) > 20:
                articles.append({
                    "title": text,
                    "url": f"https://www.reuters.com{href}" if href.startswith("/") else href,
                    "source": "Reuters",
                    "timestamp": datetime.utcnow().isoformat(),
                })
        # Fallback: generic link patterns
        if not articles:
            for a in soup.find_all("a", href=True):
                href = a["href"]
                text = a.get_text(strip=True)
                if "/markets/" in href and len(text) > 30 and text not in [a["title"] for a in articles]:
                    articles.append({
                        "title": text,
                        "url": f"https://www.reuters.com{href}" if href.startswith("/") else href,
                        "source": "Reuters",
                        "timestamp": datetime.utcnow().isoformat(),
                    })
                    if len(articles) >= 8:
                        break
    except Exception as e:
        logger.warning(f"Reuters scrape error: {e}")
    return articles[:8]


def _scrape_yahoo_finance_news() -> list[dict]:
    """Scrape Yahoo Finance market news feed."""
    articles = []
    try:
        resp = requests.get(
            "https://finance.yahoo.com/news/",
            headers=HEADERS, timeout=8
        )
        soup = BeautifulSoup(resp.text, "lxml")
        for item in soup.select("h3.Mb\\(5px\\), h3[class*='title'], .js-stream-content h3")[:10]:
            a_tag = item.find("a")
            if a_tag:
                title = a_tag.get_text(strip=True)
                href = a_tag.get("href", "")
                if title and href:
                    url = f"https://finance.yahoo.com{href}" if href.startswith("/") else href
                    articles.append({
                        "title": title,
                        "url": url,
                        "source": "Yahoo Finance",
                        "timestamp": datetime.utcnow().isoformat(),
                    })
        # Broader fallback
        if len(articles) < 5:
            for a in soup.find_all("a", href=True):
                href = a["href"]
                text = a.get_text(strip=True)
                if "/news/" in href and len(text) > 30:
                    articles.append({
                        "title": text,
                        "url": f"https://finance.yahoo.com{href}" if href.startswith("/") else href,
                        "source": "Yahoo Finance",
                        "timestamp": datetime.utcnow().isoformat(),
                    })
                    if len(articles) >= 10:
                        break
    except Exception as e:
        logger.warning(f"Yahoo Finance scrape error: {e}")
    return articles[:10]


def _scrape_investing_com_news() -> list[dict]:
    """Scrape Investing.com economic news RSS-style."""
    articles = []
    try:
        resp = requests.get(
            "https://www.investing.com/rss/news_25.rss",
            headers=HEADERS, timeout=8
        )
        soup = BeautifulSoup(resp.text, "xml")
        for item in soup.find_all("item")[:10]:
            title = item.find("title")
            link = item.find("link")
            pub = item.find("pubDate")
            if title and link:
                articles.append({
                    "title": title.get_text(strip=True),
                    "url": link.get_text(strip=True),
                    "source": "Investing.com",
                    "timestamp": pub.get_text(strip=True) if pub else datetime.utcnow().isoformat(),
                })
    except Exception as e:
        logger.warning(f"Investing.com scrape error: {e}")
    return articles


def _scrape_all_news() -> list[dict]:
    all_news = []
    all_news.extend(_scrape_reuters_markets())
    all_news.extend(_scrape_yahoo_finance_news())
    all_news.extend(_scrape_investing_com_news())
    # Deduplicate by title
    seen = set()
    unique = []
    for art in all_news:
        t = art["title"][:60]
        if t not in seen and len(art["title"]) > 15:
            seen.add(t)
            unique.append(art)
    return unique[:30]


# ─── Global indices ────────────────────────────────────────────────────────────

GLOBAL_INDICES = {
    "S&P 500": "^GSPC",
    "Nasdaq": "^IXIC",
    "Dow Jones": "^DJI",
    "Russell 2000": "^RUT",
    "VIX": "^VIX",
    "FTSE 100": "^FTSE",
    "DAX": "^GDAXI",
    "Nikkei 225": "^N225",
    "Hang Seng": "^HSI",
    "Shanghai": "000001.SS",
    "ASX 200": "^AXJO",
    "Euro Stoxx 50": "^STOXX50E",
    "CAC 40": "^FCHI",
    "TSX": "^GSPTSE",
    "Bovespa": "^BVSP",
}

FOREX_PAIRS = {
    "EUR/USD": "EURUSD=X",
    "GBP/USD": "GBPUSD=X",
    "USD/JPY": "JPY=X",
    "USD/CHF": "CHF=X",
    "AUD/USD": "AUDUSD=X",
    "USD/CAD": "CAD=X",
    "USD/CNY": "CNY=X",
    "USD/INR": "INR=X",
}

COMMODITIES = {
    "Gold": "GC=F",
    "Silver": "SI=F",
    "Crude Oil": "CL=F",
    "Natural Gas": "NG=F",
    "Copper": "HG=F",
    "Wheat": "ZW=F",
    "Corn": "ZC=F",
    "10Y Treasury": "^TNX",
}


def _fetch_batch(symbols_dict: dict) -> list[dict]:
    results = []
    for name, sym in symbols_dict.items():
        try:
            t = yf.Ticker(sym)
            info = _safe_info(t)
            price = (info.get("currentPrice") or info.get("regularMarketPrice")
                     or info.get("previousClose") or 0)
            prev = info.get("previousClose") or info.get("regularMarketPreviousClose") or price
            chg = (price - prev) / prev * 100 if prev else 0
            results.append({
                "name": name,
                "symbol": sym,
                "price": round(float(price), 4),
                "change_pct": round(float(chg), 2),
                "currency": info.get("currency", ""),
            })
        except Exception:
            pass
    return results


# ─── Route handlers ────────────────────────────────────────────────────────────

async def health(request):
    return web.json_response({"status": "ok", "time": datetime.utcnow().isoformat()})


async def get_quote(request):
    symbol = request.match_info["symbol"].upper()
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(executor, _fetch_quote, symbol)
    return web.json_response(data)


async def get_history(request):
    symbol = request.match_info["symbol"].upper()
    period = request.rel_url.query.get("period", "1mo")
    interval = request.rel_url.query.get("interval", "1d")
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(executor, _fetch_history, symbol, period, interval)
    return web.json_response(data)


async def get_options(request):
    symbol = request.match_info["symbol"].upper()
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(executor, _fetch_options_chain, symbol)
    return web.json_response(data)


async def get_technicals(request):
    symbol = request.match_info["symbol"].upper()
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(executor, _compute_technicals, symbol)
    return web.json_response(data)


async def get_market_overview(request):
    loop = asyncio.get_event_loop()
    indices, forex, commodities = await asyncio.gather(
        loop.run_in_executor(executor, _fetch_batch, GLOBAL_INDICES),
        loop.run_in_executor(executor, _fetch_batch, FOREX_PAIRS),
        loop.run_in_executor(executor, _fetch_batch, COMMODITIES),
    )
    return web.json_response({
        "indices": indices,
        "forex": forex,
        "commodities": commodities,
        "timestamp": datetime.utcnow().isoformat(),
    })


async def get_movers(request):
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(executor, _fetch_market_movers)
    return web.json_response(data)


async def get_news(request):
    loop = asyncio.get_event_loop()
    articles = await loop.run_in_executor(executor, _scrape_all_news)
    return web.json_response({"articles": articles, "count": len(articles)})


async def search_symbols(request):
    query = request.rel_url.query.get("q", "").upper()
    if not query or len(query) < 1:
        return web.json_response({"results": []})
    
    # Quick search using yfinance
    loop = asyncio.get_event_loop()
    
    def _search():
        candidates = [query, f"{query}.L", f"{query}.T", f"{query}.DE", f"{query}.HK"]
        results = []
        for sym in candidates:
            try:
                t = yf.Ticker(sym)
                info = _safe_info(t)
                name = info.get("longName") or info.get("shortName", "")
                if name:
                    results.append({
                        "symbol": sym,
                        "name": name,
                        "exchange": info.get("exchange", ""),
                        "type": info.get("quoteType", ""),
                    })
            except Exception:
                pass
        return results

    data = await loop.run_in_executor(executor, _search)
    return web.json_response({"results": data})


async def get_screener(request):
    """Small-cap screener — finds capacity-constrained alpha opportunities."""
    loop = asyncio.get_event_loop()
    
    def _screen():
        # A curated list of small/mid caps with potential inefficiencies
        candidates = [
            "MSTR", "RIOT", "MARA", "CLSK", "BITF",  # crypto-adjacent
            "SPWR", "FSLR", "ENPH", "SEDG", "ARRY",  # clean energy
            "ACMR", "SLAB", "ONTO", "FORM", "ICHR",  # semiconductor small caps
            "PRPH", "INVA", "HALO", "ACAD", "FATE",  # biotech
            "TIGR", "FUTU", "PAGS", "SQ", "UPST",    # fintech
        ]
        results = []
        for sym in candidates:
            try:
                t = yf.Ticker(sym)
                info = _safe_info(t)
                price = info.get("currentPrice") or info.get("regularMarketPrice") or 0
                prev = info.get("previousClose") or price
                chg = (price - prev) / prev * 100 if prev else 0
                mcap = info.get("marketCap", 0)
                vol = info.get("volume", 0)
                avg_vol = info.get("averageVolume", 1) or 1
                vol_ratio = vol / avg_vol if avg_vol else 0
                
                results.append({
                    "symbol": sym,
                    "name": info.get("shortName", sym),
                    "price": round(float(price), 2),
                    "change_pct": round(float(chg), 2),
                    "market_cap": mcap,
                    "volume": vol,
                    "vol_ratio": round(vol_ratio, 2),
                    "pe": info.get("trailingPE"),
                    "sector": info.get("sector", ""),
                    "beta": info.get("beta"),
                })
            except Exception:
                pass
        return sorted(results, key=lambda x: abs(x["change_pct"]), reverse=True)

    data = await loop.run_in_executor(executor, _screen)
    return web.json_response({"results": data})


# ─── App factory ───────────────────────────────────────────────────────────────

def create_app():
    app = web.Application(middlewares=[cors_middleware])
    app.router.add_get("/api/health", health)
    app.router.add_get("/api/quote/{symbol}", get_quote)
    app.router.add_get("/api/history/{symbol}", get_history)
    app.router.add_get("/api/options/{symbol}", get_options)
    app.router.add_get("/api/technicals/{symbol}", get_technicals)
    app.router.add_get("/api/market/overview", get_market_overview)
    app.router.add_get("/api/market/movers", get_movers)
    app.router.add_get("/api/news", get_news)
    app.router.add_get("/api/search", search_symbols)
    app.router.add_get("/api/screener", get_screener)
    return app


if __name__ == "__main__":
    app = create_app()
    web.run_app(app, host="0.0.0.0", port=8080)
    print("Server running on http://localhost:8080")
