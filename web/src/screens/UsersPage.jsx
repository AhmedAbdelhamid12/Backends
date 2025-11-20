import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import { useToast } from '../context/ToastContext';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import LoadingSpinner from '../components/LoadingSpinner';
import './UsersPage.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'trainee',
    status: 'active',
    birthDate: '',
    gender: 'other',
    specialization: '',
    experience: 0,
    bio: ''
  });
  const toast = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await API.get('/users');
      setUsers(data.data?.users || data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = () => {
    setIsEditing(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'trainee',
      status: 'active',
      birthDate: '',
      gender: 'other',
      specialization: '',
      experience: 0,
      bio: ''
    });
    setModalOpen(true);
  };

  const handleEditUser = (user) => {
    setIsEditing(true);
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
      gender: user.gender || 'other',
      specialization: user.specialization || '',
      experience: user.experience || 0,
      bio: user.bio || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && selectedUser) {
        await API.put(`/users/${selectedUser._id}`, formData);
        toast.success('User updated successfully');
      } else {
        // For new users, we'll need to create a proper registration flow
        await API.post('/auth/register', { 
          ...formData, 
          password: 'temp123' // In a real app, this would be handled differently
        });
        toast.success('User created successfully');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await API.put(`/users/${userId}/status`, { status: newStatus });
      toast.success('Status updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const columns = [
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
      key: 'role',
      label: 'Role',
      render: (value) => (
        <span className={`badge badge-${value}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
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
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Joined',
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
            onClick={() => handleEditUser(row)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant={row.status === 'active' ? 'danger' : 'success'}
            onClick={() => handleStatusChange(
              row._id, 
              row.status === 'active' ? 'suspended' : 'active'
            )}
          >
            {row.status === 'active' ? 'Suspend' : 'Activate'}
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
          <h1>Users Management</h1>
          <p className="page-subtitle">Manage all system users</p>
        </div>
        <Button onClick={handleCreateUser}>
          + Add User
        </Button>
      </div>

      <div className="page-content">
        <Table 
          columns={columns}
          data={users}
          loading={loading}
          emptyMessage="No users found"
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit User' : 'Create New User'}
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
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
              disabled={isEditing}
            />
          </div>
          
          <div className="form-row">
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
            <Input
              label="Birth Date"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              fullWidth
            />
          </div>
          
          <div className="form-row">
            <Select
              label="Role"
              options={[
                { value: 'trainee', label: 'Trainee' },
                { value: 'coach', label: 'Coach' },
                { value: 'parent', label: 'Parent' },
                { value: 'admin', label: 'Admin' }
              ]}
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value })}
              fullWidth
            />
            <Select
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'pending', label: 'Pending' },
                { value: 'suspended', label: 'Suspended' }
              ]}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
              fullWidth
            />
          </div>
          
          <div className="form-row">
            <Select
              label="Gender"
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' }
              ]}
              value={formData.gender}
              onChange={(value) => setFormData({ ...formData, gender: value })}
              fullWidth
            />
            {(formData.role === 'coach') && (
              <Input
                label="Experience (years)"
                type="number"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                fullWidth
              />
            )}
          </div>
          
          {(formData.role === 'coach') && (
            <>
              <Input
                label="Specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                fullWidth
              />
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="form-textarea"
                  rows="3"
                  placeholder="Coach biography..."
                />
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;