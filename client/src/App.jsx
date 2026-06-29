import { useEffect, useState } from 'react';
import StatsCard from './components/StatsCard';
import UsersTable from './components/UsersTable';
import ActivityFeed from './components/ActivityFeed';

const NAV = [
  { icon: '📊', label: 'Dashboard' },
  { icon: '👥', label: 'Users' },
  { icon: '📦', label: 'Orders' },
  { icon: '💳', label: 'Payments' },
  { icon: '⚙️', label: 'Settings' },
];

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

export default function App() {
  const stats    = useFetch('/api/stats');
  const users    = useFetch('/api/users');
  const activity = useFetch('/api/activity');

  const [activeNav, setActiveNav] = useState('Dashboard');

  const statsCards = stats.data
    ? [
        { icon: '👥', label: 'Total Users',      value: stats.data.totalUsers.toLocaleString(),  change: stats.data.changes.totalUsers },
        { icon: '💰', label: 'Revenue',           value: `$${stats.data.revenue.toLocaleString()}`, change: stats.data.changes.revenue },
        { icon: '📦', label: 'Orders',            value: stats.data.orders.toLocaleString(),      change: stats.data.changes.orders },
        { icon: '🟢', label: 'Active Sessions',   value: stats.data.activeSessions.toLocaleString(), change: stats.data.changes.activeSessions },
      ]
    : [];

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">Back<span>office</span></div>
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <div
              key={item.label}
              className={`nav-item ${activeNav === item.label ? 'active' : ''}`}
              onClick={() => setActiveNav(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">v1.0.0 · Backoffice</div>
      </aside>

      {/* Main */}
      <div className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-title">{activeNav}</div>
          <div className="topbar-right">
            <span className="badge">Live</span>
            <div className="avatar">AJ</div>
          </div>
        </header>

        {/* Content */}
        <main className="content">
          {/* Stats */}
          <div className="section-title">Overview</div>
          {stats.loading && <div className="loading">Loading stats…</div>}
          {stats.error   && <div className="error-msg">Error: {stats.error}</div>}
          {stats.data && (
            <div className="stats-grid">
              {statsCards.map((c) => <StatsCard key={c.label} {...c} />)}
            </div>
          )}

          {/* Users + Activity */}
          <div className="grid-2">
            {/* Users Table */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Users</div>
              </div>
              <div className="card-body">
                {users.loading && <div className="loading">Loading users…</div>}
                {users.error   && <div className="error-msg">Error: {users.error}</div>}
                {users.data    && <UsersTable users={users.data} />}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Recent Activity</div>
              </div>
              <div className="card-body">
                {activity.loading && <div className="loading">Loading…</div>}
                {activity.error   && <div className="error-msg">Error: {activity.error}</div>}
                {activity.data    && <ActivityFeed activity={activity.data} />}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
