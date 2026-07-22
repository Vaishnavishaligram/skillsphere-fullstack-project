const express = require('express');
const router = express.Router();

const {
  updateBasicProfile,
  getFreelancerProfile,
  updateFreelancerProfile,
  uploadFreelancerFile,
  getClientProfile,
  updateClientProfile,
  getFreelancerAnalytics,
} = require('../controllers/userController');

const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { upload } = require('../utils/upload');

router.put('/me', protect, upload.single('avatar'), updateBasicProfile);

router.get('/freelancer/analytics', protect, authorize('freelancer'), getFreelancerAnalytics);
router.get('/freelancer/:id?', optionalAuth, getFreelancerProfile);
router.put('/freelancer/me', protect, authorize('freelancer'), updateFreelancerProfile);
router.post('/freelancer/upload', protect, authorize('freelancer'), upload.single('file'), uploadFreelancerFile);

router.get('/client/:id?', getClientProfile);
router.put('/client/me', protect, authorize('client'), updateClientProfile);

module.exports = router;
