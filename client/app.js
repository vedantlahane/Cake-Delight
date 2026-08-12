/* ============================================================
   app.js — Cake Delight Customer App
   ============================================================ */

const hostname = window.location.hostname || 'localhost';
const GATEWAY_BASE = `http://${hostname}:8080`;
const API_BASE = `${GATEWAY_BASE}/api`;

// ============================================================
// SESSION HELPERS
// ============================================================
function saveSession(userId, token, role) {
  localStorage.setItem('cd_userId', userId);
  localStorage.setItem('cd_token', token);
  localStorage.setItem('cd_role', role || 'customer');
}
function getToken()  { return localStorage.getItem('cd_token'); }
function getUserId() { return localStorage.getItem('cd_userId'); }
function getRole()   { return localStorage.getItem('cd_role') || 'customer'; }
function clearSession() {
  localStorage.removeItem('cd_userId');
  localStorage.removeItem('cd_token');
  localStorage.removeItem('cd_role');
  // also clear old keys if present
  localStorage.removeItem('userId');
  localStorage.removeItem('token');
}
function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

// ============================================================
// TOAST NOTIFICATIONS (replaces alert())
// ============================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) { console.log('[Toast]', message); return; }

  const icons = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info:    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-icon">${icons[type] || icons.info}</div><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}

// ============================================================
// NAVBAR AUTH STATE
// ============================================================
function updateNavbarAuth() {
  const userId = getUserId();
  const role   = getRole();
  const token  = getToken();

  const loggedInBadge = document.getElementById('logged-in-as');
  const userIdText    = document.getElementById('user-id-text');
  const logoutBtn     = document.getElementById('logout-btn');
  const loginNavBtn   = document.getElementById('login-nav-btn');
  const adminNavLink  = document.getElementById('admin-nav-link');

  if (userId && token) {
    if (loggedInBadge) loggedInBadge.style.display = 'flex';
    if (userIdText)    userIdText.textContent = userId;
    if (logoutBtn)     logoutBtn.style.display = 'inline-flex';
    if (loginNavBtn)   loginNavBtn.style.display = 'none';
    // Only show Admin link for admin role
    if (adminNavLink)  adminNavLink.style.display = role === 'admin' ? 'flex' : 'none';
  } else {
    if (loggedInBadge) loggedInBadge.style.display = 'none';
    if (logoutBtn)     logoutBtn.style.display = 'none';
    if (loginNavBtn)   loginNavBtn.style.display = 'inline-flex';
    if (adminNavLink)  adminNavLink.style.display = 'none';
  }
}

const logoutBtnEl = document.getElementById('logout-btn');
if (logoutBtnEl) {
  logoutBtnEl.addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });
}

// ============================================================
// AUTH — OTP REQUEST
// ============================================================
const reqOtpBtn = document.getElementById('request-otp-btn');
if (reqOtpBtn) {
  reqOtpBtn.addEventListener('click', async () => {
    const userIdInput = document.getElementById('login-userId');
    const userId = userIdInput.value.trim();
    if (!userId) { showToast('Please enter your email address', 'error'); return; }

    reqOtpBtn.disabled = true;
    reqOtpBtn.textContent = 'Sending OTP…';

    try {
      const response = await fetch(`${GATEWAY_BASE}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        showToast('Failed to request OTP. Check server status.', 'error');
        return;
      }

      const data = await response.json();

      const otpHintEl = document.getElementById('otp-hint-text');
      if (otpHintEl) otpHintEl.textContent = data.simulatedMessage || 'Check your email for the OTP';

      document.getElementById('login-step-1').style.display = 'none';
      document.getElementById('login-step-2').style.display = 'block';
      showToast('OTP sent! Check your email.', 'success');
    } catch (err) {
      console.error('Request OTP error:', err);
      showToast('Cannot connect to gateway. Is it running?', 'error');
    } finally {
      reqOtpBtn.disabled = false;
      reqOtpBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Send OTP`;
    }
  });
}

// Back to step 1
const backToStep1 = document.getElementById('back-to-step1');
if (backToStep1) {
  backToStep1.addEventListener('click', () => {
    document.getElementById('login-step-1').style.display = 'block';
    document.getElementById('login-step-2').style.display = 'none';
    document.getElementById('otp-message').style.display = 'none';
  });
}

// ============================================================
// AUTH — OTP LOGIN
// ============================================================
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const userId = document.getElementById('login-userId').value.trim();
    const otp    = document.getElementById('login-otp').value.trim();
    await executeLogin(userId, otp);
  });
}

