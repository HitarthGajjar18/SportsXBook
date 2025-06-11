import axios from 'axios';

// Setup Axios instance for API calls
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // your backend API
  headers: {
    'Content-Type': 'application/json',
  }
});

export default api;
