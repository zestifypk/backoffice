const NAV = [
  { icon: '📊', label: 'Dashboard' },
  { icon: '👥', label: 'Users' },
  { icon: '📦', label: 'Orders' },
  { icon: '💳', label: 'Payments' },
  { icon: '⚙️', label: 'Settings' },
];

let authToken = localStorage.getItem('access_token');

// Utility to fetch data
async function fetchAPI(url) {
  try {
    const headers = authToken
      ? {
          Authorization: `Bearer ${authToken}`,
        }
      : {};
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (e) {
    console.error(`Error fetching ${url}:`, e);
    return null;
  }
}

function renderLoginForm() {
  const container = document.getElementById('usersContainer');
  container.innerHTML = `
    <div class="login-box">
      <h3>Login to Load Users</h3>
      <p>Use seeded admin credentials to fetch users from database.</p>
      <form id="loginForm">
        <label>Email</label>
        <input type="email" name="email" value="admin@example.com" required />
        <label>Password</label>
        <input type="password" name="password" value="Admin@12345" required />
        <button type="submit">Login & Load Users</button>
      </form>
      <div class="error-msg" id="loginError" style="display:none;"></div>
    </div>
  `;

  const form = document.getElementById('loginForm');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Login failed');
      }

      authToken = payload.token;
      localStorage.setItem('access_token', authToken);
      await loadUsers();
    } catch (error) {
      const errorBox = document.getElementById('loginError');
      errorBox.style.display = 'block';
      errorBox.textContent = error.message;
    }
  });
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

async function loadUsers() {
  if (!authToken) {
    renderLoginForm();
    return;
  }

  const users = await fetchAPI('/api/users');
  if (!users) {
    renderLoginForm();
    return;
  }
  renderUsers(users);
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
  await loadUsers();
  
  // Load and render activity
  const activity = await fetchAPI('/api/activity');
  if (activity) renderActivity(activity);
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', init);
