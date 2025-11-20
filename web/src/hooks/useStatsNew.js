import { useState, useEffect } from 'react';
import { statsAPI } from '../services/apiNew';

// Custom hook for statistics
export const useStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeEnrollments: 0,
    revenueThisMonth: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await statsAPI.getOverview();
      setStats(response.data.data);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch statistics');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};