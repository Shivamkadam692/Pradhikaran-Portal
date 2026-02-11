import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function ResearcherLanding() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'Researcher'}!</h1>
        <p className="auth-subtitle">Pradhikaran Portal</p>
      </div>
      
      <div className="landing-content" style={{ maxWidth: '800px', margin: '2rem auto', textAlign: 'center' }}>
        <div className="landing-section" style={{ marginBottom: '2rem', padding: '2rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <h2>Get Started</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#666' }}>
            Browse open questions from your department and submit your answers.
          </p>
          <Link to="/departments" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
            View Open Questions
          </Link>
        </div>

        <div className="landing-features" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          <div className="feature-card" style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>📝 Answer Questions</h3>
            <p style={{ color: '#666' }}>Submit answers to research questions from your department.</p>
          </div>
          
          <div className="feature-card" style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>🔄 Revisions</h3>
            <p style={{ color: '#666' }}>Receive feedback and revise your answers as needed.</p>
          </div>
          
          <div className="feature-card" style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>📊 Track Progress</h3>
            <p style={{ color: '#666' }}>Monitor the status of your submissions and versions.</p>
          </div>
        </div>

        {user?.department && (
          <div className="department-info" style={{ marginTop: '2rem', padding: '1rem', background: '#e3f2fd', borderRadius: '8px' }}>
            <p style={{ margin: 0 }}>
              <strong>Your Department:</strong> {user.department}
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
              You can only view and answer questions from your department.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

