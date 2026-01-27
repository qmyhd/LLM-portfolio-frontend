# LLM Portfolio Dashboard - Next.js Frontend

> **Production-ready Next.js 14 dashboard for the LLM Portfolio Journal**  
> A modern web interface for portfolio analytics, trading ideas, and market data.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17+ (LTS recommended)
- npm 9+ or pnpm
- Backend API running (FastAPI on EC2 or localhost)

### Local Development

```bash
# Clone the repository
git clone https://github.com/qmyhd/LLM-portfolio-frontend.git
cd LLM-portfolio-frontend/frontend

# Install dependencies
npm install

# Configure environment (see Environment Variables below)
cp .env.example .env.local
# Edit .env.local with your backend URL

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
# ============================================
# REQUIRED: Backend API URL
# ============================================
# For local development (FastAPI running locally):
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production (your EC2 FastAPI backend):
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# ============================================
# OPTIONAL: Direct Supabase connection
# ============================================
# Only needed if frontend queries Supabase directly
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ============================================
# OPTIONAL: Feature flags
# ============================================
# NEXT_PUBLIC_ENABLE_CHAT=true
# NEXT_PUBLIC_ENABLE_WATCHLIST=true
```

### Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | FastAPI backend URL (e.g., `http://localhost:8000` or `https://api.yourdomain.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL (only for direct DB access) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anonymous key |

> **Note:** All `NEXT_PUBLIC_*` variables are exposed to the browser. Never put secrets here.

## 📦 Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Dashboard home (portfolio overview)
│   │   ├── layout.tsx            # Root layout with dark theme
│   │   ├── globals.css           # Tailwind + custom styles
│   │   ├── stock/[ticker]/       # Dynamic stock hub pages
│   │   ├── positions/            # Positions page
│   │   ├── orders/               # Orders history page
│   │   ├── watchlist/            # Watchlist page
│   │   └── api/                  # API Routes (BFF pattern)
│   │       ├── portfolio/        # Portfolio data endpoint
│   │       ├── orders/           # Orders data endpoint
│   │       ├── search/           # Symbol search endpoint
│   │       ├── watchlist/        # Watchlist data endpoint
│   │       └── stocks/[ticker]/  # Stock profile, OHLCV, ideas
│   ├── components/
│   │   ├── layout/               # Sidebar, TopBar navigation
│   │   ├── dashboard/            # Portfolio summary, positions, orders
│   │   ├── stock/                # Chart, metrics, ideas, chat widgets
│   │   └── ui/                   # Reusable UI components
│   ├── hooks/                    # Custom React hooks
│   │   ├── usePortfolio.ts       # Portfolio data with polling
│   │   ├── useIdeas.ts           # Ideas data with polling
│   │   └── useLiveUpdates.ts     # Global polling toggle
│   └── types/
│       ├── index.ts              # Component types
│       └── api.ts                # API response types
├── package.json
├── tailwind.config.ts            # Discord-inspired dark theme
├── vercel.json                   # Vercel deployment config
└── next.config.mjs
```

## 🔄 Live Updates (Polling)

The dashboard supports automatic data refresh via polling hooks:

### Using the Hooks

```tsx
import { usePortfolio, useIdeas, useLiveUpdates } from '@/hooks';

// Portfolio data with 60s polling
const { data, isLoading, isPolling, refresh } = usePortfolio();

// Ideas for a specific ticker
const { data: ideas } = useIdeas('AAPL', { direction: 'bullish' });

// Toggle live updates globally
const { isEnabled, toggle } = useLiveUpdates();
```

### Live Updates Toggle Component

Add the toggle to your TopBar or settings:

```tsx
import { LiveUpdatesToggle } from '@/components/ui/LiveUpdatesToggle';

// Full toggle with label
<LiveUpdatesToggle showLabel />

// Compact icon-only toggle
<LiveUpdatesToggle compact />
```

Users can turn live updates on/off, and their preference is saved to localStorage.

The frontend uses a **Backend for Frontend (BFF)** pattern. API routes in `src/app/api/` proxy to your Python backend:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/portfolio` | GET | Portfolio summary + positions |
| `/api/portfolio` | POST | Trigger brokerage sync |
| `/api/stocks/[ticker]` | GET | Stock profile + position data |
| `/api/stocks/[ticker]/ohlcv` | GET | OHLCV candles + orders |
| `/api/stocks/[ticker]/ideas` | GET | Parsed trading ideas |

**Current State:** API routes return mock data. To connect to your Python backend:

1. Set `NEXT_PUBLIC_API_URL` to your Python API endpoint
2. Update each route handler in `src/app/api/` to fetch from that URL

## 🚢 Deployment

### Option 1: Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications with automatic CI/CD.

#### Step 1: Prepare Your Repository

Ensure your repository is pushed to GitHub:

```bash
git add .
git commit -m "Frontend ready for deployment"
git push origin main
```

#### Step 2: Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your `LLM-portfolio-frontend` repository
4. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend` ← **Important!**
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

#### Step 3: Add Environment Variables

In Vercel Project Settings → Environment Variables, add:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` | Production |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Development |

#### Step 4: Deploy

Click **Deploy** and Vercel will:
- Install dependencies
- Build your Next.js app
- Deploy to a `.vercel.app` domain
- Set up automatic deployments on every push

#### Vercel Configuration

