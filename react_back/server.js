const express = require('express');
const app = express();
const port = 5000;

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const fs = require('fs');
const data = fs.readFileSync('./database.json');

const conf = JSON.parse(data);
const mysql = require('mysql2');
const pool = mysql.createPool({
  connectionLimit: 10,
  host: conf.host,
  port: conf.port,
  user: conf.user,
  password: conf.password,
  database: conf.database
});

const cors = require('cors');
app.use(cors());

app.get('/api/fetch_post', (req, res) => {
  const query = "SELECT * FROM post ORDER BY num DESC";
  pool.query(query, (err, rows, fields) => {
    res.send(rows);
  });
});

// app.get('/api/fetch_post/:num', (req, res) => {
//   const num = req.params.num;
//   const query = 'SELECT * FROM post WHERE num = ?';
//   pool.query(query, [num], (err, rows, fields) => {
//       res.json(rows[0]);
//   });
// });

app.get("/api/login", (req, res) => {
  const { id, pw } = req.query;
  const query = "SELECT * FROM user WHERE id = ? AND pw = ?";
  pool.query(query, [id, pw], (err, results) => {
    if (err) {
      return res.status(500).send("서버 오류 발생");
    }
    if (results.length > 0) {
      res.send({ success: true, message: "로그인 성공", user: results[0] });
    } else {
      res.send({ success: false, message: "로그인 실패: ID 또는 비밀번호가 일치하지 않습니다." });
    }
  });
});

app.listen(port, () => {
  console.log(`Server Running`);
});