async function executeLogin(userId, otp) {
  if (!userId || !otp) {
    showToast('Please enter both email and OTP', 'error');
    return;
  }

  try {
    const response = await fetch(`${GATEWAY_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, otp })
    });

    if (!response.ok) {
      showToast('Invalid OTP or login failed. Please try again.', 'error');
      return;
    }

    const data = await response.json();
    saveSession(data.userId, data.token, data.role);
    showToast(`Welcome back! Logged in as ${data.role}.`, 'success');

    setTimeout(() => {
      if (data.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'index.html';
      }
    }, 800);
  } catch (err) {
    console.error('Login error:', err);
    showToast('Cannot connect to gateway', 'error');
  }
}

// ============================================================
// AUTH — DEMO ONE-CLICK LOGIN
// ============================================================
async function handleDemoLogin(demoUserId) {
  const otpMsgEl = document.getElementById('otp-message');
  if (otpMsgEl) {
    otpMsgEl.textContent = `Requesting OTP for ${demoUserId}…`;
    otpMsgEl.className = 'status-box info';
    otpMsgEl.style.display = 'flex';
  }

  try {
    const response = await fetch(`${GATEWAY_BASE}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: demoUserId })
    });

    if (!response.ok) {
      if (otpMsgEl) { otpMsgEl.textContent = 'Failed to request OTP.'; otpMsgEl.className = 'status-box error'; }
      return;
    }

    if (otpMsgEl) otpMsgEl.textContent = 'Fetching OTP from gateway…';
    await new Promise(r => setTimeout(r, 800));

    const otpRes = await fetch(`${GATEWAY_BASE}/auth/demo-otp/${encodeURIComponent(demoUserId)}`);
    if (!otpRes.ok) {
      if (otpMsgEl) { otpMsgEl.textContent = 'Could not fetch OTP.'; otpMsgEl.className = 'status-box error'; }
      return;
    }

    const otpData = await otpRes.json();
    if (!otpData.otp) {
      if (otpMsgEl) { otpMsgEl.textContent = 'OTP not found.'; otpMsgEl.className = 'status-box error'; }
      return;
    }

    if (otpMsgEl) { otpMsgEl.textContent = `OTP ${otpData.otp} received. Logging in…`; otpMsgEl.className = 'status-box success'; }
    await executeLogin(demoUserId, otpData.otp);
  } catch (err) {
    console.error('Demo Login Error:', err);
    if (otpMsgEl) { otpMsgEl.textContent = 'Demo login error. See console.'; otpMsgEl.className = 'status-box error'; }
  }
}

const demoAdminBtn    = document.getElementById('demo-admin-btn');
const demoCustomerBtn = document.getElementById('demo-customer-btn');
if (demoAdminBtn)    demoAdminBtn.addEventListener('click',    () => handleDemoLogin('admin@cakedelight.com'));
if (demoCustomerBtn) demoCustomerBtn.addEventListener('click', () => handleDemoLogin('customer@cakedelight.com'));

// ============================================================
// CATALOG — Fetch & Render
// ============================================================
async function fetchCakes(filters = {}) {
  const params = new URLSearchParams();
  if (filters.name)     params.append('name', filters.name);
  if (filters.category) params.append('category', filters.category);
  if (filters.minPrice) params.append('minPrice', filters.minPrice);
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

  const url = `${API_BASE}/cakes${params.toString() ? '?' + params.toString() : ''}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch cakes');
    return await res.json();
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
  } catch {
    return { averageScore: 0, count: 0 };
  }
}

function renderStars(score) {
  const filled = Math.round(score);
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<svg viewBox="0 0 24 24" class="${i <= filled ? '' : 'empty'}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
  return html;
}

async function renderCakes(cakes) {
  const container = document.getElementById('cake-list');
  if (!container) return;

  if (!cakes || cakes.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">🔍</div>
        <h3>No cakes found</h3>
        <p>Try adjusting your filters or browse all cakes.</p>
      </div>`;
    return;
  }

  const cakeCardsHtml = await Promise.all(cakes.map(async (cake) => {
    const ratingData = await fetchCakeAverageRating(cake._id);
    const avgScore   = ratingData.averageScore ? ratingData.averageScore.toFixed(1) : 'New';
    const imgUrl     = cake.imageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80';

    return `
      <div class="cake-card">
        <div class="cake-image-wrap">
          <img src="${imgUrl}" alt="${cake.name}" class="cake-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80'">
        </div>
        <div class="cake-content">
          <span class="cake-badge">${cake.category || 'Bakery'}</span>
          <h3>${cake.name}</h3>
          <p class="cake-desc">${cake.description || 'Delicious freshly baked artisan cake.'}</p>
          <div class="cake-footer">
            <div class="cake-price">₹${cake.price ? cake.price.toFixed(2) : '0.00'}</div>
            <div class="cake-rating-summary">
              <div class="stars">${renderStars(ratingData.averageScore || 0)}</div>
              <span class="cake-rating-meta">${avgScore} (${ratingData.count || 0})</span>
            </div>
          </div>
          <div class="cake-actions">
            <button class="btn btn-primary btn-sm" onclick="addToBasket('${cake._id}', '${cake.name.replace(/'/g, "\\'")}')">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Add to Basket
            </button>
            <button class="btn btn-outline btn-sm" onclick="openRatingModal('${cake._id}', '${cake.name.replace(/'/g, "\\'")}')">
              ★ Rate
            </button>
          </div>
        </div>
      </div>`;
  }));

  container.innerHTML = cakeCardsHtml.join('');
}

