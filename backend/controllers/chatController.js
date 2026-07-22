const Message = require('../models/Message');
const { uploadToCloudinary } = require('../utils/upload');
const { ApiError } = require('../middleware/errorHandler');

const buildConversationId = (userA, userB) => [String(userA), String(userB)].sort().join('_');

// @desc    Get chat history between logged-in user and another user
// @route   GET /api/chat/:userId
// @access  Private
const getConversation = async (req, res, next) => {
  try {
    const conversationId = buildConversationId(req.user._id, req.params.userId);
    const { page = 1, limit = 30 } = req.query;

    const messages = await Message.find({ conversationId })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    res.status(200).json({ success: true, messages: messages.reverse() });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations (inbox list) for logged-in user
// @route   GET /api/chat
// @access  Private
const getInbox = async (req, res, next) => {
  try {
    const messages = await Message.aggregate([
      { $match: { $or: [{ sender: req.user._id }, { receiver: req.user._id }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    res.status(200).json({ success: true, conversations: messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message (REST fallback; primary path is via Socket.IO)
// @route   POST /api/chat/:userId
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { content, gigId } = req.body;
    const receiverId = req.params.userId;

    let attachmentUrl;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'skillsphere/chat');
      attachmentUrl = result.secure_url;
    }

    const message = await Message.create({
      conversationId: buildConversationId(req.user._id, receiverId),
      gig: gigId,
      sender: req.user._id,
      receiver: receiverId,
      content: content || '',
      attachments: attachmentUrl ? [attachmentUrl] : [],
      messageType: attachmentUrl ? 'file' : 'text',
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages in a conversation as read
// @route   PUT /api/chat/:userId/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const conversationId = buildConversationId(req.user._id, req.params.userId);
    await Message.updateMany(
      { conversationId, receiver: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getConversation, getInbox, sendMessage, markAsRead, buildConversationId };
