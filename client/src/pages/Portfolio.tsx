import React from 'react';
import PortfolioManager from '../components/PortfolioManager';

const Portfolio: React.FC = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>📂 My Portfolio Showcase</h1>
      <p style={{ marginBottom: '2rem', color: 'var(--text)' }}>
        Configure your professional profile, skills tags, and artistic media.
        All data is backed by local cache layouts (IndexedDB) and synchronized securely.
      </p>
      
      <PortfolioManager />
    </div>
  );
};

export default Portfolio;
