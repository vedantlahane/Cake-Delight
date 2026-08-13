# Running Cake Delight on Kubernetes

These manifests run the whole system as real pods — closer to how it'd actually be deployed somewhere, instead of just Docker Compose on your laptop. Tested with minikube on Windows and Ubuntu.

**If you're also running the Docker Compose version on this same machine, stop it first** (`docker compose down`, from the `docker/` folder). Running both stacks at once means two separate MongoDBs, two separate gateways on different ports, and it's very easy to seed one and look at the other — which is exactly what happened last time.

## What you need

- minikube installed and working
- `kubectl` installed and pointed at your minikube cluster
- Docker installed — Docker Desktop on Windows/Mac, or Docker Engine on Linux (minikube uses whichever one you have to build images)

**Linux only:** if you installed Docker Engine directly, your user needs to be in the `docker` group, or every `docker` command needs `sudo`, which then breaks the `minikube docker-env` step below since its environment variables don't survive `sudo`. Fix it once:
```bash
sudo usermod -aG docker $USER
newgrp docker
```
Log out and back in if `newgrp docker` alone doesn't seem to take.

Start minikube if it's not already running:
```bash
minikube start --driver=docker
```
The `docker` driver reuses your existing Docker install instead of spinning up a separate VM layer — same command on Windows, Mac, and Ubuntu.

## Important: images need to be built inside minikube

This is the thing that trips everyone up the first time. minikube runs its own Docker daemon, separate from the one you'd normally use. Build with a regular `docker build` and minikube can't see it — it'll try to pull from Docker Hub and fail with `ImagePullBackOff`.

Point your terminal at minikube's Docker environment before building:

**Windows (PowerShell):**
```powershell
minikube docker-env | Invoke-Expression
```

**Ubuntu / Mac (bash or zsh):**
```bash
eval $(minikube docker-env)
```

Redo this in every new terminal session — it only affects the terminal you ran it in. Then build all the images:
```bash
docker build -t catalog-service:latest ./catalog-service
docker build -t order-service:latest ./order-service
docker build -t rating-service:latest ./rating-service
docker build -t notification-service:latest ./notification-service
docker build -t gateway:latest ./gateway
docker build -t client:latest ./client
```
Run these from the project root (the folder containing all the service folders).

**Sanity check on Ubuntu after `eval $(minikube docker-env)`:** run `docker ps`. If you see minikube's own internals (`kube-apiserver`, `etcd`, etc.) instead of your usual containers, it worked. If you see your regular containers, the environment variables didn't take — try a fresh terminal.

## Deploying

```bash
kubectl apply -f k8s/
```
Or one file at a time, in order — MongoDB and RabbitMQ should be up before anything that depends on them:
```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-mongodb.yaml
kubectl apply -f k8s/02-rabbitmq.yaml
kubectl apply -f k8s/03-mailpit.yaml
kubectl apply -f k8s/04-catalog-service.yaml
kubectl apply -f k8s/05-order-service.yaml
kubectl apply -f k8s/06-rating-service.yaml
kubectl apply -f k8s/07-notification-service.yaml
kubectl apply -f k8s/08-gateway.yaml
kubectl apply -f k8s/09-client.yaml
```
Wait a minute after applying — MongoDB and RabbitMQ take a bit to actually be ready.

## Checking that it worked

```bash
kubectl get pods -n cake-delight
```
Every pod should show `Running`, all containers `READY` (`1/1`). If something's `CrashLoopBackOff` or `Pending`:
```bash
kubectl logs deploy/<service-name> -n cake-delight
kubectl describe pod <pod-name> -n cake-delight
```
(`describe` needs the real pod name, not the deployment — `kubectl get pods -n cake-delight` to grab it.)

```bash
kubectl get svc -n cake-delight
```
`client` and `gateway` are `NodePort` — reachable from outside the cluster. Everything else is `ClusterIP` — only reachable inside the cluster, on purpose.

## Accessing things

**Frontend:**
```bash
minikube service client -n cake-delight
```
Handles tunneling and opens your browser. On a headless Ubuntu box it'll just print the URL instead of opening anything — copy that into a browser on your host.

**Gateway** (needed if the frontend has a hardcoded gateway URL that doesn't match the NodePort):
```bash
kubectl port-forward svc/gateway 8080:8080 -n cake-delight
```

**RabbitMQ dashboard:**
```bash
kubectl port-forward svc/rabbitmq 15672:15672 -n cake-delight
```
Then http://localhost:15672 (guest/guest).

**Mailpit:**
```bash
kubectl port-forward svc/mailpit 8025:8025 -n cake-delight
```
Then http://localhost:8025.

## Seeding the catalog

Target the Deployment, not a specific pod — the pod name has a random suffix that changes every time it restarts, and there are 2 replicas anyway, so grabbing one specific pod name is more fragile than it needs to be:
```bash
kubectl exec -it deploy/catalog-service -n cake-delight -- node src/seed.js
```

**Important — this data does not survive a redeploy.** The `mongodb` Deployment in these manifests has no `PersistentVolumeClaim`, so its data lives inside the pod's own filesystem. Every time you `kubectl delete namespace cake-delight` and `kubectl apply -f k8s/` again, you get a genuinely empty database — you'll need to run this seed command again after every fresh deploy. That's fine for a demo as long as you remember to do it; if you want data to actually persist across redeploys, you'd need to add a PVC to the mongodb manifest and mount it at `/data/db`.

## Updating code

`kubectl apply -f k8s/` only reacts to actual text changes in the YAML. Same tag (`:latest`) means `apply` reports `unchanged` even after you've rebuilt the image, and your old pods keep running. Force it:
```bash
kubectl rollout restart deployment/catalog-service -n cake-delight
kubectl rollout status deployment/catalog-service -n cake-delight
```

## Cleaning up

```bash
kubectl delete namespace cake-delight
minikube stop
```