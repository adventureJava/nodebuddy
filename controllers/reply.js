const {User, Reply } = require('../models');

exports.replyRemove= async (req, res, next) => {
  try {
    const id = req.params.id;

    const count = await Reply.count({
      where: { rGroup: req.body.rGroup,
         },
    })

    const reply = await Reply.findOne({
      where: { id: id },
      
    });
    console.log(reply.tId)
    console.log(count)

    if(reply.tId==null && count>1){
      res.send('대댓글이 있는 댓글은 삭제 할 수 없습니다.');
    }else{
      await Reply.destroy({ where: { id: id } });
      res.send('댓글이 삭제되었습니다.');
    }

  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.reply = async (req, res, next) => {
    try {
      const postId = req.params.id;
  
      const replies = await Reply.findAll({
        where: { pId: postId },
        include: [
          {
            model: User,
            as: 'Author',  // 댓글 작성자 정보
            attributes: ['id', 'nick'],
          },
          {
            model: User,
            as: 'TaggedUser',  // 태그된 사용자 정보
            attributes: ['id', 'nick'],
            required: false  // tId가 null인 경우에도 처리 가능
          }
        ],
        order: [
          ['rGroup', 'DESC'],        // rGroup 기준으로 내림차순 정렬
          ['createdAt', 'ASC']       // rGroup 내에서는 createdAt 기준으로 오름차순 정렬
        ],
      });
    res.json({ replies});
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

  exports.replyWrite = async (req, res, next) => {
    try {
      const postId = req.params.id;
      const { rId, rGroup, content } = req.body;
      console.log("rId="+rId);
      if(rId){
        console.log("rID체크:"+rGroup);
        const newreply = await Reply.create({
          pId: postId,
          content: content,
          rId: req.user.id,
          rGroup: req.body.rGroup,
          tId: req.body.rId,
        });        
        const reply = await Reply.findOne({
          where: { id: newreply.id },
          include: [
            {
              model: User,
              as: 'Author',  // 댓글 작성자 정보
              attributes: ['id', 'nick'],
            },
            {
              model: User,
              as: 'TaggedUser',  // 태그된 사용자 정보
              attributes: ['id', 'nick'],
              required: false  // tId가 null일 경우에도 조회 가능
            }
          ]
        });
        const count = await Reply.count({
          where: { rGroup: req.body.rGroup,
            tId: req.body.rId, },
        })
      res.json({ reply,count});
      }else{
        const reply = await Reply.create({
          pId: postId,
          content: req.body.content,
          rId: req.user.id,
          rGroup: 0,
        });
        await Reply.update({
        rGroup: reply.id},
        {where: { id: reply.id}}
        );
        return res.status(201).json({ message: '댓글이 성공적으로 작성되었습니다.', reply });
      }          
      
    } catch (error) {
      console.error(error);
      next(error);
    }
  };