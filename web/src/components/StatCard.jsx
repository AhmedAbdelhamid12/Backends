import './StatCard.css';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue,
  color = 'primary',
  loading = false
}) => {
  return (
    <div className={`stat-card stat-card-${color}`}>
      {loading ? (
        <div className="stat-card-loading">
          <div className="skeleton-circle"></div>
          <div className="skeleton-text"></div>
        </div>
      ) : (
        <>
          <div className="stat-card-icon">
            {icon}
          </div>
          <div className="stat-card-content">
            <h3 className="stat-card-title">{title}</h3>
            <p className="stat-card-value">{value}</p>
            {trend && (
              <div className={`stat-card-trend stat-card-trend-${trend}`}>
                <span className="trend-icon">
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                </span>
                <span className="trend-value">{trendValue}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StatCard;
