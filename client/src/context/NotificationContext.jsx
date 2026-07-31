import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const socketUri = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';
    const newSocket = io(socketUri, { autoConnect: true });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchNotifications = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (currentUser && socket) {
      socket.emit('join:user', currentUser.id);
      fetchNotifications(currentUser.id);

      const handleNewNotification = (notification) => {
        if (notification.user_id === currentUser.id) {
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);

          const toastId = 'tst_' + Date.now();
          setToasts(prev => [...prev, { ...notification, toastId }]);

          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.toastId !== toastId));
          }, 5000);
        }
      };

      const handleUpdatedNotification = ({ notification, unread_count }) => {
        if (notification.user_id === currentUser.id) {
          setNotifications(prev => prev.map(n => n.id === notification.id ? notification : n));
          setUnreadCount(unread_count);
        }
      };

      const handleReadAllNotifications = ({ userId }) => {
        if (userId === currentUser.id) {
          setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
          setUnreadCount(0);
        }
      };

      socket.on('notification:new', handleNewNotification);
      socket.on('notification:updated', handleUpdatedNotification);
      socket.on('notification:read-all', handleReadAllNotifications);

      return () => {
        socket.emit('leave:user', currentUser.id);
        socket.off('notification:new', handleNewNotification);
        socket.off('notification:updated', handleUpdatedNotification);
        socket.off('notification:read-all', handleReadAllNotifications);
      };
    }
  }, [currentUser, socket]);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(prev => prev.map(n => n.id === id ? data.notification : n));
        setUnreadCount(data.unread_count);
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const dismissToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isConnected,
      toasts,
      markAsRead,
      markAllAsRead,
      dismissToast,
      refetchNotifications: () => fetchNotifications(currentUser?.id)
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
