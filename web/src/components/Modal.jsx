import { useEffect } from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'medium',
  closeOnOutsideClick = true,
  closeOnEscape = true,
  backdropVariant = 'default',
  headerVariant = 'default',
  footerVariant = 'default',
  shadowVariant = 'default',
  className = '',
  ...props
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && closeOnEscape) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const overlayClasses = [
    'modal-overlay',
    backdropVariant === 'blur' && 'backdrop-blur',
    backdropVariant === 'dark' && 'backdrop-dark',
    className
  ].filter(Boolean).join(' ');

  const contentClasses = [
    'modal-content',
    `modal-${size}`,
    shadowVariant === 'light' && 'shadow-light',
    shadowVariant === 'heavy' && 'shadow-heavy'
  ].filter(Boolean).join(' ');

  const headerClasses = [
    'modal-header',
    headerVariant === 'no-border' && 'no-border',
    headerVariant === 'primary' && 'primary'
  ].filter(Boolean).join(' ');

  const footerClasses = [
    'modal-footer',
    footerVariant === 'no-border' && 'no-border',
    footerVariant === 'sticky' && 'sticky'
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={overlayClasses}
      onClick={closeOnOutsideClick ? onClose : undefined}
      {...props}
    >
      <div 
        className={contentClasses}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={headerClasses}>
          <h3 className="modal-title">{title}</h3>
          <button 
            className="modal-close" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className={footerClasses}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;