import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExperts } from '../services/api';
import { Star, Briefcase, Search, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

const CATEGORIES = ['All', 'Technology', 'Finance', 'Healthcare', 'Marketing', 'Legal', 'Design'];

const CATEGORY_COLORS = {
  Technology: { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8', border: 'rgba(99,102,241,0.3)' },
  Finance:    { bg: 'rgba(34,197,94,0.12)',   text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  Healthcare: { bg: 'rgba(236,72,153,0.12)',  text: '#f472b6', border: 'rgba(236,72,153,0.3)' },
  Marketing:  { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  Legal:      { bg: 'rgba(6,182,212,0.12)',   text: '#22d3ee', border: 'rgba(6,182,212,0.3)' },
  Design:     { bg: 'rgba(168,85,247,0.15)',  text: '#c084fc', border: 'rgba(168,85,247,0.3)' },
};

function StarRating({ rating }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          style={{ color: s <= Math.round(rating) ? '#fbbf24' : '#374151', fill: s <= Math.round(rating) ? '#fbbf24' : 'none' }}
        />
      ))}
      <span style={{ marginLeft: '4px', fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>{rating}</span>
    </div>
  );
}

// ── Skeleton card — shown during loading ────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="skeleton skeleton-circle" style={{ width: '64px', height: '64px', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="skeleton" style={{ height: '18px', width: '70%' }} />
          <div className="skeleton" style={{ height: '22px', width: '40%', borderRadius: '100px' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: '64px', borderRadius: '10px', marginBottom: '16px' }} />
      <div className="skeleton" style={{ height: '40px', borderRadius: '10px' }} />
    </div>
  );
}

export default function ExpertsList() {
  const navigate = useNavigate();
  const [experts, setExperts]     = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, currentPage: 1 });
  const [loading, setLoading]     = useState(true);
  const [isSearching, setIsSearching] = useState(false); // spinner inside search box
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All');
  const [page, setPage]           = useState(1);
  const [inputVal, setInputVal]   = useState('');

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getExperts({ page, limit: 9, search, category });
      setExperts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => { fetchExperts(); }, [fetchExperts]);

  // Debounce search input with in-flight spinner
  useEffect(() => {
    setIsSearching(true);
    const t = setTimeout(() => {
      setSearch(inputVal);
      setPage(1);
      setIsSearching(false);
    }, 400);
    return () => { clearTimeout(t); };
  }, [inputVal]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  const c = (key) => CATEGORY_COLORS[key] || CATEGORY_COLORS.Technology;

  return (
    <div className="page-enter" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 56px)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #e2e8f0 30%, #818cf8 70%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Connect with Top Experts
        </h1>
        <p style={{ color: '#64748b', fontSize: 'clamp(15px, 2vw, 18px)', maxWidth: '560px', margin: '0 auto' }}>
          Book 1-on-1 sessions with industry leaders. Real-time availability — no waiting, no double bookings.
        </p>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
        {/* Search with in-flight spinner */}
        <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', zIndex: 1 }}
          />
          <input
            id="expert-search"
            type="text"
            placeholder="Search experts by name…"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 44px 12px 46px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#e2e8f0',
              fontSize: '15px',
            }}
          />
          {/* Debounce in-progress indicator */}
          {isSearching && inputVal && (
            <Loader2
              size={16}
              style={{
                position: 'absolute', right: '14px', top: '50%',
                transform: 'translateY(-50%)', color: '#6366f1',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          )}
        </div>

        {/* Category filter pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              id={`filter-${cat.toLowerCase()}`}
              onClick={() => handleCategoryChange(cat)}
              style={{
                padding: '7px 18px',
                borderRadius: '100px',
                border: `1px solid ${category === cat ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)'}`,
                background: category === cat ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                color: category === cat ? '#818cf8' : '#94a3b8',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '20px', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#f87171',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={fetchExperts}
            style={{
              marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', cursor: 'pointer', fontSize: '13px',
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Expert grid — skeleton cards while loading, real cards when loaded */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
              gap: '24px',
              marginBottom: '40px',
            }}
          >
            {loading
              ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
              : experts.length === 0
              ? null
              : experts.map((expert) => (
                  <div
                    key={expert._id}
                    className="glass-card expert-card"
                    id={`expert-card-${expert._id}`}
                    style={{ padding: '24px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)' }}
                    onClick={() => navigate(`/experts/${expert._id}`)}
                  >
                    {/* Header row */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <img
                        src={expert.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${expert.name}`}
                        alt={expert.name}
                        style={{
                          width: '64px', height: '64px', borderRadius: '50%',
                          background: 'rgba(99,102,241,0.1)',
                          border: '2px solid rgba(99,102,241,0.3)', flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h2
                          style={{
                            fontSize: '17px', fontWeight: 700, color: '#e2e8f0',
                            marginBottom: '4px', whiteSpace: 'nowrap',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                          }}
                        >
                          {expert.name}
                        </h2>
                        <div
                          style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '3px 10px', borderRadius: '100px',
                            background: c(expert.category).bg,
                            border: `1px solid ${c(expert.category).border}`,
                            color: c(expert.category).text,
                            fontSize: '12px', fontWeight: 600,
                          }}
                        >
                          {expert.category}
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div
                      style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '12px', background: 'rgba(255,255,255,0.03)',
                        borderRadius: '10px', marginBottom: '16px',
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#818cf8' }}>
                          {expert.experience}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Years Exp.</div>
                      </div>
                      <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
                      <div style={{ textAlign: 'center' }}>
                        <StarRating rating={expert.rating} />
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Rating</div>
                      </div>
                      <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#4ade80' }}>
                          <Briefcase size={18} style={{ display: 'inline' }} />
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Available</div>
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      className="btn-primary"
                      style={{ width: '100%', padding: '11px', borderRadius: '10px', fontSize: '14px' }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/experts/${expert._id}`); }}
                    >
                      View &amp; Book Session →
                    </button>
                  </div>
                ))}
          </div>

          {/* Empty state */}
          {!loading && experts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</p>
              <p style={{ color: '#64748b', fontSize: '18px' }}>No experts found for your search.</p>
              <button
                onClick={() => { setInputVal(''); setCategory('All'); }}
                style={{
                  marginTop: '16px', padding: '10px 24px', borderRadius: '10px',
                  background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                  color: '#818cf8', cursor: 'pointer', fontSize: '14px',
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                  color: page === 1 ? '#374151' : '#94a3b8',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                Page <strong style={{ color: '#818cf8' }}>{page}</strong> of{' '}
                <strong style={{ color: '#818cf8' }}>{pagination.totalPages}</strong>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                  color: page === pagination.totalPages ? '#374151' : '#94a3b8',
                  cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
