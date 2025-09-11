const express = require('express');

const router = express.Router();
const homeController = require('../controllers/home_controller');

console.log('router loaded');


router.get('/', homeController.home);
router.use('/users', require('./users'));
router.use('/posts', require('./posts'));
router.use('/comments', require('./comments'));
router.use('/likes', require('./likes'));
router.use('/activity', require('./activity'));
router.use('/follow', require('./follow'));
router.use('/discover', require('./discovery'));
router.use('/chat', require('./chat'));
router.use('/stories', require('./stories'));
router.use('/ai', require('./ai'));


router.use('/api', require('./api'));

// for any further routes, access from here
// router.use('/routerName', require('./routerfile));


module.exports = router;