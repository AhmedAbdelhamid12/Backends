import { useEffect } from 'react';
import './Toast.css';

const Toast = ({ 
  id, 
  title, 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose,
  showProgress = true,
  icon,
  ...props
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const toastClasses = [
    'toast',
    `toast-${type}`
  ].filter(Boolean).join(' ');

  return (
    <div className={toastClasses} {...props}>
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-content">
        {title && <h4 className="toast-title">{title}</h4>}
        {message && <p className="toast-message">{message}</p>}
      </div>
      <button 
        className="toast-close" 
        onClick={() => onClose(id)}
        aria-label="Close toast"
      >
        ×
      </button>
      {showProgress && duration > 0 && (
        <div className="toast-progress">
          <div 
            className="toast-progress-bar" 
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;