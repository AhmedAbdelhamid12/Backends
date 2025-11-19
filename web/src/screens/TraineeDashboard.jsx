import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import DashboardHeader from '../components/DashboardHeader';
import './Dashboard.css';

const TraineeDashboard = () => {
  const [stats, setStats] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentProgress, setRecentProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, sessionsRes, progressRes] = await Promise.all([
        API.get('/dashboard/trainee'),
        API.get('/training-sessions?status=scheduled&limit=5'),
        API.get('/progress?limit=5')
      ]);
      setStats(dashboardRes.data);
      setUpcomingSessions(sessionsRes.data.data?.sessions || sessionsRes.data.sessions || []);
      setRecentProgress(progressRes.data.data?.progress || progressRes.data.progress || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data for progress visualization
  const progressData = [
    { week: 'Week 1', progress: 20 },
    { week: 'Week 2', progress: 35 },
    { week: 'Week 3', progress: 50 },
    { week: 'Week 4', progress: 75 },
    { week: 'Week 5', progress: 85 },
    { week: 'Week 6', progress: 95 }
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
      key: 'date',
      label: 'Date & Time',
      render: (value) => new Date(value).toLocaleString()
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value) => `${value} min`
    }
  ];

  const progressColumns = [
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
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <Button size="small" variant="outline" onClick={() => navigate(`/progress/${row._id}`)}>
          View
        </Button>
      )
    }
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="dashboard">
      <DashboardHeader 
        title="Trainee Dashboard"
        subtitle="Track your progress and upcoming sessions"
      />

      <div className="stats-grid">
        <StatCard
          title="Active Subscription"
          value={stats?.overview?.hasActiveSubscription ? 'Active' : 'None'}
          icon="🎫"
          color={stats?.overview?.hasActiveSubscription ? 'success' : 'warning'}
          trend={stats?.overview?.hasActiveSubscription ? 'up' : 'down'}
          trendValue={stats?.overview?.hasActiveSubscription ? 'Valid until ' + new Date(stats?.overview?.subscriptionEndDate).toLocaleDateString() : 'No active subscription'}
        />
        <StatCard
          title="Upcoming Sessions"
          value={stats?.overview?.upcomingSessions || 0}
          icon="📅"
          color="info"
          trend="neutral"
          trendValue="Scheduled"
        />
        <StatCard
          title="Completed Sessions"
          value={stats?.overview?.completedSessions || 0}
          icon="✅"
          color="success"
          trend="up"
          trendValue="+2 this month"
        />
        <StatCard
          title="Progress Entries"
          value={stats?.overview?.progressEntries || 0}
          icon="📈"
          color="primary"
          trend="up"
          trendValue="+3 this month"
        />
      </div>

      {/* Progress Overview Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Progress Overview</h2>
          <Button size="small" variant="outline">View Detailed Report</Button>
        </div>
        <div className="chart-container">
          <div className="chart-info">
            <h3>Weekly Progress</h3>
            <p className="chart-description">Track your training progress over time</p>
          </div>
          <div className="chart-visualization">
            <div className="chart-bars">
              {progressData.map((data, index) => (
                <div key={index} className="chart-bar-container">
                  <div 
                    className="chart-bar" 
                    style={{ height: `${data.progress}%`, background: `linear-gradient(180deg, var(--success-${500 - Math.floor(index/2)*100}) 0%, var(--success-${300 - Math.floor(index/2)*100}) 100%)` }}
                  ></div>
                  <span className="chart-label">{data.week}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
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
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-card" onClick={() => navigate('/sessions')}>
            <span className="action-icon">📅</span>
            <span className="action-title">My Sessions</span>
          </button>
          <button className="action-card" onClick={() => navigate('/progress')}>
            <span className="action-icon">📈</span>
            <span className="action-title">Track Progress</span>
          </button>
          <button className="action-card" onClick={() => navigate('/subscriptions')}>
            <span className="action-icon">🎫</span>
            <span className="action-title">Subscriptions</span>
          </button>
          <button className="action-card">
            <span className="action-icon">🏆</span>
            <span className="action-title">Achievements</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TraineeDashboard;