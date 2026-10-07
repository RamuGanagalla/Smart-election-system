export default function StatCard({ title, value, change, icon: Icon, tone = "blue" }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={21} /></div>
      <div className="stat-info">
        <span>{title}</span>
        <strong>{value}</strong>
        {change && <small className={change.startsWith("-") ? "negative" : "positive"}>{change}</small>}
      </div>
    </div>
  );
}