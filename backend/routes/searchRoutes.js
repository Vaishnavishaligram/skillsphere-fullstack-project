const express = require('express');
const router = express.Router();

const { searchGigs, searchFreelancers, getTrendingSkills } = require('../controllers/searchController');

router.get('/gigs', searchGigs);
router.get('/freelancers', searchFreelancers);
router.get('/trending-skills', getTrendingSkills);

module.exports = router;
