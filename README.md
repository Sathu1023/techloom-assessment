# Techloom.ai Software Engineer Intern — Practical Assessment

**Repository:** https://github.com/Sathu1023/techloom-assessment


**Live Deployments:**
- Task 01 (POS Order & Inventory System): https://techloom-assessment-production-1837.up.railway.app
- Task 02 (E-Commerce Checkout & Payment System): https://techloom-assessment-production-bd2b.up.railway.app

---

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | Java 17, Spring Boot 3.3 (Web, Data JPA, Validation, Scheduling) |
| Frontend | React 18 + Vite, React Router |
| Database | MySQL 8 |
| Concurrency control | Pessimistic row locking (`SELECT ... FOR UPDATE`) + JPA optimistic `@Version` as a second guard |
| Auth | Not implemented — out of scope for this assessment; order history is single-tenant (all orders visible) |

Both tasks share the same design language (see `/design` reference) but are **independently deployable** Spring Boot + React apps, each with its own database.

---

## Repository Structure

```
/task-01
  /backend    Spring Boot POS API (port 8080)
  /frontend   React staff dashboard (port 5173)
/task-02
  /backend    Spring Boot e-commerce API (port 8081)
  /frontend   React storefront (port 5174)
docker-compose.yml   Spins up MySQL for both tasks locally
```

---

## Local Setup

### 1. Start MySQL (Docker)
```bash
docker compose up -d
```
This starts `pos_db` on `localhost:3306` and `ecommerce_db` on `localhost:3307`.

> No Docker? Install MySQL locally and create two databases: `pos_db` and `ecommerce_db`. Update the connection URLs below to match.

### 2. Task 01 — POS Backend
```bash
cd task-01/backend
mvn spring-boot:run
# (or `./mvnw spring-boot:run` if you generate the wrapper: `mvn -N io.takari:maven:wrapper`)
```
Environment variables (all have working local defaults):
| Var | Default |
|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/pos_db` |
| `DB_USERNAME` | `root` |
| `DB_PASSWORD` | `` |
| `PORT` | `8080` |
| `FRONTEND_URL` | `http://localhost:5173` (CORS allow-list) |

### 3. Task 01 — Frontend
```bash
cd task-01/frontend
npm install
npm run dev
```
Set `VITE_API_URL` in a `.env` file if the backend isn't on `http://localhost:8080/api`.

### 4. Task 02 — E-Commerce Backend
```bash
cd task-02/backend
mvn spring-boot:run
```
Since both backends may run on the same machine, set:
| Var | Local value (with docker-compose) |
|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3307/ecommerce_db` |
| `DB_USERNAME` | `root` |
| `DB_PASSWORD` | `root` |
| `PORT` | `8081` |
| `FRONTEND_URL` | `http://localhost:5174` |

### 5. Task 02 — Frontend
```bash
cd task-02/frontend
npm install
npm run dev
```

---

## Railway Deploy Setup (recommended)

Each task is **one Docker service** (React UI + Spring Boot API on the same URL). Do **not** deploy `backend/` or `frontend/` alone.

