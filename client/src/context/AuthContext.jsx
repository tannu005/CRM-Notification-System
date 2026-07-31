import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const DEFAULT_USERS = [
  {
    id: 'usr_alex',
    name: 'Alex Vance',
    email: 'alex@apex.crm',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_sarah',
    name: 'Sarah Jenkins',
    email: 'sarah@apex.crm',
    role: 'agent',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_david',
    name: 'David Chen',
    email: 'david@apex.crm',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_maria',
    name: 'Maria Garcia',
    email: 'maria@apex.crm',
    role: 'agent',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'
  }
];

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState(DEFAULT_USERS[0]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
          const active = data.find(u => u.id === currentUser?.id) || data[0];
          setCurrentUser(active);
        }
      }
    } catch (err) {
      console.error('Failed to load users from API, using default seed list', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const switchUser = (user) => {
    setCurrentUser(user);
  };

  return (
    <AuthContext.Provider value={{ users, currentUser, switchUser, fetchUsers, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
