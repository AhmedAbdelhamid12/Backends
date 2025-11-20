import { useState, useEffect } from 'react';
import { serviceAPI } from '../services/apiNew';

// Custom hook for services
export const useServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await serviceAPI.getServices();
      setServices(response.data.data.services);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch services');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await serviceAPI.createService(serviceData);
      
      // Refetch services after creating new one
      await fetchServices();
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create service');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return {
    services,
    loading,
    error,
    refetch: fetchServices,
    createService,
  };
};