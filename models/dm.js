const Sequelize = require('sequelize');

class Dm extends Sequelize.Model {
  static initiate(sequelize) {
    Dm.init({
      senderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // 'users' 테이블과 연관
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      receiverId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // 'users' 테이블과 연관
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      receiver_check: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    }, {
      sequelize,
      timestamps: true, // createdAt, updatedAt 사용
      underscored: false, // camelCase 필드명 사용
      modelName: 'Dm',
      tableName: 'dms',
      paranoid: false, // deletedAt 비활성화
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.Dm.belongsTo(db.User, { foreignKey: 'senderId', targetKey: 'id' });
    db.Dm.belongsTo(db.User, { foreignKey: 'receiverId', targetKey: 'id' });
  }
}

module.exports = Dm;
