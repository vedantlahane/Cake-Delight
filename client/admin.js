/* ============================================================
   admin.js — Cake Delight Admin Dashboard
   ============================================================ */

const hostname    = window.location.hostname || 'localhost';
const GATEWAY_BASE = `http://${hostname}:8080`;
const API_BASE    = `${GATEWAY_BASE}/api`;

// ============================================================
// SESSION HELPERS
// ============================================================
function getToken()  { return localStorage.getItem('cd_token') || localStorage.getItem('token'); }
function getUserId() { return localStorage.getItem('cd_userId') || localStorage.getItem('userId'); }
function getRole()   { return localStorage.getItem('cd_role') || ''; }
function clearSession() {
  ['cd_userId','cd_token','cd_role','userId','token'].forEach(k => localStorage.removeItem(k));
}
function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
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
// AUTH GUARD — Redirect if not admin
// ============================================================
function enforceAdminAuth() {
  const token = getToken();
  const role  = getRole();

  if (!token) {
    showToast('Please sign in to access the admin dashboard', 'error');
    setTimeout(() => { window.location.href = 'auth.html'; }, 800);
    return false;
  }

  if (role !== 'admin') {
    showToast('Access denied: Admin privileges required', 'error');
    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    return false;
  }

  return true;
}

// Update navbar elements
function updateAdminNavbar() {
  const userId = getUserId();
  const loggedInBadge = document.getElementById('logged-in-as');
  const userIdText    = document.getElementById('user-id-text');
  const logoutBtn     = document.getElementById('logout-btn');
  const roleBadge     = document.getElementById('admin-role-badge');

  if (userId) {
    if (loggedInBadge) loggedInBadge.style.display = 'flex';
    if (userIdText)    userIdText.textContent = userId;
    if (logoutBtn)     logoutBtn.style.display = 'inline-flex';
    if (roleBadge)     roleBadge.style.display = 'inline-flex';
  }
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    clearSession();
    window.location.href = 'auth.html';
  });
}

// ============================================================
// TAB NAVIGATION
// ============================================================
window.switchTab = function(tabName) {
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));

  const btn = document.querySelector(`[data-tab="${tabName}"]`);
  const tab = document.getElementById(`tab-content-${tabName}`);
  if (btn) btn.classList.add('active');
  if (tab) tab.classList.add('active');

  // Load data when switching tabs
  if (tabName === 'overview')      loadOverview();
  if (tabName === 'orders')        loadOrders();
  if (tabName === 'notifications') loadNotificationsAdmin();
  if (tabName === 'catalog')       loadCatalogAdmin();
  if (tabName === 'ratings')       loadRatingsAdmin();
};

document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ============================================================
// STATS / OVERVIEW
// ============================================================
async function loadOverview() {
  const [orders, notifications, cakes] = await Promise.all([
    fetchAdminOrders(),
    fetchAdminNotifications(),
    fetchCatalog()
  ]);

  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);

  document.getElementById('stat-orders').textContent        = orders.length;
  document.getElementById('stat-revenue').textContent       = `₹${revenue.toFixed(0)}`;
  document.getElementById('stat-notifications').textContent = notifications.length;
  document.getElementById('stat-cakes').textContent         = cakes.length;

  // Recent 5 orders
  const tbody = document.getElementById('overview-orders-list');
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No orders yet</td></tr>';
  } else {
    tbody.innerHTML = orders.slice(0, 5).map(o => orderRow(o)).join('');
  }
}

// ============================================================
// ORDERS
// ============================================================
async function fetchAdminOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed');
    return await res.json();
  } catch (err) {
    console.error('Fetch orders error:', err);
    return [];
  }
}

function orderRow(o) {
  const itemCount = o.items ? o.items.length : 0;
  const date      = new Date(o.createdAt).toLocaleString();
  return `
    <tr>
      <td><code style="font-size:0.78rem;">${o._id.substring(0, 10)}…</code></td>
      <td style="max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${o.userId}</td>
      <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
      <td><strong>₹${o.total.toFixed(2)}</strong></td>
      <td><span class="badge ${o.status}">${o.status}</span></td>
      <td style="font-size:0.8rem; color:var(--text-muted);">${date}</td>
    </tr>`;
}

