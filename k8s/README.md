# Running Cake Delight on Kubernetes

These manifests run the whole system as real pods — closer to how it'd actually be deployed somewhere, instead of just Docker Compose on your laptop. I tested this locally with minikube.

## What you need

- minikube installed and working
- `kubectl` installed and pointed at your minikube cluster
- Docker Desktop (minikube uses its Docker environment to build images)

Start minikube if it's not already running:
```bash
minikube start --driver=docker
```
The `docker` driver reuses your existing Docker Desktop install instead of spinning up a separate VM layer, which is why it's the easiest option.

## Important: images need to be built inside minikube

This is the thing that trips everyone up the first time. minikube runs its own Docker daemon, separate from the Docker Desktop one you'd normally use. If you build an image with `docker build` in a regular terminal, minikube can't see it — it'll try to pull it from Docker Hub and fail with `ImagePullBackOff`.

You have to point your terminal at minikube's Docker environment before building:

**PowerShell:**
```powershell
minikube docker-env | Invoke-Expression
```

**Bash/Mac/Linux:**
```bash
eval $(minikube docker-env)
```

You need to do this in every new terminal session. Then build all the images:
```bash
docker build -t catalog-service:latest ./catalog-service
docker build -t order-service:latest ./order-service
docker build -t rating-service:latest ./rating-service
docker build -t notification-service:latest ./notification-service
docker build -t gateway:latest ./gateway
docker build -t client:latest ./client
```
Run all of these from the project root folder (the one that contains all the service folders).

## Deploying

Apply everything at once from the project root:
```bash
kubectl apply -f k8s/
```

Or apply them one file at a time in order — MongoDB and RabbitMQ should be running before the services that depend on them:
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

Wait a minute after applying — especially MongoDB and RabbitMQ take a bit to actually be ready.

## Checking that it worked

```bash
kubectl get pods -n cake-delight
```
Every pod should show `Running` with all containers `READY` (shown as `1/1`). If something's stuck in `CrashLoopBackOff` or `Pending`, don't guess at what's wrong — look at the logs:
```bash
kubectl logs <pod-name> -n cake-delight
kubectl describe pod <pod-name> -n cake-delight
```
`describe` is especially useful for `Pending` pods — it'll tell you if it's an image pull issue or a scheduling issue.

Check services too:
```bash
kubectl get svc -n cake-delight
```
The frontend (`client`) and gateway are `NodePort` services — they're reachable from outside the cluster. MongoDB, RabbitMQ, the internal microservices are `ClusterIP` — only reachable from inside the cluster, which is the point. Nothing outside should be hitting MongoDB directly.

## Accessing things

**Frontend** — open it in your browser:
```bash
minikube service client -n cake-delight
```
This handles the tunneling minikube needs and opens the URL automatically. The port will be some random high port number, not 80 — that's normal for minikube NodePort.

**Gateway** — if the frontend has `localhost:8080` hardcoded as the API base, you need to forward the gateway port while you're testing:
```bash
kubectl port-forward svc/gateway 8080:8080 -n cake-delight
```
Keep that terminal open. Closing it stops the forwarding.

**RabbitMQ dashboard** — useful during a demo to watch the `order.completed` message flow:
```bash
kubectl port-forward svc/rabbitmq 15672:15672 -n cake-delight
```
Then open http://localhost:15672 (username `guest`, password `guest`).

**Mailpit** — see confirmation emails after a checkout:
```bash
kubectl port-forward svc/mailpit 8025:8025 -n cake-delight
```
Then open http://localhost:8025.

## Seeding the catalog

The database starts empty. Once the catalog-service pod is running, exec into it and run the seed script:
```bash
kubectl exec -it <catalog-pod-name> -n cake-delight -- node src/seed.js
```
Get the actual pod name from `kubectl get pods -n cake-delight` first.

## Updating code

This one's a bit annoying. `kubectl apply -f k8s/` only does something when the YAML text actually changed. If your Deployment still says `image: catalog-service:latest` and you just rebuilt that image with new code, the YAML text is identical so `apply` says `unchanged` and leaves your old pods running.

After rebuilding an image, force Kubernetes to pick up the new one:
```bash
kubectl rollout restart deployment/catalog-service -n cake-delight
```
Swap in whichever service name you rebuilt. You can watch it roll over with:
```bash
kubectl rollout status deployment/catalog-service -n cake-delight
```

## Cleaning up

Delete everything in one go:
```bash
kubectl delete namespace cake-delight
```
This removes all the pods, services, deployments, and config maps inside the namespace. If you want to start fresh, just apply everything again after this.

To also stop minikube when you're done:
```bash
minikube stop
```