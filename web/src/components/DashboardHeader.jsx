import './DashboardHeader.css';

const DashboardHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="dashboard-header">
      <div className="dashboard-header-content">
        <div>
          <h1 className="dashboard-title">{title}</h1>
          {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
        </div>
        {actions && (
          <div className="dashboard-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;