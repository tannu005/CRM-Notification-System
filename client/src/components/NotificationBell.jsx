import React, { useState, useRef, useEffect } from 'react';
import { Bell, UserCheck, Clock, ExternalLink } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationBell({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timeAgo = (dateStr) => {
    const time = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - time) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        style={{
          position: 'relative',
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          border: unreadCount > 0 ? '1px solid rgba(232, 112, 42, 0.6)' : '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: unreadCount > 0 ? '0 0 16px rgba(232, 112, 42, 0.4)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: unreadCount > 0 ? '#ffffff' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          outline: 'none'
        }}
      >
        <Bell size={18} style={{ color: unreadCount > 0 ? '#e8702a' : 'inherit' }} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: 'linear-gradient(135deg, #ef4444, #ec4899)',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            right: 0,
            width: '380px',
            maxWidth: '92vw',
            background: 'rgba(19, 22, 32, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(232, 112, 42, 0.25)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>Notifications</div>
              {unreadCount > 0 && (
                <span style={{ background: 'rgba(232, 112, 42, 0.2)', color: '#fdba74', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '12px' }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                style={{ fontSize: '0.8rem', color: '#e8702a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                No notifications right now
              </div>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (n.is_read === 0) markAsRead(n.id);
                  }}
                  style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    background: n.is_read === 0 ? 'rgba(232, 112, 42, 0.08)' : 'transparent',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: n.type === 'assignment' ? 'rgba(232, 112, 42, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: n.type === 'assignment' ? '#fdba74' : '#fcd34d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {n.type === 'assignment' ? <UserCheck size={18} /> : <Clock size={18} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.2rem' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45, marginBottom: '0.35rem' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(0, 0, 0, 0.3)', textAlign: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '0.55rem' }}
              onClick={() => {
                setIsOpen(false);
                if (onNavigate) onNavigate('notifications');
              }}
            >
              View Notification Hub <ExternalLink size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
