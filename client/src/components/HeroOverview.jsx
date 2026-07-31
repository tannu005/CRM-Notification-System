import React, { useState, useRef } from 'react';
import { Building2, Users, Bell, Cpu, Zap, ArrowRight, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function HeroOverview({ setActiveTab }) {
  const { currentUser } = useAuth();
  const { unreadCount, isConnected, notifications } = useNotifications();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: -(y / rect.height) * 12,
      y: (x / rect.width) * 12
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const latestNotif = notifications.length > 0 ? notifications[0] : null;

  return (
    <div className="hero-banner">
      <div className="hero-content-grid">
        <div>
          <div className="hero-pill">
            <Zap size={15} style={{ color: '#e8702a' }} />
            <span>Real-Time Event Driven Architecture</span>
          </div>

          <h1 className="hero-title">
            Enterprise Live CRM &amp; Notification Engine
          </h1>

          <p className="hero-subtitle">
            Manage company accounts, contacts, and role assignments seamlessly. Target real-time notification events directly to individual user socket channels with zero broadcast noise.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => setActiveTab('companies')}>
              Manage Companies <ArrowRight size={18} />
            </button>
            <button className="btn-secondary" onClick={() => setActiveTab('worker')}>
              <Cpu size={18} /> Background Worker
            </button>
          </div>
        </div>

        <div style={{ perspective: '1000px' }}>
          <div
            ref={cardRef}
            className="hero-live-card"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="brand-icon" style={{ width: '36px', height: '36px' }}>
                  <Activity size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>Live Activity Feed</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Target User: {currentUser?.name}</div>
                </div>
              </div>

              <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
            </div>

            {latestNotif ? (
              <div style={{ padding: '1rem', background: 'rgba(232, 112, 42, 0.12)', borderRadius: '14px', border: '1px solid rgba(232, 112, 42, 0.3)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fdba74', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Latest Signal &bull; {latestNotif.type}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>{latestNotif.title}</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem', lineHeight: 1.4 }}>
                  {latestNotif.message}
                </div>
              </div>
            ) : (
              <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                No active notifications yet. Assign an account to trigger real-time delivery.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Unread Queue</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#e8702a', marginTop: '0.15rem' }}>{unreadCount}</div>
              </div>

              <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Channel</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: '0.15rem' }}>{isConnected ? 'Socket.io' : 'Offline'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
