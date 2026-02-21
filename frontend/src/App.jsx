import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ExpertsList from './pages/ExpertsList';
import ExpertDetail from './pages/ExpertDetail';
import BookingPage from './pages/BookingPage';
import MyBookings from './pages/MyBookings';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e1e2e',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#4ade80', secondary: '#0f0f1a' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#0f0f1a' } },
        }}
      />
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 64px)' }}>
        <Routes>
          <Route path="/" element={<ExpertsList />} />
          <Route path="/experts/:id" element={<ExpertDetail />} />
          <Route path="/experts/:id/book" element={<BookingPage />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route
            path="*"
            element={
              <div style={{ textAlign: 'center', paddingTop: '100px' }}>
                <p style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</p>
                <h1 style={{ color: '#e2e8f0', marginBottom: '8px' }}>Page Not Found</h1>
                <p style={{ color: '#64748b' }}>The page you're looking for doesn't exist.</p>
              </div>
            }
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
