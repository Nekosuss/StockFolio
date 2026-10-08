# Stockfolio

An ivory and forest-green virtual portfolio tracker for Indian equities built with React, Vite, Express, MongoDB, and Mongoose. Stockfolio is a learning and tracking product: trades use virtual cash and never reach a brokerage.

## Features
- Responsive ivory and forest-green investment dashboard, portfolio analytics, performance and allocation charts.
- Holdings, stock search/details, watchlist, and transaction history.
- Virtual buy/sell with weighted average cost, cash validation, share validation, and atomic MongoDB transactions.
- JWT authentication and bcrypt password hashing in the API.
- Replaceable Indian market data provider with Twelve Data NSE support, optional Finnhub support, and an isolated mock provider/cache for demos.
- Lenis root scrolling synchronized with ScrollTrigger, GSAP section reveals, a responsive Vanta NET landing hero (disabled on mobile/reduced-motion), and reduced-motion support.

## Tech stack and architecture
React 18, Vite, Tailwind CSS, React Router, Recharts, Axios, GSAP/ScrollTrigger, Lenis, Vanta NET, Express, Mongoose, JWT, bcryptjs. The browser demo uses localStorage for a no-setup walkthrough; configured API deployments use MongoDB and bearer JWTs. Market API access lives only in `server/services/marketDataService.js`.

## Structure
```
src/App.jsx                 Screens, reusable dashboard components and demo interactions
src/styles.css              Responsive design system
src/main.jsx                React, router and Lenis bootstrap
server/index.js             Express app and MongoDB startup
server/models/index.js      User, Holding, Transaction, Watchlist, PortfolioSnapshot
server/routes/              Authentication and REST API
server/services/            Cached market-data provider abstraction
.env.example                Server configuration template
```

## Setup
Requires Node.js 20+ and MongoDB 6+ (local or managed).

1. Copy `.env.example` to `.env` in the project root and set `MONGODB_URI` and a long random `JWT_SECRET`.
2. Install dependencies: `npm install`.
3. Start the API: `npm run server`.
4. Start the frontend: `npm run dev`.
5. Build frontend assets: `npm run build`.

Vite runs at `http://localhost:5173`; API at `http://localhost:5000`. The market provider defaults to `mock`, which has clearly separated illustrative prices. For NSE equities, set `MARKET_DATA_PROVIDER=upstox` and `UPSTOX_ANALYTICS_TOKEN` to use Upstox's read-only Analytics Token for instrument search, quotes, and history. Alternatively, Twelve Data is configured with `MARKET_DATA_PROVIDER=twelvedata` and `TWELVEDATA_API_KEY`; Twelve Data receives NSE symbols such as `RELIANCE:NSE`. Keep provider credentials on the server. Access, delay, symbols, and request limits depend on provider terms. Cache TTL is one minute. Finnhub remains available for its supported symbols. Authenticated stock quotes and history use the configured provider; demo index ticker values remain illustrative.

## API
`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`; authenticated `/api/portfolio`, `/api/portfolio/performance`, `/api/portfolio/allocation`, `/api/holdings`, `/api/holdings/:symbol`, `/api/trades/buy`, `/api/trades/sell`, `/api/transactions`, `/api/watchlist`, `/api/stocks/search`, `/api/stocks/:symbol`, `/api/stocks/:symbol/history`. Send `Authorization: Bearer <token>` to protected endpoints. A MongoDB replica set is required for transactional trades; MongoDB Atlas provides this by default.

## Indian market setup
Use NSE-listed symbols such as `RELIANCE`, `TCS`, `HDFCBANK`, `INFY`, and `ICICIBANK`. All portfolio amounts use INR. `.env.example` documents the backend configuration. Authenticated portfolio and market screens consume API quote endpoints when a JWT session exists. Demo holdings and index values remain illustrative.

## Demo account
Open `/dashboard` or select “Explore demo” for the browser-only sample portfolio. To save an account portfolio, start MongoDB and the API, then register or log in; the form uses the JWT API. The API requires a MongoDB replica set for virtual trade transactions.

## Screenshots
_Add screenshots here._

## Future improvements
Add an index-data feed, API-backed portfolio performance snapshots, BSE instrument support, rate-limit protection, MFA, and automated API/UI coverage.

## Disclaimer
Market figures shown in browser demo mode are illustrative and may be stale. This is not a brokerage or investment advice service.

