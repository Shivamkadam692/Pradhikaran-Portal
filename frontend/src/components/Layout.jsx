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
          <Link to={isSenior ? '/senior' : '/researcher'}>Research Collab</Link>
        </div>
        <nav className="layout-nav">
          {isSenior && (
            <>
              <Link to="/senior" className={location.pathname === '/senior' ? 'active' : ''}>Dashboard</Link>
              <Link to="/senior/questions/new">New Question</Link>
              <Link to="/senior/analytics" className={location.pathname === '/senior/analytics' ? 'active' : ''}>Analytics</Link>
            </>
          )}
          {!isSenior && (
            <Link to="/researcher" className={location.pathname === '/researcher' ? 'active' : ''}>Dashboard</Link>
          )}
        </nav>
        <div className="layout-actions">
          <div className="notif-wrap">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowNotifs(!showNotifs)}
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
            {showNotifs && (
              <div className="notif-dropdown">
                {notifications.length === 0 ? (
                  <p className="muted">No notifications</p>
                ) : (
                  notifications.slice(0, 10).map((n) => {
                    const path = n.link || '';
                    const match = path.match(/\/questions\/([a-f0-9]+)/);
                    const qId = match?.[1];
                    const to = path.startsWith('/questions/')
                      ? (user?.role === 'senior_member' ? `/senior${path}` : (qId ? `/researcher/questions/${qId}` : `/researcher${path}`))
                      : (path || '#');
                    return (
                    <Link
                      key={n._id}
                      to={to}
                      className="notif-item"
                      onClick={() => {
                        notificationsApi.markRead(n._id);
                        setShowNotifs(false);
                      }}
                    >
                      <strong>{n.title}</strong>
                      {!n.read && <span className="unread-dot" />}
                    </Link>
                  ); })
                )}
              </div>
            )}
          </div>
          <span className="user-name">{user?.name}</span>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main className="layout-main">{children}</main>
    </div>
  );
}
