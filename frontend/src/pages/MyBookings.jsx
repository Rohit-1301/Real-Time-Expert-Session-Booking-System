import { useState } from 'react';
import { getBookingsByEmail, updateBookingStatus } from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Mail, Search, Calendar, Clock, User, AlertCircle, BookOpen, XCircle } from 'lucide-react';

const STATUS_STYLES = {
  Pending:   { bg: 'rgba(234,179,8,0.12)',   color: '#fbbf24', border: 'rgba(234,179,8,0.3)' },
  Confirmed: { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  Completed: { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  Cancelled: { bg: 'rgba(239,68,68,0.10)',   color: '#f87171', border: 'rgba(239,68,68,0.3)' },
};

const STATUS_EMOJI = { Pending: '⏳', Confirmed: '✅', Completed: '🏆', Cancelled: '❌' };

// Bookings that can still be cancelled
const CANCELLABLE_STATUSES = ['Pending', 'Confirmed'];

export default function MyBookings() {
  const [email, setEmail]         = useState('');
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [searched, setSearched]   = useState(false);
  // Track which booking is being cancelled (disables its button)
  const [cancelling, setCancelling] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(false);
    try {
      const res = await getBookingsByEmail(email.trim());
      setBookings(res.data);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(bookingId);
    try {
      await updateBookingStatus(bookingId, 'Cancelled');
      // Update locally — no need to refetch the whole list
      setBookings((prev) =>
        prev.map((b) => b._id === bookingId ? { ...b, status: 'Cancelled' } : b)
      );
      toast.success('Booking cancelled. The slot has been restored for others.', {
        icon: '❌',
        duration: 4000,
        style: { background: '#1c0a0a', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' },
      });
    } catch (err) {
      toast.error(err.message || 'Failed to cancel. Please try again.', { duration: 4000 });
    } finally {
      setCancelling(null);
    }
  };

  const s = (status) => STATUS_STYLES[status] || STATUS_STYLES.Pending;

  return (
    <div className="page-enter" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 900,
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #e2e8f0, #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          My Bookings
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px' }}>
          Enter your email to view all your session bookings.
        </p>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}
      >
        <div style={{ flex: 1, position: 'relative', minWidth: '260px' }}>
          <Mail
            size={16}
            style={{
              position: 'absolute', left: '14px', top: '50%',
              transform: 'translateY(-50%)', color: '#64748b',
            }}
          />
          <input
            id="mybookings-email"
            type="email"
            placeholder="Enter your email address…"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%', padding: '12px 16px 12px 42px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', color: '#e2e8f0', fontSize: '15px',
            }}
          />
        </div>
        <button
          id="mybookings-search"
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{
            padding: '12px 24px', borderRadius: '12px',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px',
          }}
        >
          <Search size={16} />
          {loading ? 'Searching…' : 'Find Bookings'}
        </button>
      </form>

      {/* States */}
      {loading && <Spinner text="Fetching your bookings…" />}

      {error && !loading && (
        <div
          style={{
            display: 'flex', gap: '12px', padding: '20px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px', color: '#f87171',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {searched && !loading && !error && bookings.length === 0 && (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <BookOpen size={48} color="#374151" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '8px' }}>
            No bookings found for <strong style={{ color: '#818cf8' }}>{email}</strong>
          </p>
          <p style={{ color: '#475569', fontSize: '14px' }}>
            Try searching with a different email, or book a session first!
          </p>
        </div>
      )}

      {/* Booking cards */}
      {searched && !loading && bookings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '4px' }}>
            Found <strong style={{ color: '#818cf8' }}>{bookings.length}</strong> booking
            {bookings.length !== 1 ? 's' : ''} for{' '}
            <strong style={{ color: '#818cf8' }}>{email}</strong>
          </p>

          {bookings.map((booking) => {
            const isCancelled  = booking.status === 'Cancelled';
            const canCancel    = CANCELLABLE_STATUSES.includes(booking.status);
            const isCancelling = cancelling === booking._id;

            return (
              <div
                key={booking._id}
                id={`booking-${booking._id}`}
                className="glass-card"
                style={{
                  padding: '20px',
                  display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center',
                  opacity: isCancelled ? 0.65 : 1,
                  transition: 'opacity 0.3s',
                }}
              >
                {/* Left: Expert info */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <User size={15} color="#818cf8" />
                    <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '16px' }}>
                      {booking.expert?.name || 'Expert'}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: '100px',
                      background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                      color: '#818cf8', fontSize: '12px', fontWeight: 500, marginBottom: '12px',
                    }}
                  >
                    {booking.expert?.category || ''}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    <span
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '13px' }}
                    >
                      <Calendar size={13} />
                      {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                    <span
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '13px' }}
                    >
                      <Clock size={13} />
                      {booking.timeSlot}
                    </span>
                  </div>
                </div>

                {/* Right: Status + Cancel */}
                <div className="booking-card-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                  {/* Status badge */}
                  <div
                    style={{
                      padding: '6px 16px', borderRadius: '100px',
                      background: s(booking.status).bg,
                      border: `1px solid ${s(booking.status).border}`,
                      color: s(booking.status).color,
                      fontSize: '13px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                  >
                    <span>{STATUS_EMOJI[booking.status]}</span>
                    {booking.status}
                  </div>

                  {/* Cancel button — only for Pending / Confirmed bookings */}
                  {canCancel && (
                    <button
                      id={`cancel-${booking._id}`}
                      onClick={() => handleCancel(booking._id)}
                      disabled={isCancelling}
                      className="btn-danger"
                      style={{
                        padding: '6px 14px', borderRadius: '8px', fontSize: '12px',
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}
                    >
                      <XCircle size={13} />
                      {isCancelling ? 'Cancelling…' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
