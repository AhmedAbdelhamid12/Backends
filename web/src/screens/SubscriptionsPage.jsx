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

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    planName: 'Basic',
    duration: 30,
    price: 100,
    sessionsPerWeek: 2,
    totalSessions: 8,
    features: []
  });
  const toast = useToast();

  const fetchSubscriptions = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/subscriptions');
      setSubscriptions(data.data?.subscriptions || data.subscriptions || []);
    } catch (error) {
      toast.error('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/users');
      setUsers(data.data?.users || data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  }, [toast]);

  useEffect(() => {
    Promise.all([fetchSubscriptions(), fetchUsers()]);
  }, [fetchSubscriptions, fetchUsers]);

  const handleCreateSubscription = () => {
    setIsEditing(false);
    setSelectedSubscription(null);
    setFormData({
      userId: '',
      planName: 'Basic',
      duration: 30,
      price: 100,
      sessionsPerWeek: 2,
      totalSessions: 8,
      features: []
    });
    setModalOpen(true);
  };

  const handleEditSubscription = (subscription) => {
    setIsEditing(true);
    setSelectedSubscription(subscription);
    setFormData({
      userId: subscription.userId?._id || subscription.userId || '',
      planName: subscription.planName || 'Basic',
      duration: subscription.duration || 30,
      price: subscription.price || 100,
      sessionsPerWeek: subscription.sessionsPerWeek || 2,
      totalSessions: subscription.totalSessions || 8,
      features: subscription.features || []
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && selectedSubscription) {
        await apiClient.put(`/subscriptions/${selectedSubscription._id}`, formData);
        toast.success('Subscription updated successfully');
      } else {
        await apiClient.post('/subscriptions', formData);
        toast.success('Subscription created successfully');
      }
      setModalOpen(false);
      fetchSubscriptions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleStatusChange = async (subscriptionId, status) => {
    try {
      await apiClient.patch(`/subscriptions/${subscriptionId}/status`, { status });
      toast.success('Status updated successfully');
      fetchSubscriptions();
    } catch (error) {
      toast.error('Failed to update status');
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
      key: 'planName',
      label: 'Plan',
      render: (value) => (
        <span className="badge badge-admin">
          {value}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      render: (value) => `$${value}`
    },
    {
      key: 'sessions',
      label: 'Sessions',
      render: (_, row) => (
        <div>
          <div>{row.usedSessions || 0}/{row.totalSessions} used</div>
          <div className="user-email">{row.sessionsPerWeek}/week</div>
        </div>
      )
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value) => `${value} days`
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
      key: 'startDate',
      label: 'Start Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
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
            onClick={() => handleEditSubscription(row)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant={row.status === 'active' ? 'danger' : 'success'}
            onClick={() => handleStatusChange(
              row._id, 
              row.status === 'active' ? 'cancelled' : 'active'
            )}
          >
            {row.status === 'active' ? 'Cancel' : 'Activate'}
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="users-page">
      <DashboardHeader 
        title="Subscriptions Management"
        subtitle="Manage all user subscriptions"
        actions={
          <Button onClick={handleCreateSubscription}>
            + Add Subscription
          </Button>
        }
      />

      <div className="page-content">
        <Table 
          columns={columns}
          data={subscriptions}
          loading={loading}
          emptyMessage="No subscriptions found"
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Subscription' : 'Create New Subscription'}
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
              label="Plan Name"
              options={[
                { value: 'Basic', label: 'Basic' },
                { value: 'Premium', label: 'Premium' },
                { value: 'Elite', label: 'Elite' },
                { value: 'Family', label: 'Family' }
              ]}
              value={formData.planName}
              onChange={(value) => setFormData({ ...formData, planName: value })}
              fullWidth
              required
            />
          </div>
          
          <div className="form-row">
            <Input
              label="Duration (days)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
              required
              fullWidth
            />
            <Input
              label="Price ($)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 100 })}
              required
              fullWidth
            />
          </div>
          
          <div className="form-row">
            <Input
              label="Sessions per Week"
              type="number"
              value={formData.sessionsPerWeek}
              onChange={(e) => setFormData({ ...formData, sessionsPerWeek: parseInt(e.target.value) || 2 })}
              required
              fullWidth
            />
            <Input
              label="Total Sessions"
              type="number"
              value={formData.totalSessions}
              onChange={(e) => setFormData({ ...formData, totalSessions: parseInt(e.target.value) || 8 })}
              required
              fullWidth
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SubscriptionsPage;