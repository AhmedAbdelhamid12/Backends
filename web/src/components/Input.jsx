import './Input.css';

const Input = ({
  label,
  error,
  success,
  helperText,
  icon,
  fullWidth = false,
  disabled = false,
  readOnly = false,
  className = '',
  type = 'text',
  ...props
}) => {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const inputClasses = [
    'input',
    icon && 'input-with-icon',
    error && 'input-error',
    success && 'input-success',
    disabled && 'input-disabled',
    readOnly && 'input-readonly',
    type === 'textarea' && 'input-textarea',
    type === 'select' && 'input-select',
    type === 'search' && 'input-search',
    type === 'number' && 'input-number',
    type === 'date' && 'input-date',
    type === 'file' && 'input-file',
    className
  ].filter(Boolean).join(' ');

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          id={inputId}
          className={inputClasses}
          disabled={disabled}
          readOnly={readOnly}
          {...props}
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          id={inputId}
          className={inputClasses}
          disabled={disabled}
          {...props}
        />
      );
    }

    return (
      <input
        id={inputId}
        type={type}
        className={inputClasses}
        disabled={disabled}
        readOnly={readOnly}
        {...props}
      />
    );
  };

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-full-width' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {icon && <span className="input-icon">{icon}</span>}
          {label}
          {props.required && <span className="input-required">*</span>}
        </label>
      )}
      
      <div className="input-container">
        {!label && icon && <span className="input-icon">{icon}</span>}
        {renderInput()}
      </div>

      {error && (
        <span className="input-error-text">
          {error}
        </span>
      )}
      
      {!error && helperText && (
        <span className="input-helper-text">
          {helperText}
        </span>
      )}
    </div>
  );
};

export default Input;