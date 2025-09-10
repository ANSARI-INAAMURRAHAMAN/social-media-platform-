const express = require('express');
const router = express.Router();
const passport = require('passport');

const activityController = require('../controllers/activity_controller');

router.get('/', passport.checkAuthentication, activityController.getActivities);
router.post('/mark-read', passport.checkAuthentication, activityController.markAsRead);

module.exports = router;
