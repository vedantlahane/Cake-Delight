# Running Cake Delight with Docker Compose

This spins up the whole system — all five services, MongoDB, RabbitMQ, Mailpit, and the frontend — with one command. It's the fastest way to see everything working without touching Kubernetes at all.

**If you're also running the Kubernetes version on this same machine, stop it first** (`kubectl delete namespace cake-delight`, or at least `minikube stop`). Running both stacks at once means two separate MongoDBs, two separate gateways, and whichever port/container you think you're testing against might not be the one you're actually looking at in the browser. This bit me once already — not worth repeating.

## What you need

- Docker Desktop (Windows/Mac) or Docker Engine + the Compose plugin (Ubuntu). Whatever you'd get installing Docker today is fine — no special minimum version needed.

**Ubuntu specific:** if `docker compose` (no hyphen) says command not found, you likely have the older standalone `docker-compose` instead of the plugin — install it with `sudo apt install docker-compose-plugin`, or just use hyphenated `docker-compose` commands throughout instead. Also, if you didn't add your user to the `docker` group, every command below needs `sudo` in front of it.

## What you're running

Everything runs in named containers on a shared Docker network called `cakedelight-net`, so services find each other by name.

| Service | Port(s) | What it's for |
|---|---|---|
| MongoDB | 27017 | Shared database instance — each service uses a different database inside it |
| RabbitMQ | 5672 (broker), 15672 (management UI) | Carries the `order.completed` event between order-service and notification-service |
| Mailpit | 1025 (SMTP), 8025 (web UI) | Catches confirmation "emails" so you can see them without a real email account |
| catalog-service | 3000 | Cake catalog API |
| order-service | 3001 | Basket + orders API |
| rating-service | 3002 | Ratings API |
| notification-service | 3003 | Listens for `order.completed`, triggers email via Mailpit |
| gateway | 8080 | Single entry point — routes and auth for everything above |
| client | 80 | The frontend, served by nginx |

Healthchecks and `depends_on` conditions are set up so Compose waits for MongoDB and RabbitMQ to actually be healthy before starting the services that need them.

## Starting it up

From the `docker/` folder:
```bash
docker compose up --build -d
```
`--build` forces rebuilding from your local code — include this every time you've changed something, or you can end up running a stale image and wondering why nothing changed. `-d` runs it in the background.

Check everything actually started:
```bash
docker compose ps
```
Every service should say `running` (or `healthy`). If anything says `restarting` or `exited`, check its logs before doing anything else:
```bash
docker compose logs -f <service-name>
```

## Seeding the catalog

The database starts empty — nothing loads automatically. Run the seed script once, inside the running **catalog container** (this is a `docker exec`, not `kubectl` — that mistake is what broke this earlier):
```bash
docker exec -it cakedelight-catalog node src/seed.js
```
If that container name doesn't exist on your machine, list what's actually running and use the real name:
```bash
docker ps -a | grep cakedelight
```

After seeding, refresh the catalog page and you'll see the cakes.

## URLs

- **Web app**: http://localhost
- **API gateway** (direct): http://localhost:8080
- **RabbitMQ dashboard**: http://localhost:15672 — guest / guest. Watch the `order.completed` message appear here during checkout.
- **Mailpit**: http://localhost:8025 — check here after checkout to see the order confirmation land.

## Logging in

Go to http://localhost/auth.html or click Sign In.

**Quick Demo Login** is the fastest way — Admin and Customer buttons that handle the whole OTP flow for you automatically.

Manual flow: type `customer@cakedelight.com` (or `admin@cakedelight.com`), click Send OTP, type the 6-digit code shown on screen (it's shown directly since no real email is sent in this demo), then Sign In.

## Stopping it

```bash
docker compose down
```
Your MongoDB data survives this — it's kept in a named volume. To wipe everything and start completely fresh:
```bash
docker compose down -v
```
You'll need to reseed the catalog after this.

## If something's not working

**Service crashed on startup** — usually a timing issue even with healthchecks, most often something trying to connect to Mongo a moment too early. Restart the one that failed once Mongo's confirmed up:
```bash
docker compose restart catalog-service
```

**Code changes not showing up** — you almost certainly ran `up -d` without `--build`:
```bash
docker compose build client
docker compose up -d client
```

**Port already in use** — something else on your machine already has port 80 or 8080.
- **Windows:** `netstat -ano | findstr :80`
- **Ubuntu:** `sudo lsof -i :80` (install with `sudo apt install lsof` if missing), or `sudo ss -tulpn | grep :80`

On Ubuntu, port 80 is often already claimed by Apache or nginx installed as a system service — check with `sudo systemctl status apache2` / `sudo systemctl status nginx` and stop whichever's running (`sudo systemctl stop nginx`) if you don't need it, or just remap the `client` port in `docker-compose.yml` to something like `"8000:80"`.

**RabbitMQ not getting events** — if a checkout doesn't produce a Mailpit email, check http://localhost:15672 to see if `order.completed` is stuck in the queue with no consumer. If notification-service isn't listed as a consumer, check its logs for a connection error.

**Nothing looks right and you're not sure why** — check you don't also have the Kubernetes stack running (see the note at the very top). `docker ps` should only show the `cakedelight-*` named containers, nothing prefixed `k8s_`.