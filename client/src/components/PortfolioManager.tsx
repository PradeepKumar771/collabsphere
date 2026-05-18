import React, { useState, useEffect } from 'react';
import { cachePortfolio, getCachedPortfolio } from '../utils/db';

const PortfolioManager: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [optimizerLog, setOptimizerLog] = useState('');

  useEffect(() => {
    const loadCached = async () => {
      const cached = await getCachedPortfolio('me');
      if (cached) {
        setTitle(cached.title);
        setDescription(cached.description);
        setSkills(cached.skills.join(', '));
        setMediaUrl(cached.mediaUrl || '');
      }
    };
    loadCached();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
    const portfolioData = {
      id: 'me',
      title,
      description,
      skills: skillsArray,
      mediaUrl,
      updatedAt: new Date().toISOString(),
    };

    // Cache locally in IndexedDB
    await cachePortfolio(portfolioData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);

    // Mock Serverless Portfolio optimizer if online
    if (navigator.onLine) {
      setOptimizerLog('⚙️ Contacting CDN serverless optimizer...');
      setTimeout(() => {
        setOptimizerLog('✅ Media file compressed by 65%. Dynamic CDN link loaded!');
        setMediaUrl('https://cdn.collabsphere.com/optimized/portfolios/me-showcase.png');
      }, 1500);
    } else {
      setOptimizerLog('⚠️ Offline. Local changes stored in IndexedDB cache.');
    }
  };

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '8px',
      background: 'var(--bg)',
      padding: '2rem',
      boxShadow: 'var(--shadow)',
    }}>
      <h2>📁 Creator Portfolio Manager</h2>
      <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--text)' }}>
        Your portfolio details are saved instantly to your browser's offline storage (IndexedDB).
      </p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
            Professional Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Web3 Creator & Motion Designer"
            required
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: 'var(--code-bg)',
              color: 'var(--text-h)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
            Bio / Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe your services, artistic style, or professional experience."
            rows={4}
            required
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: 'var(--code-bg)',
              color: 'var(--text-h)',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
            Skills (comma separated)
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="React, TypeScript, GraphQL, Blender, WebSockets"
            required
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: 'var(--code-bg)',
              color: 'var(--text-h)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
            Showcase Media URL (Image or Video)
          </label>
          <input
            type="text"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://example.com/art.png"
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: 'var(--code-bg)',
              color: 'var(--text-h)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '0.8rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginTop: '0.5rem',
            transition: 'opacity 0.2s',
          }}
        >
          Save Portfolio Details
        </button>
      </form>

      {isSaved && (
        <div style={{
          marginTop: '1rem',
          padding: '0.6rem 1rem',
          background: 'rgba(76, 175, 80, 0.1)',
          color: '#4caf50',
          borderRadius: '4px',
          fontSize: '0.9rem',
          fontWeight: '500',
        }}>
          💾 Changes saved to local IndexedDB store!
        </div>
      )}

      {optimizerLog && (
        <div style={{
          marginTop: '1rem',
          padding: '0.6rem 1rem',
          background: 'var(--code-bg)',
          color: 'var(--text-h)',
          borderRadius: '4px',
          fontSize: '0.85rem',
          fontFamily: 'monospace',
          borderLeft: '3px solid var(--accent)',
        }}>
          {optimizerLog}
        </div>
      )}
    </div>
  );
};

export default PortfolioManager;
