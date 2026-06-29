export default function ActivityFeed({ activity }) {
  return (
    <div className="activity-list">
      {activity.map((item) => (
        <div key={item.id} className={`activity-item type-${item.type}`}>
          <div className="activity-dot-wrap">
            <span className="activity-dot" />
          </div>
          <div>
            <div className="activity-msg">{item.message}</div>
            <div className="activity-time">{item.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
