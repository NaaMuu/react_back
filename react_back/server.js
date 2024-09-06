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
  const query = "SELECT * FROM posts ORDER BY num DESC";
  pool.query(query, (err, rows, fields) => {
    res.send(rows);
  });
});

app.listen(port, () => {
  console.log(`Server Running`);
});