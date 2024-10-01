const Sequelize = require('sequelize');

class Post extends Sequelize.Model {
    static initiate(sequelize) {
      Post.init({
        content: {
          type: Sequelize.STRING(140),
          allowNull: false,
        },
        img: {
          type: Sequelize.STRING(200),
          allowNull: true,
        },
        like: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        }
      }, {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: 'Post',
        tableName: 'posts',
        paranoid: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      });
    }
  
    static associate(db) {
        db.Post.belongsTo(db.User);
        db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' });
        db.Post.belongsToMany(db.User, { 
          through: 'Like',  // 'Like' 중간 테이블 생성
          as: 'Likers',     // 좋아요 누른 사용자 목록
          foreignKey: 'PostId',
        });
        db.Post.hasMany(db.Reply, { foreignKey: 'pId', sourceKey: 'id' });
    }
  };
  module.exports = Post;