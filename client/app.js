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

// ---------- shared layout ----------
function updateNavbarAuth() {
  const userId = getUserId();
  const loggedInBadge = document.getElementById('logged-in-as');
  const userIdText = document.getElementById('user-id-text');
  const logoutBtn = document.getElementById('logout-btn');
  const loginNavBtn = document.getElementById('login-nav-btn');

  if (userId && getToken()) {
    if (loggedInBadge) loggedInBadge.style.display = 'flex';
    if (userIdText) userIdText.textContent = userId;
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (loginNavBtn) loginNavBtn.style.display = 'none';
  } else {
    if (loggedInBadge) loggedInBadge.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (loginNavBtn) loginNavBtn.style.display = 'inline-flex';
  }
}

const logoutBtnEl = document.getElementById('logout-btn');
if (logoutBtnEl) {
  logoutBtnEl.addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });
}

// ---------- login / otp (auth.html) ----------
const reqOtpBtn = document.getElementById('request-otp-btn');
if (reqOtpBtn) {
  reqOtpBtn.addEventListener('click', async () => {
    const userIdInput = document.getElementById('login-userId');
    const userId = userIdInput.value.trim();
    if (!userId) {
      alert('Please enter a User ID');
      return;
    }

    try {
      const response = await fetch(`${GATEWAY_BASE}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        alert('Failed to request OTP. Check server status.');
        return;
      }

      const data = await response.json();
      
      const otpMsgEl = document.getElementById('otp-message');
      otpMsgEl.textContent = data.simulatedMessage;
      otpMsgEl.className = 'status-box success';
      otpMsgEl.style.display = 'flex';
      
      document.getElementById('login-step-1').style.display = 'none';
      document.getElementById('login-step-2').style.display = 'block';
    } catch (err) {
      console.error('Request OTP error:', err);
      alert('Failed to connect to gateway. Is it running?');
    }
  });
}

const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const userId = document.getElementById('login-userId').value.trim();
    const otp = document.getElementById('login-otp').value.trim();
    
    if (!userId || !otp) {
      alert('Please enter OTP');
      return;
    }

    try {
      const response = await fetch(`${GATEWAY_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Login failed: ${data.error}`);
        return;
      }

      saveSession(userId, data.token);
      window.location.href = 'index.html';
    } catch (err) {
      console.error('Login error:', err);
      alert('Failed to connect to gateway.');
    }
  });
}

// ---------- catalog (index.html) ----------
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
  if (!container) return; // not on catalog page

  if (!cakes || cakes.length === 0) {
    container.innerHTML = '<p class="empty-msg">No cakes found matching criteria.</p>';
    return;
  }

  const cakeCardsHtml = await Promise.all(cakes.map(async (cake) => {
    const ratingData = await fetchCakeAverageRating(cake._id);
    const avgScore = ratingData.averageScore ? ratingData.averageScore.toFixed(1) : 'New';
    const stars = ratingData.averageScore 
      ? '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'.repeat(Math.round(ratingData.averageScore)) 
      : '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    
    // Fallback if missing
    const imgUrl = cake.imageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80';

    return `
      <div class="cake-card">
        <img src="${imgUrl}" alt="${cake.name}" class="cake-image" loading="lazy">
        <div class="cake-content">
          <span class="cake-badge">${cake.category || 'Bakery'}</span>
          <h3>${cake.name}</h3>
          <p class="cake-desc">${cake.description || 'Delicious freshly baked artisan cake.'}</p>
          <div class="cake-price">₹${cake.price ? cake.price.toFixed(2) : '0.00'}</div>
          <div class="cake-rating-summary">
            ${stars} <span>${avgScore} (${ratingData.count || 0} reviews)</span>
          </div>
          <div class="cake-actions">
            <button class="btn btn-primary btn-sm full-width" onclick="addToBasket('${cake._id}')">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Add
            </button>
            <button class="btn btn-outline btn-sm full-width" onclick="openRatingModal('${cake._id}', '${cake.name}')">
              Rate
            </button>
          </div>
        </div>
      </div>
    `;
  }));

  container.innerHTML = cakeCardsHtml.join('');
}

const filterForm = document.getElementById('filter-form');
if (filterForm) {
  filterForm.addEventListener('submit', async (e) => {
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
}

const resetFiltersBtn = document.getElementById('reset-filters-btn');
if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener('click', async () => {
    document.getElementById('filter-form').reset();
    const cakes = await fetchCakes();
    await renderCakes(cakes);
  });
}

window.addToBasket = async function(cakeId) {
  if (!getToken()) {
    alert('Please login first');
    window.location.href = 'auth.html';
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
    alert('Added to basket!');
  } catch (err) {
    console.error('Add to basket error:', err);
  }
};

// ---------- rating modal ----------
window.openRatingModal = function(cakeId, cakeName) {
  if (!getUserId() || !getToken()) {
    alert('Please login first to rate cakes');
    window.location.href = 'auth.html';
    return;
  }
  document.getElementById('rating-cake-id').value = cakeId;
  document.getElementById('rating-modal-title').textContent = `Rate "${cakeName}"`;
  document.getElementById('rating-modal').style.display = 'flex';
};

const closeModalBtn = document.getElementById('close-modal-btn');
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    document.getElementById('rating-modal').style.display = 'none';
  });
}

const ratingForm = document.getElementById('rating-form');
if (ratingForm) {
  ratingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cakeId = document.getElementById('rating-cake-id').value;
    const score = Number(document.getElementById('rating-score').value);
    const comment = document.getElementById('rating-comment').value;

    try {
      const res = await fetch(`${API_BASE}/ratings`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ cakeId, userId: getUserId(), score, comment })
      });

      if (!res.ok) {
        alert('Failed to submit rating');
        return;
      }

      alert('Thank you for rating!');
      document.getElementById('rating-modal').style.display = 'none';
      document.getElementById('rating-form').reset();
      
      const cakes = await fetchCakes();
      await renderCakes(cakes);
    } catch (err) {
      console.error('Submit rating error:', err);
    }
  });
}

// ---------- basket & notifications (basket.html) ----------
async function loadBasket() {
  const userId = getUserId();
  const container = document.getElementById('basket-items');
  if (!container) return;

  if (!userId || !getToken()) {
    renderBasket({ items: [] });
    return;
  }
  
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
  if (!container) return;

  if (!basket || !basket.items || basket.items.length === 0) {
    container.innerHTML = '<div class="empty-msg">Your basket is currently empty.</div>';
    totalEl.innerHTML = '<span>Total</span><span>$0.00</span>';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  container.innerHTML = basket.items.map(item => `
    <div class="basket-item">
      <div class="basket-item-info">
        <span class="basket-item-title">${item.name}</span>
        <span class="basket-item-price">₹${item.price} each</span>
      </div>
      <div class="basket-item-controls">
        <input type="number" id="qty-${item.cakeId}" value="${item.quantity}" min="1" onchange="updateItemQuantity('${item.cakeId}')">
        <button class="btn btn-outline btn-sm" onclick="removeItem('${item.cakeId}')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  const total = basket.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  totalEl.innerHTML = `<span>Total</span><span>₹${total.toFixed(2)}</span>`;
  if (getUserId() && checkoutBtn) checkoutBtn.disabled = false;
}

window.updateItemQuantity = async function(cakeId) {
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
};

window.removeItem = async function(cakeId) {
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
};

const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', async () => {
    const userId = getUserId();
    if (!userId || !getToken()) {
      alert('Please login first');
      return;
    }

    const confirmationEl = document.getElementById('order-confirmation');
    confirmationEl.style.display = 'flex';
    confirmationEl.className = 'status-box';
    confirmationEl.innerHTML = 'Processing checkout...';

    try {
      const response = await fetch(`${API_BASE}/orders/checkout`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (!response.ok) {
        confirmationEl.className = 'status-box error';
        confirmationEl.innerHTML = `Checkout failed: ${data.error || 'Server error'}`;
        return;
      }

      confirmationEl.className = 'status-box success';
      confirmationEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div><strong>Order placed successfully!</strong></div>
          <div>Order ID: ${data._id}</div>
          <div>Total: ₹${data.total.toFixed(2)}</div>
        </div>
      `;
      
      await loadBasket();
      setTimeout(loadNotifications, 1000);
    } catch (err) {
      confirmationEl.className = 'status-box error';
      confirmationEl.innerHTML = 'Checkout request failed. Please try again.';
    }
  });
}

async function loadNotifications() {
  const userId = getUserId();
  const container = document.getElementById('notifications-list');
  if (!container) return;

  if (!userId) {
    container.innerHTML = '<div class="empty-msg">Please log in to view notifications.</div>';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/notifications/${userId}`, {
      headers: authHeaders()
    });
    if (!res.ok) return;
    const notifications = await res.json();
    
    if (!notifications || notifications.length === 0) {
      container.innerHTML = '<div class="empty-msg">No notifications found.</div>';
      return;
    }

    container.innerHTML = notifications.map(n => `
      <div class="notification-item">
        <div style="font-weight:600; margin-bottom:4px;">Order Confirmation (${n.channel})</div>
        <div style="font-size:0.9rem;">Order ID: ${n.orderId}</div>
        <div class="notification-time">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px; height:14px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${new Date(n.createdAt).toLocaleString()} — Status: ${n.status}
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Load notifications error:', err);
  }
}

const refreshNotificationsBtn = document.getElementById('refresh-notifications-btn');
if (refreshNotificationsBtn) {
  refreshNotificationsBtn.addEventListener('click', loadNotifications);
}

// ---------- init ----------
document.addEventListener('DOMContentLoaded', async () => {
  updateNavbarAuth();
  if (document.getElementById('cake-list')) {
    const cakes = await fetchCakes();
    await renderCakes(cakes);
  }
  if (document.getElementById('basket-items')) {
    await loadBasket();
    await loadNotifications();
  }
});