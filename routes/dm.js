const express = require('express');
const { isLoggedIn } = require('../middlewares');
const { directMessage ,sendMessage,receive_check } = require('../controllers/dm');

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : [];
  next();
});


router.get('/:id',isLoggedIn, directMessage);

router.post('/send',isLoggedIn, sendMessage);

router.post('/receive_check',isLoggedIn, receive_check);

module.exports = router;
