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

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    title: '',
    description: '',
    category: 'swimming',
    points: 10,
    icon: '🏆',
    earnedAt: new Date().toISOString().split('T')[0]
  });
  const toast = useToast();

  const fetchAchievements = useCallback(async () => {
    try {
      const { data } = await API.get('/achievements');
      setAchievements(data.data?.achievements || data.achievements || []);
    } catch (error) {
      toast.error('Failed to fetch achievements');
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
    Promise.all([fetchAchievements(), fetchUsers()]);
  }, [fetchAchievements, fetchUsers]);

  const handleCreateAchievement = () => {
    setIsEditing(false);
    setSelectedAchievement(null);
    setFormData({
      userId: '',
      title: '',
      description: '',
      category: 'swimming',
      points: 10,
      icon: '🏆',
      earnedAt: new Date().toISOString().split('T')[0]
    });
    setModalOpen(true);
  };

  const handleEditAchievement = (achievement) => {
    setIsEditing(true);
    setSelectedAchievement(achievement);
    setFormData({
      userId: achievement.userId?._id || achievement.userId || '',
      title: achievement.title || '',
      description: achievement.description || '',
      category: achievement.category || 'swimming',
      points: achievement.points || 10,
      icon: achievement.icon || '🏆',
      earnedAt: achievement.earnedAt ? new Date(achievement.earnedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && selectedAchievement) {
        await API.put(`/achievements/${selectedAchievement._id}`, formData);
        toast.success('Achievement updated successfully');
      } else {
        await API.post('/achievements', formData);
        toast.success('Achievement created successfully');
      }
      setModalOpen(false);
      fetchAchievements();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteAchievement = async (achievementId) => {
    if (!window.confirm('Are you sure you want to delete this achievement?')) return;
    
    try {
      await API.delete(`/achievements/${achievementId}`);
      toast.success('Achievement deleted successfully');
      fetchAchievements();
    } catch (error) {
      toast.error('Failed to delete achievement');
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
      key: 'title',
      label: 'Achievement',
      render: (value, row) => (
        <div className="achievement-cell">
          <span className="achievement-icon">{row.icon || '🏆'}</span>
          <div>
            <div className="user-name">{value}</div>
            <div className="user-email">{row.description}</div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (value) => (
        <span className="badge badge-success">
          {value}
        </span>
      )
    },
    {
      key: 'points',
      label: 'Points',
      render: (value) => (
        <span className="badge badge-warning">
          {value} pts
        </span>
      )
    },
    {
      key: 'earnedAt',
      label: 'Earned',
      render: (value) => new Date(value).toLocaleDateString()
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
            onClick={() => handleEditAchievement(row)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="danger"
            onClick={() => handleDeleteAchievement(row._id)}
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
        title="Achievements Management"
        subtitle="Track and manage user achievements"
        actions={
          <Button onClick={handleCreateAchievement}>
            + Add Achievement
          </Button>
        }
      />

      <div className="page-content">
        <Table 
          columns={columns}
          data={achievements}
          loading={loading}
          emptyMessage="No achievements found"
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Achievement' : 'Add Achievement'}
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
            <Input
              label="Achievement Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
            />
          </div>
          
          <div className="form-row">
            <Select
              label="Category"
              options={[
                { value: 'swimming', label: 'Swimming' },
                { value: 'fitness', label: 'Fitness' },
                { value: 'technique', label: 'Technique' },
                { value: 'endurance', label: 'Endurance' },
                { value: 'competition', label: 'Competition' },
                { value: 'milestone', label: 'Milestone' }
              ]}
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              fullWidth
            />
            <Input
              label="Points"
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 10 })}
              fullWidth
            />
          </div>
          
          <div className="form-row">
            <Input
              label="Icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="e.g., 🏆"
              fullWidth
            />
            <Input
              label="Earned Date"
              type="date"
              value={formData.earnedAt}
              onChange={(e) => setFormData({ ...formData, earnedAt: e.target.value })}
              required
              fullWidth
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows="3"
              placeholder="Achievement description..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AchievementsPage;