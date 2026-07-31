import React, { useState, useEffect } from 'react';
import { Cpu, Play, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BackgroundJobPanel() {
  const { users, currentUser } = useAuth();
  const [jobHistory, setJobHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState('scheduled_followup');
  const [targetUser, setTargetUser] = useState('');

  const fetchJobHistory = async () => {
    try {
      const res = await fetch('/api/background-jobs');
      if (res.ok) {
        const data = await res.json();
        setJobHistory(data);
      }
    } catch (err) {
      console.error('Failed to load job history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobHistory();
    const interval = setInterval(fetchJobHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerJob = async () => {
    setTriggering(true);
    try {
      let body = {};
      if (selectedJobType !== 'scheduled_followup') {
        body = {
          jobType: selectedJobType,
          targetUserId: targetUser || currentUser?.id
        };
      }

      const res = await fetch('/api/background-jobs/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await fetchJobHistory();
      }
    } catch (err) {
      console.error('Error triggering job', err);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Background Job & Worker Service</h1>
          <div className="page-subtitle">Automated background processes generating targeted user notifications</div>
        </div>

        <button className="btn-secondary" onClick={fetchJobHistory}>
          <RefreshCw size={16} /> Refresh Log
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="brand-icon" style={{ width: '36px', height: '36px' }}>
              <Cpu size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Background Scheduler</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Active (Interval: 45 seconds)</div>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            The background worker periodically evaluates database records for assigned leads and companies. When a follow-up condition is triggered, it saves a notification and pushes it via WebSocket to the assigned user.
          </p>

          <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase' }}>
              Automatic Triggers
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
              ✔ Follow-up Reminders &nbsp;|&nbsp; ✔ Stale Lead Audit &nbsp;|&nbsp; ✔ Assignment Follow-ups
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Manual Job Trigger (Test Flow)</h3>

          <div className="form-group">
            <label>Select Background Workflow</label>
            <select
              className="form-select"
              value={selectedJobType}
              onChange={(e) => setSelectedJobType(e.target.value)}
            >
              <option value="scheduled_followup">Automated Scheduled Follow-up Worker</option>
              <option value="stale_lead">Stale Lead Re-engagement Alert</option>
              <option value="weekly_digest">Weekly Activity Digest Worker</option>
            </select>
          </div>

          {selectedJobType !== 'scheduled_followup' && (
            <div className="form-group">
              <label>Target User Notification Recipient</label>
              <select
                className="form-select"
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
              >
                <option value="">-- Active User ({currentUser?.name}) --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          )}

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleTriggerJob}
            disabled={triggering}
          >
            {triggering ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
            {triggering ? 'Executing Worker...' : 'Execute Background Job Now'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Background Job Execution Audit Log</h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading execution logs...</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Workflow Name</th>
                  <th>Status</th>
                  <th>Execution Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {jobHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No background jobs recorded yet
                    </td>
                  </tr>
                ) : (
                  jobHistory.map((j) => (
                    <tr key={j.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>{j.id}</td>
                      <td style={{ fontWeight: 600 }}>{j.name}</td>
                      <td>
                        <span className={`badge ${j.status === 'success' ? 'badge-customer' : 'badge-prospect'}`}>
                          {j.status === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {j.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{j.details}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                        {new Date(j.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