### Account
Use GitHub **Sathu1023** / email **sathurshika1023@gmail.com** on [railway.app](https://railway.app). Delete any old failed project that was created under a different account.

### Create project
1. **New Project** → **Empty Project**
2. Add **MySQL** twice → rename them `pos-mysql` and `ecommerce-mysql`
3. **Add Service** → **GitHub Repo** → `Sathu1023/techloom-assessment` (connect GitHub if asked)

### Service A — Task 01 (POS)
| Setting | Value |
|---|---|
| Root Directory | `task-01` |
| Builder | Dockerfile (auto from `railway.json`) |
| Variables | **Add Variable Reference** from `pos-mysql` (so `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` appear) |
| Networking | **Generate Domain** |

### Service B — Task 02 (Store)
Same as above, but Root Directory = `task-02`, link MySQL = `ecommerce-mysql`, then **Generate Domain**.

### After deploy
1. Open the public URLs at the top of this README — Task 02 should show BookNest with **6 categories × 3 books** and cover images.
2. Health checks:
   - Task 01: https://techloom-assessment-production-1837.up.railway.app/health → `{"status":"ok"}`
   - Task 02: https://techloom-assessment-production-bd2b.up.railway.app/health → `{"status":"ok"}`
3. On Task 02 startup the seeder upserts the catalog (adds missing titles and cover URLs even if older rows already exist). Look for `BookNest seeder: catalog ready` in the service logs.

### Why deploy usually crashes (and how this repo avoids it)
| Crash cause | Fix in this repo / on Railway |
|---|---|
| Wrong Root Directory (repo root or `backend/`) | Set Root Directory to `task-01` or `task-02` only |
| MySQL not linked | Add Variable Reference from the MySQL service |
| App starts before MySQL is ready | `docker-entrypoint.sh` waits for MySQL; Hikari retries forever |
| Wrong account / no push access | Deploy from GitHub `Sathu1023` after you push |
| Listening on localhost only | App binds `0.0.0.0` and uses Railway `PORT` |

### Optional separate frontends
If you prefer split hosting: deploy each `backend` to Railway/Render and each `frontend` to Vercel with `VITE_API_URL=https://your-api/api`, and set `FRONTEND_URL` on the backend for CORS.

---

## How to Test Each Feature

### Task 01 — POS System
1. **Products/Inventory** — go to *Product Management*, add a book with stock (e.g. 5). It appears in inventory immediately.
2. **Concurrency / overselling** — open two browser tabs on *New Order*, add the same low-stock book to both carts, and click "Proceed to Checkout" on both around the same time. Only requests that fit within available stock succeed; the rest get a `409 INSUFFICIENT_STOCK` error — stock is never oversold. (For an automated concurrency test, fire N parallel `POST /api/orders` requests for a product with stock < N and confirm exactly `stock` of them succeed — see `curl` snippet below.)
3. **Reservation & expiry** — after checkout, the order shows a live 5-minute countdown. Leave it unpaid; after 5 minutes the backend's scheduled sweeper flips it to `EXPIRED` and releases stock automatically (confirm via *Orders* page, which polls every 5s).
4. **Payments** — on a `RESERVED` order, click Success / Failure / Timeout to simulate each payment outcome and see status + stock update accordingly.
5. **Duplicate payment** — try clicking a payment button twice quickly (or re-POST the same payment request); the second attempt is rejected with `409 DUPLICATE_REQUEST` since the order is already `PAID` or has a payment in progress.
6. **Cancellation** — cancel a `RESERVED` or `PAID` order from the Orders page; stock is restored.

```bash
# Simple concurrency smoke test: 10 parallel orders for 1 unit of product 1 (assume stock = 5)
for i in $(seq 1 10); do
  curl -s -X POST http://localhost:8080/api/orders \
    -H "Content-Type: application/json" \
    -d "{\"items\":[{\"productId\":1,\"quantity\":1}],\"idempotencyKey\":\"test-$i\"}" &
done
wait
# Expect exactly 5 successful (201) responses and 5 INSUFFICIENT_STOCK (409) responses.
```

### Task 02 — E-Commerce Storefront
The store is preloaded with **18 books** (3 in each category: Fiction, Non-Fiction, Technology, Children's, Self-Development, Business), each with a cover.

1. **Discovery** — on the homepage, each category should show **3 books**. Use search and category/price filters; results update via `GET /api/products/search`. Book covers load from `/covers/*.svg`.
2. **Cart & checkout** — add items to cart, go to checkout, click "Reserve Stock & Continue to Payment".
3. **Mock payment / duplicate protection** — same as Task 01: pick Success/Failure/Timeout; duplicate submissions for the same order are rejected.
4. **Refunds & cancellation** — from *Order History*, cancel a `RESERVED` order (plain stock release) or a `PAID` order (issues a simulated refund via `POST /api/orders/{id}/refund`, restocks items, and returns a refund reference).
5. **Order history** — the *Order History* page reflects live status for every order (no login in this build — see Auth note above).

---

## Design Reference

The UI follows the attached BookNest design system (deep green `#0F5132` primary, soft mint accents, Inter typeface) across both the staff POS dashboard and the customer storefront — see the design mockup provided with this assessment for the full page-by-page reference.

## Optional: Demo Walkthrough

`<PASTE A LOOM/YOUTUBE LINK HERE IF YOU RECORD ONE>`
