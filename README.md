# Cake Delight

A cloud-native microservices app for a made-up cake shop — my capstone project. You can browse cakes, log in, manage a basket, check out, get notified, and rate what you bought. Under the hood it's five separate Node.js services behind an API gateway, backed by MongoDB and RabbitMQ, and it runs either in Docker Compose or on Kubernetes.

The point of building it this way wasn't really the cake shop — it was to actually practice the parts that are hard to get right just from reading about them: splitting a system into services that own their own data, keeping them loosely coupled, using events instead of direct calls where it matters, and deploying the thing for real instead of just running `npm start` forever on my laptop.

## What it does

- Browse the catalog, search by name, filter by category and price range
- Log in with an OTP (one-time password) flow — enter an email, get a code, enter the code
- Add cakes to a basket, change quantities, remove items
- Check out — creates a real order, empties the basket, fires off a notification in the background
- See the order confirmation show up on its own (no refresh needed) — it arrived asynchronously via RabbitMQ
- Rate a cake you bought and watch the average score update

There are two roles: **Admin** and **Customer**. Customers only see their own basket, orders, and notifications. Admins can see everything across all customers, plus manage the catalog.

## Architecture

One API gateway sits in front of everything and is the only thing the frontend talks to directly. Behind it, four services each own their own slice of the data:

| Service | Owns | Notes |
|---|---|---|
| **catalog-service** | Cake data | Public reads, admin-only writes |
| **order-service** | Baskets + orders | The one service that calls another service directly — it asks catalog-service for the real price of a cake before adding it to a basket, instead of trusting whatever the browser sends |
| **rating-service** | Ratings | Averages are calculated with a MongoDB aggregation pipeline, not in application code |
| **notification-service** | Notification records | Never called directly — it just listens on RabbitMQ for an `order.completed` event and reacts when one shows up |

Order and Notification are connected through RabbitMQ instead of a direct API call. That's the deliberately asynchronous part of the system: checkout shouldn't have to sit around waiting for an email to send before it tells the customer they're done.

*(Architecture diagram and checkout sequence diagram: see `docs/` if included in this repo.)*

## Tech stack

- **Node.js + Express** — all five services
- **MongoDB + Mongoose** — one MongoDB instance locally, each service uses its own database inside it, so they're still logically separate
- **RabbitMQ** — carries the `order.completed` event
- **JWT** — the gateway issues and verifies tokens; backend services trust the gateway rather than re-verifying tokens themselves
- **Plain HTML/CSS/JS** — frontend, no framework, served by nginx
- **Mailpit** — stands in for a real email provider, so notifications land somewhere visible without needing real SMTP credentials
- **Docker + Kubernetes** — containerization and orchestration

## Running it

Two ways to run this. **Don't run both at once** — they use separate databases, so you'll end up seeding one and looking at the other, which is exactly as confusing as it sounds.

**Docker Compose** (easiest, best for local dev/testing) — full steps in [`docker/README.md`](docker/README.md):
```bash
cd docker
docker compose up --build -d
```
Then open http://localhost.

**Kubernetes** (closer to a real deployment, tested with minikube) — full steps in [`k8s/README.md`](k8s/README.md):
```bash
minikube start --driver=docker
# build images inside minikube's Docker environment first — see k8s/README.md
kubectl apply -f k8s/
minikube service client -n cake-delight
```

## Logging in

Go to `/auth.html` (or click Sign In from the catalog page).

**Quick Demo Login** — two buttons right on the login page, Admin and Customer, that request an OTP, fetch it from the gateway's demo endpoint, and log you in with no typing required.

**Manual OTP flow**, if you want to see the real steps:
1. Type an email (e.g. `customer@cakedelight.com`), click **Send OTP**
2. The code appears on screen as a hint — since this is a demo with no real email provider wired to auth, showing it directly is the intended behavior, not a bug
3. Enter the code, click **Sign In**

## Trying the whole flow

1. Log in as Customer (Quick Demo Login)
2. Browse the catalog, try the search and price filters
3. Add a couple of cakes to the basket, change a quantity, remove one
4. Checkout
5. Check the notification bell — the confirmation should already be there
6. Rate a cake, watch the average update
7. Sign out, log in as Admin, and see the same system from that side — all orders, all notifications, catalog management

## API quick reference

| Service | Endpoint | Auth |
|---|---|---|
| catalog | `GET /cakes` — list/filter (`?name=&category=&minPrice=&maxPrice=`) | Public |
| catalog | `GET /cakes/:id` | Public |
| order | `GET/POST/PUT/DELETE /basket/:userId[/items/:cakeId]` | Required |
| order | `POST /orders/checkout` | Required |
| order | `GET /orders/:orderId` | Required |
| rating | `POST /ratings` | Required |
| rating | `GET /ratings/:cakeId`, `GET /ratings/:cakeId/average` | Public |
| notification | `GET /notifications/:orderId` | Required |
| gateway | `POST /auth/login` (or OTP endpoints, if that's what's live) | — |

All of the above are reached through the gateway at `/api/...` (e.g. `/api/cakes`), except auth, which is at `/auth/...`.

## Things I simplified on purpose

Worth being upfront about these instead of hoping nobody asks:

- Ratings don't check whether you actually bought the cake — anyone logged in can rate anything
- All four services' data lives in one MongoDB instance. Still logically separate databases, just sharing one server instead of four for simplicity
- Notifications go through Mailpit, not a real email provider — swapping in real SMTP later is a config change, not a rewrite
- Login checks that you know a valid OTP for that email, not a real password/account system

## Known gotchas

- **Kubernetes MongoDB has no PersistentVolumeClaim.** Every fresh `kubectl apply` after deleting the namespace means an empty database — you'll need to reseed. See `k8s/README.md` for the seed command.
- **Don't run Compose and Kubernetes at the same time.** They're two entirely separate stacks with separate databases; mixing them up is the single most common source of "why isn't this working" while testing.

## Repo layout

```
catalog-service/       Cake catalog API — CRUD for cakes, public reads, admin-only writes
order-service/         Basket + order API — adds items, handles checkout, publishes order.completed
rating-service/        Ratings API — submit ratings, read per-cake averages
notification-service/  Consumes order.completed from RabbitMQ, sends confirmation via Mailpit
gateway/                Single entry point — routing, auth/JWT, RBAC
client/                 Frontend — HTML/CSS/JS served by nginx
docker/                 Docker Compose setup — see docker/README.md
k8s/                    Kubernetes manifests — see k8s/README.md
```