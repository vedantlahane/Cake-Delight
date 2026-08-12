const GATEWAY_BASE = 'http://localhost:8080';
const API_BASE = `${GATEWAY_BASE}/api`;

// ---------- session helpers ----------
function saveSession(userId, token) {
  localStorage.setItem('userId', userId);
  localStorage.setItem('token', token);
}
function getToken() {
  return localStorage.getItem('token');
}
function getUserId() {
  return localStorage.getItem('userId');
}
function clearSession() {
  localStorage.removeItem('userId');
  localStorage.removeItem('token');
}
function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ---------- login / logout ----------
document.getElementById('login-btn').addEventListener('click', async () => {
  const userIdInput = document.getElementById('login-userId');
  const userId = userIdInput.value.trim();
  if (!userId) {
    alert('Please enter a User ID');
    return;
  }

  try {
    const response = await fetch(`${GATEWAY_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      alert('Login failed. Check server status.');
      return;
    }

    const data = await response.json();
    saveSession(userId, data.token);
    showLoggedInState();
    loadBasket();
    loadNotifications();
  } catch (err) {
    console.error('Login error:', err);
    alert('Failed to connect to gateway. Is it running?');
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  clearSession();
  showLoggedInState();
  renderBasket({ items: [] });
  renderNotifications([]);
});

function showLoggedInState() {
  const userId = getUserId();
  const loggedInBadge = document.getElementById('logged-in-as');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userIdInput = document.getElementById('login-userId');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (userId && getToken()) {
    loggedInBadge.textContent = `👤 ${userId}`;
    loggedInBadge.style.display = 'inline-block';
    logoutBtn.style.display = 'inline-block';
    loginBtn.style.display = 'none';
    userIdInput.style.display = 'none';
    checkoutBtn.disabled = false;
  } else {
    loggedInBadge.style.display = 'none';
    logoutBtn.style.display = 'none';
    loginBtn.style.display = 'inline-block';
    userIdInput.style.display = 'inline-block';
    checkoutBtn.disabled = true;
  }
}

// ---------- cakes & ratings ----------
async function fetchCakes(filters = {}) {
  const params = new URLSearchParams();
  if (filters.name) params.append('name', filters.name);
  if (filters.category) params.append('category', filters.category);
  if (filters.minPrice) params.append('minPrice', filters.minPrice);
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

  const url = `${API_BASE}/cakes${params.toString() ? '?' + params.toString() : ''}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch cakes');
    return await response.json();
  } catch (err) {
    console.error('Fetch cakes error:', err);
    return [];
  }
}

async function fetchCakeAverageRating(cakeId) {
  try {
    const res = await fetch(`${API_BASE}/ratings/${cakeId}/average`);
    if (!res.ok) return { averageScore: 0, count: 0 };
    return await res.json();
  } catch (err) {
    return { averageScore: 0, count: 0 };
  }
}

async function renderCakes(cakes) {
  const container = document.getElementById('cake-list');
  if (!cakes || cakes.length === 0) {
    container.innerHTML = '<p class="empty-msg">No cakes found matching criteria.</p>';
    return;
  }

  // Fetch ratings for each cake asynchronously
  const cakeCardsHtml = await Promise.all(cakes.map(async (cake) => {
    const ratingData = await fetchCakeAverageRating(cake._id);
    const avgScore = ratingData.averageScore ? ratingData.averageScore.toFixed(1) : 'New';
    const stars = ratingData.averageScore ? '⭐'.repeat(Math.round(ratingData.averageScore)) : '⭐';

    return `
      <div class="cake-card">
        <span class="cake-badge">${cake.category || 'Bakery'}</span>
        <h3>${cake.name}</h3>
        <p class="cake-desc">${cake.description || 'Delicious freshly baked artisan cake.'}</p>
        <div class="cake-rating-summary">
          <span>${stars} ${avgScore}</span>
          <span style="color:var(--text-muted); font-size:0.8rem;">(${ratingData.count || 0} reviews)</span>
        </div>
        <div class="cake-price">$${cake.price ? cake.price.toFixed(2) : '0.00'}</div>
        <div class="cake-actions">
          <button class="btn btn-primary btn-sm" onclick="addToBasket('${cake._id}')">Add to Basket</button>
          <button class="btn btn-outline btn-sm" onclick="openRatingModal('${cake._id}', '${cake.name}')">Rate</button>
        </div>
      </div>
    `;
  }));

  container.innerHTML = cakeCardsHtml.join('');
}

document.getElementById('filter-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const filters = {
    name: document.getElementById('name').value,
    category: document.getElementById('category').value,
    minPrice: document.getElementById('minPrice').value,
    maxPrice: document.getElementById('maxPrice').value
  };
  const cakes = await fetchCakes(filters);
  await renderCakes(cakes);
});

document.getElementById('reset-filters-btn').addEventListener('click', async () => {
  document.getElementById('filter-form').reset();
  const cakes = await fetchCakes();
  await renderCakes(cakes);
});

