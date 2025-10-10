import { useState, useEffect } from 'react';
import API from '../services/api';
import './Dashboard.css';

const TraineeDashboard = () => {
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [progressRes, sessionsRes, achievementsRes] = await Promise.all([
        API.get('/progress/my-progress'),
        API.get('/training-sessions/my-sessions'),
        API.get('/achievements/my-achievements')
      ]);
      setProgress(progressRes.data);
      setSessions(sessionsRes.data.sessions || []);
      setAchievements(achievementsRes.data.achievements || []);
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
      <h2>Trainee Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Training Sessions</h3>
          <p className="stat-value">{sessions.length}</p>
        </div>
        <div className="stat-card">
          <h3>Achievements</h3>
          <p className="stat-value">{achievements.length}</p>
        </div>
        <div className="stat-card">
          <h3>Progress Level</h3>
          <p className="stat-value">{progress?.level || 'Beginner'}</p>
        </div>
      </div>

      <div className="sections">
        <section className="section">
          <h3>Upcoming Sessions</h3>
          <div className="list">
            {sessions.slice(0, 5).map((session) => (
              <div key={session._id} className="list-item">
                <div>
                  <strong>{session.title}</strong>
                  <p>{session.description}</p>
                </div>
                <span className="date">{new Date(session.date).toLocaleDateString()}</span>
              </div>
            ))}
            {sessions.length === 0 && <p>No upcoming sessions</p>}
          </div>
        </section>

        <section className="section">
          <h3>My Achievements</h3>
          <div className="achievements-grid">
            {achievements.map((achievement) => (
              <div key={achievement._id} className="achievement-card">
                <div className="achievement-icon">🏆</div>
                <strong>{achievement.title}</strong>
                <p>{achievement.description}</p>
              </div>
            ))}
            {achievements.length === 0 && <p>No achievements yet. Keep training!</p>}
          </div>
        </section>

        <section className="section">
          <h3>Training Progress</h3>
          <div className="progress-info">
            <p>Current Level: <strong>{progress?.level || 'Beginner'}</strong></p>
            <p>Total Sessions Attended: <strong>{progress?.sessionsAttended || 0}</strong></p>
            <p>Skills Mastered: <strong>{progress?.skillsMastered?.length || 0}</strong></p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TraineeDashboard;
