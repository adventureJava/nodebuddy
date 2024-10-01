const {User, Post,sequelize,Reply,Hashtag } = require('../models');



exports.renderProfile = (req, res) => {
    res.render('profile', { title: '내 정보 - nodebuddy' });
  };
  
exports.renderJoin = (req, res) => {
    res.render('join', { title: '회원가입 - nodebuddy' });
  };
  
exports.renderMain = async (req, res, next) => {
    try {
      let postIds = []; // 기본값으로 빈 배열을 설정합니다.
  
      if (req.user && req.user.id) {
        const userId = req.user.id;
  
        // Query Interface를 사용하여 중간 테이블의 데이터 조회
        const results = await sequelize.query(
          'SELECT PostId FROM `Like` WHERE UserId = ?',
          {
            replacements: [userId],
            type: sequelize.QueryTypes.SELECT,
          }
        );
  
        // 결과가 배열인지 확인하고, 배열로 변환합니다.
        if (Array.isArray(results)) {
          // 결과가 배열일 경우, 배열로 변환
          postIds = results.map(row => row.PostId);
        } else if (results && results.PostId) {
          // 결과가 단일 객체일 경우 배열로 변환
          postIds = [results.PostId];
        } else {
          // 예상하지 못한 형식의 결과가 반환된 경우
          console.error('Unexpected result format:', results);
        }
      }

      let posts;
        if (req.params.id) {
            // req.params.id가 있는 경우, 해당 ID의 게시물만 찾기
            posts = await Post.findAll({
                where: { UserId: req.params.id },
                include: {
                    model: User,
                    attributes: ['id', 'nick'],
                },
                order: [['createdAt', 'DESC']],
            });
        } else {
            // req.params.id가 없는 경우, 모든 게시물 찾기
            posts = await Post.findAll({
                include: {
                    model: User,
                    attributes: ['id', 'nick'],
                },
                order: [['createdAt', 'DESC']],
            });
        }  

      // 각 게시물의 댓글 수(rCount) 구하기
      for (const post of posts) {
        const rCount = await Reply.count({
          where: { pId: post.id }, // pId가 게시물의 id와 일치하는 댓글 수를 구함
        });
        post.dataValues.rCount = rCount; // 댓글 수를 posts 객체의 속성으로 추가
      }
  
      res.render('main', {
        title: 'nodebuddy',
        twits: posts,
        postIds: postIds,
      });
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  exports.renderHashtag = async (req, res, next) => {
    const query = req.query.hashtag;
    if (!query) {
      return res.redirect('/');
    }
    try {
      const hashtag = await Hashtag.findOne({ where: { title: query } });
      let posts = [];
      if (hashtag) {
        posts = await hashtag.getPosts({ include: [{ model: User }] });
      }

      // 각 게시물의 댓글 수(rCount) 구하기
      for (const post of posts) {
        const rCount = await Reply.count({
          where: { pId: post.id }, // pId가 게시물의 id와 일치하는 댓글 수를 구함
        });
        post.dataValues.rCount = rCount; // 댓글 수를 posts 객체의 속성으로 추가
      }

      let postIds = []; // 기본값으로 빈 배열을 설정합니다.
  
      if (req.user && req.user.id) {
        const userId = req.user.id;
  
        // Query Interface를 사용하여 중간 테이블의 데이터 조회
        const results = await sequelize.query(
          'SELECT PostId FROM `Like` WHERE UserId = ?',
          {
            replacements: [userId],
            type: sequelize.QueryTypes.SELECT,
          }
        );
  
        // 결과가 배열인지 확인하고, 배열로 변환합니다.
        if (Array.isArray(results)) {
          // 결과가 배열일 경우, 배열로 변환
          postIds = results.map(row => row.PostId);
        } else if (results && results.PostId) {
          // 결과가 단일 객체일 경우 배열로 변환
          postIds = [results.PostId];
        } else {
          // 예상하지 못한 형식의 결과가 반환된 경우
          console.error('Unexpected result format:', results);
        }
      }
  
      return res.render('main', {
        title: `${query} | Nodebuddy`,
        twits: posts,
        postIds: postIds,
      });
    } catch (error) {
      console.error(error);
      return next(error);
    }
  }