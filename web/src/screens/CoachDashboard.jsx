import { useState, useEffect } from 'react';
import API from '../services/api';
import './Dashboard.css';

const CoachDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [sessionsRes, teamsRes] = await Promise.all([
        API.get('/training-sessions/my-sessions'),
        API.get('/teams/my-teams')
      ]);
      setSessions(sessionsRes.data.sessions || []);
      setTeams(teamsRes.data.teams || []);
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
      <h2>Coach Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>My Teams</h3>
          <p className="stat-value">{teams.length}</p>
        </div>
        <div className="stat-card">
          <h3>Upcoming Sessions</h3>
          <p className="stat-value">{sessions.filter(s => new Date(s.date) > new Date()).length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Sessions</h3>
          <p className="stat-value">{sessions.length}</p>
        </div>
      </div>

      <div className="sections">
        <section className="section">
          <h3>Upcoming Training Sessions</h3>
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
          <h3>My Teams</h3>
          <div className="list">
            {teams.map((team) => (
              <div key={team._id} className="list-item">
                <div>
                  <strong>{team.name}</strong>
                  <p>{team.members?.length || 0} members</p>
                </div>
              </div>
            ))}
            {teams.length === 0 && <p>No teams assigned</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CoachDashboard;
