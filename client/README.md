# Client Frontend

This is the frontend for Cake Delight. It's plain HTML, CSS, and vanilla JavaScript — no React, no Vue, nothing like that. I kept it simple so I could focus on the backend and infrastructure parts of the project rather than fighting a frontend framework.

It gets served by nginx inside a Docker/Kubernetes container and talks to the backend entirely through the API gateway at `http://localhost:8080`.

## Pages

**`index.html` — Cake Catalog**
The main landing page. Loads all available cakes from the catalog service, shows their images, prices, and average ratings. You can search by name, filter by category, and filter by price range. Logged-in customers can add cakes to their basket or leave a rating. Logged-out visitors can browse but not do much else.

**`basket.html` — Shopping Basket**
Shows the items in your basket. Each item shows the cake image, name, price per unit, and a +/− toggle for adjusting the quantity. You can also remove individual items. The order summary on the right updates as you change things. The Secure Checkout button creates the order and clears the basket.

**`auth.html` — Login**
Handles the OTP login flow. You type an email, click Send OTP, then type the code that appears. There's also a Quick Demo Login section with two one-click buttons — Admin and Customer — that automate the whole OTP process so you don't have to copy-paste anything when demoing.

**`admin.html` — Admin Dashboard**
Only accessible if you're logged in as an admin. Has a sidebar with five tabs: Overview (stats), All Orders, Catalog Management, All Ratings, and All Notifications. The catalog management tab lets admins add new cakes, edit existing ones, and delete them. Customers who try to access this page get redirected.

## How authentication works

When you log in, the gateway gives back a JWT token. That token gets stored in `localStorage` alongside your userId and role. Every request to a protected endpoint includes the token as a `Bearer` header.

The gateway checks the token before forwarding anything to the services. If the token's missing or invalid, the request comes back as 401. If the token's valid but you're a customer trying to hit an admin-only route, it comes back as 403.

The frontend also checks your role locally on page load to show or hide things — for example, the Admin link only shows up in the navbar if you're logged in as admin, and the basket and notification bell only show up for customers.

## Role separation

Customers see:
- Catalog (browse, filter, add to basket, rate)
- Their own basket
- Their own order notifications in the bell dropdown

Admins see:
- The admin dashboard with all orders, all notifications, all ratings
- Catalog management (add/edit/delete cakes)
- They don't get a basket — they're not supposed to be shopping

## Notification bell

When you're logged in as a customer, there's a bell icon in the top navbar. The number badge shows how many notifications you have. Clicking it opens a dropdown showing your order confirmations — each one shows the order ID, channel (email), and when it was sent. You can hit Refresh to pull the latest ones.

These notifications come from the notification-service via RabbitMQ — they're created in the background when checkout happens, not when you add something to the basket.

## File structure

```
client/
  index.html      Catalog page
  basket.html     Shopping basket
  auth.html       Login / OTP flow
  admin.html      Admin dashboard
  app.js          All customer-facing logic — catalog, basket, auth, notifications, ratings
  admin.js        All admin-specific logic — dashboard tabs, catalog CRUD, data tables
  style.css       All styles — design system variables, component styles, layouts
```

## Talking to the API

All API calls go to `http://localhost:8080/api/...`. The gateway routes them:

| Frontend calls | Goes to |
|---|---|
| `/api/cakes` | catalog-service |
| `/api/basket` | order-service |
| `/api/orders` | order-service |
| `/api/ratings` | rating-service |
| `/api/notifications` | notification-service |
| `/auth/...` | gateway (handles login + OTP) |

If the gateway is running somewhere other than `localhost:8080` (e.g. in Kubernetes with port-forwarding), `app.js` has an `API_BASE` constant near the top that you'd update.
