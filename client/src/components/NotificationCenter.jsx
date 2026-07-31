import React, { useState } from 'react';
import { Bell, CheckCheck, UserCheck, Clock, Check } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export default function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return n.is_read === 0;
    if (filter === 'assignment') return n.type === 'assignment';
    if (filter === 'reminder') return n.type === 'reminder';
    return true;
  });

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Notification Hub</h1>
          <div className="page-subtitle">
            Real-time targeted event stream for <strong style={{ color: '#ffffff' }}>{currentUser?.name}</strong>
          </div>
        </div>

        {unreadCount > 0 && (
          <button className="btn-primary" onClick={markAllAsRead}>
            <CheckCheck size={16} /> Mark All Read ({unreadCount})
          </button>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="nav-links">
            <button
              className={`nav-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={`nav-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={`nav-btn ${filter === 'assignment' ? 'active' : ''}`}
              onClick={() => setFilter('assignment')}
            >
              Assignments
            </button>
            <button
              className={`nav-btn ${filter === 'reminder' ? 'active' : ''}`}
              onClick={() => setFilter('reminder')}
            >
              Reminders
            </button>
          </div>
        </div>

        {filteredNotifications.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
            <Bell size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>No notifications found</div>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              Notifications assigned to your user account will show up here in real time.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.1rem',
                  padding: '1.15rem 1.35rem',
                  background: n.is_read === 0 ? 'rgba(232, 112, 42, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid',
                  borderColor: n.is_read === 0 ? 'rgba(232, 112, 42, 0.35)' : 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: n.type === 'assignment' ? 'rgba(232, 112, 42, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: n.type === 'assignment' ? '#fdba74' : '#fcd34d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {n.type === 'assignment' ? <UserCheck size={20} /> : <Clock size={20} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff' }}>{n.title}</div>
                    {n.role && (
                      <span className="badge badge-prospect" style={{ fontSize: '0.72rem' }}>
                        Role: {n.role}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                    {formatDate(n.created_at)}
                  </div>
                </div>

                <div>
                  {n.is_read === 0 ? (
                    <button
                      className="btn-secondary"
                      onClick={() => markAsRead(n.id)}
                      style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
                    >
                      <Check size={14} /> Mark Read
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCheck size={15} style={{ color: '#10b981' }} /> Read
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
