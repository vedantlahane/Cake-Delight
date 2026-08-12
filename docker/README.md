# Docker Execution Instructions — Cake Delight

This directory contains the Docker Compose configuration to spin up the entire **Cake Delight** microservices application stack locally.

## Prerequisites
- Docker Engine 29+
- Docker Compose v5+

## Services Included
- **MongoDB**: Centralized persistence (`27017`)
- **RabbitMQ**: Event Broker (`5672`, Management UI at `15672`)
- **Catalog Microservice**: Product catalog & filtering (`3000`)
- **Order Microservice**: Basket & order management (`3001`)
- **Rating Microservice**: Cake ratings & review scores (`3002`)
- **Notification Microservice**: Async order confirmation consumer (`3003`)
- **API Gateway**: Central ingress & JWT Auth routing (`8080`)
- **Client Frontend**: Nginx static web app UI (`80`)

## Running the Application

### 1. Build and Start All Containers
```bash
docker compose up --build -d
```

### 2. Verify Running Containers
```bash
docker-compose ps
```

### 3. Access Application UIs
- **Web App UI**: [http://localhost](http://localhost)
- **API Gateway**: [http://localhost:8080](http://localhost:8080)
- **RabbitMQ Management Dashboard**: [http://localhost:15672](http://localhost:15672) (User: `guest`, Pass: `guest`)

### 4. Seed Initial Catalog Data (Optional)
```bash
docker exec -it cakedelight-catalog node src/seed.js
```

### 5. Stop Containers
```bash
docker-compose down
```
