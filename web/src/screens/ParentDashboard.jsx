import { useState, useEffect } from 'react';
import API from '../services/api';
import './Dashboard.css';

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [childrenRes, paymentsRes] = await Promise.all([
        API.get('/users/my-children'),
        API.get('/payments/my-payments')
      ]);
      setChildren(childrenRes.data.children || []);
      setPayments(paymentsRes.data.payments || []);
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
      <h2>Parent Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Children</h3>
          <p className="stat-value">{children.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Payments</h3>
          <p className="stat-value">${payments.reduce((sum, p) => sum + (p.amount || 0), 0)}</p>
        </div>
        <div className="stat-card">
          <h3>Active Subscriptions</h3>
          <p className="stat-value">{children.filter(c => c.subscription?.status === 'active').length}</p>
        </div>
      </div>

      <div className="sections">
        <section className="section">
          <h3>My Children</h3>
          <div className="list">
            {children.map((child) => (
              <div key={child._id} className="list-item">
                <div>
                  <strong>{child.name}</strong>
                  <p>Level: {child.progress?.level || 'Beginner'}</p>
                  <p>Sessions Attended: {child.progress?.sessionsAttended || 0}</p>
                </div>
                <span className={`status ${child.subscription?.status}`}>
                  {child.subscription?.status || 'Inactive'}
                </span>
              </div>
            ))}
            {children.length === 0 && <p>No children registered</p>}
          </div>
        </section>

        <section className="section">
          <h3>Payment History</h3>
          <div className="list">
            {payments.slice(0, 5).map((payment) => (
              <div key={payment._id} className="list-item">
                <div>
                  <strong>${payment.amount}</strong>
                  <p>{payment.description}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`status ${payment.status}`}>{payment.status}</span>
                  <p className="date">{new Date(payment.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {payments.length === 0 && <p>No payment history</p>}
          </div>
        </section>

        <section className="section">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn">Add Child</button>
            <button className="action-btn">Make Payment</button>
            <button className="action-btn">View Schedule</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ParentDashboard;
