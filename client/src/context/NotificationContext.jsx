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
    const backendUrl = import.meta.env.VITE_SOCKET_URL || (
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : window.location.origin
    );

    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      query: { userId: currentUser?.id || 'usr_alex' }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (currentUser?.id) {
        newSocket.emit('join_user_room', currentUser.id);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser?.id]);

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
      fetchNotifications(currentUser.id);
      socket.emit('join_user_room', currentUser.id);

      const handleNotificationPayload = (notification) => {
        if (!notification) return;
        if (notification.user_id === currentUser.id || !notification.user_id) {
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);

          const toastId = 'tst_' + Date.now();
          setToasts(prev => [...prev, { ...notification, toastId }]);

          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.toastId !== toastId));
          }, 5000);
        }
      };

      socket.on('notification', handleNotificationPayload);
      socket.on('notification:new', handleNotificationPayload);

      return () => {
        socket.off('notification', handleNotificationPayload);
        socket.off('notification:new', handleNotificationPayload);
      };
    }
  }, [currentUser, socket]);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
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
