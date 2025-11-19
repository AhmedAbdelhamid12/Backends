import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import LoadingSpinner from '../components/LoadingSpinner';
import './UsersPage.css';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    coachId: '',
    userId: '',
    date: '',
    duration: 60,
    capacity: 10,
    type: 'swimming',
    location: '',
    pool: '',
    notes: ''
  });
  const toast = useToast();

  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await API.get('/training-sessions');
      setSessions(data.data?.sessions || data.sessions || []);
    } catch (error) {
      toast.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchCoaches = useCallback(async () => {
    try {
      const { data } = await API.get('/users?role=coach');
      setCoaches(data.data?.users || data.users || []);
    } catch (error) {
      toast.error('Failed to fetch coaches');
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await API.get('/users?role=trainee');
      setUsers(data.data?.users || data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  }, [toast]);

  useEffect(() => {
    Promise.all([fetchSessions(), fetchCoaches(), fetchUsers()]);
  }, [fetchSessions, fetchCoaches, fetchUsers]);

  const handleCreateSession = () => {
    setIsEditing(false);
    setSelectedSession(null);
    setFormData({
      title: '',
      coachId: '',
      userId: '',
      date: '',
      duration: 60,
      capacity: 10,
      type: 'swimming',
      location: '',
      pool: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleEditSession = (session) => {
    setIsEditing(true);
    setSelectedSession(session);
    setFormData({
      title: session.title || '',
      coachId: session.coachId?._id || session.coachId || '',
      userId: session.userId?._id || session.userId || '',
      date: session.date ? new Date(session.date).toISOString().slice(0, 16) : '',
      duration: session.duration || 60,
      capacity: session.capacity || 10,
      type: session.type || 'swimming',
      location: session.location || '',
      pool: session.pool || '',
      notes: session.notes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && selectedSession) {
        await API.put(`/training-sessions/${selectedSession._id}`, formData);
        toast.success('Session updated successfully');
      } else {
        await API.post('/training-sessions', formData);
        toast.success('Session created successfully');
      }
      setModalOpen(false);
      fetchSessions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleStatusUpdate = async (sessionId, status) => {
    try {
      await API.patch(`/training-sessions/${sessionId}/status`, { status });
      toast.success('Status updated');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Session',
      render: (value, row) => (
        <div>
          <div className="user-name">{row.title || 'Training Session'}</div>
          <div className="user-email">{row.type}</div>
        </div>
      )
    },
    {
      key: 'coach',
      label: 'Coach',
      render: (_, row) => (
        <div>
          <div className="user-name">{row.coachId?.name || 'N/A'}</div>
          <div className="user-email">{row.coachId?.email || ''}</div>
        </div>
      )
    },
    {
      key: 'user',
      label: 'Trainee',
      render: (_, row) => (
        <div>
          <div className="user-name">{row.userId?.name || 'N/A'}</div>
          <div className="user-email">{row.userId?.email || ''}</div>
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
      key: 'capacity',
      label: 'Capacity',
      render: (value, row) => `${row.attendees?.length || 0}/${value}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`status-badge status-${value}`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="action-buttons">
          <Button size="small" variant="outline" onClick={() => handleEditSession(row)}>
            Edit
          </Button>
          <Button size="small" variant="success" onClick={() => handleStatusUpdate(row._id, 'completed')}>
            Complete
          </Button>
          <Button size="small" variant="danger" onClick={() => handleStatusUpdate(row._id, 'cancelled')}>
            Cancel
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>Training Sessions</h1>
          <p className="page-subtitle">Manage training sessions and schedules</p>
        </div>
        <Button onClick={handleCreateSession}>
          + New Session
        </Button>
      </div>

      <div className="page-content">
        <Table columns={columns} data={sessions} loading={loading} />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Session' : 'Create New Session'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{isEditing ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="user-form">
          <Input 
            label="Title" 
            value={formData.title} 
            onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
            required 
            fullWidth 
          />
          <Select
            label="Coach"
            options={coaches.map(coach => ({ value: coach._id, label: `${coach.name} (${coach.email})` }))}
            value={formData.coachId}
            onChange={(value) => setFormData({ ...formData, coachId: value })}
            fullWidth
            required
          />
          <Select
            label="Trainee"
            options={users.map(user => ({ value: user._id, label: `${user.name} (${user.email})` }))}
            value={formData.userId}
            onChange={(value) => setFormData({ ...formData, userId: value })}
            fullWidth
            required
          />
          <Input 
            label="Date & Time" 
            type="datetime-local" 
            value={formData.date} 
            onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
            required 
            fullWidth 
          />
          <Input 
            label="Duration (minutes)" 
            type="number" 
            value={formData.duration} 
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })} 
            required 
            fullWidth 
          />
          <Input 
            label="Capacity" 
            type="number" 
            value={formData.capacity} 
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 10 })} 
            required 
            fullWidth 
          />
          <Select
            label="Type"
            options={[
              { value: 'swimming', label: 'Swimming' },
              { value: 'fitness', label: 'Fitness' },
              { value: 'rehabilitation', label: 'Rehabilitation' },
              { value: 'technique', label: 'Technique' },
              { value: 'endurance', label: 'Endurance' },
              { value: 'strength', label: 'Strength' },
              { value: 'other', label: 'Other' }
            ]}
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value })}
            fullWidth
          />
          <Input 
            label="Location" 
            value={formData.location} 
            onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
            fullWidth 
          />
          <Input 
            label="Pool" 
            value={formData.pool} 
            onChange={(e) => setFormData({ ...formData, pool: e.target.value })} 
            fullWidth 
          />
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-textarea"
              rows="3"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SessionsPage;