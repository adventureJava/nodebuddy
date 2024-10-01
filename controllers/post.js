const { Post, Hashtag } = require('../models');

exports.afterUploadImage = (req,res) =>  {
    console.log(req.file);
    res.json({ url: `/img/${req.file.filename}` });
  };

exports.uploadPost = async (req, res, next) => {
    try {
      const post = await Post.create({
        content: req.body.content,
        img: req.body.url,
        UserId: req.user.id,
      });
      const hashtags = req.body.content.match(/#[^\s#]*/g);
      if (hashtags) {
        const result = await Promise.all(
          hashtags.map(tag => {
            return Hashtag.findOrCreate({
              where: { title: tag.slice(1).toLowerCase() },
            })
          }),
        );
        await post.addHashtags(result.map(r => r[0]));
      }
      res.redirect('/');
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

  exports.likePost = async (req, res, next) => {
    try {
      const postId = req.params.id;
        // 게시글의 like 수 증가
        const post = await Post.findOne({ where: { id: postId } });
        if (post) {
          await post.increment('like');  // like 값 1 증가
        }
        // 사용자가 게시글을 좋아요 누른 것으로 설정
        await req.user.addLikedPost(postId);
        res.send('Liked');    
    } catch (error) {
      res.status(400).send('Already liked this post');
      console.error(error);
      next(error);
    }
  };

  exports.unlikePost = async (req, res, next) => {
    try {
      const postId = req.params.id;
        // 게시글의 like 수 감소
        const post = await Post.findOne({ where: { id: postId } });
        if (post) {
          await post.decrement('like', { by: 1 });   // like 값 1 감소
        }
        // 사용자가 게시글을 좋아요 철회한 것으로 설정
        await req.user.removeLikedPost(postId);
        res.send('unLiked');
    } catch (error) {
      res.status(400).send('Already unliked this post');
      console.error(error);
      next(error);
    }
  };


  exports.removePost = async (req, res, next) => {
    try {
        const postId = req.params.id;

        // postId에 해당하는 게시물을 찾고, 연관된 해시태그도 함께 조회
        const post = await Post.findOne({ 
            where: { id: postId }, 
            include: [{ model: Hashtag }] // 연관된 해시태그를 포함하여 조회
        });

        if (post && post.Hashtags.length > 0) { 
            const hashtagsToCheck = post.Hashtags.map(tag => tag.id);

            // 게시물과 해시태그 사이의 연관 관계 제거 (PostHashtag 중간 테이블에서 삭제)
            await post.removeHashtags(hashtagsToCheck);

            // 각 해시태그가 다른 게시물에서도 사용되고 있는지 확인
            for (const tagId of hashtagsToCheck) {
                const hashtag = await Hashtag.findOne({
                    where: { id: tagId },
                    include: [{ model: Post }] // 해당 해시태그가 다른 게시물과도 연결되어 있는지 확인
                });

                // 더 이상 다른 게시물과 연결되어 있지 않은 해시태그는 삭제
                if (hashtag && hashtag.Posts.length === 0) {
                    await Hashtag.destroy({ where: { id: tagId } }); // 해시태그 삭제
                }
            }
        }

        // 게시물 삭제
        await Post.destroy({ where: { id: postId } });

        res.redirect('/');
    } catch (error) {
        console.error(error);
        next(error);
    }
};

