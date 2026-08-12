# Cake Delight

This is my capstone project — a cloud-native microservices app for a made-up cake shop called Cake Delight. You can browse cakes, add them to a basket, check out, get notified by email, and rate what you bought. It's built as five separate Node.js services sitting behind an API gateway, backed by MongoDB and RabbitMQ, and it can run either in Docker or on Kubernetes.

The point of building it this way wasn't to make a cake shop — it's to actually practice the stuff that's hard to get right just from reading about it: splitting a system into services that own their own data, keeping them loosely coupled, using events instead of direct calls where it matters, and deploying the whole thing instead of just running `npm start` forever on my laptop.

## What it does

- Browse the cake catalog, search by name, filter by category and price range
- Log in using an OTP (one-time password) flow — enter your email, get a code, type it in
- Add cakes to a basket, change quantities using the +/− buttons, remove items
- Checkout — creates a real order, empties the basket, and fires off a notification in the background
- See your order confirmation in the bell icon in the top navbar without refreshing
- Rate a cake you liked and see the average score update

There are two login roles: **Admin** and **Customer**. They don't see each other's stuff. Admins can see all orders and all notifications, manage the cake catalog, and view all ratings. Customers only see their own basket, their own orders, and their own notifications.

## How it's put together

There's one API gateway in front of everything, and it's the only thing the frontend ever talks to directly. Behind it are four services, each owning its own slice of the data:

- **catalog-service** — owns the cake data. Customers can browse it freely. Only admins can add, edit, or delete cakes.
- **order-service** — owns baskets and orders. This is the one service that calls another service directly: when you add a cake to your basket, it asks catalog-service for the real price instead of trusting whatever the browser sends. That's on purpose — otherwise someone could just edit the request and buy a cake for a penny.
- **rating-service** — owns ratings, and calculates the average score using a MongoDB aggregation pipeline instead of pulling every rating into JavaScript and averaging it there.
- **notification-service** — doesn't get called directly by anything. It just sits and listens on RabbitMQ for an `order.completed` event, and sends a confirmation email whenever one shows up.

Order and Notification talk through RabbitMQ instead of Order calling Notification's API directly. That's the deliberately async part — checkout shouldn't have to wait for an email to send before it tells you your order went through.

## Tech stack

- Node.js + Express for all five services (4 microservices + 1 gateway)
- MongoDB with Mongoose — one MongoDB instance, but each service uses its own database inside it, so they're still logically separate
- RabbitMQ for the `order.completed` event between order-service and notification-service
- JWT tokens for authentication — the gateway validates them before letting requests through to protected routes
- Plain HTML/CSS/JS for the frontend, no framework — kept it simple on purpose so I could spend more time on the backend and infrastructure side
- Nginx serves the frontend as a static site inside a container
- Docker for containers, Docker Compose for running locally, Kubernetes for running it like it'd actually be deployed
- Mailpit standing in for a real email provider — notifications actually land somewhere you can look at them without needing real SMTP credentials

## Running it

There are two ways to run this. Pick one.

**Docker Compose** — easiest, good for local testing. Full steps are in [`docker/README.md`](docker/README.md), short version:
```bash
cd docker
docker compose up --build -d
```
Then open http://localhost.

**Kubernetes** — closer to how this would actually run in production. Tested locally with minikube. Full steps are in [`k8s/README.md`](k8s/README.md), short version:
```bash
minikube start --driver=docker
# build images inside minikube's Docker environment first — see k8s/README.md
kubectl apply -f k8s/
minikube service client -n cake-delight
```

## Logging in

Go to http://localhost/auth.html (or click Sign In from the catalog page).

**Quick Demo Login** is the easiest way — there are two buttons right on the login page:
- **Admin Demo Login** — logs in as `admin@cakedelight.com`
- **Customer Demo Login** — logs in as `customer@cakedelight.com`

These automatically request an OTP, fetch it from the gateway's demo endpoint, and log you in without you having to type anything.

If you want to use the full OTP flow manually:
1. Type an email address (e.g. `customer@cakedelight.com`) and click **Send OTP**
2. The gateway generates a code — you'll see it appear in the login UI as a hint (since this is a demo, it shows the code instead of sending it somewhere you can't see)
3. Type the 6-digit code and click **Sign In**

After logging in you'll be redirected to the catalog. Admins go straight to the admin dashboard.

## Trying the whole flow

1. Log in as Customer using the Quick Demo Login button
2. Browse the catalog, try the search bar and price filters
3. Add a couple of cakes to the basket, use the +/− buttons to change quantities, remove one
4. Click **Secure Checkout**
5. Click the bell icon in the top navbar — your order confirmation should be there. It arrived via RabbitMQ in the background while the checkout was processing, not because the frontend went looking for it.
6. Go back to the catalog, rate a cake, and see the star rating update

To see the admin view: sign out, then log in as Admin. You'll get to see all orders across all customers, all notifications, and the full catalog management panel.

## Things I simplified on purpose

Worth being upfront about rather than hoping nobody asks:

- Ratings don't check whether you actually bought the cake — anyone who's logged in can rate anything
- All four services' data lives in one MongoDB instance. They still use separate databases inside it, so the data is logically separated, but in a real deployment each service would have its own database server
- Notifications go through Mailpit, not a real email provider. If you open http://localhost:8025 after a checkout you'll see the confirmation land there. Swapping in real SMTP later would be a one-env-variable change, not a code rewrite.
- Login doesn't check a real password — it just checks that you know the OTP that was generated for that userId

## Repo layout

```
catalog-service/      Cake catalog API — CRUD for cakes, public reads, admin-only writes
order-service/        Basket + order API — adds items, handles checkout, publishes order.completed
rating-service/       Ratings API — submit ratings, read per-cake averages
notification-service/ Consumes order.completed from RabbitMQ, sends confirmation via Mailpit
gateway/              Single entry point — routes requests, handles auth/JWT, enforces RBAC
client/               Frontend — HTML/CSS/JS served by nginx
docker/               Docker Compose setup, see docker/README.md
k8s/                  Kubernetes manifests, see k8s/README.md
```