import { useState, useEffect } from 'react';
import API from '../services/api';
import './Dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await API.get('/dashboard/admin');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-value">{stats?.totalUsers || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Active Subscriptions</h3>
          <p className="stat-value">{stats?.activeSubscriptions || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">${stats?.totalRevenue || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Academies</h3>
          <p className="stat-value">{stats?.totalAcademies || 0}</p>
        </div>
      </div>

      <div className="sections">
        <section className="section">
          <h3>Recent Activities</h3>
          <div className="activity-list">
            {stats?.recentActivities?.map((activity, index) => (
              <div key={index} className="activity-item">
                <span>{activity.description}</span>
                <span className="activity-time">{new Date(activity.createdAt).toLocaleDateString()}</span>
              </div>
            )) || <p>No recent activities</p>}
          </div>
        </section>

        <section className="section">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn">Manage Users</button>
            <button className="action-btn">View Reports</button>
            <button className="action-btn">Manage Academies</button>
            <button className="action-btn">Settings</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
