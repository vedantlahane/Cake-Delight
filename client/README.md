# Cake Delight - Client Frontend

This is the frontend application for the **Cake Delight** microservices project. It provides a clean, modern, multi-page UI to interact with the backend services.

## Architecture

The frontend is built using standard web technologies without heavy frameworks to remain lightweight and performant:
- **HTML5**: Structured into a multi-page layout (`index.html`, `basket.html`, `auth.html`, `admin.html`).
- **CSS3**: A minimalist, "plain light colors" theme using CSS variables (`style.css`).
- **Vanilla JavaScript**: Handles routing logic and API communication (`app.js`, `admin.js`).
- **SVG Icons**: Uses professional vector icons (Lucide/Feather styles) rather than plain emojis for a modern aesthetic.

## Pages

1. **Catalog (`index.html`)**: The main landing page. Displays the seed catalog of cakes fetching from the `catalog-service`. Users can filter cakes, view ratings, and add them to the basket.
2. **Shopping Basket (`basket.html`)**: A dedicated page for users to review their selected cakes, adjust quantities, remove items, and securely checkout.
3. **Authentication (`auth.html`)**: A centralized login flow simulating OTP (One-Time Password) based authentication.
4. **Admin Dashboard (`admin.html`)**: A monitoring interface to view all global orders and system notifications in real-time.

## Communication

The frontend communicates entirely through the API Gateway (`gateway`), which routes requests to the appropriate microservices (`catalog-service`, `order-service`, `notification-service`, `rating-service`).

By default, the client expects the API Gateway to be running at `http://localhost:8080`.

## Features
- **Responsive Design**: Built using modern CSS Grid and Flexbox for mobile and desktop support.
- **Session Management**: JWT tokens and User IDs are stored locally.
- **Real-time Refresh**: The admin dashboard and notifications poll the backend for updates.
