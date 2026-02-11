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
    navigate('/pradhikaran/login');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isPradhikaranOffice = user?.role === 'pradhikaran_office';
  const isDepartment = user?.role === 'departments';

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-brand">
          <Link to={isPradhikaranOffice ? '/pradhikaran/dashboard' : '/departments/landing'}>Pradhikaran Portal</Link>
        </div>
        <nav className="layout-nav">
          {/* Home button for both roles */}
          <Link 
            to={isPradhikaranOffice ? '/pradhikaran/dashboard' : '/departments/landing'} 
            className={location.pathname === (isPradhikaranOffice ? '/pradhikaran/dashboard' : '/departments/landing') ? 'active' : ''}
          >
            Home
          </Link>
          
          {isPradhikaranOffice && (
            <>
              <Link to="/pradhikaran/departments" className={location.pathname === '/pradhikaran/departments' ? 'active' : ''}>Departments</Link>
              <Link to="/pradhikaran/questions" className={location.pathname === '/pradhikaran/questions' ? 'active' : ''}>Q&A Management</Link>
              <Link to="/pradhikaran/questions/new">New Question</Link>
              <Link to="/pradhikaran/analytics" className={location.pathname === '/pradhikaran/analytics' ? 'active' : ''}>Analytics</Link>
              <Link to="/pradhikaran/admin" className={location.pathname === '/pradhikaran/admin' ? 'active' : ''}>Admin</Link>
            </>
          )}
          {isDepartment && (
            <Link to="/departments" className={location.pathname === '/departments' ? 'active' : ''}>My Questions</Link>
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
