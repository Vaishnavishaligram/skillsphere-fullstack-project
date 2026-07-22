const express = require('express');
const router = express.Router();

const { getConversation, getInbox, sendMessage, markAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/upload');

router.get('/', protect, getInbox);
router.get('/:userId', protect, getConversation);
router.post('/:userId', protect, upload.single('file'), sendMessage);
router.put('/:userId/read', protect, markAsRead);

module.exports = router;
