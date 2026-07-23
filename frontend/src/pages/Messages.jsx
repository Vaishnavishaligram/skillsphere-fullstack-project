import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Paperclip, Check, CheckCheck } from 'lucide-react';
import { useInbox, useConversation, useMarkConversationRead } from '../../hooks/queries/useChatQueries';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const Messages = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  // Inbox list and initial conversation history are server state, owned by
  // React Query (auto-refreshed whenever the Socket.IO handler invalidates
  // the 'chat' cache - see context/SocketContext.jsx). The open conversation
  // additionally keeps a local `messages` array so newly-arrived real-time
  // messages can be appended instantly without waiting on a refetch.
  const { data: conversations = [], isLoading: loadingInbox } = useInbox();
  const { data: conversationHistory, isLoading: loadingConvo } = useConversation(userId);
  const markConversationRead = useMarkConversationRead();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeout = useRef(null);
  const messagesEndRef = useRef(null);

  // Re-seed local messages whenever the fetched history changes (i.e. every
  // time the person switches to a different conversation).
  useEffect(() => {
    if (conversationHistory) setMessages(conversationHistory);
  }, [conversationHistory, userId]);

  useEffect(() => {
    if (!userId) return;
    markConversationRead.mutate(userId);
    if (socket) socket.emit('join_conversation', { otherUserId: userId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, socket]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg) => {
      if (msg.sender._id === userId || msg.sender === userId || msg.receiver === userId) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    const onTyping = ({ userId: typingUserId }) => {
      if (typingUserId === userId) setOtherTyping(true);
    };
    const onStopTyping = ({ userId: typingUserId }) => {
      if (typingUserId === userId) setOtherTyping(false);
    };

    socket.on('receive_message', onReceive);
    socket.on('user_typing', onTyping);
    socket.on('user_stop_typing', onStopTyping);

    return () => {
      socket.off('receive_message', onReceive);
      socket.off('user_typing', onTyping);
      socket.off('user_stop_typing', onStopTyping);
    };
  }, [socket, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('send_message', { receiverId: userId, content: input });
    setInput('');
    socket.emit('stop_typing', { receiverId: userId });
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit('typing', { receiverId: userId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit('stop_typing', { receiverId: userId }), 1500);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] card overflow-hidden">
      {/* Conversation list */}
      <div className="w-72 border-r border-ink-100 flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-ink-100">
          <h2 className="font-display font-semibold text-ink-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingInbox ? (
            <LoadingSpinner />
          ) : conversations.length === 0 ? (
            <p className="text-sm text-ink-400 text-center py-8 px-4">No conversations yet.</p>
          ) : (
            conversations.map((c) => {
              const other = c.lastMessage.sender._id === user._id ? c.lastMessage.receiver : c.lastMessage.sender;
              const otherId = typeof other === 'object' ? other._id : other;
              return (
                <button
                  key={c._id}
                  onClick={() => navigate(`/messages/${otherId}`)}
                  className={`w-full text-left px-4 py-3 border-b border-ink-50 hover:bg-ink-50 ${
                    userId === otherId ? 'bg-ink-50' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {typeof other === 'object' ? other.name : 'Conversation'}
                  </p>
                  <p className="text-xs text-ink-400 truncate">{c.lastMessage.content}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Conversation view */}
      <div className="flex-1 flex flex-col min-w-0">
        {!userId ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState title="Select a conversation" description="Choose someone from the list to start chatting." />
          </div>
        ) : loadingConvo ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.map((m) => {
                const isMine = (m.sender._id || m.sender) === user._id;
                return (
                  <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs px-4 py-2.5 rounded-lg text-sm ${
                        isMine ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-900'
                      }`}
                    >
                      <p>{m.content}</p>
                      {m.attachments?.length > 0 && (
                        <a
                          href={m.attachments[0]}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-xs underline flex items-center gap-1 mt-1 ${isMine ? 'text-ink-100' : 'text-pin'}`}
                        >
                          <Paperclip size={11} /> Attachment
                        </a>
                      )}
                      {isMine && (
                        <span className="flex justify-end mt-1">
                          {m.isRead ? <CheckCheck size={12} className="text-pin" /> : <Check size={12} className="text-ink-300" />}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {otherTyping && <p className="text-xs text-ink-400 italic">Typing...</p>}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t border-ink-100">
              <input
                className="input"
                placeholder="Type a message..."
                value={input}
                onChange={handleTyping}
              />
              <button type="submit" className="btn-accent px-3.5">
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;
