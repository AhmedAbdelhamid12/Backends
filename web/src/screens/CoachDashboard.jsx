import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import DashboardHeader from '../components/DashboardHeader';
import './Dashboard.css';

const CoachDashboard = () => {
  const [stats, setStats] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentTrainees, setRecentTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, sessionsRes, traineesRes] = await Promise.all([
        API.get('/dashboard/coach'),
        API.get('/training-sessions?status=scheduled&limit=5'),
        API.get('/users?role=trainee&limit=5')
      ]);
      setStats(dashboardRes.data);
      setUpcomingSessions(sessionsRes.data.data?.sessions || sessionsRes.data.sessions || []);
      setRecentTrainees(traineesRes.data.data?.users || traineesRes.data.users || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data for performance visualization
  const chartData = [
    { month: 'Jan', sessions: 12, earnings: 1200 },
    { month: 'Feb', sessions: 19, earnings: 1900 },
    { month: 'Mar', sessions: 15, earnings: 1500 },
    { month: 'Apr', sessions: 22, earnings: 2200 },
    { month: 'May', sessions: 18, earnings: 1800 },
    { month: 'Jun', sessions: 25, earnings: 2500 }
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
      label: 'Date & Time',
      render: (value) => new Date(value).toLocaleString()
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value) => `${value} min`
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <Button size="small" variant="outline" onClick={() => navigate(`/sessions/${row._id}`)}>
          View
        </Button>
      )
    }
  ];

  const traineeColumns = [
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
      key: 'phone',
      label: 'Phone',
      render: (value) => value || 'N/A'
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
        title="Coach Dashboard"
        subtitle="Manage your training sessions and track progress"
        actions={
          <Button onClick={() => navigate('/sessions')}>
            View All Sessions
          </Button>
        }
      />

      <div className="stats-grid">
        <StatCard
          title="Total Trainees"
          value={stats?.overview?.totalTrainees || 0}
          icon="👥"
          color="primary"
          trend="up"
          trendValue="+5% from last month"
        />
        <StatCard
          title="Upcoming Sessions"
          value={stats?.overview?.upcomingSessions || 0}
          icon="📅"
          color="info"
          trend="neutral"
          trendValue="This week"
        />
        <StatCard
          title="Monthly Earnings"
          value={`$${stats?.overview?.monthlyEarnings || 0}`}
          icon="💰"
          color="warning"
          trend="up"
          trendValue="+12% from last month"
        />
        <StatCard
          title="Completed Sessions"
          value={stats?.sessions?.find(s => s._id === 'completed')?.count || 0}
          icon="✅"
          color="success"
          trend="up"
          trendValue="+8% from last month"
        />
      </div>

      {/* Performance Overview Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Performance Overview</h2>
          <Button size="small" variant="outline">View Detailed Report</Button>
        </div>
        <div className="chart-container">
          <div className="chart-info">
            <h3>Monthly Growth</h3>
            <p className="chart-description">Track your coaching performance over time</p>
          </div>
          <div className="chart-visualization">
            <div className="chart-bars">
              {chartData.map((data, index) => (
                <div key={index} className="chart-bar-container">
                  <div 
                    className="chart-bar" 
                    style={{ height: `${(data.sessions / 30) * 100}%` }}
                  ></div>
                  <span className="chart-label">{data.month}</span>
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
            <h2>Recent Trainees</h2>
            <Button size="small" variant="outline" onClick={() => navigate('/users')}>
              View All
            </Button>
          </div>
          <Table
            columns={traineeColumns}
            data={recentTrainees}
            pagination={false}
            emptyMessage="No trainees found"
          />
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-card" onClick={() => navigate('/sessions')}>
            <span className="action-icon">📅</span>
            <span className="action-title">Schedule Session</span>
          </button>
          <button className="action-card" onClick={() => navigate('/users')}>
            <span className="action-icon">👥</span>
            <span className="action-title">Manage Trainees</span>
          </button>
          <button className="action-card">
            <span className="action-icon">📊</span>
            <span className="action-title">View Reports</span>
          </button>
          <button className="action-card">
            <span className="action-icon">📝</span>
            <span className="action-title">Session Notes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;