window.loadOrders = async function() {
  const tbody = document.getElementById('admin-orders-list');
  tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Loading…</td></tr>';
  const orders = await fetchAdminOrders();
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No orders found.</td></tr>';
  } else {
    tbody.innerHTML = orders.map(o => orderRow(o)).join('');
  }
};

// ============================================================
// NOTIFICATIONS (admin — all)
// ============================================================
async function fetchAdminNotifications() {
  try {
    const res = await fetch(`${API_BASE}/notifications`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed');
    return await res.json();
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return [];
  }
}

window.loadNotificationsAdmin = async function() {
  const tbody = document.getElementById('admin-notifications-list');
  tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Loading…</td></tr>';
  const notifications = await fetchAdminNotifications();
  if (notifications.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No notifications found.</td></tr>';
  } else {
    tbody.innerHTML = notifications.map(n => `
      <tr>
        <td><code style="font-size:0.78rem;">${n.orderId.substring(0, 10)}…</code></td>
        <td style="max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${n.userId}</td>
        <td>${n.channel}</td>
        <td><span class="badge ${n.status}">${n.status}</span></td>
        <td style="font-size:0.8rem; color:var(--text-muted);">${new Date(n.createdAt).toLocaleString()}</td>
      </tr>`).join('');
  }
};

// ============================================================
// CATALOG MANAGEMENT (admin only)
// ============================================================
async function fetchCatalog() {
  try {
    const res = await fetch(`${API_BASE}/cakes`);
    if (!res.ok) throw new Error('Failed');
    return await res.json();
  } catch {
    return [];
  }
}

window.loadCatalogAdmin = async function() {
  const tbody   = document.getElementById('admin-catalog-list');
  const countEl = document.getElementById('catalog-count');
  tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Loading…</td></tr>';
  const cakes = await fetchCatalog();
  if (countEl) countEl.textContent = cakes.length;

  if (cakes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No cakes in catalog. Add your first one!</td></tr>';
    return;
  }
  tbody.innerHTML = cakes.map(c => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          ${c.imageUrl ? `<img src="${c.imageUrl}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;" onerror="this.style.display='none'">` : ''}
          <strong>${c.name}</strong>
        </div>
      </td>
      <td><span class="badge admin-role" style="background:rgba(249,115,22,0.1);color:#f97316;">${c.category}</span></td>
      <td><strong>₹${c.price.toFixed(2)}</strong></td>
      <td><span class="badge ${c.available !== false ? 'completed' : 'failed'}">${c.available !== false ? 'Available' : 'Unavailable'}</span></td>
      <td>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline btn-xs" onclick="editCake(${JSON.stringify(c).replace(/"/g, '&quot;')})">Edit</button>
          <button class="btn btn-danger btn-xs" onclick="deleteCake('${c._id}', '${c.name.replace(/'/g, "\\'")}')">Delete</button>
        </div>
      </td>
    </tr>`).join('');
};

// Show / hide form
const showAddFormBtn   = document.getElementById('show-add-form-btn');
const hideCakeFormBtn  = document.getElementById('hide-cake-form-btn');
const cakeFormCard     = document.getElementById('cake-form-card');
const resetCakeFormBtn = document.getElementById('reset-cake-form-btn');

if (showAddFormBtn)  showAddFormBtn.addEventListener('click',  () => { resetCakeForm(); cakeFormCard.style.display = 'block'; cakeFormCard.scrollIntoView({behavior:'smooth'}); });
if (hideCakeFormBtn) hideCakeFormBtn.addEventListener('click', () => { cakeFormCard.style.display = 'none'; });
if (resetCakeFormBtn) resetCakeFormBtn.addEventListener('click', resetCakeForm);

function resetCakeForm() {
  document.getElementById('cake-form').reset();
  document.getElementById('edit-cake-id').value = '';
  document.getElementById('cake-form-title').textContent = 'Add New Cake';
  document.getElementById('cake-form-submit-btn').textContent = 'Save Cake';
  document.getElementById('cake-available').checked = true;
}

window.editCake = function(cake) {
  document.getElementById('edit-cake-id').value   = cake._id;
  document.getElementById('cake-name').value       = cake.name;
  document.getElementById('cake-category').value   = cake.category;
  document.getElementById('cake-description').value= cake.description || '';
  document.getElementById('cake-price').value      = cake.price;
  document.getElementById('cake-image').value      = cake.imageUrl || '';
  document.getElementById('cake-available').checked= cake.available !== false;
  document.getElementById('cake-form-title').textContent = 'Edit Cake';
  document.getElementById('cake-form-submit-btn').textContent = 'Update Cake';
  if (cakeFormCard) { cakeFormCard.style.display = 'block'; cakeFormCard.scrollIntoView({behavior:'smooth'}); }
};

window.deleteCake = async function(cakeId, cakeName) {
  if (!confirm(`Delete "${cakeName}"? This cannot be undone.`)) return;
  try {
    const res = await fetch(`${API_BASE}/cakes/${cakeId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) { showToast('Failed to delete cake', 'error'); return; }
    showToast(`"${cakeName}" deleted successfully`, 'success');
    await loadCatalogAdmin();
  } catch (err) {
    showToast('Error deleting cake', 'error');
  }
};

const cakeForm = document.getElementById('cake-form');
if (cakeForm) {
  cakeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-cake-id').value;
    const payload = {
      name:        document.getElementById('cake-name').value.trim(),
      category:    document.getElementById('cake-category').value.trim(),
      description: document.getElementById('cake-description').value.trim(),
      price:       parseFloat(document.getElementById('cake-price').value),
      imageUrl:    document.getElementById('cake-image').value.trim(),
      available:   document.getElementById('cake-available').checked
    };

    const url    = editId ? `${API_BASE}/cakes/${editId}` : `${API_BASE}/cakes`;
    const method = editId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Failed to save cake', 'error');
        return;
      }
      showToast(editId ? 'Cake updated successfully!' : 'Cake added to catalog!', 'success');
      cakeFormCard.style.display = 'none';
      resetCakeForm();
      await loadCatalogAdmin();
    } catch (err) {
      showToast('Error saving cake', 'error');
    }
  });
}

