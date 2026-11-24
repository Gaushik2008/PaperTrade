// PaperTrade live server: serves the app and proxies real NSE quotes via stock-nse-india.
// Usage: npm install && npm start  → http://localhost:3000
const http = require('http'), fs = require('fs'), path = require('path');
const { NseIndia } = require('stock-nse-india');
const nse = new NseIndia();
const SYMS = ['RELIANCE','TCS','INFY','HDFCBANK','ICICIBANK','SBIN','ITC','LT'];
let cache = { t: 0, data: {} };
async function quotes() {
  if (Date.now() - cache.t < 3000) return cache.data;
  const out = {};
  await Promise.all(SYMS.map(async s => {
    try {
      const d = await nse.getEquityDetails(s), p = d.priceInfo;
      out[s] = { price: p.lastPrice, prevClose: p.previousClose, change: p.change, pChange: p.pChange };
    } catch (e) { /* skip symbol this round */ }
  }));
  if (Object.keys(out).length) cache = { t: Date.now(), data: out };
  return Object.keys(out).length ? out : cache.data;
}
http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/quotes')) {
    const data = await quotes();
    res.writeHead(Object.keys(data).length ? 200 : 502, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ source: 'NSE via stock-nse-india', ts: Date.now(), quotes: data }));
  }
  fs.readFile(path.join(__dirname, 'index.html'), (e, b) => {
    if (e) { res.writeHead(500); return res.end('error'); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(b);
  });
}).listen(process.env.PORT || 3000, () => console.log('PaperTrade on http://localhost:' + (process.env.PORT || 3000)));
