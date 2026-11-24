# PaperTrade

Paper-trading web app with ₹10,00,000 virtual capital and trainable trading agents (Momentum, Mean reversion, Random).

## Features
- Glassmorphic dark/light UI, live simulated NSE feed with sparklines and per-stock charts
- Order ticket with buy/sell toggle, quantity stepper, quick sizes and live cost estimate
- Positions with average cost and unrealised P&L, realised P&L, trade history
- Agent leaderboard, equity-curve comparison vs you, non-blocking training with progress bar
- Persistence (localStorage), keyboard shortcuts: `B` buy · `S` sell · `Space` pause · `T` theme

## Run
Open `index.html` in a browser. Live NSE quotes are pulled from [0xramm/Indian-Stock-Market-API](https://github.com/0xramm/Indian-Stock-Market-API) (`/stock/list`, polled every 5s); the app falls back to the simulated feed if it is unreachable. Set `API=""` in `index.html` to force simulation, or point it at your own deployment.

Virtual money only; no real funds.
