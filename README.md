# 🍔 CraveDash — Real-Time Order Management & Analytics Platform

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Amazon MemoryDB](https://img.shields.io/badge/AWS-Amazon_MemoryDB_for_Redis-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/memorydb/)
[![AWS EC2](https://img.shields.io/badge/AWS-EC2-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/ec2/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

**CraveDash** is an ultra-fast, full-stack food delivery and order management platform built with **React + Vite** on the frontend, **Spring Boot 3** on **AWS EC2**, and backed by **Amazon MemoryDB for Redis** as its primary high-durability in-memory database.

---

## 📑 Table of Contents

- [System Architecture](#-system-architecture)
- [Cloud & Infrastructure Services Breakdown](#-cloud--infrastructure-services-breakdown)
  - [1. Amazon MemoryDB for Redis](#1-amazon-memorydb-for-redis)
  - [2. AWS EC2 (Elastic Compute Cloud)](#2-aws-ec2-elastic-compute-cloud)
  - [3. Vercel (Edge Hosting & Reverse Proxy)](#3-vercel-edge-hosting--reverse-proxy)
  - [4. Lettuce Redis Driver](#4-lettuce-redis-driver)
  - [5. Spring Boot 3 Backend](#5-spring-boot-3-backend)
  - [6. React + Vite Frontend](#6-react--vite-frontend)
- [Comparison Matrix: Why These Services Over Alternatives?](#-comparison-matrix-why-these-services-over-alternatives)
- [Redis Data Structures & Slot Architecture](#-redis-data-structures--slot-architecture)
- [Order Lifecycle State Machine](#-order-lifecycle-state-machine)
- [Key Platform Features](#-key-platform-features)
- [Project Directory Structure](#-project-directory-structure)
- [Local Development Setup](#-local-development-setup)
- [Production AWS & Vercel Deployment](#-production-aws--vercel-deployment)
- [API Reference](#-api-reference)

---

## 📐 System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Client Browser                       │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS
                            ▼
┌────────────────────────────────────────────────────────┐
│               Vercel Edge Platform                     │
│  • Serves React + Vite Static SPA from Global CDN     │
│  • Reverse Proxy (`/api/*` rewrite) via vercel.json    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON (Proxied)
                            ▼
┌────────────────────────────────────────────────────────┐
│              Amazon EC2 (AWS VPC)                      │
│  • Spring Boot 3 REST API (Port 8080)                 │
│  • State Validation & Business Logic                   │
│  • Lettuce Client Pool (TLS + Topology Refresh)        │
└───────────────────────────┬────────────────────────────┘
                            │ Lettuce Cluster Protocol (TLS: 6379)
                            ▼
┌────────────────────────────────────────────────────────┐
│          Amazon MemoryDB for Redis Cluster             │
│  • Multi-AZ Distributed Transaction Log (RPO = 0)     │
│  • Ultra-low Sub-Millisecond In-Memory Store           │
│  • Sharded Cluster Hash Slots via `{cravedash}` tag    │
│  • Hashes, Sets, Sorted Sets, & Atomic Strings         │
└────────────────────────────────────────────────────────┘
```

---

## ☁️ Cloud & Infrastructure Services Breakdown

### 1. Amazon MemoryDB for Redis
* **Role**: Primary authoritative database (not merely a secondary cache).
* **Usage in CraveDash**:
  * Auto-increment order ID generator via atomic counters (`{cravedash}:seq:order`).
  * Order entity storage via Redis Hashes (`{cravedash}:order:<id>`).
  * Creation-time chronological indexing via Sorted Sets (`{cravedash}:orders:all`).
  * Live non-delivered active orders tracking via Sets (`{cravedash}:orders:active`).
  * Real-time customer loyalty points leaderboard via Sorted Sets (`{cravedash}:leaderboard`).
* **Key Advantages**:
  * **Sub-millisecond Latencies**: Data resides entirely in memory for high-frequency order ingest.
  * **Multi-AZ Durability ($RPO = 0$)**: Commits every write to a distributed multi-AZ transaction log before acknowledging, eliminating the risk of data loss.
  * **ACID Transactions**: Enables multi-key `MULTI/EXEC` operations across orders, counters, and leaderboard within a single cluster slot.

### 2. AWS EC2 (Elastic Compute Cloud)
* **Role**: Hosting the Java Spring Boot 3 application runtime in a private/public VPC subnet.
* **Key Advantages**:
  * **Direct VPC Access**: MemoryDB clusters are VPC-isolated and cannot be exposed to the public internet. EC2 sits inside the same VPC/security group for direct private TLS communication.
  * **Persistent Connection Pooling**: Maintains long-lived TCP/TLS Lettuce connection pools and background cluster topology refresh listeners without cold-start interruptions.
  * **Full Hardware & JVM Control**: Predictable compute, heap sizing, and continuous uptime.

### 3. Vercel (Edge Hosting & Reverse Proxy)
* **Role**: Frontend hosting, edge caching, and API reverse proxy routing.
* **Key Advantages**:
  * **Eliminates Mixed Content & CORS**: The edge rewrite rules in `vercel.json` forward `/api/*` requests directly to `http://54.208.18.100:8080/api/*`, allowing the browser to communicate entirely over HTTPS on the same origin.
  * **Global CDN**: Delivers instant asset loading worldwide with zero devops overhead.
  * **Automated CI/CD**: Automatically builds and deploys updates pushed to the GitHub repository.

### 4. Lettuce Redis Driver
* **Role**: High-performance, asynchronous Redis driver for Spring Boot.
* **Key Advantages**:
  * **Non-blocking & Thread-safe**: Built on Netty; shares a single thread-safe connection across multiple concurrent threads.
  * **Adaptive Cluster Topology Refresh**: Dynamically reacts to Redis shard additions, failovers, and primary elections without service interruption.
  * **Replica Offloading**: Configured with `ReadFrom.REPLICA_PREFERRED` to offload analytical reads to replicas while funneling writes to the shard primary.

### 5. Spring Boot 3 Backend
* **Role**: Core application layer handling REST APIs, validation, security, and order lifecycle management.
* **Key Advantages**:
  * **Strict Validation & Architecture**: Layered design (`Controller` → `Service` → `Repository`) preventing invalid state jumps.
  * **Actuator Probes**: Out-of-the-box `/actuator/health` endpoint verifying both JVM and MemoryDB cluster health.

### 6. React + Vite Frontend
* **Role**: Fast, reactive Single Page Application (SPA) offering real-time dashboards, live order tracking pipelines, and diagnostic tools.
* **Key Advantages**:
  * **Instant HMR & Build Speed**: Native ES modules (ESM) provide rapid developer feedback and lean production bundles.
  * **Interactive Operations Tools**: Live latency benchmarks, Redis key inspector, and status timeline steppers.

---

## 📊 Comparison Matrix: Why These Services Over Alternatives?

| Service Used | Alternative Considered | Why We Chose Our Service |
|:---|:---|:---|
| **Amazon MemoryDB** | **Amazon ElastiCache for Redis** | ElastiCache is primarily a cache with asynchronous replication; node failures before replication can cause data loss. MemoryDB writes to a distributed multi-AZ transaction log *before* acknowledging writes, guaranteeing durability ($RPO=0$) as a primary DB. |
| **Amazon MemoryDB** | **Amazon DynamoDB** | DynamoDB typical latency is $4\text{–}12\text{ ms}$ (unless paying for DAX). DynamoDB also requires expensive table scans or complex GSI designs for real-time ranked leaderboards, whereas Redis Sorted Sets rank top users natively in $O(\log N)$ with $<1\text{ ms}$ response. |
| **Amazon MemoryDB** | **Amazon RDS (PostgreSQL/MySQL)** | Relational databases encounter disk I/O, lock contention, and connection pool bottlenecks under heavy write bursts. MemoryDB handles fast-moving order queues and live score increments purely in RAM. |
| **AWS EC2** | **AWS Lambda** | Lambda functions are ephemeral and suffer from cold starts and VPC ENI attachment overheads. MemoryDB requires long-lived stateful Lettuce connection pools and cluster topology refresh listeners, which cannot run efficiently inside transient Lambda invocations. |
| **Vercel** | **AWS S3 + CloudFront** | S3 + CloudFront requires setting up custom CloudFront Origins, Cache Behaviors, and Lambda@Edge/CloudFront Functions for API proxying and URL rewrites. Vercel provides seamless Git deployments and built-in reverse proxy routing with a single declarative file. |
| **Lettuce** | **Jedis** | Jedis is synchronous and blocks threads, requiring one dedicated socket per thread (`JedisPool`). Lettuce is non-blocking (Netty-based) and adaptively handles cluster topology rebalancing. |
| **React + Vite** | **Next.js (SSR)** | CraveDash is an authenticated operations portal relying on client-side polling and diagnostic benchmarks. Next.js adds unnecessary server-side rendering compute overhead without tangible SEO benefits. |

---

## 📦 Redis Data Structures & Slot Architecture

### Why the `{cravedash}` Hash Tag?
In Redis Cluster mode, keys are distributed across 16,384 hash slots. Multi-key operations and `MULTI/EXEC` transactions fail with a `CROSSSLOT` error if the keys reside on different shards.
By wrapping the namespace in braces `{cravedash}`, Redis hashes only the bracketed text, ensuring **all platform keys map to the exact same hash slot**:

$$\text{Slot} = \text{CRC16}("\text{cravedash}") \pmod{16384}$$

### Key Schema

| Key Pattern | Redis Type | Purpose | Time Complexity |
|:---|:---|:---|:---|
| `{cravedash}:seq:order` | **String** | Atomic counter for auto-incrementing order IDs (starts at `5001`). | $O(1)$ (`INCR`) |
| `{cravedash}:order:<id>` | **Hash** | Stores complete order metadata (customer, items, status, timestamp, total). | $O(1)$ (`HGETALL`, `HSET`) |
| `{cravedash}:orders:all` | **Sorted Set** | Index of all order IDs scored by creation epoch timestamp (milliseconds). | $O(\log N)$ (`ZADD`, `ZREVRANGE`) |
| `{cravedash}:orders:active` | **Set** | Unordered pool of IDs for orders currently in flight. | $O(1)$ (`SADD`, `SREM`, `SCARD`) |
| `{cravedash}:leaderboard` | **Sorted Set** | Customer loyalty reward points ledger scored by points. | $O(\log N)$ (`ZINCRBY`, `ZREVRANGE`) |

---

## 🔄 Order Lifecycle State Machine

Order status transitions are strictly linear and enforced in [OrderStatus.java](file:///d:/AWS/backend/src/main/java/com/cravedash/model/OrderStatus.java):

```
PLACED ──► ACCEPTED ──► PREPARING ──► OUT_FOR_DELIVERY ──► DELIVERED
```

* **Linear Enforcement**: Skipping steps or moving backwards triggers an `InvalidStatusTransitionException` ($400\text{ Bad Request}$).
* **Completion Event**: When an order transitions to `DELIVERED`:
  1. The order ID is removed from `{cravedash}:orders:active`.
  2. The customer is awarded **10 loyalty points** via `ZINCRBY {cravedash}:leaderboard 10 "<CustomerName>"`.

---

## ✨ Key Platform Features

1. **Operations Dashboard**: Live statistics (total orders, active orders, today's volume, top customers).
2. **Interactive Order Pipeline**: Visual state timeline and action buttons to advance order stages.
3. **Customer Portal**: Self-service menu ordering, live tracking, and loyalty rewards tracking.
4. **Restaurant Partner Portal**: Dedicated interface for kitchen staff to manage pending and preparing orders.
5. **Real-time Analytics**: Visual KPI metrics, revenue tracking, and fulfillment velocities.
6. **In-Memory Inspector Hub (`MemoryDbHub`)**:
   - Inspects real-time Redis data structures and slot allocations.
   - **Live Latency Benchmark**: Executes 50 live read and write operations against the database to measure P50 and P99 latency in real time.

---

## 📁 Project Directory Structure

```
d:/AWS/
├── backend/                               # Spring Boot 3 Java Application
│   ├── pom.xml                            # Maven dependencies (Web, Redis, Actuator)
│   └── src/main/
│       ├── java/com/cravedash/
│       │   ├── CraveDashApplication.java
│       │   ├── config/
│       │   │   ├── RedisConfig.java       # Lettuce Cluster + TLS configuration
│       │   │   └── WebConfig.java         # Global CORS configuration
│       │   ├── controller/
│       │   │   ├── OrderController.java   # Order CRUD & lifecycle endpoints
│       │   │   ├── AnalyticsController.java # Business analytics & KPIs
│       │   │   ├── LeaderboardController.java # Customer loyalty rankings
│       │   │   ├── MemoryDbInspectorController.java # Live Redis key inspection & benchmark
│       │   │   ├── RestaurantController.java # Restaurant order fulfillment
│       │   │   └── HealthController.java  # System & Redis ping health checks
│       │   ├── model/                     # Domain entities, DTOs & status enums
│       │   ├── repository/                # RedisTemplate operations (Hashes, ZSets, Sets)
│       │   ├── service/                   # Business rules & transition validation
│       │   └── exception/                 # Global controller advice & error handlers
│       └── resources/
│           ├── application.yml            # Production config (MemoryDB cluster)
│           └── application-local.yml      # Local dev profile (standalone Redis)
│
├── frontend/                              # React 18 + Vite Application
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json                        # Vercel reverse-proxy & SPA fallback routing
│   └── src/
│       ├── App.jsx                        # React Router configuration
│       ├── index.css                      # Premium dark-mode design system
│       ├── api/api.js                     # Axios client & centralized API calls
│       ├── pages/
│       │   ├── Dashboard.jsx              # Executive operations dashboard
│       │   ├── Orders.jsx                 # Order management & modal creation
│       │   ├── OrderDetails.jsx           # Order detail view & timeline advancement
│       │   ├── LiveTrackerPage.jsx        # Live delivery tracking
│       │   ├── CustomerPage.jsx           # Customer ordering & loyalty points
│       │   ├── RestaurantPage.jsx         # Restaurant fulfillment dashboard
│       │   ├── AnalyticsPage.jsx          # Analytics & business KPIs
│       │   ├── Leaderboard.jsx            # Real-time customer points leaderboard
│       │   ├── MemoryDbHub.jsx            # Live Redis key inspector & benchmark
│       │   └── LoginPage.jsx              # Role-based workspace switch
│       └── components/                    # Navbar, StatusBadge, Timeline, Modals
│
├── maven/                                 # Bundled Apache Maven 3.9.6
├── start-backend.bat                      # One-click Windows backend runner
├── start-frontend.bat                     # One-click Windows frontend runner
├── vercel.json                            # Root Vercel reverse proxy configuration
└── README.md
```

---

## 💻 Local Development Setup

### Prerequisites
* **Java 17+**
* **Node.js 18+**
* **Docker** (or local Redis 7+ / Valkey)

### 1. Start Local Redis / Valkey
```bash
docker run -d --name redis-local -p 6379:6379 valkey/valkey:7.2
```

### 2. Run the Backend
Using the provided Windows batch script:
```powershell
d:\AWS\start-backend.bat
```
*Or manually via PowerShell:*
```powershell
cd d:\AWS\backend
$env:SPRING_PROFILES_ACTIVE = "local"
$env:MEMORYDB_ENDPOINT      = "localhost"
$env:MEMORYDB_PORT          = "6379"

d:\AWS\maven\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```
*Backend runs on:* **http://localhost:8080**

### 3. Run the Frontend
Using the provided Windows batch script:
```powershell
d:\AWS\start-frontend.bat
```
*Or manually:*
```powershell
cd d:\AWS\frontend
npm install
npm run dev
```
*Frontend runs on:* **http://localhost:5173**

---

## 🏭 Production AWS & Vercel Deployment

### 1. Amazon MemoryDB Setup
1. Create a MemoryDB cluster with at least 1 shard and Multi-AZ enabled.
2. Enable In-Transit Encryption (TLS).
3. Associate with your VPC private subnets and security group allowing inbound port `6379`.

### 2. AWS EC2 Backend Deployment
1. Launch an Amazon Linux 2023 or Ubuntu EC2 instance in the same VPC as your MemoryDB cluster.
2. Ensure the EC2 Security Group is authorized to connect to the MemoryDB Security Group on port `6379`.
3. Set environment variables on the EC2 instance:
   ```bash
   export MEMORYDB_ENDPOINT="your-cluster.memorydb.us-east-1.amazonaws.com"
   export MEMORYDB_PORT="6379"
   export MEMORYDB_USERNAME="your-user"
   export MEMORYDB_PASSWORD="your-password"
   export ALLOWED_ORIGIN="*"
   ```
4. Build and run the jar:
   ```bash
   mvn clean package -DskipTests
   java -jar target/cravedash-backend-1.0.0.jar
   ```

### 3. Vercel Frontend Deployment
1. Link your GitHub repository to [Vercel](https://vercel.com/).
2. Set the Root Directory to `./` or `frontend`.
3. Verify that `vercel.json` contains the reverse-proxy rewrite to your EC2 public IP or load balancer:
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "http://54.208.18.100:8080/api/:path*" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
4. Deploy. Vercel automatically routes `/api/*` requests through its edge proxies, guaranteeing zero Mixed Content issues over HTTPS.

---

## 🌐 API Reference

### Orders (`/api/orders`)
* `GET /api/orders` — List all orders (newest first).
* `POST /api/orders` — Create a new order:
  ```json
  {
    "customer": "Priya Sharma",
    "restaurant": "Biryani House",
    "amount": 499
  }
  ```
* `GET /api/orders/{id}` — Retrieve an order by ID.
* `PUT /api/orders/{id}/status` — Advance order state:
  ```json
  { "status": "ACCEPTED" }
  ```
* `GET /api/orders/stats` — Summary counts (`{ totalOrders, activeOrders }`).

### Loyalty Leaderboard (`/api/leaderboard`)
* `GET /api/leaderboard?limit=20` — Top customers sorted by earned points.

### In-Memory Diagnostics (`/api/memorydb`)
* `GET /api/memorydb/inspect` — Real-time dump of Redis keys, active order counts, and hash slots.
* `GET /api/memorydb/benchmark` — Executes live read/write latency benchmarks against MemoryDB.
* `GET /api/memorydb/info` — Returns server version, uptime, and cluster info.

### Health Probes (`/api/health`)
* `GET /api/health` — Returns application status and live MemoryDB connectivity.

---

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
