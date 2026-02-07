import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import SeniorDashboard from './pages/SeniorDashboard';
import ResearcherDashboard from './pages/ResearcherDashboard';
import QuestionCreate from './pages/QuestionCreate';
import QuestionDetail from './pages/QuestionDetail';
import AnswerEditor from './pages/AnswerEditor';
import ReviewFeedback from './pages/ReviewFeedback';
import QuestionEdit from './pages/QuestionEdit';
import Analytics from './pages/Analytics';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={user.role === 'senior_member' ? '/senior' : '/researcher'} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/senior"
        element={
          <ProtectedRoute allowedRoles={['senior_member']}>
            <Layout><SeniorDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/senior/questions/new"
        element={
          <ProtectedRoute allowedRoles={['senior_member']}>
            <Layout><QuestionCreate /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/senior/questions/:id"
        element={
          <ProtectedRoute allowedRoles={['senior_member']}>
            <Layout><QuestionDetail /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/senior/questions/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['senior_member']}>
            <Layout><QuestionEdit /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/senior/questions/:id/review"
        element={
          <ProtectedRoute allowedRoles={['senior_member']}>
            <Layout><ReviewFeedback /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/senior/analytics"
        element={
          <ProtectedRoute allowedRoles={['senior_member']}>
            <Layout><Analytics /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher"
        element={
          <ProtectedRoute allowedRoles={['researcher']}>
            <Layout><ResearcherDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher/questions/:id"
        element={
          <ProtectedRoute allowedRoles={['researcher']}>
            <Layout><AnswerEditor /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
