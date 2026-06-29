const NAV = [
  { icon: '📊', label: 'Dashboard' },
  { icon: '👥', label: 'Users' },
  { icon: '📦', label: 'Orders' },
  { icon: '💳', label: 'Payments' },
  { icon: '⚙️', label: 'Settings' },
];

// Utility to fetch data
async function fetchAPI(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (e) {
    console.error(`Error fetching ${url}:`, e);
    return null;
  }
}

// Initialize sidebar navigation
function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = NAV.map((item, idx) => 
    `<button class="nav-item ${idx === 0 ? 'active' : ''}" data-page="${item.label}">
      <span class="nav-icon">${item.icon}</span>
      ${item.label}
    </button>`
  ).join('');
  
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('pageTitle').textContent = btn.dataset.page;
    });
  });
}

// Render stats cards
function renderStats(stats) {
  const grid = document.getElementById('statsGrid');
  const cards = [
    { icon: '👥', label: 'Total Users',      value: stats.totalUsers.toLocaleString(),  change: stats.changes.totalUsers },
    { icon: '💰', label: 'Revenue',           value: `$${stats.revenue.toLocaleString()}`, change: stats.changes.revenue },
    { icon: '📦', label: 'Orders',            value: stats.orders.toLocaleString(),      change: stats.changes.orders },
    { icon: '🟢', label: 'Active Sessions',   value: stats.activeSessions.toLocaleString(), change: stats.changes.activeSessions },
  ];
  
  grid.innerHTML = cards.map(c => `
    <div class="stat-card">
      <div class="stat-icon">${c.icon}</div>
      <div class="stat-label">${c.label}</div>
      <div class="stat-value">${c.value}</div>
      <div class="stat-change ${c.change >= 0 ? 'up' : 'down'}">
        ${c.change >= 0 ? '▲' : '▼'} ${Math.abs(c.change)}% vs last month
      </div>
    </div>
  `).join('');
}

// Render users table
function renderUsers(users) {
  const container = document.getElementById('usersContainer');
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Joined</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>${u.id}</td>
            <td class="user-name">${u.name}</td>
            <td>${u.email}</td>
            <td><span class="role-badge role-${u.role}">${u.role}</span></td>
            <td><span class="status-${u.status}"><span class="status-dot"></span>${u.status}</span></td>
            <td>${u.joined}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Render activity feed
function renderActivity(activity) {
  const container = document.getElementById('activityContainer');
  container.innerHTML = `
    <div class="activity-list">
      ${activity.map(item => `
        <div class="activity-item type-${item.type}">
          <div class="activity-dot-wrap">
            <span class="activity-dot"></span>
          </div>
          <div>
            <div class="activity-msg">${item.message}</div>
            <div class="activity-time">${item.time}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Load all data on page load
async function init() {
  renderNav();
  
  // Load and render stats
  const stats = await fetchAPI('/api/stats');
  if (stats) renderStats(stats);
  
  // Load and render users
  const users = await fetchAPI('/api/users');
  if (users) renderUsers(users);
  
  // Load and render activity
  const activity = await fetchAPI('/api/activity');
  if (activity) renderActivity(activity);
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', init);
