type StatCardProps = {
  icon: string;
  label: string;
  value: number | string;
  sub?: string;
  accent?: 'default' | 'danger' | 'warning' | 'success';
};

const accentMap: Record<string, string> = {
  default: 'var(--primary)',
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  success: 'var(--success)',
};

function StatCard({ icon, label, value, sub, accent = 'default' }: StatCardProps) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${accentMap[accent]}` }}>
      <span className="stat-card-icon">{icon}</span>
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value" style={{ color: accentMap[accent] }}>
        {value}
      </span>
      {sub && <span className="stat-card-sub">{sub}</span>}
    </div>
  );
}

export default StatCard;
