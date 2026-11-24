// PaperTrade live server: serves the app and proxies real quotes (indianapi.in if INDIANAPI_KEY is set, else NSE via stock-nse-india).
// Usage: npm install && npm start  → http://localhost:3000
const http = require('http'), fs = require('fs'), path = require('path');
const { NseIndia } = require('stock-nse-india');
const nse = new NseIndia();
const SYMS = ['RELIANCE','TCS','INFY','HDFCBANK','ICICIBANK','SBIN','ITC','LT'];
// load .env (INDIANAPI_KEY) without extra dependencies
try { fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(l => { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }); } catch (e) {}
const KEY = process.env.INDIANAPI_KEY, TDKEY = process.env.TWELVEDATA_KEY;
const IAPI = 'https://stock.indianapi.in';
const QNAME = { RELIANCE: 'Reliance', TCS: 'TCS', INFY: 'Infosys', HDFCBANK: 'HDFC Bank', ICICIBANK: 'ICICI Bank', SBIN: 'State Bank of India', ITC: 'ITC', LT: 'Larsen & Toubro' };
const num = v => { if (v && typeof v === 'object') v = v.NSE ?? v.nse ?? v.BSE ?? v.value; v = parseFloat(String(v ?? '').replace(/[₹,\s]/g, '')); return isFinite(v) && v > 0 ? v : null; };
let cache = { t: 0, data: {}, src: '' };
async function viaTwelveData() {         // twelvedata.com  (batch /quote, NSE)
  const out = {};
  try {
    const u = 'https://api.twelvedata.com/quote?apikey=' + encodeURIComponent(TDKEY) + '&symbol=' + SYMS.map(s => s + ':NSE').join(',');
    const j = await (await fetch(u, { signal: AbortSignal.timeout(10000) })).json();
    const items = j && j.symbol ? [j] : Object.entries(j || {}).map(([k, v]) => v && typeof v === 'object' ? { symbol: k, ...v } : null);
    items.forEach(d => {
      if (!d || d.status === 'error') return;
      const s = String(d.symbol || '').split(':')[0].toUpperCase(), price = num(d.close);
      if (SYMS.includes(s) && price) out[s] = { price, prevClose: num(d.previous_close) };
    });
  } catch (e) {}
  return out;
}
async function viaIndianApi() {           // indianapi.in  (header: x-api-key)
  const out = {};
  await Promise.all(SYMS.map(async s => {
    try {
      const r = await fetch(IAPI + '/stock?name=' + encodeURIComponent(QNAME[s]), { headers: { 'x-api-key': KEY }, signal: AbortSignal.timeout(8000) });
      if (!r.ok) return;
      const d = await r.json(), price = num(d.currentPrice);
      if (price) out[s] = { price, prevClose: num(d.previousClose) || num(d.stockTechnicalData && d.stockTechnicalData.previousClose) || null };
    } catch (e) { /* skip */ }
  }));
  return out;
}
async function viaNse() {                 // stock-nse-india fallback
  const out = {};
  await Promise.all(SYMS.map(async s => {
    try { const p = (await nse.getEquityDetails(s)).priceInfo; out[s] = { price: p.lastPrice, prevClose: p.previousClose }; } catch (e) {}
  }));
  return out;
}
async function quotes() {
  const ttl = TDKEY ? 60000 : KEY ? 15000 : 3000;   // respect provider rate limits (Twelve Data free: 8 credits/min)
  if (Date.now() - cache.t < ttl && Object.keys(cache.data).length) return cache;
  let data = {}, src = '';
  const ok = d => Object.keys(d).length >= 4;
  if (TDKEY) { data = await viaTwelveData(); src = 'twelvedata.com'; }
  if (!ok(data) && KEY) { data = await viaIndianApi(); src = 'indianapi.in'; }
  if (!ok(data)) { data = await viaNse(); src = 'NSE via stock-nse-india'; }
  if (Object.keys(data).length) cache = { t: Date.now(), data, src };
  return cache;
}
http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/quotes')) {
    const c = await quotes(), ok = Object.keys(c.data).length > 0;
    res.writeHead(ok ? 200 : 502, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ source: c.src, ts: c.t, quotes: c.data }));
  }
  fs.readFile(path.join(__dirname, 'index.html'), (e, b) => {
    if (e) { res.writeHead(500); return res.end('error'); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(b);
  });
}).listen(process.env.PORT || 3000, () => console.log('PaperTrade on http://localhost:' + (process.env.PORT || 3000)));