// Filter form
const filterForm = document.getElementById('filter-form');
if (filterForm) {
  filterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const filters = {
      name:     document.getElementById('name').value,
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

// ============================================================
// BASKET — Add to basket
// ============================================================
window.addToBasket = async function(cakeId, cakeName) {
  if (!getToken()) {
    showToast('Please sign in to add items to your basket', 'info');
    setTimeout(() => { window.location.href = 'auth.html'; }, 1200);
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/basket/${getUserId()}/items`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ cakeId, quantity: 1 })
    });
    if (!response.ok) {
      showToast('Failed to add cake to basket', 'error');
      return;
    }
    showToast(`${cakeName || 'Cake'} added to basket! 🎂`, 'success');
  } catch (err) {
    console.error('Add to basket error:', err);
    showToast('Error connecting to server', 'error');
  }
};

// ============================================================
// RATING MODAL
// ============================================================
// Star picker — custom interaction
document.querySelectorAll('.star-picker label').forEach((label, index, all) => {
  label.addEventListener('click', () => {
    const value = label.previousElementSibling.value;
    document.getElementById('rating-score').value = value;
    all.forEach(l => l.classList.remove('star-filled'));
    // Fill all stars up to selected
    for (let i = all.length - 1; i >= all.length - parseInt(value); i--) {
      all[i].classList.add('star-filled');
    }
  });
});

window.openRatingModal = function(cakeId, cakeName) {
  if (!getUserId() || !getToken()) {
    showToast('Please sign in to rate cakes', 'info');
    setTimeout(() => { window.location.href = 'auth.html'; }, 1200);
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

// Close modal on backdrop click
const ratingModalOverlay = document.getElementById('rating-modal');
if (ratingModalOverlay) {
  ratingModalOverlay.addEventListener('click', (e) => {
    if (e.target === ratingModalOverlay) ratingModalOverlay.style.display = 'none';
  });
}

const ratingForm = document.getElementById('rating-form');
if (ratingForm) {
  ratingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cakeId  = document.getElementById('rating-cake-id').value;
    const score   = Number(document.getElementById('rating-score').value);
    const comment = document.getElementById('rating-comment').value;

    try {
      const res = await fetch(`${API_BASE}/ratings`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ cakeId, userId: getUserId(), score, comment })
      });

      if (!res.ok) {
        showToast('Failed to submit rating. Try again.', 'error');
        return;
      }

      showToast('Thank you for your rating! ⭐', 'success');
      document.getElementById('rating-modal').style.display = 'none';
      ratingForm.reset();

      const cakes = await fetchCakes();
      await renderCakes(cakes);
    } catch (err) {
      console.error('Submit rating error:', err);
      showToast('Error submitting rating', 'error');
    }
  });
}

// ============================================================
// BASKET PAGE — Load & Render
// ============================================================
async function loadBasket() {
  const userId    = getUserId();
  const container = document.getElementById('basket-items');
  if (!container) return;

  if (!userId || !getToken()) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔐</div>
        <h3>Sign in required</h3>
        <p>Please sign in to view your basket.</p>
        <a href="auth.html" class="btn btn-primary" style="margin-top:8px;">Sign In</a>
      </div>`;
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/basket/${userId}`, { headers: authHeaders() });
    if (!response.ok) return;
    const basket = await response.json();
    renderBasket(basket);
  } catch (err) {
    console.error('Load basket error:', err);
  }
}

function renderBasket(basket) {
  const container   = document.getElementById('basket-items');
  const checkoutBtn = document.getElementById('checkout-btn');
  if (!container) return;

  if (!basket || !basket.items || basket.items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <h3>Your basket is empty</h3>
        <p>Browse our catalog and add some cakes!</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:8px;">Browse Cakes</a>
      </div>`;
    updateBasketTotal(0);
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
        <input type="number" id="qty-${item.cakeId}" value="${item.quantity}" min="1" max="99"
          onchange="updateItemQuantity('${item.cakeId}')">
        <button class="btn btn-danger btn-xs" onclick="removeItem('${item.cakeId}')" title="Remove">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>`).join('');

  const total = basket.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  updateBasketTotal(total);
  if (getUserId() && checkoutBtn) checkoutBtn.disabled = false;
}

function updateBasketTotal(total) {
  const totalAmountEl = document.getElementById('basket-total-amount');
  const subtotalEl    = document.getElementById('subtotal-val');
  const totalEl       = document.getElementById('total-val');
  const fmt = `₹${total.toFixed(2)}`;
  if (totalAmountEl) totalAmountEl.textContent = fmt;
  if (subtotalEl)    subtotalEl.textContent = fmt;
  if (totalEl)       totalEl.textContent = fmt;
}

window.updateItemQuantity = async function(cakeId) {
  const input    = document.getElementById(`qty-${cakeId}`);
  const quantity = Number(input.value);
  if (quantity < 1) return;

  try {
    const res = await fetch(`${API_BASE}/basket/${getUserId()}/items/${cakeId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ quantity })
    });
    if (!res.ok) { showToast('Failed to update quantity', 'error'); return; }
    await loadBasket();
  } catch (err) {
    console.error('Update item error:', err);
  }
};

