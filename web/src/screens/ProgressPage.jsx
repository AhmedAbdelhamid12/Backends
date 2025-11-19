import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import LoadingSpinner from '../components/LoadingSpinner';
import DashboardHeader from '../components/DashboardHeader';
import './UsersPage.css';

const ProgressPage = () => {
  const [progressEntries, setProgressEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    type: 'swimming',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    metrics: {
      distance: '',
      time: '',
      strokes: '',
      pace: ''
    }
  });
  const toast = useToast();

  const fetchProgressEntries = useCallback(async () => {
    try {
      const { data } = await API.get('/progress');
      setProgressEntries(data.data?.progress || data.progress || []);
    } catch (error) {
      toast.error('Failed to fetch progress entries');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await API.get('/users');
      setUsers(data.data?.users || data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  }, [toast]);

  useEffect(() => {
    Promise.all([fetchProgressEntries(), fetchUsers()]);
  }, [fetchProgressEntries, fetchUsers]);

  const handleCreateProgress = () => {
    setIsEditing(false);
    setSelectedProgress(null);
    setFormData({
      userId: '',
      type: 'swimming',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      metrics: {
        distance: '',
        time: '',
        strokes: '',
        pace: ''
      }
    });
    setModalOpen(true);
  };

  const handleEditProgress = (progress) => {
    setIsEditing(true);
    setSelectedProgress(progress);
    setFormData({
      userId: progress.userId?._id || progress.userId || '',
      type: progress.type || 'swimming',
      date: progress.date ? new Date(progress.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: progress.notes || '',
      metrics: progress.metrics || {
        distance: '',
        time: '',
        strokes: '',
        pace: ''
      }
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && selectedProgress) {
        await API.put(`/progress/${selectedProgress._id}`, formData);
        toast.success('Progress entry updated successfully');
      } else {
        await API.post('/progress', formData);
        toast.success('Progress entry created successfully');
      }
      setModalOpen(false);
      fetchProgressEntries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteProgress = async (progressId) => {
    if (!window.confirm('Are you sure you want to delete this progress entry?')) return;
    
    try {
      await API.delete(`/progress/${progressId}`);
      toast.success('Progress entry deleted successfully');
      fetchProgressEntries();
    } catch (error) {
      toast.error('Failed to delete progress entry');
    }
  };

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (_, row) => (
        <div className="user-cell">
          <div className="user-avatar">{row.userId?.name?.charAt(0).toUpperCase() || 'U'}</div>
          <div>
            <div className="user-name">{row.userId?.name || 'N/A'}</div>
            <div className="user-email">{row.userId?.email || ''}</div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className="badge badge-primary">
          {value}
        </span>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'metrics',
      label: 'Metrics',
      render: (_, row) => (
        <div className="metrics-summary">
          {row.metrics?.distance && <div>Distance: {row.metrics.distance}</div>}
          {row.metrics?.time && <div>Time: {row.metrics.time}</div>}
        </div>
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
        <div className="action-buttons">
          <Button 
            size="small" 
            variant="outline"
            onClick={() => handleEditProgress(row)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="danger"
            onClick={() => handleDeleteProgress(row._id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="users-page">
      <DashboardHeader 
        title="Progress Tracking"
        subtitle="Monitor and manage user progress"
        actions={
          <Button onClick={handleCreateProgress}>
            + Add Progress Entry
          </Button>
        }
      />

      <div className="page-content">
        <Table 
          columns={columns}
          data={progressEntries}
          loading={loading}
          emptyMessage="No progress entries found"
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Progress Entry' : 'Add Progress Entry'}
        size="large"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-row">
            <Select
              label="User"
              options={users.map(user => ({ value: user._id, label: `${user.name} (${user.email})` }))}
              value={formData.userId}
              onChange={(value) => setFormData({ ...formData, userId: value })}
              fullWidth
              required
            />
            <Select
              label="Type"
              options={[
                { value: 'swimming', label: 'Swimming' },
                { value: 'fitness', label: 'Fitness' },
                { value: 'technique', label: 'Technique' },
                { value: 'endurance', label: 'Endurance' },
                { value: 'strength', label: 'Strength' }
              ]}
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value })}
              fullWidth
              required
            />
          </div>
          
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            fullWidth
          />
          
          <div className="form-row">
            <Input
              label="Distance"
              value={formData.metrics.distance}
              onChange={(e) => setFormData({ 
                ...formData, 
                metrics: { ...formData.metrics, distance: e.target.value } 
              })}
              placeholder="e.g., 500m"
              fullWidth
            />
            <Input
              label="Time"
              value={formData.metrics.time}
              onChange={(e) => setFormData({ 
                ...formData, 
                metrics: { ...formData.metrics, time: e.target.value } 
              })}
              placeholder="e.g., 8:30"
              fullWidth
            />
          </div>
          
          <div className="form-row">
            <Input
              label="Strokes"
              value={formData.metrics.strokes}
              onChange={(e) => setFormData({ 
                ...formData, 
                metrics: { ...formData.metrics, strokes: e.target.value } 
              })}
              placeholder="e.g., 400"
              fullWidth
            />
            <Input
              label="Pace"
              value={formData.metrics.pace}
              onChange={(e) => setFormData({ 
                ...formData, 
                metrics: { ...formData.metrics, pace: e.target.value } 
              })}
              placeholder="e.g., 1:42/100m"
              fullWidth
            />
          </div>
          
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-textarea"
              rows="3"
              placeholder="Progress notes..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProgressPage;