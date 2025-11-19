import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import DashboardHeader from '../components/DashboardHeader';
import Card from '../components/Card';
import './Dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, usersRes, sessionsRes] = await Promise.all([
        API.get('/dashboard/admin'),
        API.get('/users?limit=5'),
        API.get('/training-sessions?limit=5')
      ]);
      
      setStats(dashboardRes.data);
      setRecentUsers(usersRes.data.data?.users || usersRes.data.users || []);
      setRecentSessions(sessionsRes.data.data?.sessions || sessionsRes.data.sessions || []);
      
      // Generate mock chart data for demonstration
      const mockChartData = [
        { month: 'Jan', users: 40, revenue: 4000 },
        { month: 'Feb', users: 30, revenue: 3000 },
        { month: 'Mar', users: 20, revenue: 2000 },
        { month: 'Apr', users: 27, revenue: 2700 },
        { month: 'May', users: 18, revenue: 1800 },
        { month: 'Jun', users: 23, revenue: 2300 },
        { month: 'Jul', users: 34, revenue: 3400 },
      ];
      setChartData(mockChartData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const userColumns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <div className="user-cell">
          <div className="user-avatar">{value.charAt(0).toUpperCase()}</div>
          <div>
            <div className="user-name">{value}</div>
            <div className="user-email">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <span className={`badge badge-${value}`}>
          {value}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`status-badge status-${value}`}>
          {value}
        </span>
      )
    }
  ];

  const sessionColumns = [
    {
      key: 'title',
      label: 'Session',
      render: (value, row) => (
        <div>
          <div className="session-title">{row.title || 'Training Session'}</div>
          <div className="session-type">{row.type}</div>
        </div>
      )
    },
    {
      key: 'coach',
      label: 'Coach',
      render: (_, row) => (
        <div className="user-cell">
          <div className="user-avatar small">{row.coachId?.name?.charAt(0).toUpperCase() || 'C'}</div>
          <div className="user-name small">{row.coachId?.name || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'user',
      label: 'Trainee',
      render: (_, row) => (
        <div className="user-cell">
          <div className="user-avatar small">{row.userId?.name?.charAt(0).toUpperCase() || 'T'}</div>
          <div className="user-name small">{row.userId?.name || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`status-badge status-${value}`}>
          {value}
        </span>
      )
    }
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="dashboard">
      <DashboardHeader 
        title="Admin Dashboard"
        subtitle="Welcome back! Here's what's happening with your academy"
        actions={
          <Button onClick={() => navigate('/users')}>
            Manage Users
          </Button>
        }
      />

      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon="👥"
          color="primary"
          trend="up"
          trendValue="+12% from last month"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions || 0}
          icon="🎫"
          color="success"
          trend="up"
          trendValue="+8% from last month"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue || 0}`}
          icon="💰"
          color="warning"
          trend="up"
          trendValue="+15% from last month"
        />
        <StatCard
          title="Recent Sessions"
          value={stats?.recentSessions || 0}
          icon="🏊"
          color="info"
          trend="neutral"
          trendValue="Last 7 days"
        />
      </div>

      <div className="dashboard-grid">
        <Card className="dashboard-card">
          <div className="card-header">
            <h3>Performance Overview</h3>
            <Button size="small" variant="outline">View Report</Button>
          </div>
          <div className="card-content">
            <div className="chart-placeholder">
              <div className="chart-info">
                <h4>Monthly Growth</h4>
                <p className="chart-description">Track your academy's performance over time</p>
              </div>
              <div className="chart-visualization">
                <div className="chart-bars">
                  {chartData.map((data, index) => (
                    <div key={index} className="chart-bar-container">
                      <div 
                        className="chart-bar" 
                        style={{ height: `${(data.users / 50) * 100}%` }}
                      ></div>
                      <span className="chart-label">{data.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="dashboard-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <Button size="small" variant="outline">View All</Button>
          </div>
          <div className="card-content">
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon primary">👤</div>
                <div className="activity-content">
                  <h4>New User Registered</h4>
                  <p>John Doe joined the academy</p>
                  <span className="activity-time">2 hours ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon success">📅</div>
                <div className="activity-content">
                  <h4>Session Scheduled</h4>
                  <p>Swimming lesson with Coach Smith</p>
                  <span className="activity-time">5 hours ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon warning">💳</div>
                <div className="activity-content">
                  <h4>Payment Received</h4>
                  <p>Monthly subscription payment</p>
                  <span className="activity-time">1 day ago</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Users</h2>
            <Button size="small" variant="outline" onClick={() => navigate('/users')}>
              View All
            </Button>
          </div>
          <Table
            columns={userColumns}
            data={recentUsers}
            pagination={false}
            emptyMessage="No users found"
          />
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Sessions</h2>
            <Button size="small" variant="outline" onClick={() => navigate('/sessions')}>
              View All
            </Button>
          </div>
          <Table
            columns={sessionColumns}
            data={recentSessions}
            pagination={false}
            emptyMessage="No sessions found"
          />
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-card" onClick={() => navigate('/users')}>
            <span className="action-icon">👥</span>
            <span className="action-title">Manage Users</span>
          </button>
          <button className="action-card" onClick={() => navigate('/sessions')}>
            <span className="action-icon">📅</span>
            <span className="action-title">Schedule Session</span>
          </button>
          <button className="action-card" onClick={() => navigate('/subscriptions')}>
            <span className="action-icon">💳</span>
            <span className="action-title">Subscriptions</span>
          </button>
          <button className="action-card" onClick={() => navigate('/reports')}>
            <span className="action-icon">📊</span>
            <span className="action-title">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;