window.removeItem = async function(cakeId) {
  try {
    const res = await fetch(`${API_BASE}/basket/${getUserId()}/items/${cakeId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) { showToast('Failed to remove item', 'error'); return; }
    showToast('Item removed from basket', 'info');
    await loadBasket();
  } catch (err) {
    console.error('Remove item error:', err);
  }
};

// CHECKOUT
const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', async () => {
    const userId = getUserId();
    if (!userId || !getToken()) {
      showToast('Please sign in first', 'info');
      return;
    }

    const confirmationEl = document.getElementById('order-confirmation');
    confirmationEl.className = 'status-box info';
    confirmationEl.style.display = 'flex';
    confirmationEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Processing your order…`;

    try {
      const response = await fetch(`${API_BASE}/orders/checkout`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (!response.ok) {
        confirmationEl.className = 'status-box error';
        confirmationEl.innerHTML = `⚠️ Checkout failed: ${data.error || 'Server error'}`;
        return;
      }

      confirmationEl.className = 'status-box success';
      confirmationEl.innerHTML = `
        <div>
          <div><strong>🎉 Order placed successfully!</strong></div>
          <div style="margin-top:6px; font-size:0.85rem;">Order ID: <code>${data._id}</code> &nbsp;|&nbsp; Total: ₹${data.total.toFixed(2)}</div>
        </div>`;

      showToast('Order placed! You\'ll receive a notification shortly.', 'success');
      await loadBasket();
      setTimeout(loadNotifications, 1200);
    } catch (err) {
      confirmationEl.className = 'status-box error';
      confirmationEl.innerHTML = '⚠️ Checkout request failed. Please try again.';
    }
  });
}

// ============================================================
// NOTIFICATIONS (customer — own only)
// ============================================================
async function loadNotifications() {
  const userId    = getUserId();
  const container = document.getElementById('notifications-list');
  if (!container) return;

  if (!userId) {
    container.innerHTML = '<div class="empty-msg">Please sign in to view notifications.</div>';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/notifications/${userId}`, { headers: authHeaders() });
    if (!res.ok) return;
    const notifications = await res.json();

    if (!notifications || notifications.length === 0) {
      container.innerHTML = '<div class="empty-msg">No notifications yet.</div>';
      return;
    }

    container.innerHTML = notifications.map(n => `
      <div class="notification-item">
        <div class="notification-title">
          📬 Order Confirmation
          <span class="badge ${n.status}" style="margin-left:8px;">${n.status}</span>
        </div>
        <div class="notification-sub">Order ID: ${n.orderId} · Channel: ${n.channel}</div>
        <div class="notification-time">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${new Date(n.createdAt).toLocaleString()}
        </div>
      </div>`).join('');
  } catch (err) {
    console.error('Load notifications error:', err);
  }
}

const refreshNotifBtn = document.getElementById('refresh-notifications-btn');
if (refreshNotifBtn) refreshNotifBtn.addEventListener('click', loadNotifications);

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  updateNavbarAuth();

  if (document.getElementById('cake-list')) {
    // Catalog page — show skeleton while loading
    document.getElementById('cake-list').innerHTML = `
      <div class="skeleton" style="height:380px;border-radius:10px;"></div>
      <div class="skeleton" style="height:380px;border-radius:10px;"></div>
      <div class="skeleton" style="height:380px;border-radius:10px;"></div>`;
    const cakes = await fetchCakes();
    await renderCakes(cakes);
  }

  if (document.getElementById('basket-items')) {
    await loadBasket();
    await loadNotifications();
  }
});