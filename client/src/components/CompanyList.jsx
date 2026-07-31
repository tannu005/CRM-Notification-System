import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, UserPlus, Globe, Tag } from 'lucide-react';
import AssignModal from './AssignModal';

export default function CompanyList() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newCompany, setNewCompany] = useState({
    name: '',
    industry: 'Enterprise Software',
    domain: '',
    status: 'prospect'
  });

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error('Failed to load companies', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompany)
      });
      if (res.ok) {
        setIsCreateOpen(false);
        setNewCompany({ name: '', industry: 'Enterprise Software', domain: '', status: 'prospect' });
        fetchCompanies();
      }
    } catch (err) {
      console.error('Error creating company', err);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry.toLowerCase().includes(search.toLowerCase()) ||
    c.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Company Accounts</h1>
          <div className="page-subtitle">Manage enterprise accounts and assign team ownership</div>
        </div>

        <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} /> Add Company
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search companies by name, domain, or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading companies...
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Domain</th>
                  <th>Industry</th>
                  <th>Status</th>
                  <th>Assigned Owners & Roles</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No companies match your query
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="brand-icon" style={{ width: '32px', height: '32px', background: 'var(--primary-light)', color: 'var(--primary)', boxShadow: 'none' }}>
                            <Building2 size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{c.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{c.contacts?.length || 0} associated contacts</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                          <Globe size={14} /> {c.domain}
                        </div>
                      </td>
                      <td>{c.industry}</td>
                      <td>
                        <span className={`badge badge-${c.status}`}>{c.status}</span>
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
                            setSelectedCompany(c);
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
        entity={selectedCompany}
        entityType="company"
        onSuccess={fetchCompanies}
      />

      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Company</h3>
              <button className="link-btn" onClick={() => setIsCreateOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCompany}>
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="e.g. Apex Dynamics"
                  required
                />
              </div>
              <div className="form-group">
                <label>Domain</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCompany.domain}
                  onChange={(e) => setNewCompany({ ...newCompany, domain: e.target.value })}
                  placeholder="e.g. apexdynamics.io"
                  required
                />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCompany.industry}
                  onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                  placeholder="e.g. Fintech & Payments"
                  required
                />
              </div>
              <div className="form-group">
                <label>Lifecycle Status</label>
                <select
                  className="form-select"
                  value={newCompany.status}
                  onChange={(e) => setNewCompany({ ...newCompany, status: e.target.value })}
                >
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Company</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
