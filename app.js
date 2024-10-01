const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');
const socketIo = require('socket.io');
const http = require('http');
const moment = require('moment');

dotenv.config();
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const dmRouter = require('./routes/dm');
const replyRouter = require('./routes/reply');
const { sequelize } = require('./models');
const passportConfig = require('./passport');

const app = express();
passportConfig(); // 패스포트 설정
app.set('port', process.env.PORT || 8001);
app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  watch: true,
});

sequelize.sync({ force: false })
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', pageRouter);
app.use('/auth', authRouter);
app.use('/post', postRouter);
app.use('/user', userRouter);
app.use('/dms', dmRouter);
app.use('/reply', replyRouter);
app.use((req, res, next) => {
  const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

const env = nunjucks.configure('views', {
  autoescape: true,
  express: app
});
// 커스텀 날짜 필터 정의하기
env.addFilter('date', function (date, format) {
  return moment(date).format(format);
});

// 서버 및 소켓 초기화
const server = http.createServer(app);
const io = socketIo(server); // socket.io 연결

// 메시지 전송 핸들러
io.on('connection', (socket) => {
  console.log('사용자가 연결되었습니다.');

  socket.on('joinRoom', ({ senderId, receiverId }) => {
    const roomName = `dm_${Math.min(senderId, receiverId)}_${Math.max(senderId, receiverId)}`;
    socket.join(roomName);
    console.log(`${senderId}님이 ${receiverId}님과의 방에 입장했습니다.`);
  });

  socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
    const roomName = `dm_${Math.min(senderId, receiverId)}_${Math.max(senderId, receiverId)}`;    

    // 상대방에게 메시지 전송
    io.to(roomName).emit('receiveMessage', { senderId, message, createdAt: new Date() });
  });

  socket.on('disconnect', () => {
    console.log('사용자가 연결을 끊었습니다.');
  });
});

// 서버 실행을 마지막에 호출
server.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기중');
});
