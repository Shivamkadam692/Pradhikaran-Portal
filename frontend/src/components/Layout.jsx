import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import * as notificationsApi from '../api/notifications';
import './Layout.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  React.useEffect(() => {
    if (!user) return;
    notificationsApi
      .list({ limit: 20 })
      .then((res) => setNotifications(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setNotifications([]));
  }, [user]);

  React.useEffect(() => {
    if (!socket || !user) return;
    const onNotif = () => {
      notificationsApi
        .list({ limit: 20 })
        .then((res) => setNotifications(Array.isArray(res?.data) ? res.data : []))
        .catch(() => {});
    };
    socket.on('new_answer', onNotif);
    socket.on('revision_requested', onNotif);
    socket.on('answer_approved', onNotif);
    socket.on('answer_rejected', onNotif);
    socket.on('inline_comment', onNotif);
    socket.on('question_completed', onNotif);
    return () => {
      socket.off('new_answer', onNotif);
      socket.off('revision_requested', onNotif);
      socket.off('answer_approved', onNotif);
      socket.off('answer_rejected', onNotif);
      socket.off('inline_comment', onNotif);
      socket.off('question_completed', onNotif);
    };
  }, [socket, user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isSenior = user?.role === 'senior_member';

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-brand">
          <Link to={isSenior ? '/senior' : '/researcher/landing'}>Pradhikaran Portal</Link>
        </div>
        <nav className="layout-nav">
          {/* Home button for both roles */}
          <Link to={isSenior ? '/senior' : '/researcher/landing'} className={location.pathname === (isSenior ? '/senior' : '/researcher/landing') ? 'active' : ''}>Home</Link>
          
          {isSenior && (
            <>
              <Link to="/senior" className={location.pathname === '/senior' ? 'active' : ''}>Dashboard</Link>
              <Link to="/senior/questions/new">New Question</Link>
              <Link to="/senior/analytics" className={location.pathname === '/senior/analytics' ? 'active' : ''}>Analytics</Link>
            </>
          )}
          {!isSenior && (
            <Link to="/researcher" className={location.pathname === '/researcher' ? 'active' : ''}>My Questions</Link>
          )}
        </nav>
        <div className="layout-actions">
          <span className="user-name">{user?.name}</span>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main className="layout-main">{children}</main>
    </div>
  );
}
