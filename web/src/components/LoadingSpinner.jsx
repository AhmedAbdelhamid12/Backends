import './LoadingSpinner.css';

const LoadingSpinner = ({
  size = 'medium',
  variant = 'primary',
  fullScreen = false,
  overlay = false,
  darkOverlay = false,
  text = '',
  type = 'spinner',
  className = '',
  ...props
}) => {
  const spinnerClasses = [
    'spinner',
    `spinner-${size}`,
    `spinner-${variant}`,
    className
  ].filter(Boolean).join(' ');

  const renderSpinner = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="loading-dots">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        );
      
      case 'progress':
        return (
          <div className="loading-progress">
            <div className="loading-progress-bar"></div>
          </div>
        );
      
      case 'skeleton':
        return (
          <div className="skeleton" {...props}>
            {props.children}
          </div>
        );
      
      default:
        return <div className={spinnerClasses}></div>;
    }
  };

  if (fullScreen || overlay) {
    return (
      <div className={`loading-overlay ${darkOverlay ? 'dark' : ''}`}>
        <div className="loading-content">
          {renderSpinner()}
          {text && <p className="loading-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="loading-spinner" {...props}>
      {renderSpinner()}
      {text && <span className="loading-text">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;