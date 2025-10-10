import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', fullScreen = false }) => {
  const sizeMap = {
    small: '24px',
    medium: '48px',
    large: '64px'
  };

  const spinnerSize = sizeMap[size] || sizeMap.medium;

  const spinner = (
    <div className="spinner-wrapper">
      <div 
        className="spinner" 
        style={{ width: spinnerSize, height: spinnerSize }}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
