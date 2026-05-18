import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { cacheGigs, getCachedGigs } from '../utils/db';

const GET_GIGS = gql`
  query GetGigs {
    gigs {
      id
      title
      description
      budget
      creator {
        name
      }
    }
  }
`;

const CREATE_GIG = gql`
  mutation CreateGig($title: String!, $description: String!, $budget: Float!, $milestones: [MilestoneInput!]!, $creatorName: String!) {
    createGig(title: $title, description: $description, budget: $budget, milestones: $milestones, creatorName: $creatorName) {
      id
      title
      description
      budget
    }
  }
`;

const Dashboard: React.FC = () => {
  const [gigs, setGigs] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneAmount, setMilestoneAmount] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [username] = useState(() => {
    const saved = localStorage.getItem('collabsphere_username');
    if (saved) return saved;
    const generated = `User-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('collabsphere_username', generated);
    return generated;
  });

  // 1. Fetch remote gigs if online
  const { data, loading, refetch } = useQuery<any>(GET_GIGS, {
    skip: !navigator.onLine,
  });

  // 2. Mutation to create gig
  const [createGigMutation] = useMutation(CREATE_GIG, {
    onCompleted: () => {
      refetch();
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewBudget('');
      setMilestoneTitle('');
      setMilestoneAmount('');
    },
  });

  // Sync online data to local state & cache in IndexedDB
  useEffect(() => {
    if (data && data.gigs) {
      setGigs(data.gigs);
      cacheGigs(data.gigs);
    }
  }, [data]);

  // Load from IndexedDB cache if offline
  useEffect(() => {
    if (!navigator.onLine) {
      const loadCached = async () => {
        const cached = await getCachedGigs();
        setGigs(cached);
      };
      loadCached();
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navigator.onLine) {
      alert('⚠️ Offline: Creating gigs is only supported when online to lock active budgets.');
      return;
    }

    const budgetVal = parseFloat(newBudget);
    const milestones = milestoneTitle
      ? [{ title: milestoneTitle, amount: parseFloat(milestoneAmount) || budgetVal }]
      : [];

    try {
      await createGigMutation({
        variables: {
          title: newTitle,
          description: newDesc,
          budget: budgetVal,
          milestones,
          creatorName: username,
        },
      });
    } catch (err) {
      console.error('Error creating gig:', err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>💼 CollabSphere Workspace</h1>
          <p>Find creator contracts, track budgets, and manage milestones in real-time.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: 'var(--accent)',
            border: 'none',
            borderRadius: '4px',
            padding: '0.8rem 1.5rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            color: '#fff',
          }}
        >
          ➕ Post a New Gig
        </button>
      </header>

      {/* Post Gig Modal/Form */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg)',
            padding: '2.5rem',
            borderRadius: '12px',
            width: '500px',
            maxWidth: '90%',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
          }}>
            <h2 style={{ marginTop: 0 }}>Create a Gig Contract</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem' }}>Gig Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 3D NFT Animator for Sci-Fi Game"
                  required
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--code-bg)', color: 'var(--text-h)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem' }}>Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the scope, tools needed, and collaboration timelines."
                  required
                  rows={4}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--code-bg)', color: 'var(--text-h)', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem' }}>Total Budget ($)</label>
                  <input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    placeholder="1200"
                    required
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--code-bg)', color: 'var(--text-h)' }}
                  />
                </div>
              </div>
              <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
              <div>
                <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Initial Milestone (Optional)</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={milestoneTitle}
                    onChange={(e) => setMilestoneTitle(e.target.value)}
                    placeholder="Milestone 1: 3D modeling draft"
                    style={{ flex: 2, padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--code-bg)', color: 'var(--text-h)' }}
                  />
                  <input
                    type="number"
                    value={milestoneAmount}
                    onChange={(e) => setMilestoneAmount(e.target.value)}
                    placeholder="Amount ($)"
                    style={{ flex: 1, padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--code-bg)', color: 'var(--text-h)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'var(--social-bg)', border: 'none', borderRadius: '4px', padding: '0.6rem 1.2rem', cursor: 'pointer', color: 'var(--text-h)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.6rem 1.2rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Publish Gig
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gigs List */}
      {loading && <p style={{ fontSize: '1.2rem', color: 'var(--text)' }}>Fetching active contracts...</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
        {gigs.length === 0 && !loading && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>
            No gigs posted yet. Be the first to start a collaboration!
          </div>
        )}
        {gigs.map((gig) => (
          <div
            key={gig.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--social-bg)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
            onClick={() => { window.location.hash = `#gig/${gig.id}`; }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'; }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                }}>
                  Active Budget
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent)' }}>${gig.budget}</span>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-h)', fontSize: '1.25rem' }}>{gig.title}</h3>
              <p style={{
                color: 'var(--text)',
                fontSize: '0.9rem',
                lineHeight: '1.4',
                marginBottom: '1.5rem',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {gig.description}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Posted by: {gig.creator.name}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent)' }}>View details →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
