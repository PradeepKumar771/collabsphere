import React, { useEffect, useState } from 'react';
import { getOfflineMessages } from '../utils/db';

const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Refresh pending count
    const interval = setInterval(async () => {
      if (isOffline) {
        const msgs = await getOfflineMessages();
        setPendingCount(msgs.length);
      }
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOffline]);

  if (!isOffline) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      zIndex: 999,
      background: '#2f303a',
      color: '#fff',
      padding: '0.8rem 1.2rem',
      borderRadius: '8px',
      boxShadow: 'var(--shadow)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.3rem',
      borderLeft: '4px solid #f44336',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
        <span>⚠️ Running Offline</span>
      </div>
      <p style={{ fontSize: '0.8rem', margin: 0, opacity: 0.8 }}>
        Portfolios and active jobs are cached locally.
      </p>
      {pendingCount > 0 && (
        <span style={{
          fontSize: '0.75rem',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          display: 'inline-block',
          marginTop: '0.25rem',
        }}>
          💬 {pendingCount} drafted message(s) queued for sync.
        </span>
      )}
    </div>
  );
};

export default OfflineIndicator;
