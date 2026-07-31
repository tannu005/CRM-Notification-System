# Live CRM Notification System

A full-stack CRM application featuring targeted, real-time user notifications upon company/contact role assignments, persistent database storage, background worker process management, and an interactive multi-role dashboard.

---

## Technical Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (React + Vite)"]
        UI["Dashboard & User Switcher"]
        Toast["Real-time Toast & Bell Badges"]
        WSClient["Socket.io Client"]
        UI <--> WSClient
        UI <--> Toast
    end

    subgraph Backend ["Backend Service (Node.js + Express)"]
        Express["REST API Controllers & JWT Auth"]
        WSServer["Socket.io Notification Room Server"]
        BGWorker["Background Worker & Scheduler"]
        PushService["Web Push & Email Fallback"]
        
        Express --> |Targeted Room Emit| WSServer
        BGWorker --> |Auto Reminders| Express
        WSServer --> |Push to user:userId| WSClient
        Express --> PushService
    end

    subgraph Storage ["Database Layer"]
        DB[("SQLite (crm.db)")]
        Express <--> DB
        BGWorker <--> DB
    end
```

---

## Core Features

1. **CRM Entity Management**:
   - Create and view **Companies** and **Contacts**.
   - Relate contacts to companies.
   - Assign Users to Companies/Contacts with customizable roles (`Account Owner`, `Account Manager`, `Lead Agent`, `Technical Lead`, etc.).

2. **Targeted Real-Time Notifications**:
   - Implemented via WebSockets (`socket.io`).
   - Each authenticated user joins a private Socket room (`user:<userId>`).
   - When an Admin assigns a company or contact, **only the assigned user** receives the notification in real-time.
   - Non-assigned users do not receive the notification.

3. **Persistent Notifications & Read Tracking**:
   - Notifications are stored in SQLite database.
   - Unread badges update dynamically.
   - Users can mark individual notifications or all notifications as read via `PATCH /api/notifications/:id/read` and `PATCH /api/notifications/read-all`.

4. **Automated & Manual Background Worker**:
   - A background process runs on an automated scheduler (every 45s).
   - Generates follow-up reminders and stale lead audit alerts.
   - Interactive **Worker & Scheduler Panel** allows reviewers to manually trigger background workflows for testing.

5. **Multi-User Switcher for Local & Live Demo**:
   - Header dropdown allows switching active context between **Alex Vance (Admin)**, **Sarah Jenkins (Agent)**, **David Chen (Manager)**, and **Maria Garcia (Agent)** to test real-time notification delivery across tabs/roles instantly.

---

## Database Schema Design

### 1. `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique user identifier (`usr_...`) |
| `name` | TEXT | NOT NULL | User full name |
| `email` | TEXT | UNIQUE, NOT NULL | User email address |
| `role` | TEXT | NOT NULL | System role (`admin`, `agent`, `manager`) |
| `avatar` | TEXT | NOT NULL | Profile avatar image URL |
| `password_hash` | TEXT | NULL | Bcrypt salted password hash |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

### 2. `companies`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Company ID (`cmp_...`) |
| `name` | TEXT | NOT NULL | Organization name |
| `industry` | TEXT | NOT NULL | Industry sector |
| `domain` | TEXT | NOT NULL | Website domain |
| `status` | TEXT | DEFAULT 'prospect' | Account lifecycle status |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Created timestamp |

### 3. `contacts`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Contact ID (`cnt_...`) |
| `name` | TEXT | NOT NULL | Contact full name |
| `email` | TEXT | NOT NULL | Contact email address |
| `phone` | TEXT | NOT NULL | Contact phone number |
| `title` | TEXT | NOT NULL | Job title |
| `company_id` | TEXT | FK -> `companies.id` | Associated company |

### 4. `assignments`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Assignment ID (`asg_...`) |
| `entity_type` | TEXT | NOT NULL | `company` or `contact` |
| `entity_id` | TEXT | NOT NULL | Target entity ID |
| `user_id` | TEXT | FK -> `users.id` | Assigned team member |
| `role` | TEXT | NOT NULL | Assignment role (`Account Owner`, etc.) |
| `assigned_by_id` | TEXT | FK -> `users.id` | Assigner (Admin/User) |

