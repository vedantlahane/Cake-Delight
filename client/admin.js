const GATEWAY_BASE = 'http://localhost:8080';
const API_BASE = `${GATEWAY_BASE}/api`;

async function fetchAdminOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function fetchAdminNotifications() {
  try {
    const res = await fetch(`${API_BASE}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

function renderOrders(orders) {
  const tbody = document.getElementById('admin-orders-list');
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No orders found.</td></tr>';
    return;
  }
  
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td>${o._id.substring(0, 8)}...</td>
      <td><strong>${o.userId}</strong></td>
      <td>$${o.total.toFixed(2)}</td>
      <td><span class="status-badge status-${o.status}">${o.status}</span></td>
      <td>${new Date(o.createdAt).toLocaleString()}</td>
    </tr>
  `).join('');
}

function renderNotifications(notifications) {
  const tbody = document.getElementById('admin-notifications-list');
  if (notifications.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No notifications found.</td></tr>';
    return;
  }
  
  tbody.innerHTML = notifications.map(n => `
    <tr>
      <td>${n.orderId.substring(0, 8)}...</td>
      <td><strong>${n.userId}</strong></td>
      <td>${n.channel}</td>
      <td><span class="status-badge status-${n.status}">${n.status}</span></td>
      <td>${new Date(n.createdAt).toLocaleString()}</td>
    </tr>
  `).join('');
}

async function loadDashboard() {
  const [orders, notifications] = await Promise.all([
    fetchAdminOrders(),
    fetchAdminNotifications()
  ]);
  
  renderOrders(orders);
  renderNotifications(notifications);
}

// Auto-refresh every 5 seconds
setInterval(loadDashboard, 5000);
document.addEventListener('DOMContentLoaded', loadDashboard);
