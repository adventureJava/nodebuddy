const express = require('express');
const { isLoggedIn } = require('../middlewares');
const { reply, replyWrite, replyRemove} = require('../controllers/reply');

const router = express.Router();

router.post('/:id',isLoggedIn, reply);

router.post('/:id/write',isLoggedIn,replyWrite);

router.post('/:id/remove',isLoggedIn,replyRemove);

module.exports = router;