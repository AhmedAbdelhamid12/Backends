import './StatCard.css';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue,
  color = 'primary',
  loading = false,
  variant = 'default',
  className = '',
  ...props
}) => {
  const cardClasses = [
    'stat-card',
    `stat-card-${color}`,
    variant === 'compact' && 'stat-card-compact',
    variant === 'large' && 'stat-card-large',
    variant === 'no-shadow' && 'stat-card-no-shadow',
    variant === 'elevated' && 'stat-card-elevated',
    className
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className={cardClasses} {...props}>
        <div className="stat-card-loading">
          <div className="skeleton-header">
            <div className="skeleton-text">
              <div className="skeleton-title"></div>
              <div className="skeleton-value"></div>
            </div>
            <div className="skeleton-icon"></div>
          </div>
          <div className="skeleton-trend"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClasses} {...props}>
      <div className="stat-card-content">
        <div className="stat-card-header">
          <div className="stat-card-text">
            <h3 className="stat-card-title">{title}</h3>
            <p className="stat-card-value">{value}</p>
          </div>
          {icon && (
            <div className="stat-card-icon">
              {icon}
            </div>
          )}
        </div>
        
        {trend && (
          <div className={`stat-card-trend stat-card-trend-${trend}`}>
            <span className="trend-icon">
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </span>
            <span className="trend-value">{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;