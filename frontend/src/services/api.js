import axios from 'axios';

// In development, Vite proxies /experts and /bookings so baseURL can be empty.
// In production, VITE_API_URL points to the deployed backend (e.g. Render URL).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — unwrap data or propagate error
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      'Something went wrong';
    return Promise.reject({ message, status: error.response?.status, data: error.response?.data });
  }
);

// ── Experts ────────────────────────────────────────────────────────────────
export const getExperts = (params) => api.get('/experts', { params });
export const getExpertById = (id) => api.get(`/experts/${id}`);

// ── Bookings ───────────────────────────────────────────────────────────────
export const createBooking = (payload) => api.post('/bookings', payload);
export const getBookingsByEmail = (email) => api.get('/bookings', { params: { email } });
export const updateBookingStatus = (id, status) => api.patch(`/bookings/${id}/status`, { status });

export default api;
