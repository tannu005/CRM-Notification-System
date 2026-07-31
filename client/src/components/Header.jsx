import React, { useState, useRef, useEffect } from 'react';
import { Building2, Users, Bell, Cpu, ChevronDown, Check } from 'lucide-react';
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
          {currentUser && (
            <button
              type="button"
              className="switcher-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="avatar"
              />
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap' }}>{currentUser.name}</div>
                <span className={`user-role-badge ${currentUser.role}`}>{currentUser.role}</span>
              </div>
              <ChevronDown size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
            </button>
          )}

          {dropdownOpen && (
            <div className="switcher-dropdown">
              <div className="dropdown-header">Switch Active User</div>
              {users.map((u) => (
                <button
                  key={u.id}
                  className={`switcher-item ${currentUser?.id === u.id ? 'active' : ''}`}
                  onClick={() => {
                    switchUser(u);
                    setDropdownOpen(false);
                  }}
                >
                  <img src={u.avatar} alt={u.name} className="avatar" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{u.name}</div>
                    <span className={`user-role-badge ${u.role}`}>{u.role}</span>
                  </div>
                  {currentUser?.id === u.id && <Check size={16} style={{ color: '#e8702a' }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
