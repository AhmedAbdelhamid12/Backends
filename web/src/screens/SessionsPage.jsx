import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import '../screens/UsersPage.css';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    duration: 60,
    capacity: 10,
    type: 'group'
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

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/training-sessions', formData);
      toast.success('Session created successfully');
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
          <div className="user-name">{value || 'Training Session'}</div>
          <div className="user-email">{row.type}</div>
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
        <Button onClick={() => setModalOpen(true)}>
          + New Session
        </Button>
      </div>

      <div className="page-content">
        <Table columns={columns} data={sessions} loading={loading} />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Session"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="user-form">
          <Input label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required fullWidth />
          <Input label="Date & Time" type="datetime-local" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required fullWidth />
          <Input label="Duration (minutes)" type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required fullWidth />
          <Input label="Capacity" type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} required fullWidth />
          <div className="form-group">
            <label>Type</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="form-select">
              <option value="group">Group</option>
              <option value="private">Private</option>
              <option value="assessment">Assessment</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SessionsPage;
