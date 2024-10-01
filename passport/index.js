const passport = require('passport');
const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const User = require('../models/user');
const Dm = require('../models/dm'); 
const { Sequelize } = require('sequelize');

module.exports = () => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findOne({
        where: { id },
        include: [
          {
            model: User,
            attributes: ['id', 'nick'],
            as: 'Followers',
          },
          {
            model: User,
            attributes: ['id', 'nick'],
            as: 'Followings',
          },
        ],
      });
  
      if (!user) {
        return done(null, false);
      }
  
      // Dm 테이블에서 senderId가 현재 로그인한 사용자와 같은 receiverId들을 가져옴
      const receiverIds = await Dm.findAll({
        where: { senderId: id },
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('receiverId')), 'receiverId']],
      });
  
      // receiverId에 해당하는 User들의 nicknames 가져오기
      const receiverNicknames = await User.findAll({
        where: {
          id: receiverIds.map(dm => dm.receiverId),
        },
        attributes: ['id', 'nick'],
      });
  
      // 각 receiverId 별로 읽지 않은 메시지 개수를 구하기 위한 쿼리
      const noReadCounts = await Dm.findAll({
        where: {
          receiverId: id,
          senderId: {
            [Sequelize.Op.in]: receiverIds.map(dm => dm.receiverId), // receiverId 목록
          },
          receiver_check: 0, // 읽지 않은 메시지 (receiver_check = 0)
        },
        attributes: [
          'senderId',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'no_read_count'],
        ],
        group: ['senderId'], // 각 receiverId별로 그룹화
      });
  
      // noReadCounts를 receiverId를 기준으로 맵핑
      const noReadMap = {};
      noReadCounts.forEach(dm => {
        noReadMap[dm.senderId] = dm.get('no_read_count'); // receiverId별로 읽지 않은 메시지 개수를 맵핑
      });

      const unknown_noReadCounts = await Dm.findAll({
        where: {
          receiverId: id, // 나에게 온 메시지
          senderId: {
            [Sequelize.Op.notIn]: receiverIds.map(dm => dm.receiverId), // 내가 메시지를 보낸 적 없는 사람들
          },
          receiver_check: 0, // 읽지 않은 메시지
        },
        attributes: [
          'senderId',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'no_read_count'],
        ],
        group: ['senderId'], // 각 senderId별로 그룹화
      });
      
      // senderId에 해당하는 User들의 닉네임과 정보 가져오기
      const unknownSenders = await User.findAll({
        where: {
          id: unknown_noReadCounts.map(dm => dm.senderId),
        },
        attributes: ['id', 'nick'],
      });
      
      // senderId를 기준으로 읽지 않은 메시지 개수 맵핑
      const unknownNoReadMap = {};
      unknown_noReadCounts.forEach(dm => {
        unknownNoReadMap[dm.senderId] = dm.get('no_read_count');
      });
      
      // unknownSenders와 읽지 않은 메시지 개수를 조합
      user.unknown_receivers = unknownSenders.map(user => ({
        receiverId: user.id,
        nick: user.nick,
        no_readCount: unknownNoReadMap[user.id] || 0, // 읽지 않은 메시지 개수
      }));

  
      // receivers 추가
      user.receivers = receiverNicknames.map(user => ({
        receiverId: user.id,
        nick: user.nick,
        no_readCount: noReadMap[user.id] || 0, // 해당 receiverId의 읽지 않은 메시지 개수, 없으면 0
      }));
  
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  

  local();
  kakao();
};
