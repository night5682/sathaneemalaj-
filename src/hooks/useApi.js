import { useState, useCallback } from 'react';

/**
 * Custom hook for interacting with the PHP API
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Endpoint can be a relative path like '/dashboard.php'
      const url = `/api${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return request(url, { method: 'GET' });
  }, [request]);

  const post = useCallback((endpoint, data) => {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [request]);

  const postMultipart = useCallback(async (endpoint, formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, browser will do it for multipart/form-data
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const putMultipart = useCallback(async (endpoint, formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api${endpoint}`, {
        method: 'PUT',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const put = useCallback((endpoint, data) => {
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [request]);

  const del = useCallback((endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  }, [request]);

  return { loading, error, get, post, postMultipart, put, putMultipart, del };
};
