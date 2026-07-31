import React, { useState, useRef, useEffect } from 'react';
import { Building2, Users, Bell, Cpu, ChevronDown, Check, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationBell from './NotificationBell';

export default function Header({ activeTab, setActiveTab }) {
  const { users, currentUser, switchUser } = useAuth();
  const { isConnected, unreadCount } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeUser = currentUser || {
    id: 'usr_alex',
    name: 'Alex Vance',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  };

  return (
    <header className="navbar">
      <a href="#" className="nav-brand" onClick={(e) => { e.preventDefault(); setActiveTab('companies'); }}>
        <div className="brand-icon">
          <Building2 size={20} />
        </div>
        <span>Apex CRM</span>
      </a>

      <nav className="nav-links">
        <button
          className={`nav-btn ${activeTab === 'companies' ? 'active' : ''}`}
          onClick={() => setActiveTab('companies')}
        >
          <Building2 size={16} /> Companies
        </button>
        <button
          className={`nav-btn ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          <Users size={16} /> Contacts
        </button>
        <button
          className={`nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={16} /> Notifications
          {unreadCount > 0 && (
            <span style={{ background: 'rgba(232, 112, 42, 0.25)', color: '#fdba74', fontSize: '0.72rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '10px', marginLeft: '0.25rem' }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button
          className={`nav-btn ${activeTab === 'worker' ? 'active' : ''}`}
          onClick={() => setActiveTab('worker')}
        >
          <Cpu size={16} /> Worker &amp; Scheduler
        </button>
      </nav>

      <div className="nav-actions">
        <div className="socket-status" title={isConnected ? "Real-time socket active" : "Socket disconnected"}>
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span>{isConnected ? 'Live Socket' : 'Offline'}</span>
        </div>

        <NotificationBell onNavigate={setActiveTab} />

        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            className="switcher-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="Click to switch active user context (Admin, Manager, Agent)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(232, 112, 42, 0.12)',
              border: '1px solid rgba(232, 112, 42, 0.4)',
              padding: '0.4rem 0.95rem',
              borderRadius: '9999px',
              cursor: 'pointer'
            }}
          >
            <img
              src={activeUser.avatar}
              alt={activeUser.name}
              className="avatar"
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #e8702a' }}
            />
            <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap' }}>
                {activeUser.name}
              </div>
              <span className={`user-role-badge ${activeUser.role}`} style={{ fontSize: '0.68rem', fontWeight: 800 }}>
                {activeUser.role.toUpperCase()}
              </span>
            </div>
            <ChevronDown size={14} style={{ color: '#fdba74', flexShrink: 0 }} />
          </button>

          {dropdownOpen && (
            <div className="switcher-dropdown" style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
              <div className="dropdown-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem' }}>
                <span style={{ fontWeight: 800, color: '#94a3b8' }}>Switch Active User</span>
                <Shield size={14} style={{ color: '#e8702a' }} />
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  className={`switcher-item ${activeUser.id === u.id ? 'active' : ''}`}
                  onClick={() => {
                    switchUser(u);
                    setDropdownOpen(false);
                  }}
                >
                  <img src={u.avatar} alt={u.name} className="avatar" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>{u.name}</div>
                    <span className={`user-role-badge ${u.role}`}>{u.role.toUpperCase()}</span>
                  </div>
                  {activeUser.id === u.id && <Check size={16} style={{ color: '#e8702a' }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
