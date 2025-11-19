import './Card.css';

const Card = ({
  children,
  title,
  subtitle,
  actions,
  variant = 'default',
  size = 'medium',
  hoverable = false,
  className = '',
  ...props
}) => {
  const cardClasses = [
    'card',
    `card-${variant}`,
    `card-${size}`,
    hoverable && 'card-hoverable',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {(title || subtitle || actions) && (
        <div className="card-header">
          <div className="card-header-content">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default Card;