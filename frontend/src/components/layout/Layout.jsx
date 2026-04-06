import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api.js';

const NAV = [
  { to: '/', icon: '📋', label: 'Órdenes' },
  { to: '/caja', icon: '💰', label: 'Caja' },
  { to: '/clientes', icon: '👤', label: 'Clientes' },
  { to: '/motores', icon: '⚙', label: 'Motores' },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const location = useLocation();
  const overlayRef = useRef(null);

  // Detectar mobile con resize
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Cerrar sidebar al navegar en mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Bloquear scroll body cuando sidebar abierto en mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, sidebarOpen]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', color: '#f8fafc' }}>

      {/* ── OVERLAY (mobile) ─────────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div
          ref={overlayRef}
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            zIndex: 999, backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* ── SIDEBAR ──────────────────────────────────────── */}
      <aside style={{
        width: 240,
        background: '#111418',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'fixed',
        left: (!isMobile || sidebarOpen) ? 0 : -240,
        top: 0,
        height: '100vh',
        zIndex: 1000,
        transition: 'left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: 12,
          position: 'relative',
        }}>
          {/* Botón cerrar en mobile */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'absolute', right: 12, top: 12,
                background: 'rgba(255,255,255,0.05)', border: 'none',
                color: '#64748b', fontSize: 18, cursor: 'pointer',
                width: 32, height: 32, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          )}
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(220,38,38,0.15)',
            border: '1px solid rgba(220,38,38,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>⚙️</div>
          <div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: 13, letterSpacing: '0.08em' }}>RECTIFICACIONES</div>
            <div style={{ fontWeight: 800, color: '#dc2626', fontSize: 14, letterSpacing: '0.1em' }}>GUZMÁN</div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>La Plata · Bs.As.</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '8px 0', flex: 1 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 20px', textDecoration: 'none',
                color: isActive ? '#fff' : '#64748b',
                background: isActive ? 'rgba(220,38,38,0.12)' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                borderLeft: isActive ? '3px solid #dc2626' : '3px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 11, color: '#334155' }}>v2.0 · Taller Pro</div>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        marginLeft: isMobile ? 0 : 240, // empuja el contenido en desktop
      }}>
        {/* TOPBAR */}
        <header style={{
          height: 56,
          background: '#111418',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}>
          {/* Hamburguesa — siempre visible en mobile, oculta en desktop */}
          <button
            onClick={() => setSidebarOpen(s => !s)}
            aria-label="Abrir menú"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              width: 40, height: 40,
              display: isMobile ? 'flex' : 'none',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, flexDirection: 'column', gap: 5,
            }}
          >
            <span style={{ width: 16, height: 1.5, background: '#fff', display: 'block', borderRadius: 2 }} />
            <span style={{ width: 16, height: 1.5, background: '#fff', display: 'block', borderRadius: 2 }} />
            <span style={{ width: 10, height: 1.5, background: '#fff', display: 'block', borderRadius: 2 }} />
          </button>

          {/* Título animado — lo mantenemos */}
          <h1
            className="animate-title"
            style={{
              fontSize: isMobile ? 14 : 16,
              fontWeight: 800, margin: 0,
              flex: 1,
              textAlign: isMobile ? 'left' : 'center',
              letterSpacing: '0.06em',
            }}
          >
            🔧 RECTIFICACIONES GUZMÁN ⚙️
          </h1>

          {/* Botón nueva orden en header (solo desktop) */}
          {!isMobile && (
            <button
              onClick={() => navigate('/ordenes/nueva')}
              style={{
                background: '#dc2626', color: '#fff',
                border: 'none', borderRadius: 10,
                padding: '8px 16px', fontSize: 13,
                fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                letterSpacing: '0.04em',
              }}
            >
              + Nueva orden
            </button>
          )}
        </header>

        {/* PAGE CONTENT */}
        <main style={{
          flex: 1,
          padding: isMobile ? '14px 12px' : '20px 24px',
          overflowY: 'auto',
          background: 'var(--bg-main)',
          paddingBottom: isMobile ? 100 : 40,
        }}>
          {children}
        </main>

        {/* FAB: NUEVA ORDEN — solo mobile */}
        {isMobile && (
          <button
            className="fab-glossy"
            onClick={() => navigate('/ordenes/nueva')}
            aria-label="Nueva orden"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
