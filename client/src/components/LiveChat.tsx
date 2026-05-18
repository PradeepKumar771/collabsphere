import React, { useState, useEffect, useRef } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation, useSubscription } from '@apollo/client/react';
import { queueOfflineMessage, getOfflineMessages } from '../utils/db';

const GET_MESSAGES = gql`
  query GetMessages($gigId: ID!) {
    messages(gigId: $gigId) {
      id
      content
      createdAt
      sender {
        id
        name
      }
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($gigId: String!, $content: String!) {
    sendMessage(gigId: $gigId, content: $content) {
      id
      content
      createdAt
      sender {
        id
        name
      }
    }
  }
`;

const MESSAGE_SUBSCRIPTION = gql`
  subscription OnMessageSent($gigId: ID!) {
    messageSent(gigId: $gigId) {
      id
      content
      createdAt
      sender {
        id
        name
      }
    }
  }
`;

interface LiveChatProps {
  gigId: string;
}

const LiveChat: React.FC<LiveChatProps> = ({ gigId }) => {
  const [inputText, setInputText] = useState('');
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 1. Fetch historical messages
  const { data, loading } = useQuery<any>(GET_MESSAGES, {
    variables: { gigId },
    skip: !navigator.onLine, // Skip remote query if offline
  });

  // 2. Setup Subscription for real-time updates (only if online)
  const { data: subData } = useSubscription<any>(MESSAGE_SUBSCRIPTION, {
    variables: { gigId },
    skip: !navigator.onLine,
  });

  // 3. Mutation to send message
  const [sendMessageMutation] = useMutation(SEND_MESSAGE);

  // Sync historical queries to local state
  useEffect(() => {
    if (data && data.messages) {
      setLocalMessages(data.messages);
    }
  }, [data]);

  // Sync incoming real-time subscription messages to local state
  useEffect(() => {
    if (subData && subData.messageSent) {
      const incoming = subData.messageSent;
      // Prevent duplicates
      setLocalMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    }
  }, [subData]);

  // Handle local offline queued messages for visualization
  useEffect(() => {
    const fetchOffline = async () => {
      const offlineMsgs = await getOfflineMessages();
      const gigOfflineMsgs = offlineMsgs
        .filter((m) => m.gigId === gigId)
        .map((m, index) => ({
          id: `offline-${index}`,
          content: m.content,
          createdAt: m.createdAt,
          sender: { id: 'me', name: 'You (Offline draft)' },
        }));

      if (gigOfflineMsgs.length > 0) {
        setLocalMessages((prev) => {
          // Remove previously rendered offline drafts first to avoid duplication
          const filtered = prev.filter((m) => !m.id.startsWith('offline-'));
          return [...filtered, ...gigOfflineMsgs];
        });
      }
    };

    fetchOffline();
    const interval = setInterval(fetchOffline, 2000);
    return () => clearInterval(interval);
  }, [gigId]);

  // Autoscroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageContent = inputText;
    setInputText('');

    if (navigator.onLine) {
      try {
        await sendMessageMutation({
          variables: { gigId, content: messageContent },
        });
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    } else {
      // Offline: Cache message in IndexedDB queue
      const offlineMsg = {
        gigId,
        content: messageContent,
        createdAt: new Date().toISOString(),
      };
      await queueOfflineMessage(offlineMsg);

      // Render instantly as local draft
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `offline-draft-${Date.now()}`,
          content: messageContent,
          createdAt: offlineMsg.createdAt,
          sender: { id: 'me', name: 'You (Offline draft)' },
        },
      ]);
    }
  };

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '8px',
      background: 'var(--social-bg)',
      display: 'flex',
      flexDirection: 'column',
      height: '400px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border)',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>💬 Workspace Chatroom</span>
        {!navigator.onLine && (
          <span style={{ fontSize: '0.75rem', color: '#f44336' }}>Offline - drafts will queue</span>
        )}
      </div>

      {/* Messages list */}
      <div style={{
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
      }}>
        {loading && <p style={{ textAlign: 'center', color: 'var(--text)' }}>Loading messages...</p>}
        {localMessages.length === 0 && !loading && (
          <p style={{ textAlign: 'center', color: 'var(--text)', fontSize: '0.9rem', margin: 'auto' }}>
            No chat history. Start typing to begin collaborating!
          </p>
        )}
        {localMessages.map((msg) => {
          const isMe = msg.sender.id === 'me' || msg.sender.name.startsWith('You');
          return (
            <div key={msg.id} style={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              maxWidth: '75%',
              background: isMe ? 'var(--accent)' : 'var(--code-bg)',
              color: isMe ? '#fff' : 'var(--text-h)',
              padding: '0.6rem 0.9rem',
              borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.2rem', fontWeight: 'bold' }}>
                {msg.sender.name}
              </div>
              <div style={{ fontSize: '0.9rem', wordBreak: 'break-word' }}>{msg.content}</div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} style={{
        display: 'flex',
        padding: '0.5rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
      }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type message here..."
          style={{
            flex: 1,
            padding: '0.6rem 1rem',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            background: 'var(--code-bg)',
            color: 'var(--text-h)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            marginLeft: '0.5rem',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '0.6rem 1.2rem',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default LiveChat;
