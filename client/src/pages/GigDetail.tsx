import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation, useSubscription } from '@apollo/client/react';
import LiveChat from '../components/LiveChat';

const GET_GIG_DETAILS = gql`
  query GetGigDetails($id: ID!) {
    gig(id: $id) {
      id
      title
      description
      budget
      creator {
        id
        name
        email
      }
      milestones {
        id
        title
        amount
        status
      }
      applications {
        id
        pitch
        budget
        status
        freelancer {
          name
        }
      }
    }
  }
`;

const APPLY_TO_GIG = gql`
  mutation ApplyToGig($gigId: String!, $pitch: String!, $budget: Float!, $freelancerName: String!) {
    applyToGig(gigId: $gigId, pitch: $pitch, budget: $budget, freelancerName: $freelancerName) {
      id
      pitch
      status
    }
  }
`;

const UPDATE_MILESTONE = gql`
  mutation UpdateMilestone($milestoneId: String!, $status: MilestoneStatus!) {
    updateMilestoneStatus(milestoneId: $milestoneId, status: $status) {
      id
      status
    }
  }
`;

const UPDATE_APPLICATION = gql`
  mutation UpdateApplication($applicationId: String!, $status: ApplicationStatus!) {
    updateApplicationStatus(applicationId: $applicationId, status: $status) {
      id
      status
    }
  }
`;

const MILESTONE_SUBSCRIPTION = gql`
  subscription OnMilestoneUpdated($gigId: ID!) {
    milestoneUpdated(gigId: $gigId) {
      id
      title
      amount
      status
    }
  }
`;

interface GigDetailProps {
  gigId: string;
}

