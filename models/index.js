const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const User = require('./user');
const Post = require('./post');
const Hashtag = require('./hashtag');
const Dm = require('./dm');
const Reply = require('./reply');

const db = {};
const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.User = User;
db.Post = Post;
db.Hashtag = Hashtag;
db.Dm = Dm;
db.Reply = Reply;

User.initiate(sequelize);
Post.initiate(sequelize);
Hashtag.initiate(sequelize);
Dm.initiate(sequelize);
Reply.initiate(sequelize);

User.associate(db);
Post.associate(db);
Hashtag.associate(db);
Dm.associate(db);
Reply.associate(db);

module.exports = db;
