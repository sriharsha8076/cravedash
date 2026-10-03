# 🍔 CraveDash — Order Management System

A full-stack food order management demo built with **React + Vite** on the frontend and **Spring Boot** on the backend, backed by **Amazon MemoryDB for Redis** (or a local Redis/Valkey container for development).

---

## 📐 Architecture

```
┌─────────────────────┐       HTTP/JSON        ┌──────────────────────┐
│   React + Vite      │ ──────────────────────► │  Spring Boot 3.x     │
│   (Port 5173)       │                         │  (Port 8080)         │
│                     │ ◄────────────────────── │                      │
│  Pages:             │                         │  Controllers:        │
│  • Dashboard        │                         │  • OrderController   │
│  • Orders           │                         │  • LeaderboardCtrl   │
│  • OrderDetails     │                         │  • HealthController  │
│  • Leaderboard      │                         │                      │
└─────────────────────┘                         └──────────┬───────────┘
                                                           │  Lettuce
                                                           │  (cluster + TLS)
                                                           ▼
                                                ┌──────────────────────┐
                                                │  Amazon MemoryDB     │
                                                │  (Redis Cluster)     │
                                                │                      │
                                                │  Key schema:         │
                                                │  {cd}:seq:order      │
                                                │  {cd}:order:<id>     │
                                                │  {cd}:orders:all     │
                                                │  {cd}:orders:active  │
                                                │  {cd}:leaderboard    │
                                                └──────────────────────┘
```

### Why `{cravedash}` hash tags?

All Redis keys share the `{cravedash}` hash tag so they land in the **same cluster slot**. This is required for `MULTI/EXEC` transactions — without a shared hash tag, a transaction touching `order:<id>` and `orders:all` would fail with a `CROSSSLOT` error.

---

## 📦 Redis Data Structures

| Key | Type | Purpose |
|-----|------|---------|
| `{cravedash}:seq:order` | String (counter) | Auto-increment order IDs (starts at 5001) |
| `{cravedash}:order:<id>` | Hash | Stores all fields for a single order |
| `{cravedash}:orders:all` | Sorted Set | All order IDs scored by creation timestamp |
| `{cravedash}:orders:active` | Set | IDs of non-delivered orders (for fast SCARD) |
| `{cravedash}:leaderboard` | Sorted Set | Customer name → total points |

---

## 🔄 Order Status Lifecycle

```
PLACED → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED
```

- Transitions are **strictly linear** — you cannot skip or go backward.
- On `DELIVERED`: the order is removed from the `active` set and **10 points** are added to the customer on the leaderboard via `ZINCRBY`.

---

## 🚀 Quick Start (Local Development)

### Prerequisites

| Tool | Version |
|------|---------|
| Java | 17+ |
| Node.js | 18+ |
| Redis / Valkey | 7.x (via Docker) |

### Step 1 — Start Redis

```bash
docker run -d --name redis-local -p 6379:6379 valkey/valkey:7.2
```

