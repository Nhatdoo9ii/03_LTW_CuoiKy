import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Custom hook gọi API GET dùng chung, tự động hủy request khi unmount (cleanup)
 */
const useFetch = (endpoint, params = null, options = { immediate: true }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(options.immediate));
  const [error, setError] = useState(null);

  const paramsKey = params ? JSON.stringify(params) : '';

  const runRequest = useCallback(
    async (signal) => {
      if (!endpoint) return;
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          params: paramsKey ? JSON.parse(paramsKey) : undefined,
          headers,
          signal,
          timeout: 5000,
        });

        setData(response.data);
        setError(null);
      } catch (err) {
        if (axios.isCancel(err) || err.name === 'CanceledError') return;
        const message =
          err.response?.data?.message ||
          err.message ||
          'Không thể tải dữ liệu từ máy chủ';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, paramsKey]
  );

  useEffect(() => {
    if (!options.immediate) return;

    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        runRequest(controller.signal);
      }
    });

    // Cleanup: hủy request nếu component unmount hoặc params thay đổi
    return () => controller.abort();
  }, [runRequest, options.immediate]);

  const refetch = () => {
    setLoading(true);
    return runRequest();
  };

  return { data, loading, error, refetch };
};

export default useFetch;
