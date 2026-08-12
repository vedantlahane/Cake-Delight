# Running Cake Delight with Docker Compose

This spins up the whole system — all five services, MongoDB, RabbitMQ, Mailpit, and the frontend — with one command. It's the fastest way to see everything working without having to touch Kubernetes at all.

## What you need

- Docker Desktop (or Docker Engine + Compose plugin on Linux). Whatever you'd get from the official Docker website today is fine. No special minimum version needed.

## What you're running

Everything runs in named containers on a shared Docker network called `cakedelight-net`, so the services can find each other by name. Here's what gets started:

| Service | Port(s) | What it's for |
|---|---|---|
| MongoDB | 27017 | Shared database instance — each service uses a different database inside it |
| RabbitMQ | 5672 (broker), 15672 (management UI) | Carries the `order.completed` event between order-service and notification-service |
| Mailpit | 1025 (SMTP), 8025 (web UI) | Catches confirmation "emails" so you can actually see them land without a real email account |
| catalog-service | 3000 | Cake catalog API |
| order-service | 3001 | Basket + orders API |
| rating-service | 3002 | Ratings API |
| notification-service | 3003 | Listens for `order.completed`, triggers email via Mailpit |
| gateway | 8080 | Single entry point — routes and auth for everything above |
| client | 80 | The frontend, served by nginx |

The services have healthchecks and `depends_on` conditions set up, so Docker Compose waits for MongoDB and RabbitMQ to actually be healthy before starting the services that need them. You shouldn't see the old "service started before database was ready" crash on a fresh start.

## Starting it up

Run this from the `docker/` folder:
```bash
docker compose up --build -d
```

`--build` forces it to rebuild images from your local code. Include this basically every time you've changed something — without it you can end up running a stale image and wondering why your code changes aren't showing up. `-d` sends it to the background so you get your terminal back.

Check everything actually started:
```bash
docker compose ps
```
Every service should say `running` (or `healthy` if it has a healthcheck). If anything says `restarting` or `exited`, look at its logs before trying anything else:
```bash
docker compose logs -f <service-name>
```

## Seeding the catalog

The database starts empty — nothing gets loaded automatically. You need to run the seed script once to get some cakes in:
```bash
docker exec -it cakedelight-catalog node src/seed.js
```
If that container name doesn't work, check the real name with `docker compose ps` first and use whatever shows up there.

After seeding, refresh the catalog page and you'll see the cakes.

## URLs

Once everything's running:

- **Web app**: http://localhost
- **API gateway** (direct): http://localhost:8080
- **RabbitMQ dashboard**: http://localhost:15672 — username `guest`, password `guest`. Go here if you want to watch the `order.completed` message appear in the queue when you do a checkout.
- **Mailpit**: http://localhost:8025 — check here after a checkout to see the order confirmation email land. No account needed, it catches everything.

## Logging in

Go to http://localhost/auth.html or click Sign In.

The fastest way is the **Quick Demo Login** buttons — there's one for Admin and one for Customer. These handle the whole OTP process automatically, so you don't have to copy-paste a code.

If you want to test the manual flow: type `customer@cakedelight.com` (or `admin@cakedelight.com`), click Send OTP, then type the code that appears on screen (the UI shows it as a hint since there's no real email being sent here), then click Sign In.

## Stopping it

```bash
docker compose down
```
This stops and removes the containers. Your MongoDB data is kept in a named volume, so your seeded cakes survive a `down` + `up` cycle.

If you want to completely wipe the data and start fresh:
```bash
docker compose down -v
```
Then you'll need to reseed the catalog again after the next `up`.

## If something's not working

**Service crashed on startup** — usually a timing issue, even with healthchecks. The most common one is a service that tried to connect to Mongo right as it was still coming up. Restarting the one service that failed usually fixes it once Mongo's running fine:
```bash
docker compose restart catalog-service
```

**Code changes not showing up** — almost always because you ran `docker compose up -d` without `--build`. Rebuild the specific service and restart:
```bash
docker compose build client
docker compose up -d client
```

**Port already in use** — something on your machine is already using port 80 or 8080. Check with `netstat -ano | findstr :80` on Windows. IIS, other Docker containers, or dev servers are the usual culprits.

**RabbitMQ not getting events** — if you checkout and the notification never arrives in Mailpit, check the RabbitMQ dashboard at http://localhost:15672 to see if the `order.completed` message is stuck in the queue without a consumer. If notification-service isn't listed as a consumer, its logs will tell you why it failed to connect.