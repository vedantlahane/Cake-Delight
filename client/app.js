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
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

// ---------- login ----------
document.getElementById('login-btn').addEventListener('click', async () => {
  const userId = document.getElementById('login-userId').value;
  if (!userId) return;

  const response = await fetch(`${GATEWAY_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });

  if (!response.ok) {
    alert('Login failed');
    return;
  }

  const data = await response.json();
  saveSession(userId, data.token);
  showLoggedInState();
  loadBasket();
});

function showLoggedInState() {
  if (getToken()) {
    document.getElementById('logged-in-as').textContent = `Logged in as ${getUserId()}`;
  }
}

// ---------- cakes ----------
async function fetchCakes(filters = {}) {
  const params = new URLSearchParams();
  if (filters.name) params.append('name', filters.name);
  if (filters.category) params.append('category', filters.category);
  if (filters.minPrice) params.append('minPrice', filters.minPrice);
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

  const url = `${API_BASE}/cakes${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch cakes');
  return response.json();
}

function renderCakes(cakes) {
  const container = document.getElementById('cake-list');
  if (cakes.length === 0) {
    container.innerHTML = '<p>No cakes found.</p>';
    return;
  }
  container.innerHTML = cakes.map(cake => `
    <div class="cake-card">
      <h3>${cake.name}</h3>
      <p>${cake.category} — $${cake.price}</p>
      <button onclick="addToBasket('${cake._id}')">Add to basket</button>
    </div>
  `).join('');
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
  renderCakes(cakes);
});

// ---------- basket ----------
async function addToBasket(cakeId) {
  if (!getToken()) {
    alert('Please login first');
    return;
  }
  const response = await fetch(`${API_BASE}/basket/${getUserId()}/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ cakeId, quantity: 1 })
  });
  if (!response.ok) {
    alert('Failed to add to basket');
    return;
  }
  await loadBasket();
}

async function loadBasket() {
  if (!getToken()) return;
  const response = await fetch(`${API_BASE}/basket/${getUserId()}`, {
    headers: authHeaders()
  });
  const basket = await response.json();
  renderBasket(basket);
}

function renderBasket(basket) {
  const container = document.getElementById('basket-items');
  const totalEl = document.getElementById('basket-total');

  if (!basket.items || basket.items.length === 0) {
    container.innerHTML = '<p>Basket is empty.</p>';
    totalEl.textContent = '';
    return;
  }

  container.innerHTML = basket.items.map(item => `
    <div class="basket-item">
      <span>${item.name} — $${item.price} each</span>
      <input type="number" id="qty-${item.cakeId}" value="${item.quantity}" min="1" style="width:50px">
      <button onclick="updateItemQuantity('${item.cakeId}')">Update</button>
      <button onclick="removeItem('${item.cakeId}')">Remove</button>
    </div>
  `).join('');

  const total = basket.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  totalEl.textContent = `Total: $${total.toFixed(2)}`;
}

async function updateItemQuantity(cakeId) {
  const quantity = Number(document.getElementById(`qty-${cakeId}`).value);
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
}

async function removeItem(cakeId) {
  const response = await fetch(`${API_BASE}/basket/${getUserId()}/items/${cakeId}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!response.ok) {
    alert('Failed to remove item');
    return;
  }
  await loadBasket();
}

// ---------- checkout ----------
document.getElementById('checkout-btn').addEventListener('click', async () => {
  if (!getToken()) {
    alert('Please login first');
    return;
  }
  const response = await fetch(`${API_BASE}/orders/checkout`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: getUserId() }) // Order currently reads userId from body — see note below
  });

  const data = await response.json();

  if (!response.ok) {
    document.getElementById('order-confirmation').innerHTML =
      `<p style="color:red">Checkout failed: ${data.error}</p>`;
    return;
  }

  document.getElementById('order-confirmation').innerHTML =
    `<p style="color:green">Order placed! Order ID: ${data._id}, Total: $${data.total}</p>`;
  await loadBasket();
});

// ---------- init ----------
document.addEventListener('DOMContentLoaded', async () => {
  showLoggedInState();
  const cakes = await fetchCakes();
  renderCakes(cakes);
  await loadBasket();
});