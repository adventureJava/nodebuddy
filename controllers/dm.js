const {User, Dm  } = require('../models');

const { Op } = require('sequelize');

exports.receive_check = async (req, res, next) => {
  try {
    const { senderId, receiverId } = req.body;

    // receiver_check를 1로 업데이트 (senderId = otherUserId, receiverId = myId 인 경우)
    const [updatedRows] = await Dm.update(
      { receiver_check: 1 },
      {
        where: {
          senderId: senderId,
          receiverId: receiverId,
          receiver_check: 0, // 아직 확인되지 않은 메시지들만 업데이트
        },
      }
    );

    // 업데이트 성공 여부 확인 후 결과 전송
    if (updatedRows > 0) {
      return res.json({ success: true }); // 업데이트 성공
    } else {
      return res.json({ success: false }); // 업데이트된 행이 없는 경우
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.directMessage = async (req, res, next) => {
  try {
    if (!req.user) {
      const message = info ? info.message : '로그인이 필요합니다.';
      return res.redirect(`/?loginError=${encodeURIComponent(message)}`);
    }
    const myId = req.user.id; // 로그인한 사용자 ID
    const otherUserId = req.params.id; // 상대방 사용자 ID

    // 1. receiver_check를 1로 업데이트 (senderId = otherUserId, receiverId = myId 인 경우)
    await Dm.update(
      { receiver_check: 1 },
      {
        where: {
          senderId: otherUserId,
          receiverId: myId,
          receiver_check: 0, // 아직 확인되지 않은 메시지들만 업데이트
        },
      }
    );

    // 이전 대화 내용 불러오기
    const messages = await Dm.findAll({
      where: {
        [Op.or]: [
          { senderId: myId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: myId }
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    // 상대방 유저 정보
    const otherUser = await User.findByPk(otherUserId);

    // DM 페이지 렌더링
    res.render('dm', { messages, otherUser });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { senderId, receiverId, message } = req.body;

    // 새로운 메시지 저장
    await Dm.create({
      senderId,
      receiverId,
      message,
    });

    // 응답으로 성공 메시지 반환
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
