import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExpertById } from '../services/api';
import socket from '../socket';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Star, Briefcase, Calendar, ArrowLeft, Clock, AlertCircle, Wifi } from 'lucide-react';

function StarRating({ rating }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={16}
          style={{
            color: s <= Math.round(rating) ? '#fbbf24' : '#374151',
            fill: s <= Math.round(rating) ? '#fbbf24' : 'none',
          }}
        />
      ))}
      <span style={{ marginLeft: '6px', fontWeight: 700, color: '#e2e8f0' }}>{rating}</span>
    </div>
  );
}

export default function ExpertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expert, setExpert]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  // Tracks slots that were just booked in real-time (for fade-out animation)
  const [flashingSlots, setFlashingSlots] = useState(new Set());

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getExpertById(id);
        setExpert(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  // ── Real-time socket listeners ────────────────────────────────────────────
  useEffect(() => {
    // Slot was booked by another user — animate it out then remove it
    const handleSlotBooked = ({ expertId, date, timeSlot }) => {
      if (expertId !== id) return;

      const key = `${date}::${timeSlot}`;

      // 1. Flash the slot red/faded for 600ms
      setFlashingSlots((prev) => new Set([...prev, key]));

      // 2. After animation, remove the slot from state
      setTimeout(() => {
        setExpert((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            availableSlots: prev.availableSlots.map((entry) =>
              entry.date === date
                ? { ...entry, slots: entry.slots.filter((s) => s !== timeSlot) }
                : entry
            ),
          };
        });
        setFlashingSlots((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });

        // 3. Notify the user someone else just booked a slot
        toast('A slot just got booked — availability updated!', {
          icon: '⚡',
          duration: 3000,
          style: { background: '#1e1b4b', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' },
        });
      }, 600);
    };

    // Slot was restored (booking cancelled) — add it back to the UI
    const handleSlotRestored = ({ expertId, date, timeSlot }) => {
      if (expertId !== id) return;
      setExpert((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          availableSlots: prev.availableSlots.map((entry) =>
            entry.date === date
              ? { ...entry, slots: [...new Set([...entry.slots, timeSlot])].sort() }
              : entry
          ),
        };
      });
      toast('A slot just became available!', {
        icon: '🎉',
        duration: 3000,
        style: { background: '#052e16', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' },
      });
    };

    socket.on('slotBooked',   handleSlotBooked);
    socket.on('slotRestored', handleSlotRestored);
    return () => {
      socket.off('slotBooked',   handleSlotBooked);
      socket.off('slotRestored', handleSlotRestored);
    };
  }, [id]);

  if (loading) return <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}><Spinner /></div>;

  if (error) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
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
      </div>
    );
  }

  if (!expert) return null;

  // Only show date groups that still have at least one available slot
  const availableDates = expert.availableSlots.filter((s) => s.slots.length > 0);

  return (
    <div className="page-enter" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px', borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
          color: '#94a3b8', cursor: 'pointer', fontSize: '14px', marginBottom: '32px',
        }}
      >
        <ArrowLeft size={16} /> Back to Experts
      </button>

      {/* Expert profile card */}
      <div
        className="glass-card expert-profile-card"
        style={{ padding: '24px', marginBottom: '32px', display: 'flex', gap: '28px', flexWrap: 'wrap' }}
      >
        <img
          src={expert.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${expert.name}`}
          alt={expert.name}
          style={{
            width: '100px', height: '100px', borderRadius: '50%',
            border: '3px solid rgba(99,102,241,0.4)', flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, color: '#e2e8f0', marginBottom: '8px' }}>
            {expert.name}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <span
              style={{
                padding: '4px 14px', borderRadius: '100px',
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8', fontSize: '13px', fontWeight: 600,
              }}
            >
              {expert.category}
            </span>
            <span
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '4px 14px', borderRadius: '100px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8', fontSize: '13px',
              }}
            >
              <Briefcase size={13} /> {expert.experience} years exp.
            </span>
          </div>
          <StarRating rating={expert.rating} />
          {expert.bio && (
            <p style={{ marginTop: '16px', color: '#94a3b8', lineHeight: 1.7, fontSize: '15px' }}>
              {expert.bio}
            </p>
          )}
        </div>
      </div>

      {/* Real-time indicator */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px',
          padding: '10px 16px', background: 'rgba(74,222,128,0.08)',
          border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px',
          fontSize: '13px', color: '#4ade80',
        }}
      >
        <Wifi size={14} />
        Slot availability updates in real-time. Booked slots disappear instantly for everyone.
      </div>

      {/* Available Slots */}
      {availableDates.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>📅</p>
          <p style={{ color: '#64748b', fontSize: '16px' }}>No available slots at this time.</p>
          <p style={{ color: '#475569', fontSize: '13px', marginTop: '8px' }}>
            Check back later — slots may open up when bookings are cancelled.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {availableDates.map((entry) => (
            <div key={entry.date} className="glass-card" style={{ padding: '24px' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}
              >
                <Calendar size={16} color="#818cf8" />
                <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '15px' }}>
                  {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
                <span
                  style={{
                    marginLeft: 'auto', padding: '2px 10px', borderRadius: '100px',
                    background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
                    color: '#4ade80', fontSize: '12px', fontWeight: 600,
                  }}
                >
                  {entry.slots.length} slot{entry.slots.length !== 1 ? 's' : ''} left
                </span>
              </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }} className="slots-grid">
                {entry.slots.map((slot) => {
                  const key = `${entry.date}::${slot}`;
                  const isFlashing = flashingSlots.has(key);
                  return (
                    <button
                      key={slot}
                      id={`slot-${entry.date}-${slot.replace(':', '-')}`}
                      disabled={isFlashing}
                      onClick={() =>
                        navigate(`/experts/${id}/book`, {
                          state: { date: entry.date, timeSlot: slot, expertName: expert.name },
                        })
                      }
                      className={`slot-btn${isFlashing ? ' slot-just-booked' : ''}`}
                      style={{
                        padding: '8px 18px', borderRadius: '10px',
                        border: '1px solid rgba(99,102,241,0.4)',
                        background: 'rgba(99,102,241,0.1)',
                        color: '#818cf8', cursor: isFlashing ? 'not-allowed' : 'pointer',
                        fontSize: '14px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      <Clock size={13} />
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
