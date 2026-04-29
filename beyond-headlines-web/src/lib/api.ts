import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add X-API-Token and inject email into requests
api.interceptors.request.use(
  (config) => {
    // 1. Add the shared service-to-service token
    const token = process.env.NEXT_PUBLIC_LARAVEL_API_TOKEN || 'beyond-headlines-secret-token-2024';
    config.headers['X-API-Token'] = token;
    
    // 2. Inject the user email as the identity identifier
    const userJson = typeof window !== 'undefined' ? localStorage.getItem('bh_user') : null;
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        const email = user.email;

        if (email) {
          if (config.method === 'get' || config.method === 'delete') {
            config.params = { ...config.params, email };
          } else {
            // For POST, PUT, PATCH - add to body
            config.data = { ...config.data, email };
          }
        }
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed: Invalid API Token or missing email identity');
      // Optional: Redirect to identity page if identity is lost
    }
    return Promise.reject(error);
  }
);

export default api;