// ============================================================
// RATINGS (admin — all)
// ============================================================
window.loadRatingsAdmin = async function() {
  const tbody = document.getElementById('admin-ratings-list');
  tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Loading…</td></tr>';
  try {
    const res = await fetch(`${API_BASE}/ratings`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed');
    const ratings = await res.json();
    if (ratings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No ratings yet.</td></tr>';
      return;
    }
    tbody.innerHTML = ratings.map(r => {
      const stars = '★'.repeat(r.score) + '☆'.repeat(5 - r.score);
      return `
        <tr>
          <td><code style="font-size:0.78rem;">${r.cakeId ? r.cakeId.substring(0, 10) : '—'}…</code></td>
          <td style="max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${r.userId || 'Anonymous'}</td>
          <td style="color:#f59e0b; font-size:1rem;">${stars} <span style="color:var(--text-muted);font-size:0.8rem;">(${r.score}/5)</span></td>
          <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${r.comment || '—'}</td>
          <td style="font-size:0.8rem; color:var(--text-muted);">${new Date(r.createdAt).toLocaleString()}</td>
        </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Failed to load ratings.</td></tr>';
  }
};

// Refresh all button
const refreshAllBtn = document.getElementById('refresh-all-btn');
if (refreshAllBtn) refreshAllBtn.addEventListener('click', loadOverview);

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  if (!enforceAdminAuth()) return;
  updateAdminNavbar();
  loadOverview();

  // Auto-refresh overview every 15 seconds
  setInterval(loadOverview, 15000);
});
