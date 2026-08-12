# Kubernetes Deployment Guide — Cake Delight

This directory contains the Kubernetes manifests for orchestrating the **Cake Delight** Cloud-Native Microservices application on Kubernetes (Minikube, MicroK8s, k3s, EKS, GKE, or AKS).

## Prerequisites
- A running Kubernetes Cluster (e.g., `minikube start --driver=docker`)
- `kubectl` CLI installed and configured

---

## Deployment Steps

### 1. Apply All Manifests in Sequence
Run the following command to deploy all resources in the `cake-delight` namespace:

From Root Folder
```bash
kubectl apply -f k8s/
```


Alternatively, apply sequentially:
```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-mongodb.yaml
kubectl apply -f k8s/02-rabbitmq.yaml
kubectl apply -f k8s/03-catalog-service.yaml
kubectl apply -f k8s/04-order-service.yaml
kubectl apply -f k8s/05-rating-service.yaml
kubectl apply -f k8s/06-notification-service.yaml
kubectl apply -f k8s/07-gateway-service.yaml
kubectl apply -f k8s/08-client-service.yaml
```

---

## Verification & Status Check

### Check Pods & Services Status
```bash
kubectl get pods -n cake-delight
kubectl get svc -n cake-delight
```

### Accessing the Web Application & Gateway
- **Client Frontend NodePort**: NodePort `30000` (e.g. `http://<node-ip>:30000` or `minikube service client -n cake-delight`)
- **API Gateway NodePort**: NodePort `30080` (e.g. `http://<node-ip>:30080` or `minikube service gateway -n cake-delight`)

---

## Cleanup
To remove all deployed workloads:
```bash
kubectl delete namespace cake-delight
```
