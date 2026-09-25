export function MetricCard({ label, value, icon: Icon, tone = 'blue', onClick, hint }) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag className={`stat-card ${tone} ${onClick ? 'clickable' : ''}`} onClick={onClick} type={onClick ? 'button' : undefined}>
      <div className="stat-icon"><Icon size={20} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <em className="stat-hint">{hint}</em> : null}
    </Tag>
  );
}
