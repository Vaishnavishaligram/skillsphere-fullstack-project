const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

const buildConversationId = (userA, userB) => [String(userA), String(userB)].sort().join('_');

// Track online users: userId -> socketId
const onlineUsers = new Map();

let ioInstance = null;
const getIO = () => ioInstance;

const initChatSocket = (io) => {
  ioInstance = io;

  // Socket auth middleware - expects JWT in handshake.auth.token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.userId = String(user._id);
      socket.userName = user.name;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    io.emit('user_online', { userId: socket.userId });

    // Join a personal room for direct notifications
    socket.join(socket.userId);

    // --- Chat: join a specific conversation room ---
    socket.on('join_conversation', ({ otherUserId }) => {
      const conversationId = buildConversationId(socket.userId, otherUserId);
      socket.join(conversationId);
    });

    // --- Chat: send message ---
    socket.on('send_message', async ({ receiverId, content, gigId, attachments = [] }) => {
      try {
        const conversationId = buildConversationId(socket.userId, receiverId);

        const message = await Message.create({
          conversationId,
          gig: gigId,
          sender: socket.userId,
          receiver: receiverId,
          content,
          attachments,
          messageType: attachments.length ? 'file' : 'text',
        });

        const populated = await message.populate('sender', 'name avatar');

        io.to(conversationId).emit('receive_message', populated);

        // Also notify receiver directly in case they haven't joined the room yet
        io.to(receiverId).emit('new_message_notification', {
          from: socket.userId,
          fromName: socket.userName,
          preview: content?.slice(0, 100),
        });
      } catch (err) {
        socket.emit('message_error', { message: err.message });
      }
    });

    // --- Chat: typing indicators ---
    socket.on('typing', ({ receiverId }) => {
      const conversationId = buildConversationId(socket.userId, receiverId);
      socket.to(conversationId).emit('user_typing', { userId: socket.userId });
    });

    socket.on('stop_typing', ({ receiverId }) => {
      const conversationId = buildConversationId(socket.userId, receiverId);
      socket.to(conversationId).emit('user_stop_typing', { userId: socket.userId });
    });

    // --- Chat: read receipts ---
    socket.on('mark_read', async ({ otherUserId }) => {
      const conversationId = buildConversationId(socket.userId, otherUserId);
      await Message.updateMany(
        { conversationId, receiver: socket.userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      io.to(conversationId).emit('messages_read', { by: socket.userId });
    });

    // --- WebRTC signaling (optional video call integration) ---
    socket.on('call_user', ({ toUserId, offer }) => {
      io.to(toUserId).emit('incoming_call', { fromUserId: socket.userId, offer });
    });
    socket.on('answer_call', ({ toUserId, answer }) => {
      io.to(toUserId).emit('call_answered', { fromUserId: socket.userId, answer });
    });
    socket.on('ice_candidate', ({ toUserId, candidate }) => {
      io.to(toUserId).emit('ice_candidate', { fromUserId: socket.userId, candidate });
    });
    socket.on('end_call', ({ toUserId }) => {
      io.to(toUserId).emit('call_ended', { fromUserId: socket.userId });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.userId);
      io.emit('user_offline', { userId: socket.userId });
    });
  });
};

module.exports = { initChatSocket, onlineUsers, getIO };
