const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'crm.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT NOT NULL,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT DEFAULT 'prospect',
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
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    assigned_by_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by_id) REFERENCES users(id)
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
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS background_jobs (
    id TEXT PRIMARY KEY,
    job_type TEXT NOT NULL DEFAULT 'reminder',
    type TEXT,
    status TEXT NOT NULL,
    details TEXT,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    subscription_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

try {
  db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
} catch (e) {}

try {
  db.exec("ALTER TABLE background_jobs ADD COLUMN job_type TEXT NOT NULL DEFAULT 'reminder'");
} catch (e) {}

const defaultHash = bcrypt.hashSync('Password123!', 10);
db.prepare('UPDATE users SET password_hash = ? WHERE password_hash IS NULL').run(defaultHash);

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();

if (userCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, role, avatar, password_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'usr_alex',
    'Alex Vance',
    'alex@apex.crm',
    'admin',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    defaultHash
  );

  insertUser.run(
    'usr_sarah',
    'Sarah Jenkins',
    'sarah@apex.crm',
    'agent',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    defaultHash
  );

  insertUser.run(
    'usr_david',
    'David Chen',
    'david@apex.crm',
    'manager',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    defaultHash
  );

  insertUser.run(
    'usr_maria',
    'Maria Garcia',
    'maria@apex.crm',
    'agent',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    defaultHash
  );

  const insertCompany = db.prepare(`
    INSERT INTO companies (id, name, industry, domain, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertCompany.run('cmp_acme', 'Acme Corporation', 'Technology', 'acme.com', 'prospect');
  insertCompany.run('cmp_nexus', 'Nexus Health', 'Healthcare', 'nexushealth.org', 'customer');

  const insertContact = db.prepare(`
    INSERT INTO contacts (id, name, email, phone, title, company_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertContact.run('cnt_john', 'John Doe', 'john@acme.com', '+1 (555) 019-2831', 'VP of Engineering', 'cmp_acme');
}

module.exports = db;
