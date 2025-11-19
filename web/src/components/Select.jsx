import { useState, useRef, useEffect } from 'react';
import './Select.css';

const Select = ({ 
  label, 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select an option',
  error,
  success,
  helperText,
  fullWidth = false,
  icon,
  searchable = false,
  multiple = false,
  disabled = false,
  required = false,
  size = 'medium',
  variant = 'default',
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleSelect = (option) => {
    if (option.disabled) return;
    
    if (multiple) {
      const newValue = value?.includes(option.value)
        ? value.filter(v => v !== option.value)
        : [...(value || []), option.value];
      onChange?.(newValue);
    } else {
      onChange?.(option.value);
      setIsOpen(false);
    }
  };

  const selectedLabel = multiple
    ? options.filter(opt => value?.includes(opt.value)).map(opt => opt.label).join(', ')
    : options.find(opt => opt.value === value)?.label;

  const removeTag = (optionValue) => {
    const newValue = value?.filter(v => v !== optionValue);
    onChange?.(newValue);
  };

  const containerClasses = [
    'select-container',
    isOpen && 'select-open',
    error && 'select-error',
    success && 'select-success',
    disabled && 'select-disabled',
    size === 'small' && 'select-small',
    size === 'large' && 'select-large',
    variant === 'ghost' && 'select-ghost',
    className
  ].filter(Boolean).join(' ');

  const wrapperClasses = [
    'select-wrapper',
    fullWidth && 'select-full-width'
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses} ref={selectRef}>
      {label && (
        <label className="select-label">
          {label}
          {required && <span className="select-required">*</span>}
        </label>
      )}
      
      <div 
        className={containerClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {icon && <span className="select-icon">{icon}</span>}
        <div className={`select-value ${multiple ? 'select-multiple' : ''}`}>
          {multiple ? (
            value?.map(val => {
              const option = options.find(opt => opt.value === val);
              return option ? (
                <span key={val} className="select-tag">
                  {option.label}
                  <button 
                    className="select-tag-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(val);
                    }}
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })
          ) : selectedLabel ? (
            selectedLabel
          ) : (
            <span className="select-placeholder">{placeholder}</span>
          )}
        </div>
        <span className={`select-arrow ${isOpen ? 'select-arrow-up' : ''}`}>▼</span>
      </div>

      {isOpen && (
        <div className="select-dropdown">
          {searchable && (
            <input
              type="text"
              className="select-search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          )}
          <div className="select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`select-option ${
                    multiple 
                      ? value?.includes(option.value) ? 'select-option-selected' : ''
                      : value === option.value ? 'select-option-selected' : ''
                  } ${option.disabled ? 'select-option-disabled' : ''}`}
                  onClick={() => handleSelect(option)}
                >
                  {multiple && (
                    <input
                      type="checkbox"
                      checked={value?.includes(option.value)}
                      readOnly
                    />
                  )}
                  {option.label}
                </div>
              ))
            ) : (
              <div className="select-no-options">No options found</div>
            )}
          </div>
        </div>
      )}

      {error && <span className="select-error-text">{error}</span>}
      {!error && helperText && <span className="select-helper-text">{helperText}</span>}
    </div>
  );
};

export default Select;