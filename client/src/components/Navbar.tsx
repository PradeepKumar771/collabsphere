import React, { useState, useEffect } from 'react';

interface NavbarProps {
  currentRoute: string;
}

const Navbar: React.FC<NavbarProps> = ({ currentRoute }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <nav className="nav-container" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>🌐 CollabSphere</span>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <a 
          href="#dashboard" 
          style={{
            color: currentRoute.startsWith('#dashboard') ? 'var(--accent)' : 'var(--text)',
            textDecoration: 'none',
            fontWeight: currentRoute.startsWith('#dashboard') ? 'bold' : 'normal',
            transition: 'color 0.2s',
          }}
        >
          Workspace
        </a>
        <a 
          href="#portfolio" 
          style={{
            color: currentRoute.startsWith('#portfolio') ? 'var(--accent)' : 'var(--text)',
            textDecoration: 'none',
            fontWeight: currentRoute.startsWith('#portfolio') ? 'bold' : 'normal',
            transition: 'color 0.2s',
          }}
        >
          My Portfolio
        </a>

        {/* Network Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.25rem 0.6rem',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: '500',
          background: isOnline ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
          color: isOnline ? '#4caf50' : '#f44336',
          border: `1px solid ${isOnline ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}`,
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isOnline ? '#4caf50' : '#f44336',
            display: 'inline-block',
          }}></span>
          {isOnline ? 'Online' : 'Offline Mode'}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
