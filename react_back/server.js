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

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer 토큰 추출
  if (!token) {
    return res.status(401).send("토큰이 제공되지 않았습니다.");
  }
  jwt.verify(token, conf_c.secretKey, (err, user) => {
    if (err) {
      return res.status(403).send("유효하지 않은 토큰입니다.");
    }
    req.user = user; // 사용자 정보를 요청 객체에 추가
    next(); // 다음 미들웨어로 이동?
  });
};

// 인증이 필요한 API
app.get('/api/fetch_post', authenticateToken, (req, res) => {
  const query = "SELECT * FROM post ORDER BY num DESC";
  pool.query(query, (err, results, fields) => {
    if (err) return res.status(500).send("서버 오류 발생");
    res.send(results);
  });
});

// 로그인 API
app.get("/api/login", (req, res) => {
  const { id, pw } = req.query;
  const query = "SELECT * FROM user WHERE id = ? AND pw = ?";
  pool.query(query, [id, pw], (err, results, fields) => {
    if (err) {
      return res.status(500).send("서버 오류 발생");
    }
    if (results.length > 0) {
      const token = jwt.sign({ id: results[0].id }, conf_c.secretKey, { expiresIn: '30m' });
      res.send({ success: true, user: results[0], token });
    } else {
      res.send({ success: false });
    }
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server Running on port ${port}`);
});