const GigDetail: React.FC<GigDetailProps> = ({ gigId }) => {
  const [pitchText, setPitchText] = useState('');
  const [pitchBudget, setPitchBudget] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [localMilestones, setLocalMilestones] = useState<any[]>([]);

  const [username] = useState(() => {
    const saved = localStorage.getItem('collabsphere_username');
    if (saved) return saved;
    const generated = `User-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('collabsphere_username', generated);
    return generated;
  });

  // 1. Query all details
  const { data, loading, error, refetch } = useQuery<any>(GET_GIG_DETAILS, {
    variables: { id: gigId },
    skip: !navigator.onLine,
  });

  // 2. Milestone real-time updates subscription
  const { data: subData } = useSubscription<any>(MILESTONE_SUBSCRIPTION, {
    variables: { gigId },
    skip: !navigator.onLine,
  });

  // Mutations
  const [applyMutation] = useMutation(APPLY_TO_GIG, { onCompleted: () => { refetch(); setHasApplied(true); } });
  const [updateMilestone] = useMutation(UPDATE_MILESTONE, { onCompleted: () => refetch() });
  const [updateApplication] = useMutation(UPDATE_APPLICATION, { onCompleted: () => refetch() });

  // Sync historical milestones
  useEffect(() => {
    if (data && data.gig && data.gig.milestones) {
      setLocalMilestones(data.gig.milestones);
    }
  }, [data]);

  // Sync subscription real-time milestone updates
  useEffect(() => {
    if (subData && subData.milestoneUpdated) {
      const updated = subData.milestoneUpdated;
      setLocalMilestones((prev) =>
        prev.map((m) => (m.id === updated.id ? { ...m, status: updated.status } : m))
      );
    }
  }, [subData]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text)' }}>Loading gig workspace...</div>;
  if (error || !data || !data.gig) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text)' }}>
        <h2>⚠️ Workspace Offline or Unavailable</h2>
        <p>Real-time collaboration is only active in online mode.</p>
        <button onClick={() => window.location.hash = '#dashboard'} style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '0.6rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
          Back to Workspace
        </button>
      </div>
    );
  }

  const { gig } = data;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await applyMutation({
        variables: {
          gigId,
          pitch: pitchText,
          budget: parseFloat(pitchBudget),
          freelancerName: username,
        },
      });
    } catch (err) {
      console.error('Error applying to gig:', err);
    }
  };

  const handleMilestoneCycle = async (milestoneId: string, currentStatus: string) => {
    const nextStatusMap: Record<string, 'IN_PROGRESS' | 'COMPLETED' | 'PENDING'> = {
      PENDING: 'IN_PROGRESS',
      IN_PROGRESS: 'COMPLETED',
      COMPLETED: 'PENDING',
    };
    const nextStatus = nextStatusMap[currentStatus] || 'PENDING';
    await updateMilestone({
      variables: { milestoneId, status: nextStatus },
    });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <button
        onClick={() => window.location.hash = '#dashboard'}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          cursor: 'pointer',
          marginBottom: '1rem',
          fontSize: '1rem',
          padding: 0,
        }}
      >
        ← Back to Workspace Gigs
      </button>

      {/* Grid Cockpit */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '2rem' }}>
        
        {/* Left Side: Gig Info & Milestones */}
        <div>
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'var(--social-bg)',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <h1 style={{ marginTop: 0, color: 'var(--text-h)' }}>{gig.title}</h1>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--accent-bg)', color: 'var(--accent)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>
                Budget: ${gig.budget}
              </span>
              <span style={{ color: 'var(--text)', padding: '0.3rem 0', fontSize: '0.9rem' }}>
                Posted by: <strong>{gig.creator.name}</strong> ({gig.creator.email})
              </span>
            </div>
            <p style={{ color: 'var(--text)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{gig.description}</p>
          </div>

          {/* Milestones Tracker */}
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'var(--bg)',
            padding: '2rem',
          }}>
            <h2 style={{ marginTop: 0 }}>📊 Gig Milestones</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: '1.5rem' }}>
              Click on a milestone status to cycle its progress. Real-time updates stream instantly via WebSockets!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {localMilestones.length === 0 && <p>No milestones created for this contract.</p>}
              {localMilestones.map((m) => {
                const statusColorMap: Record<string, string> = {
                  PENDING: '#9e9e9e',
                  IN_PROGRESS: '#ff9800',
                  COMPLETED: '#4caf50',
                };
                return (
                  <div
                    key={m.id}
                    onClick={() => handleMilestoneCycle(m.id, m.status)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: 'var(--code-bg)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--social-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--code-bg)'}
                  >
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-h)' }}>{m.title}</strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: '500' }}>${m.amount}</span>
                    </div>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      padding: '0.3rem 0.7rem',
                      borderRadius: '20px',
                      background: statusColorMap[m.status] + '22',
                      color: statusColorMap[m.status],
                      border: `1px solid ${statusColorMap[m.status]}33`,
                    }}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Chat room & Bids applications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Chat room */}
          <LiveChat gigId={gigId} />

          {/* Applications/Bid panel */}
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'var(--bg)',
            padding: '2rem',
          }}>
            <h2>Bid Applications</h2>

            {/* Freelancer Pitch Form */}
            {!hasApplied && (
              <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Are you a creator? Submit a pitch and offer active pricing to apply.</p>
                <div>
                  <textarea
                    value={pitchText}
                    onChange={(e) => setPitchText(e.target.value)}
                    placeholder="Describe your design style, software experience, and why you are the best fit."
                    required
                    rows={3}
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--code-bg)', color: 'var(--text-h)', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={pitchBudget}
                    onChange={(e) => setPitchBudget(e.target.value)}
                    placeholder="Your Bid Budget ($)"
                    required
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--code-bg)', color: 'var(--text-h)', boxSizing: 'border-box' }}
                  />
                </div>
                <button type="submit" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Submit Pitch Application
                </button>
              </form>
            )}

            {hasApplied && (
              <div style={{ padding: '0.75rem', background: 'rgba(76,175,80,0.1)', color: '#4caf50', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                🎉 Application successfully submitted! Review details below.
              </div>
            )}

            {/* Applications List */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {gig.applications.length === 0 && <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>No bids submitted yet.</p>}
              {gig.applications.map((app: any) => (
                <div key={app.id} style={{
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  background: 'var(--code-bg)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{app.freelancer.name}</strong>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>${app.budget}</span>
                  </div>
                  <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.85rem', color: 'var(--text)', whiteSpace: 'pre-line' }}>{app.pitch}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: app.status === 'ACCEPTED' ? '#4caf50' : app.status === 'REJECTED' ? '#f44336' : '#ff9800',
                    }}>
                      Status: {app.status}
                    </span>
                    {app.status === 'PENDING' && gig.creator.name === username && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => updateApplication({ variables: { applicationId: app.id, status: 'ACCEPTED' } })}
                          style={{ background: '#4caf50', color: '#fff', border: 'none', borderRadius: '3px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateApplication({ variables: { applicationId: app.id, status: 'REJECTED' } })}
                          style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: '3px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigDetail;
