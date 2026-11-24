# PaperTrade

Paper-trading web app with ₹10,00,000 virtual capital and trainable trading agents (Momentum, Mean reversion, Random).

## Features
- Glassmorphic dark/light UI, live simulated NSE feed with sparklines and per-stock charts
- Order ticket with buy/sell toggle, quantity stepper, quick sizes and live cost estimate
- Positions with average cost and unrealised P&L, realised P&L, trade history
- Agent leaderboard, equity-curve comparison vs you, non-blocking training with progress bar
- Persistence (localStorage), keyboard shortcuts: `B` buy · `S` sell · `Space` pause · `T` theme

## Run with real NSE data
```bash
npm install
npm start        # http://localhost:3000
```
`server.js` uses [hi-imcodeman/stock-nse-india](https://github.com/hi-imcodeman/stock-nse-india) to fetch real NSE quotes (NSE blocks browser requests, so a tiny Node server proxies them) and exposes `/api/quotes`. The app polls it every 5s. Badge shows **Live · NSE**.

If the server isn't running (plain `index.html` / static hosting) the app tries the community API ([0xramm/Indian-Stock-Market-API](https://github.com/0xramm/Indian-Stock-Market-API)), then falls back to the built-in simulation.

Virtual money only; no real funds. Quotes may be delayed and are for practice only.
