import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Users, BookOpen, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/',           label: 'Experts',     icon: Users },
    { to: '/my-bookings', label: 'My Bookings', icon: BookOpen },
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav
      style={{
        background: 'rgba(15,15,26,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          onClick={closeMenu}
          style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}
        >
          <div
            style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <Zap size={18} color="white" fill="white" />
          </div>
          <span
            style={{
              fontSize: '18px', fontWeight: 800,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
            }}
          >
            ExpertConnect
          </span>
        </Link>

        {/* Desktop nav links + live dot */}
        <div id="nav-desktop" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {links.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '9px',
                  textDecoration: 'none', fontSize: '14px', fontWeight: 500,
                  background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: active ? '#818cf8' : '#94a3b8',
                  border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = '#e2e8f0';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}

          {/* Live dot — hide on very small screens */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
            <div style={{ position: 'relative', width: '10px', height: '10px' }}>
              <div
                style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: '#4ade80', position: 'relative', zIndex: 1,
                }}
              />
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(74,222,128,0.4)', animation: 'ping 1.5s ease-out infinite',
                }}
              />
            </div>
            <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 500 }}>Live</span>
          </div>
        </div>

        {/* Mobile hamburger button */}
        <button
          id="nav-hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{
            display: 'none', // shown via CSS below
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '9px',
            padding: '6px', cursor: 'pointer', color: '#94a3b8',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          id="nav-mobile-menu"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            background: 'rgba(15,15,26,0.98)',
          }}
        >
          {links.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={closeMenu}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px', borderRadius: '10px', textDecoration: 'none',
                  fontSize: '15px', fontWeight: 500,
                  background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                  color: active ? '#818cf8' : '#94a3b8',
                  border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes ping {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @media (max-width: 600px) {
          #nav-desktop   { display: none !important; }
          #nav-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
