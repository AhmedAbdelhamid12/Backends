import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import DashboardHeader from '../components/DashboardHeader';
import './Dashboard.css';

const ParentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [children, setChildren] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentProgress, setRecentProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, childrenRes, sessionsRes, progressRes] = await Promise.all([
        API.get('/dashboard/parent'),
        API.get('/users?role=trainee'), // This would need to be filtered for parent's children
        API.get('/training-sessions?status=scheduled&limit=5'),
        API.get('/progress?limit=5')
      ]);
      setStats(dashboardRes.data);
      setChildren(childrenRes.data.data?.users || childrenRes.data.users || []);
      setUpcomingSessions(sessionsRes.data.data?.sessions || sessionsRes.data.sessions || []);
      setRecentProgress(progressRes.data.data?.progress || progressRes.data.progress || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data for children progress visualization
  const childrenProgressData = [
    { child: 'Child 1', progress: 75 },
    { child: 'Child 2', progress: 60 },
    { child: 'Child 3', progress: 90 },
    { child: 'Child 4', progress: 45 }
  ];

  const childColumns = [
    {
      key: 'name',
      label: 'Child Name',
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
      key: 'subscription',
      label: 'Subscription',
      render: (_, row) => (
        <span className={`status-badge status-${row.hasActiveSubscription ? 'active' : 'inactive'}`}>
          {row.hasActiveSubscription ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'sessions',
      label: 'Sessions',
      render: (_, row) => (
        <div>
          <div>{row.completedSessions || 0} completed</div>
          <div className="user-email">{row.upcomingSessions || 0} upcoming</div>
        </div>
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
      key: 'child',
      label: 'Child',
      render: (_, row) => (
        <div className="user-cell">
          <div className="user-avatar small">{row.userId?.name?.charAt(0).toUpperCase() || 'C'}</div>
          <div className="user-name small">{row.userId?.name || 'N/A'}</div>
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
      key: 'date',
      label: 'Date & Time',
      render: (value) => new Date(value).toLocaleString()
    }
  ];

  const progressColumns = [
    {
      key: 'child',
      label: 'Child',
      render: (_, row) => (
        <div className="user-cell">
          <div className="user-avatar small">{row.userId?.name?.charAt(0).toUpperCase() || 'C'}</div>
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
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className="badge badge-trainee">
          {value}
        </span>
      )
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (value) => (
        <div className="progress-notes">
          {value?.substring(0, 50)}{value?.length > 50 ? '...' : ''}
        </div>
      )
    }
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="dashboard">
      <DashboardHeader 
        title="Parent Dashboard"
        subtitle="Monitor your children's progress and sessions"
      />

      <div className="stats-grid">
        <StatCard
          title="Children"
          value={children.length || 0}
          icon="👶"
          color="primary"
          trend="neutral"
          trendValue="Registered"
        />
        <StatCard
          title="Active Subscriptions"
          value={children.filter(c => c.hasActiveSubscription).length || 0}
          icon="🎫"
          color="success"
          trend="up"
          trendValue="+1 this month"
        />
        <StatCard
          title="Upcoming Sessions"
          value={upcomingSessions.length || 0}
          icon="📅"
          color="info"
          trend="neutral"
          trendValue="This week"
        />
        <StatCard
          title="Completed Sessions"
          value={children.reduce((sum, child) => sum + (child.completedSessions || 0), 0) || 0}
          icon="✅"
          color="success"
          trend="up"
          trendValue="+5 this month"
        />
      </div>

      {/* Children Progress Overview Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Children Progress Overview</h2>
          <Button size="small" variant="outline">View Detailed Report</Button>
        </div>
        <div className="chart-container">
          <div className="chart-info">
            <h3>Children Progress Comparison</h3>
            <p className="chart-description">Compare progress across your children</p>
          </div>
          <div className="chart-visualization">
            <div className="chart-bars">
              {childrenProgressData.map((data, index) => (
                <div key={index} className="chart-bar-container">
                  <div 
                    className="chart-bar" 
                    style={{ height: `${data.progress}%`, background: `linear-gradient(180deg, var(--accent-${500 - Math.floor(index/2)*100}) 0%, var(--accent-${300 - Math.floor(index/2)*100}) 100%)` }}
                  ></div>
                  <span className="chart-label">{data.child}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>My Children</h2>
            <Button size="small" variant="outline" onClick={() => navigate('/users')}>
              View All
            </Button>
          </div>
          <Table
            columns={childColumns}
            data={children}
            pagination={false}
            emptyMessage="No children registered"
          />
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Upcoming Sessions</h2>
            <Button size="small" variant="outline" onClick={() => navigate('/sessions')}>
              View All
            </Button>
          </div>
          <Table
            columns={sessionColumns}
            data={upcomingSessions}
            pagination={false}
            emptyMessage="No upcoming sessions"
          />
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Progress</h2>
          <Button size="small" variant="outline" onClick={() => navigate('/progress')}>
            View All
          </Button>
        </div>
        <Table
          columns={progressColumns}
          data={recentProgress}
          pagination={false}
          emptyMessage="No progress entries"
        />
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-card" onClick={() => navigate('/users')}>
            <span className="action-icon">👶</span>
            <span className="action-title">Manage Children</span>
          </button>
          <button className="action-card" onClick={() => navigate('/sessions')}>
            <span className="action-icon">📅</span>
            <span className="action-title">View Sessions</span>
          </button>
          <button className="action-card" onClick={() => navigate('/subscriptions')}>
            <span className="action-icon">🎫</span>
            <span className="action-title">Subscriptions</span>
          </button>
          <button className="action-card" onClick={() => navigate('/progress')}>
            <span className="action-icon">📈</span>
            <span className="action-title">Progress Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;