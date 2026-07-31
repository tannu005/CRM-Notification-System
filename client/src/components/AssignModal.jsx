import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_ROLES = [
  'Account Owner',
  'Account Manager',
  'Lead Agent',
  'Technical Lead',
  'Support Specialist'
];

export default function AssignModal({ isOpen, onClose, entity, entityType, onSuccess }) {
  const { users, currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState(DEFAULT_ROLES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !entity) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select a user to assign.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entity.id,
          user_id: selectedUser,
          role: selectedRole,
          assigned_by_id: currentUser?.id
        })
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create assignment');
      }
    } catch (err) {
      setError('Network error creating assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="brand-icon" style={{ width: '36px', height: '36px' }}>
              <UserPlus size={18} />
            </div>
            <h3 id="modal-title">Assign {entityType === 'company' ? 'Company' : 'Contact'}</h3>
          </div>
          <button className="link-btn" onClick={onClose} aria-label="Close modal" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Target Account / Lead
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--text-primary)' }}>
            {entity.name}
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.85rem', background: 'var(--danger-subtle)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="select-user">Assign To Team Member</label>
            <select
              id="select-user"
              className="form-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
              aria-required="true"
            >
              <option value="" style={{ backgroundColor: '#111827', color: '#f8fafc' }}>
                -- Select Team Member --
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id} style={{ backgroundColor: '#111827', color: '#f8fafc' }}>
                  {u.name} ({u.role.toUpperCase()}) - {u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="select-role">Role & Responsibility</label>
            <select
              id="select-role"
              className="form-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {DEFAULT_ROLES.map((r) => (
                <option key={r} value={r} style={{ backgroundColor: '#111827', color: '#f8fafc' }}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
