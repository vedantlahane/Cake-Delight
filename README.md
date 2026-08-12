# Cake Delight — Cloud-Native Microservices Architecture

Welcome to **Cake Delight**, a robust cloud-native application built using a microservices architecture. This project serves as a comprehensive Capstone Project, demonstrating core engineering principles including service independence, loose coupling, event-driven communication, containerization, and Kubernetes orchestration.

## Project Overview

Cake Delight allows customers to:
1. **Browse** a catalog of artisanal cakes (with filtering).
2. **Authenticate** securely using a simulated OTP-based login.
3. **Manage Basket** by adding, updating, and removing cakes.
4. **Checkout** to finalize orders.
5. **Receive Notifications** asynchronously when orders are successfully placed.
6. **Rate & Review** purchased cakes, updating global average scores.

## Architecture

The solution uses an API Gateway as the single entry point. Each microservice independently manages its own capability and data store.

- **Frontend Client (`client`)**: A modern, responsive single-page web app (HTML/CSS/JS) styled with glassmorphism and modern UI paradigms.
- **API Gateway (`gateway`)**: Routes traffic to respective services, handles simulated OTP authentication, and verifies JWT tokens.
- **Catalog Service (`catalog-service`)**: Manages cake inventory and provides querying/filtering APIs. 
- **Order Service (`order-service`)**: Manages shopping baskets, processes checkouts, and persists order histories.
- **Rating Service (`rating-service`)**: Handles user ratings and calculates real-time average scores for cakes.
- **Notification Service (`notification-service`)**: An asynchronous consumer that listens for `order.completed` events and processes order confirmation notifications.
- **MongoDB**: Primary persistent data store (each service has its own logical database/collection).
- **RabbitMQ**: Message broker enabling event-driven asynchronous communication between Order and Notification services.

## Getting Started

You can run Cake Delight either through Docker Compose (recommended for simple local testing) or deploy it to a Kubernetes cluster.

### Option 1: Docker Compose (Local Testing)

1. Ensure Docker Desktop or Docker Engine is running.
2. Navigate to the `docker/` directory:
   ```bash
   cd docker
   ```
3. Build and spin up the entire cluster:
   ```bash
   docker-compose up --build -d
   ```
4. Access the applications:
   - **Web UI**: [http://localhost](http://localhost)
   - **API Gateway**: [http://localhost:8080](http://localhost:8080)
   - **RabbitMQ Dashboard**: [http://localhost:15672](http://localhost:15672) (guest / guest)

5. *Optional*: Seed the database with sample cakes (if empty):
   ```bash
   docker exec -it cakedelight-catalog node src/seed.js
   ```

### Option 2: Kubernetes Deployment

1. Ensure you have a running Kubernetes cluster (e.g., `minikube start`) and `kubectl` configured.
2. From the project root, apply the manifests located in the `k8s/` directory:
   ```bash
   kubectl apply -f k8s/
   ```
3. Check deployment status:
   ```bash
   kubectl get pods -n cake-delight
   ```
4. Expose the services (if using Minikube):
   ```bash
   minikube service client -n cake-delight
   ```
   *(Alternatively, access the Client via NodePort 30000 and Gateway via NodePort 30080 on your cluster IP).*

---

## Simulating Authentication (OTP Flow)

To log in without requiring external SMS/Email APIs:
1. Type a username (e.g., `alice`) into the **User ID** field and click **Send OTP**.
2. A simulated SMS notification containing a 6-digit OTP will appear near the login bar.
3. Enter the 6-digit OTP into the input field and click **Login**.
4. You will be authenticated with a JWT token stored securely in your browser's local storage.

## End-to-End Demo Flow

1. **Browse & Filter**: View the catalog on the main page. Test the search and price filter options.
2. **Login**: Use the OTP simulation flow described above to log in.
3. **Add to Basket**: Add your favorite cakes to the shopping basket. Modify quantities or remove items.
4. **Checkout**: Click "Proceed to Checkout". The Order Service will create the order, empty your basket, and publish an event to RabbitMQ.
5. **View Notifications**: Check the "Order Notifications" sidebar. The Notification Service will have asynchronously consumed the event and generated an order confirmation.
6. **Rate the Cake**: Click the **Rate** button on a purchased cake, assign 1-5 stars, and leave a review. Watch the catalog's average rating update dynamically!

---

## Built With
- **Node.js & Express.js** (Microservices API)
- **Vanilla JS & CSS** (Frontend)
- **MongoDB & Mongoose** (Database)
- **RabbitMQ & amqplib** (Event Messaging)
- **Docker & Docker Compose** (Containerization)
- **Kubernetes** (Orchestration)