The `vercel.json` is already configured with:
- Security headers (X-Frame-Options, CSP)
- API route caching disabled
- Backend proxy rewrites

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "headers": [...],
  "rewrites": [
    {
      "source": "/api/backend/:path*",
      "destination": "${NEXT_PUBLIC_API_URL}/:path*"
    }
  ]
}
```

---

### Option 2: AWS Amplify

AWS Amplify provides similar CI/CD capabilities integrated with AWS.

#### Step 1: Create Amplify App

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **"New app"** → **"Host web app"**
3. Select **GitHub** and authorize access
4. Choose your `LLM-portfolio-frontend` repository

#### Step 2: Configure Build Settings

In the Amplify build settings:

```yaml
version: 1
applications:
  - appRoot: frontend
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
```

#### Step 3: Add Environment Variables

In Amplify Console → App Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL = https://api.yourdomain.com
```

#### Step 4: Deploy

Amplify will automatically build and deploy on every push to `main`.

---

### Option 3: Self-Hosted (EC2/VPS)

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Navigate to project directory
cd /path/to/LLM-portfolio-project

# Pull latest changes
git pull origin main

# Install frontend dependencies
cd frontend
npm install --production

# Build for production
npm run build

# Option A: Run with PM2
npm install -g pm2
pm2 start npm --name "portfolio-dashboard" -- start

# Option B: Run with systemd (see below)
```

#### Systemd Service (EC2)

Create `/etc/systemd/system/portfolio-dashboard.service`:

```ini
[Unit]
Description=LLM Portfolio Dashboard
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/path/to/LLM-portfolio-project/frontend
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable portfolio-dashboard
sudo systemctl start portfolio-dashboard
```

#### Nginx Reverse Proxy

Add to `/etc/nginx/sites-available/portfolio`:

```nginx
server {
    listen 80;
    server_name dashboard.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔗 Connecting to Python Backend

The frontend expects the following backend endpoints. You can add these to your existing FastAPI setup or create a new service:

### Required Backend Endpoints

```python
# In your Python backend (FastAPI example)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-vercel-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/portfolio")
async def get_portfolio():
    # Query positions from Supabase
    # Return: { summary: {...}, positions: [...] }
    pass

@app.get("/api/stocks/{ticker}")
async def get_stock(ticker: str):
    # Query stock profile, position, sentiment
    pass

@app.get("/api/stocks/{ticker}/ohlcv")
async def get_ohlcv(ticker: str, period: str = "6M"):
    # Query from price_service.get_ohlcv()
    pass

@app.get("/api/stocks/{ticker}/ideas")
async def get_ideas(ticker: str, limit: int = 20):
    # Query discord_parsed_ideas table
    pass
```

### Database Query Examples

```python
# Using existing src/db.py infrastructure
from src.db import execute_sql

# Get positions for portfolio
positions = execute_sql("""
    SELECT p.*, s.company_name, s.sector
    FROM positions p
    LEFT JOIN stock_profiles s ON p.symbol = s.symbol
    WHERE p.quantity > 0
    ORDER BY p.market_value DESC
""", fetch_results=True)

# Get parsed ideas for a ticker
ideas = execute_sql("""
    SELECT * FROM discord_parsed_ideas
    WHERE primary_symbol = :ticker
    ORDER BY source_created_at DESC
    LIMIT :limit
""", params={'ticker': 'AAPL', 'limit': 20}, fetch_results=True)

# Get OHLCV data
from src.price_service import get_ohlcv
df = get_ohlcv('AAPL', start='2024-01-01', end='2025-01-01')
```

## 🧪 Development

### Scripts

```bash
npm run dev      # Start dev server with hot reload
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
npm run type-check  # TypeScript check (if added)
```

### Adding New Pages

1. Create route in `src/app/[route]/page.tsx`
2. Create components in `src/components/[feature]/`
3. Add API route if needed in `src/app/api/`
4. Update Sidebar navigation in `src/components/layout/Sidebar.tsx`

### Chart Customization

The `StockChart` component uses [lightweight-charts](https://tradingview.github.io/lightweight-charts/). Key options:

```typescript
// In StockChart.tsx
chart.applyOptions({
  layout: {
    background: { type: ColorType.Solid, color: '#0f0f0f' },
    textColor: '#a0a0a0',
  },
  grid: {
    vertLines: { color: '#2a2a2a' },
    horzLines: { color: '#2a2a2a' },
  },
});

// Add markers for orders
candlestickSeries.setMarkers([
  {
    time: order.date,
    position: order.type === 'buy' ? 'belowBar' : 'aboveBar',
    color: order.type === 'buy' ? '#3ba55d' : '#ed4245',
    shape: order.type === 'buy' ? 'arrowUp' : 'arrowDown',
    text: `${order.type.toUpperCase()} $${order.price}`,
  },
]);
```

## 📋 Checklist Before Deploying

- [ ] Set all environment variables in `.env.local` or Vercel dashboard
- [ ] Verify Python backend is running and accessible
- [ ] Test API routes return real data (not mock)
- [ ] Check responsive layout on mobile
- [ ] Verify charts load with real OHLCV data
- [ ] Test search functionality in TopBar
- [ ] Confirm Sidebar favorites work with localStorage

## 🐛 Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### CORS errors when connecting to backend
Ensure your Python backend allows the frontend origin:
```python
allow_origins=["http://localhost:3000", "https://your-app.vercel.app"]
```

### Charts not rendering
- Ensure `lightweight-charts` is installed: `npm install lightweight-charts`
- Check that the chart container has explicit dimensions

### API routes returning mock data
Update the route handlers in `src/app/api/` to fetch from your actual backend URL.

---

## 📚 Related Documentation

- [AGENTS.md](../AGENTS.md) - Main project guide
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
- [Discord Bot](../src/bot/) - Original bot implementation
- [Price Service](../src/price_service.py) - OHLCV data source

---

**Built with ❤️ using Next.js 14, React 18, and Tailwind CSS**
