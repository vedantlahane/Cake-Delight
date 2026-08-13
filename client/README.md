# Client Frontend

This is the frontend for **Cake Delight**. Built with plain HTML5, CSS3, and modern vanilla JavaScript (ES6+) — without external frameworks like React or Vue — ensuring lightweight, fast rendering and low complexity.

It is served via Nginx inside a Docker or Kubernetes container and communicates with backend microservices via the API Gateway.

---

## 📄 Pages Overview

### `index.html` — Cake Catalog
The main customer landing page:
- Displays available cakes from `catalog-service` with images, prices, and average ratings from `rating-service`.
- Features real-time search by cake name, category filter, and price range filter.
- Logged-in customers can add cakes to their shopping basket or submit ratings/reviews.
- Unauthenticated visitors can browse products.

### `basket.html` — Shopping Basket
Manages customer cart items:
- Lists selected cakes, unit prices, and quantity controls (`+` / `-`).
- Calculates order totals dynamically.
- Features a **Secure Checkout** button that places the order via `order-service` and clears the cart.

### `auth.html` — Authentication & OTP Flow
Handles user login and role assignment:
- Requests one-time passwords (OTP) sent to user email.
- Includes a **Quick Demo Login** section with single-click Admin and Customer login presets.

### `admin.html` — Admin Dashboard
Admin control panel restricted to accounts with `admin` role:
- **Overview**: High-level platform statistics and system metrics.
- **Orders**: View all submitted customer orders and order status.
- **Catalog Management**: Full CRUD operations (Add, Edit, Delete cakes in `catalog-service`).
- **Ratings**: Moderate and review all customer ratings.
- **Notifications**: Inspect sent notification history.

---

## 🔐 Authentication & Security

- **JWT Tokens**: Upon successful OTP login, the API Gateway returns a JWT token.
- **Local Storage**: Credentials are cached in `localStorage` under `cd_token`, `cd_userId`, and `cd_role`.
- **Authorization Headers**: Protected requests attach the JWT as `Authorization: Bearer <token>`.
- **Role Enforcement**:
  - Gateway responds with `401 Unauthorized` for missing/invalid tokens.
  - Gateway responds with `403 Forbidden` for non-admin attempts on restricted endpoints.
  - Frontend dynamically toggles UI controls (e.g., Admin Dashboard link, Shopping Basket, Notification Bell) based on session role.

---

## 🔔 Notification Bell

For logged-in customers, a notification bell icon appears in the top navigation bar:
- Badge counter displays unread order notifications.
- Dropdown menu lists recent order confirmations.
- Notifications are created asynchronously when `order-service` emits checkout events over RabbitMQ, which are processed by `notification-service`.

---

## 📁 File Structure

```
client/
├── index.html      # Main product catalog & filter page
├── basket.html     # Shopping basket & checkout page
├── auth.html       # Login page & OTP authentication flow
├── admin.html      # Admin dashboard & catalog management
├── app.js          # Customer-facing app logic (catalog, cart, ratings, auth)
├── admin.js        # Admin dashboard logic (stats, CRUD, tables)
├── style.css       # Global design system & component styles
├── Dockerfile      # Nginx container deployment setup
└── README.md       # Client documentation
```

---

## 🌐 API Gateway Integration

All frontend API calls are routed through the API Gateway:

| Route Endpoint | Target Microservice | Description |
|---|---|---|
| `/api/cakes` | `catalog-service` | Catalog browsing, cake details, CRUD operations |
| `/api/basket` | `order-service` | Shopping cart management |
| `/api/orders` | `order-service` | Order placement & checkout processing |
| `/api/ratings` | `rating-service` | Cake rating submissions & average score calculations |
| `/api/notifications` | `notification-service` | Customer order notification retrieval |
| `/api/auth/...` | `gateway` | Login request, OTP verification, and JWT issuance |

### Gateway Port Configuration
- **Kubernetes Environment**: Gateway is available on NodePort `30080` (configured in `app.js` and `admin.js` as `http://${window.location.hostname}:30080`).
- **Docker / Local Development**: Gateway runs on port `8080` (`http://localhost:8080`). Update `GATEWAY_BASE` in `app.js` and `admin.js` if running in standard Docker mode.

---

## 🚀 Running the Client

### Via Docker
```bash
docker build -t cakedelight-client .
docker run -d -p 80:80 cakedelight-client
```

### Locally (Static Web Server)

# Using Node npx serve
npx serve .
```
Access the application at `http://localhost:8000` (or `http://localhost:80` for Docker).
