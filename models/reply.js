const Sequelize = require('sequelize');

class Reply extends Sequelize.Model {
  static initiate(sequelize) {
    Reply.init({
      pId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'posts', // 테이블과 연관
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      rId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // 'users' 테이블과 연관
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rGroup: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'users', // 'users' 테이블과 연관
          key: 'id',
        },
      },
          
    }, {
      sequelize,
      timestamps: true, // createdAt, updatedAt 사용
      underscored: false, // camelCase 필드명 사용
      modelName: 'Reply',
      tableName: 'replys',
      paranoid: false, // deletedAt 비활성화
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.Reply.belongsTo(db.Post, { foreignKey: 'pId', targetKey: 'id' });
    db.Reply.belongsTo(db.User, { foreignKey: 'rId', as: 'Author' });
    db.Reply.belongsTo(db.User, { foreignKey: 'tId', as: 'TaggedUser' });
  }
}

module.exports = Reply;