> **No Docker?** Install [Redis for Windows](https://github.com/microsoftarchive/redis/releases) or use WSL.

### Step 2 — Start the Backend

**Option A — Double-click the script (Windows):**
```
d:\AWS\start-backend.bat
```

**Option B — Manual:**
```powershell
cd d:\AWS\backend
$env:SPRING_PROFILES_ACTIVE = "local"
$env:MEMORYDB_ENDPOINT      = "localhost"
$env:MEMORYDB_PORT          = "6379"

d:\AWS\maven\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```

Backend starts at: **http://localhost:8080**

### Step 3 — Start the Frontend

**Option A — Double-click the script (Windows):**
```
d:\AWS\start-frontend.bat
```

**Option B — Manual:**
```powershell
cd d:\AWS\frontend
npm install   # first time only
npm run dev
```

Frontend starts at: **http://localhost:5173** 🎉

---

## 🌐 API Reference

All endpoints are prefixed with `/api`.

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orders` | List all orders (newest first) |
| `POST` | `/api/orders` | Create a new order |
| `GET` | `/api/orders/{id}` | Get a single order by ID |
| `PUT` | `/api/orders/{id}/status` | Advance order to next status |
| `GET` | `/api/orders/stats` | Get `{ totalOrders, activeOrders }` |

**Create Order body:**
```json
{
  "customer": "Priya Sharma",
  "restaurant": "Biryani House",
  "amount": 499
}
```

**Update Status body:**
```json
{ "status": "ACCEPTED" }
```

### Leaderboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leaderboard?limit=20` | Top N customers by points |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Backend + MemoryDB health check |

---

## ⚙️ Configuration

### Backend (`application-local.yml`)

The `local` Spring profile is used for local development. It disables TLS and uses environment variables with defaults:

```yaml
spring.data.redis:
  host: ${MEMORYDB_ENDPOINT:localhost}
  port: ${MEMORYDB_PORT:6379}
  ssl.enabled: false
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## 🏗️ Project Structure

```
d:/AWS/
├── backend/                     # Spring Boot application
│   ├── pom.xml
│   └── src/main/java/com/cravedash/
│       ├── CraveDashApplication.java
│       ├── config/
│       │   ├── RedisConfig.java     # Lettuce cluster + TLS config
│       │   └── WebConfig.java       # CORS configuration
│       ├── controller/
│       │   ├── OrderController.java
│       │   ├── LeaderboardController.java
│       │   └── HealthController.java
│       ├── model/
│       │   ├── Order.java
│       │   ├── OrderStatus.java     # Enum with transition logic
│       │   ├── CreateOrderRequest.java
│       │   ├── UpdateStatusRequest.java
│       │   └── LeaderboardEntry.java
│       ├── repository/
│       │   ├── OrderRepository.java      # All Redis ops for orders
│       │   └── LeaderboardRepository.java
│       ├── service/
│       │   ├── OrderService.java
│       │   └── LeaderboardService.java
│       └── exception/
│           ├── GlobalExceptionHandler.java
│           ├── OrderNotFoundException.java
│           └── InvalidStatusTransitionException.java
│
├── frontend/                    # React + Vite application
│   ├── .env                     # VITE_API_BASE_URL
│   └── src/
│       ├── App.jsx              # Routes
│       ├── main.jsx             # Entry point
│       ├── index.css            # Global dark theme
│       ├── api/api.js           # Axios client + all API calls
│       ├── components/
│       │   ├── Navbar.jsx           # Sticky nav + health indicator
│       │   ├── StatusBadge.jsx      # Colored status pills
│       │   ├── StatusTimeline.jsx   # Order progress tracker
│       │   └── CreateOrderModal.jsx # Modal form
│       └── pages/
│           ├── Dashboard.jsx        # Stats + recent orders + leaderboard
│           ├── Orders.jsx           # All orders + filter + create
│           ├── OrderDetails.jsx     # Single order + status update
│           └── Leaderboard.jsx      # Full leaderboard
│
├── maven/apache-maven-3.9.6/   # Bundled Maven (no global install needed)
├── start-backend.bat            # One-click backend startup (Windows)
├── start-frontend.bat           # One-click frontend startup (Windows)
└── README.md
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Connection refused` on backend start | Start Redis: `docker run -p 6379:6379 valkey/valkey:7.2` |
| `CORS error` in browser | Ensure backend is running on port 8080 and `ALLOWED_ORIGIN` is set |
| `npm` not recognized in PowerShell | Use `cmd /c npm ...` or enable PowerShell scripts |
| Frontend shows `MemoryDB unreachable` | Backend is not running or not reachable at `localhost:8080` |
| Orders return empty after restart | Redis data is in-memory; it resets when the container stops. Use `docker run -v redis-data:/data ...` for persistence |

---

## 🏭 Production Deployment (AWS)

1. **Backend**: Deploy to ECS/EC2. Set env vars:
   - `MEMORYDB_ENDPOINT` — MemoryDB cluster endpoint
   - `MEMORYDB_PORT` — `6379`
   - `MEMORYDB_USERNAME` / `MEMORYDB_PASSWORD` — MemoryDB credentials
   - `ALLOWED_ORIGIN` — CloudFront or ALB URL
   - `SPRING_PROFILES_ACTIVE` — leave unset (production config applies)

2. **Frontend**: Build with `npm run build` and deploy `dist/` to S3 + CloudFront.
   Set `VITE_API_BASE_URL` to your API Gateway or ALB URL before building.

---

## 📄 License

MIT — feel free to use, modify, and distribute.
