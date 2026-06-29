export default function StatsCard({ icon, label, value, change }) {
  const isUp = change >= 0;
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-change ${isUp ? 'up' : 'down'}`}>
        {isUp ? '▲' : '▼'} {Math.abs(change)}% vs last month
      </div>
    </div>
  );
}
