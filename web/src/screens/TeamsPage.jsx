import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import { useToast } from '../context/ToastContext';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import LoadingSpinner from '../components/LoadingSpinner';
import DashboardHeader from '../components/DashboardHeader';
import './UsersPage.css';

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    coachId: '',
    members: [],
    description: '',
    schedule: '',
    level: 'beginner'
  });
  const toast = useToast();

  const fetchTeams = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/teams');
      setTeams(data.data?.teams || data.teams || []);
    } catch (error) {
      toast.error('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchCoaches = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/users?role=coach');
      setCoaches(data.data?.users || data.users || []);
    } catch (error) {
      toast.error('Failed to fetch coaches');
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/users?role=trainee');
      setUsers(data.data?.users || data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  }, [toast]);

  useEffect(() => {
    Promise.all([fetchTeams(), fetchCoaches(), fetchUsers()]);
  }, [fetchTeams, fetchCoaches, fetchUsers]);

  const handleCreateTeam = () => {
    setIsEditing(false);
    setSelectedTeam(null);
    setFormData({
      name: '',
      coachId: '',
      members: [],
      description: '',
      schedule: '',
      level: 'beginner'
    });
    setModalOpen(true);
  };

  const handleEditTeam = (team) => {
    setIsEditing(true);
    setSelectedTeam(team);
    setFormData({
      name: team.name || '',
      coachId: team.coachId?._id || team.coachId || '',
      members: team.members?.map(member => member._id || member) || [],
      description: team.description || '',
      schedule: team.schedule || '',
      level: team.level || 'beginner'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && selectedTeam) {
        await apiClient.put(`/teams/${selectedTeam._id}`, formData);
        toast.success('Team updated successfully');
      } else {
        await apiClient.post('/teams', formData);
        toast.success('Team created successfully');
      }
      setModalOpen(false);
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    
    try {
      await apiClient.delete(`/teams/${teamId}`);
      toast.success('Team deleted successfully');
      fetchTeams();
    } catch (error) {
      toast.error('Failed to delete team');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Team Name',
      render: (value) => (
        <div className="user-name">{value}</div>
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
      key: 'members',
      label: 'Members',
      render: (_, row) => (
        <span className="badge badge-primary">
          {row.members?.length || 0} members
        </span>
      )
    },
    {
      key: 'level',
      label: 'Level',
      render: (value) => (
        <span className={`status-badge status-${value}`}>
          {value}
        </span>
      )
    },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (value) => value || 'N/A'
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
            onClick={() => handleEditTeam(row)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="danger"
            onClick={() => handleDeleteTeam(row._id)}
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
        title="Teams Management"
        subtitle="Manage training teams and groups"
        actions={
          <Button onClick={handleCreateTeam}>
            + Add Team
          </Button>
        }
      />

      <div className="page-content">
        <Table 
          columns={columns}
          data={teams}
          loading={loading}
          emptyMessage="No teams found"
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Team' : 'Create New Team'}
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
            <Input
              label="Team Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
          </div>
          
          <div className="form-row">
            <Select
              label="Level"
              options={[
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' },
                { value: 'competitive', label: 'Competitive' }
              ]}
              value={formData.level}
              onChange={(value) => setFormData({ ...formData, level: value })}
              fullWidth
            />
            <Input
              label="Schedule"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              placeholder="e.g., Mon/Wed/Fri 6:00 PM"
              fullWidth
            />
          </div>
          
          <Select
            label="Team Members"
            options={users.map(user => ({ value: user._id, label: `${user.name} (${user.email})` }))}
            value={formData.members}
            onChange={(value) => setFormData({ ...formData, members: value })}
            fullWidth
            multiple
          />
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows="3"
              placeholder="Team description..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamsPage;
