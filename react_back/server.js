const express = require('express');
const app = express();
const port = 5000;

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const fs = require('fs');
const conf_d = JSON.parse(fs.readFileSync('./database.json'));
const mysql = require('mysql2');
const pool = mysql.createPool({
  connectionLimit: 10,
  host: conf_d.host,
  port: conf_d.port,
  user: conf_d.user,
  password: conf_d.password,
  database: conf_d.database
});

const cors = require('cors');
app.use(cors());

const jwt = require('jsonwebtoken');
const conf_c = JSON.parse(fs.readFileSync('./config.json'));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; // Authorization 헤더에서 토큰을 가져옴
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer [TOKEN]" 형식이므로 Bearer 부분을 제외한 토큰만 추출
  
  if (!token) {
    return res.status(401).send("토큰이 제공되지 않았습니다."); // 토큰이 없을 경우 401 Unauthorized 응답
  }

  // JWT 토큰을 검증
  jwt.verify(token, conf_c.secretKey, (err, user) => {
    if (err) {
      return res.status(403).send("유효하지 않은 토큰입니다."); // 유효하지 않은 토큰일 경우 403 Forbidden 응답
    }

    req.user = user; // 검증된 사용자 정보를 req 객체에 추가
    next(); // 다음 미들웨어 또는 실제 API 처리 함수로 이동
  });
};

// 로그인 API
app.get("/api/login", (req, res) => {
  const { id, pw } = req.query; // 클라이언트로부터 전달받은 아이디와 비밀번호
  const query = "SELECT * FROM user WHERE id = ? AND pw = ?"; // 아이디와 비밀번호로 DB 조회
  pool.query(query, [id, pw], (err, results, fields) => {
    if (err) {
      return res.status(500).send("서버 오류 발생"); // DB 조회 실패 시 500 오류 반환
    }
    if (results.length > 0) {
      // 로그인 성공 시 JWT 토큰 발급
      const token = jwt.sign({ id: results[0].id }, conf_c.secretKey, { expiresIn: '30m' });
      res.send({ success: true, user: results[0], token }); // 사용자 정보와 토큰을 반환
    } else {
      res.send({ success: false }); // 로그인 실패 시 실패 메시지 반환
    }
  });
});

// 인증이 필요한 API
app.get('/api/fetch_post', (req, res) => {
  const query = "SELECT * FROM post ORDER BY num DESC"; // DB에서 게시물을 가져오는 SQL 쿼리
  pool.query(query, (err, results, fields) => {
    if (err) return res.status(500).send("서버 오류 발생"); // DB 쿼리 실패 시 500 오류 반환
    res.send(results); // 성공 시 결과를 클라이언트에 전송
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server Running on port ${port}`);
});
