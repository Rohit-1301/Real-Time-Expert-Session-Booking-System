import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { createBooking } from '../services/api';
import { ArrowLeft, User, Mail, Phone, Calendar, Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: '#e2e8f0',
  fontSize: '15px',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  color: '#94a3b8',
  fontSize: '13px',
  fontWeight: 500,
};

const errorStyle = {
  color: '#f87171',
  fontSize: '12px',
  marginTop: '4px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

function Field({ label, icon: Icon, error, children }) {
  return (
    <div>
      <label style={labelStyle}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {Icon && <Icon size={13} />}
          {label}
        </span>
      </label>
      {children}
      {error && (
        <p style={errorStyle}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

const MAX_NOTES = 1000;

const validate = (form) => {
  const errs = {};
  if (!form.name.trim()) errs.name = 'Name is required';
  else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
  if (!form.email.trim()) errs.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
  if (!form.phone.trim()) errs.phone = 'Phone is required';
  else if (!/^[+\d\s\-().]{7,20}$/.test(form.phone)) errs.phone = 'Invalid phone number (e.g. +91 98765 43210)';
  if (form.notes.length > MAX_NOTES) errs.notes = `Notes must not exceed ${MAX_NOTES} characters`;
  return errs;
};

export default function BookingPage() {
  const { id: expertId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const { date = '', timeSlot = '', expertName = 'Expert' } = state || {};

  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await createBooking({ expertId, ...form, date, timeSlot });
      setSuccess(true);
      toast.success('Booking confirmed! Redirecting…', { icon: '🎉', duration: 3000 });
      setTimeout(() => navigate('/my-bookings'), 2500);
    } catch (err) {
      if (err.status === 409) {
        toast.error('Slot just taken! Please pick another.', { icon: '⚠️', duration: 4000 });
        navigate(-1);
      } else if (err.status === 422) {
        const fieldErrors = {};
        err.data?.errors?.forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
        toast.error('Please fix the form errors.', { duration: 3000 });
      } else {
        toast.error(err.message || 'Booking failed. Please try again.', { duration: 4000 });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!date || !timeSlot) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ color: '#64748b', marginBottom: '16px' }}>No slot selected. Please go back and pick a slot.</p>
        <button onClick={() => navigate(-1)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div
        className="page-enter"
        style={{ maxWidth: '500px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}
      >
        <div className="glass-card" style={{ padding: 'clamp(20px, 5vw, 32px)' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(74,222,128,0.15)',
              border: '2px solid rgba(74,222,128,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <CheckCircle size={36} color="#4ade80" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#e2e8f0', marginBottom: '12px' }}>
            Booking Confirmed!
          </h2>
          <p style={{ color: '#64748b', marginBottom: '8px' }}>
            Your session with <strong style={{ color: '#818cf8' }}>{expertName}</strong> is booked.
          </p>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            {date} at {timeSlot}
          </p>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '16px' }}>
            Redirecting to My Bookings…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 16px', width: '100%' }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
          color: '#94a3b8',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '32px',
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Booking summary */}
      <div
        className="booking-summary-strip"
        style={{
          padding: '14px 16px',
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '2px' }}>Expert</p>
          <p style={{ color: '#e2e8f0', fontWeight: 700 }}>{expertName}</p>
        </div>
        <div>
          <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '2px' }}>Date</p>
          <p style={{ color: '#e2e8f0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={13} /> {date}
          </p>
        </div>
        <div>
          <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '2px' }}>Time</p>
          <p style={{ color: '#818cf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={13} /> {timeSlot}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="glass-card" style={{ padding: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#e2e8f0', marginBottom: '24px' }}>
          Complete Your Booking
        </h1>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Field label="Full Name" icon={User} error={errors.name}>
            <input
              id="booking-name"
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={set('name')}
              style={{ ...inputStyle, borderColor: errors.name ? '#f87171' : undefined }}
            />
          </Field>

          <Field label="Email Address" icon={Mail} error={errors.email}>
            <input
              id="booking-email"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={set('email')}
              style={{ ...inputStyle, borderColor: errors.email ? '#f87171' : undefined }}
            />
          </Field>

          <Field label="Phone Number" icon={Phone} error={errors.phone}>
            <input
              id="booking-phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={form.phone}
              onChange={set('phone')}
              style={{ ...inputStyle, borderColor: errors.phone ? '#f87171' : undefined }}
            />
          </Field>

          <Field label="Notes (optional)" icon={FileText} error={errors.notes}>
            <textarea
              id="booking-notes"
              placeholder="Topics you'd like to discuss, questions, goals…"
              value={form.notes}
              onChange={set('notes')}
              rows={4}
              maxLength={MAX_NOTES}
              style={{
                ...inputStyle, resize: 'vertical', lineHeight: 1.6,
                borderColor: errors.notes ? '#f87171' : undefined,
              }}
            />
            {/* Live character counter */}
            <div
              style={{
                textAlign: 'right', fontSize: '12px', marginTop: '4px',
                color: form.notes.length > MAX_NOTES * 0.9 ? '#fbbf24' : '#475569',
              }}
            >
              {form.notes.length}/{MAX_NOTES}
            </div>
          </Field>

          <button
            id="booking-submit"
            type="submit"
            disabled={submitting}
            className="btn-primary btn-full-mobile"
            style={{ padding: '14px', borderRadius: '12px', fontSize: '16px', marginTop: '8px', width: '100%' }}
          >
            {submitting ? 'Confirming…' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
