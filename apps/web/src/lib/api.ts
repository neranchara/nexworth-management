import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

// Request Interceptor: Auth & Impersonation Security
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const isImpersonating = sessionStorage.getItem('is_impersonated') === 'true';

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // ISP Policy 1: Read-Only Enforcement at Network Layer
  const method = config.method?.toUpperCase();
  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (isImpersonating && method && mutationMethods.includes(method)) {
    const errorMsg = `[SECURITY] Blocked ${method} attempt in View-As mode. Mutation is not allowed.`;
    console.error(errorMsg);
    
    // Return a canceled promise to prevent the request from being sent
    return Promise.reject({
      response: {
        status: 403,
        data: { message: errorMsg }
      }
    });
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