// ---------- basket ----------
async function addToBasket(cakeId) {
  if (!getToken()) {
    alert('Please login first with a User ID');
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/basket/${getUserId()}/items`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ cakeId, quantity: 1 })
    });
    if (!response.ok) {
      alert('Failed to add cake to basket');
      return;
    }
    await loadBasket();
  } catch (err) {
    console.error('Add to basket error:', err);
  }
}

async function loadBasket() {
  const userId = getUserId();
  if (!userId || !getToken()) return;
  try {
    const response = await fetch(`${API_BASE}/basket/${userId}`, {
      headers: authHeaders()
    });
    if (!response.ok) return;
    const basket = await response.json();
    renderBasket(basket);
  } catch (err) {
    console.error('Load basket error:', err);
  }
}

function renderBasket(basket) {
  const container = document.getElementById('basket-items');
  const totalEl = document.getElementById('basket-total');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (!basket || !basket.items || basket.items.length === 0) {
    container.innerHTML = '<p class="empty-msg">Your basket is currently empty.</p>';
    totalEl.textContent = 'Total: $0.00';
    if (getUserId()) checkoutBtn.disabled = true;
    return;
  }

  container.innerHTML = basket.items.map(item => `
    <div class="basket-item">
      <div class="basket-item-info">
        <span class="basket-item-title">${item.name}</span>
        <span class="basket-item-price">$${item.price} each</span>
      </div>
      <div class="basket-item-controls">
        <input type="number" id="qty-${item.cakeId}" value="${item.quantity}" min="1" onchange="updateItemQuantity('${item.cakeId}')">
        <button class="btn btn-outline btn-sm" onclick="removeItem('${item.cakeId}')">🗑️</button>
      </div>
    </div>
  `).join('');

  const total = basket.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  totalEl.textContent = `Total: $${total.toFixed(2)}`;
  if (getUserId()) checkoutBtn.disabled = false;
}

async function updateItemQuantity(cakeId) {
  const quantityInput = document.getElementById(`qty-${cakeId}`);
  const quantity = Number(quantityInput.value);
  if (quantity < 1) return;

  try {
    const response = await fetch(`${API_BASE}/basket/${getUserId()}/items/${cakeId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ quantity })
    });
    if (!response.ok) {
      alert('Failed to update quantity');
      return;
    }
    await loadBasket();
  } catch (err) {
    console.error('Update item error:', err);
  }
}

async function removeItem(cakeId) {
  try {
    const response = await fetch(`${API_BASE}/basket/${getUserId()}/items/${cakeId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!response.ok) {
      alert('Failed to remove item');
      return;
    }
    await loadBasket();
  } catch (err) {
    console.error('Remove item error:', err);
  }
}

// ---------- checkout ----------
document.getElementById('checkout-btn').addEventListener('click', async () => {
  const userId = getUserId();
  if (!userId || !getToken()) {
    alert('Please login first');
    return;
  }

  const confirmationEl = document.getElementById('order-confirmation');
  confirmationEl.className = 'status-box';
  confirmationEl.textContent = 'Processing checkout...';

  try {
    const response = await fetch(`${API_BASE}/orders/checkout`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userId })
    });

    const data = await response.json();

    if (!response.ok) {
      confirmationEl.className = 'status-box error';
      confirmationEl.textContent = `Checkout failed: ${data.error || 'Server error'}`;
      return;
    }

    confirmationEl.className = 'status-box success';
    confirmationEl.innerHTML = `✅ Order placed successfully!<br><strong>Order ID:</strong> ${data._id}<br><strong>Total:</strong> $${data.total.toFixed(2)}`;
    
    await loadBasket();

    // Poll for order completion notification after 2 seconds
    setTimeout(loadNotifications, 2000);
  } catch (err) {
    confirmationEl.className = 'status-box error';
    confirmationEl.textContent = 'Checkout request failed. Please try again.';
  }
});

// ---------- notifications ----------
async function loadNotifications() {
  const userId = getUserId();
  if (!userId) return;

  const container = document.getElementById('notifications-list');
  try {
    const res = await fetch(`${API_BASE}/notifications/${userId}`, {
      headers: authHeaders()
    });
    if (!res.ok) return;
    const notifications = await res.json();
    renderNotifications(notifications);
  } catch (err) {
    console.error('Load notifications error:', err);
  }
}

function renderNotifications(notifications) {
  const container = document.getElementById('notifications-list');
  if (!notifications || notifications.length === 0) {
    container.innerHTML = '<p class="empty-msg">No notifications found.</p>';
    return;
  }

  container.innerHTML = notifications.map(n => `
    <div class="notification-item">
      <div><strong>Order Confirmation Sent</strong> (${n.channel})</div>
      <div>Order ID: ${n.orderId}</div>
      <div class="notification-time">${new Date(n.createdAt).toLocaleString()} — Status: ${n.status}</div>
    </div>
  `).join('');
}

document.getElementById('refresh-notifications-btn').addEventListener('click', loadNotifications);

// ---------- rating modal & submission ----------
function openRatingModal(cakeId, cakeName) {
  if (!getUserId() || !getToken()) {
    alert('Please login first to rate cakes');
    return;
  }
  document.getElementById('rating-cake-id').value = cakeId;
  document.getElementById('rating-modal-title').textContent = `Rate "${cakeName}"`;
  document.getElementById('rating-modal').style.display = 'flex';
}

document.getElementById('close-modal-btn').addEventListener('click', () => {
  document.getElementById('rating-modal').style.display = 'none';
});

document.getElementById('rating-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const cakeId = document.getElementById('rating-cake-id').value;
  const score = Number(document.getElementById('rating-score').value);
  const comment = document.getElementById('rating-comment').value;

  try {
    const res = await fetch(`${API_BASE}/ratings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        cakeId,
        userId: getUserId(),
        score,
        comment
      })
    });

    if (!res.ok) {
      alert('Failed to submit rating');
      return;
    }

    alert('Thank you for rating!');
    document.getElementById('rating-modal').style.display = 'none';
    document.getElementById('rating-form').reset();
    
    // Refresh cakes list to display updated average rating
    const cakes = await fetchCakes();
    await renderCakes(cakes);
  } catch (err) {
    console.error('Submit rating error:', err);
  }
});

// ---------- init ----------
document.addEventListener('DOMContentLoaded', async () => {
  showLoggedInState();
  const cakes = await fetchCakes();
  await renderCakes(cakes);
  await loadBasket();
  await loadNotifications();
});