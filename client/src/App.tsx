import React, { useState, useEffect, Suspense } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import Navbar from './components/Navbar';
import OfflineIndicator from './components/OfflineIndicator';
import { registerOnlineListener } from './utils/sync';
import type { OfflineMessage } from './utils/db';

// Lazy load route pages for high performance / code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const GigDetail = React.lazy(() => import('./pages/GigDetail'));
const Portfolio = React.lazy(() => import('./pages/Portfolio'));

const SEND_MESSAGE = gql`
  mutation SendMessage($gigId: String!, $content: String!) {
    sendMessage(gigId: $gigId, content: $content) {
      id
    }
  }
`;

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash || '#dashboard');
  const [sendMessageMutation] = useMutation(SEND_MESSAGE);

  // 1. Hash router controller
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#dashboard');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 2. Register offline background queue sync orchestrator
  useEffect(() => {
    registerOnlineListener(async (msg: OfflineMessage) => {
      try {
        await sendMessageMutation({
          variables: {
            gigId: msg.gigId,
            content: msg.content,
          },
        });
        return true;
      } catch (err) {
        console.error('Failed to sync offline message back to GraphQL server:', err);
        return false;
      }
    });
  }, [sendMessageMutation]);

  // 3. Simple Route Switcher
  const renderRoute = () => {
    if (route.startsWith('#portfolio')) {
      return <Portfolio />;
    }
    if (route.startsWith('#gig/')) {
      const gigId = route.split('/')[1];
      return <GigDetail gigId={gigId} />;
    }
    // Default to Dashboard
    return <Dashboard />;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Sticky header nav with online network sensor */}
      <Navbar currentRoute={route} />

      {/* Main Container */}
      <main style={{ flex: 1, paddingBottom: '4rem' }}>
        <Suspense fallback={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60vh',
            fontSize: '1.25rem',
            fontWeight: '500',
            color: 'var(--accent)',
          }}>
            <div style={{
              border: '4px solid var(--border)',
              borderTop: '4px solid var(--accent)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              marginRight: '1rem',
            }}></div>
            Loading CollabSphere Route...
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        }>
          {renderRoute()}
        </Suspense>
      </main>

      {/* Floating Offline Alert indicator banner */}
      <OfflineIndicator />
    </div>
  );
};

export default App;