### 5. `notifications`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Notification ID (`ntf_...`) |
| `user_id` | TEXT | FK -> `users.id` | Target recipient user |
| `type` | TEXT | NOT NULL | `assignment` or `reminder` |
| `title` | TEXT | NOT NULL | Short summary header |
| `message` | TEXT | NOT NULL | Full notification body |
| `is_read` | INTEGER | DEFAULT 0 | Read flag (`0` = unread, `1` = read) |
| `read_at` | DATETIME | NULL | Timestamp when marked as read |

---

## Architectural Tradeoffs & Production Scaling Considerations

1. **Database Ephemerality vs Managed PostgreSQL**:
   - *Current Implementation*: SQLite (`better-sqlite3`) was chosen for zero-config local evaluation without external database setup.
   - *Production Upgrade*: For horizontal scaling across multiple container instances, SQLite would be replaced with managed PostgreSQL (e.g. Supabase, AWS RDS) using Prisma or Kysely ORM.

2. **Single-Node WebSockets vs Distributed Redis Pub/Sub Adapter**:
   - *Current Implementation*: Socket.io rooms operate in-memory on a single Node.js instance.
   - *Production Upgrade*: To support multi-node load balancing across 5+ server replicas, `@socket.io/redis-adapter` with Redis Pub/Sub would be attached to sync room broadcasts across cluster nodes.

3. **Notification List Pagination**:
   - *Current Implementation*: Fetches active user notifications ordered by `created_at DESC`.
   - *Production Upgrade*: To prevent memory spikes for power users with 10,000+ notifications, limit/offset or cursor-based pagination (`LIMIT 20 OFFSET ?`) with infinite scrolling would be enforced.

4. **Demo Context Switcher vs Production OAuth2/SAML SSO Auth**:
   - *Current Implementation*: Header dropdown enables evaluators to test multi-user real-time targeted notification delivery across 2 tabs in 10 seconds.
   - *Production Upgrade*: Supported by JWT `httpOnly` secure cookies and Bcrypt password hashing, with optional Google OAuth2 / SAML SSO integration for enterprise multi-tenancy.

---

## Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Install Dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Run Automated Backend Tests
```bash
cd server && npm test
```

### 3. Start Development Servers

**Terminal 1 (Backend Server - Port 5000)**:
```bash
cd server && npm start
```

**Terminal 2 (Frontend Client - Port 3000)**:
```bash
cd client && npm run dev
```

Open your browser at `http://localhost:3000`.

---

## Step-by-Step Demo & Evaluation Guide

1. **Open Two Browser Windows / Tabs**:
   - Tab A: Open `http://localhost:3000` as **Alex Vance (Admin)**.
   - Tab B: Open `http://localhost:3000` and switch user to **Sarah Jenkins (Agent)** using the top-right switcher.

2. **Admin Assigns Company**:
   - In Tab A (Admin), navigate to **Companies**.
   - Click **Assign Role** on "Acme Corp".
   - Select User: **Sarah Jenkins**, Role: **Account Owner**.
   - Click **Confirm Assignment**.

3. **Verify Targeted Real-Time Notification**:
   - Observe Tab B (Sarah Jenkins): real-time toast alert arrives instantly (*"You have been assigned to Acme Corp as Account Owner by Alex Vance"*).
   - Observe Tab A (Admin): Alex Vance receives **no notification noise**, proving targeted socket room isolation.

4. **View Notification List & Mark as Read**:
   - In Tab B (Sarah Jenkins), open the **Notifications** tab.
   - Click **Mark Read**. Verify unread counter updates to `0` and database updates `is_read = 1`.

5. **Test Background Process Flow**:
   - Navigate to **Worker & Scheduler**.
   - Click **Execute Background Job Now**.
   - Observe background job execution log populate in real-time and deliver automated follow-up reminders.
