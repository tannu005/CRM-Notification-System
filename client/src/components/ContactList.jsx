import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, UserPlus, Mail, Phone, Building2 } from 'lucide-react';
import AssignModal from './AssignModal';

export default function ContactList() {
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    title: 'Account Executive',
    company_id: ''
  });

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error('Failed to load contacts', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error('Failed to load companies', err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchCompanies();
  }, []);

  const handleCreateContact = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });
      if (res.ok) {
        setIsCreateOpen(false);
        setNewContact({ name: '', email: '', phone: '', title: 'Account Executive', company_id: '' });
        fetchContacts();
      }
    } catch (err) {
      console.error('Error creating contact', err);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.company_name && c.company_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>People & Contacts</h1>
          <div className="page-subtitle">Manage customer contacts and assign individual lead handlers</div>
        </div>

        <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} /> Add Contact
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search contacts by name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading contacts...
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contact Name & Title</th>
                  <th>Company Relation</th>
                  <th>Contact Details</th>
                  <th>Assigned Agent & Role</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No contacts match your query
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{c.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>{c.title}</div>
                      </td>
                      <td>
                        {c.company_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 600 }}>
                            <Building2 size={14} /> {c.company_name}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)' }}>Independent</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                            <Mail size={13} /> {c.email}
                          </div>
                          {c.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>
                              <Phone size={13} /> {c.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {c.assignments && c.assignments.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {c.assignments.map((a) => (
                              <div key={a.id} className="assigned-pill">
                                <img src={a.user_avatar} alt={a.user_name} className="avatar" style={{ width: '18px', height: '18px' }} />
                                <span style={{ fontWeight: 600 }}>{a.user_name}</span>
                                <span style={{ color: 'var(--text-subtle)', fontSize: '0.7rem' }}>({a.role})</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', italic: true }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setSelectedContact(c);
                            setIsAssignOpen(true);
                          }}
                        >
                          <UserPlus size={14} /> Assign Role
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AssignModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        entity={selectedContact}
        entityType="contact"
        onSuccess={fetchContacts}
      />

      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Contact</h3>
              <button className="link-btn" onClick={() => setIsCreateOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateContact}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="e.g. Sarah Connor"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="e.g. s.connor@cyberdyne.io"
                  required
                />
              </div>
              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={newContact.title}
                  onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                  placeholder="e.g. Director of Information Security"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="e.g. +1 (555) 987-6543"
                />
              </div>
              <div className="form-group">
                <label>Associated Company</label>
                <select
                  className="form-select"
                  value={newContact.company_id}
                  onChange={(e) => setNewContact({ ...newContact, company_id: e.target.value })}
                >
                  <option value="">-- None / Independent --</option>
                  {companies.map((comp) => (
                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
