const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'crm.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent',
    avatar TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'prospect',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    title TEXT NOT NULL,
    company_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    assigned_by_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(assigned_by_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    role TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS background_jobs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  const insertUser = db.prepare('INSERT INTO users (id, name, email, role, avatar) VALUES (?, ?, ?, ?, ?)');
  const insertCompany = db.prepare('INSERT INTO companies (id, name, industry, domain, status) VALUES (?, ?, ?, ?, ?)');
  const insertContact = db.prepare('INSERT INTO contacts (id, name, email, phone, title, company_id) VALUES (?, ?, ?, ?, ?, ?)');

  const seedUsers = [
    ['usr_1', 'Alex Vance', 'alex.vance@apex-crm.com', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'],
    ['usr_2', 'Sarah Jenkins', 'sarah.j@apex-crm.com', 'agent', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'],
    ['usr_3', 'David Chen', 'david.c@apex-crm.com', 'manager', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'],
    ['usr_4', 'Elena Rostova', 'elena.r@apex-crm.com', 'agent', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80']
  ];

  for (const u of seedUsers) {
    insertUser.run(...u);
  }

  const seedCompanies = [
    ['cmp_1', 'Acme Corp', 'Enterprise Software', 'acme.com', 'customer'],
    ['cmp_2', 'Starlight Logistics', 'Supply Chain & Freight', 'starlightlogistics.io', 'prospect'],
    ['cmp_3', 'Nexus Health', 'Biotech & Pharma', 'nexushealth.org', 'lead'],
    ['cmp_4', 'Vortex Energy', 'Clean Tech', 'vortexenergy.co', 'prospect']
  ];

  for (const c of seedCompanies) {
    insertCompany.run(...c);
  }

  const seedContacts = [
    ['cnt_1', 'Michael Scott', 'm.scott@acme.com', '+1 (555) 234-5678', 'VP of Operations', 'cmp_1'],
    ['cnt_2', 'Pam Beesly', 'p.beesly@acme.com', '+1 (555) 234-5679', 'Director of Procurement', 'cmp_1'],
    ['cnt_3', 'Robert California', 'rc@starlightlogistics.io', '+1 (555) 876-5432', 'Chief Executive Officer', 'cmp_2'],
    ['cnt_4', 'Dr. Evelyn Reed', 'e.reed@nexushealth.org', '+1 (555) 345-6789', 'Head of Clinical R&D', 'cmp_3']
  ];

  for (const ct of seedContacts) {
    insertContact.run(...ct);
  }
}

seedDatabase();

module.exports = db;
