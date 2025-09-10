const express = require('express');
const router = express.Router();
const passport = require('passport');

const searchController = require('../controllers/search_controller');

router.get('/users', searchController.searchUsers);
router.get('/posts', searchController.searchPosts);
router.get('/discover', searchController.discoverUsers);

module.exports = router;
