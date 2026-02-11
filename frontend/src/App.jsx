import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import PradhikaranLogin from './pages/PradhikaranLogin';
import DepartmentLogin from './pages/DepartmentLogin';
import DepartmentRegister from './pages/DepartmentRegister';
import PradhikaranDashboard from './pages/PradhikaranDashboard';
import AdminPanel from './pages/AdminPanel';
import SeniorDashboard from './pages/SeniorDashboard';
import ResearcherDashboard from './pages/ResearcherDashboard';
import ResearcherLanding from './pages/ResearcherLanding';
import QuestionCreate from './pages/QuestionCreate';
import QuestionDetail from './pages/QuestionDetail';
import AnswerEditor from './pages/AnswerEditor';
import ReviewFeedback from './pages/ReviewFeedback';
import QuestionEdit from './pages/QuestionEdit';
import Analytics from './pages/Analytics';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading...</div>;
  if (!user) return <Navigate to="/pradhikaran/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'pradhikaran_office' ? '/pradhikaran/dashboard' : '/departments/landing'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Authentication Routes */}
      <Route path="/pradhikaran/login" element={<PradhikaranLogin />} />
      <Route path="/departments/login" element={<DepartmentLogin />} />
      <Route path="/departments/register" element={<DepartmentRegister />} />
      
      {/* Pradhikaran Office Routes */}
      <Route
        path="/pradhikaran/dashboard"
        element={
          <ProtectedRoute allowedRoles={['pradhikaran_office']}>
            <Layout><PradhikaranDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pradhikaran/admin"
        element={
          <ProtectedRoute allowedRoles={['pradhikaran_office']}>
            <Layout><AdminPanel /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pradhikaran/questions/new"
        element={
          <ProtectedRoute allowedRoles={['pradhikaran_office']}>
            <Layout><QuestionCreate /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pradhikaran/questions/:id"
        element={
          <ProtectedRoute allowedRoles={['pradhikaran_office']}>
            <Layout><QuestionDetail /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pradhikaran/questions/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['pradhikaran_office']}>
            <Layout><QuestionEdit /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pradhikaran/questions/:id/review"
        element={
          <ProtectedRoute allowedRoles={['pradhikaran_office']}>
            <Layout><ReviewFeedback /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pradhikaran/analytics"
        element={
          <ProtectedRoute allowedRoles={['pradhikaran_office']}>
            <Layout><Analytics /></Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Department Routes */}
      <Route
        path="/departments/landing"
        element={
          <ProtectedRoute allowedRoles={['departments']}>
            <Layout><ResearcherLanding /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <ProtectedRoute allowedRoles={['departments']}>
            <Layout><ResearcherDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments/questions/:id"
        element={
          <ProtectedRoute allowedRoles={['departments']}>
            <Layout><AnswerEditor /></Layout>
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
      <Route path="/" element={<Navigate to="/pradhikaran/login" replace />} />
      <Route path="*" element={<Navigate to="/pradhikaran/login" replace />} />
    </Routes>
  );
}
