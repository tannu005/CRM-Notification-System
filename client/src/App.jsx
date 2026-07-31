import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import Header from './components/Header';
import HeroOverview from './components/HeroOverview';
import CompanyList from './components/CompanyList';
import ContactList from './components/ContactList';
import NotificationCenter from './components/NotificationCenter';
import BackgroundJobPanel from './components/BackgroundJobPanel';
import { UserCheck, Clock, X } from 'lucide-react';

function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="toast-container" role="region" aria-label="Notifications Toast Bar">
      {toasts.map((t) => (
        <div key={t.toastId} className="toast" role="alert">
          <div className={`notif-icon ${t.type}`} style={{ color: '#e8702a' }}>
            {t.type === 'assignment' ? <UserCheck size={18} /> : <Clock size={18} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>{t.title}</div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
              {t.message}
            </div>
          </div>
          <button onClick={() => dismissToast(t.toastId)} aria-label="Dismiss notification" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('companies');

  return (
    <div className="app-container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content" id="main-content">
        <HeroOverview setActiveTab={setActiveTab} />

        {activeTab === 'companies' && <CompanyList />}
        {activeTab === 'contacts' && <ContactList />}
        {activeTab === 'notifications' && <NotificationCenter />}
        {activeTab === 'worker' && <BackgroundJobPanel />}
      </main>

      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '2rem 1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', background: '#0b0d12' }}>
        Apex CRM System &copy; 2026 &bull; Real-time Targeted Notifications &bull; Warm Orange &amp; Charcoal Enterprise Design
      </footer>

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
