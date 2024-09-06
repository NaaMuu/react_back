// Express 애플리케이션 설정
const express = require('express'); /*
- Node.js 웹 및 애플리케이션 프레임 워크
- Node.js를 사용하여 쉽게 서버를 구성할 수 있게 만든 클래스와 라이브러리의 집합체 */
const bodyParser = require('body-parser'); /*
- 클라이언트 POST request data의 body로부터 파라미터를 추출하는 모듈
- 요청(request)과 응답(response) 사이에서 공통적인 기능을 수행하는 소프트웨어(미들웨어) */
const app = express(); /*
- Express 애플리케이션을 생성
- express 함수:Express 애플리케이션 객체 반환, 애플리케이션의 라우팅 및 미들웨어 정의 */
const port = process.env.PORT || 5000; /*
- 포트 번호 설정
- process.env.PORT: 환경 변수에서 포트 번호를 가져옴, 설정되어 있지 않으면 기본값으로 5000 */

// Express 애플리케이션 미들웨어 추가
app.use(bodyParser.json()); /*
- 이 미들웨어는 HTTP 요청의 본문(body)이 JSON 형식일 경우, 해당 파싱하여 JavaScript 객체로 변환
- 변환된 데이터는 req.body 객체에 저장되어 라우트 핸들러에서 사용 가능 */
app.use(bodyParser.urlencoded({ extended: true })); /*
- 이 미들웨어는 HTTP 요청의 본문이 URL-encoded 형식일 경우, 해당 데이터를 파싱하여 JavaScript 객체로 변환
- { extended: true }: 중첩된 객체를 파싱할 수 있도록 하는 옵션 */

/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/

// DB 연결 설정
const fs = require('fs'); /*
- FileSystem: Node.js에서 파일 입출력 및 작업을 위한 모듈
- fs 모듈: 파일을 읽거나 쓰는 등의 파일 시스템 작업 수행 */
const data = fs.readFileSync('./database.json'); /*
- fs 모듈을 사용하여 현재 디렉토리의 database.json 파일을 동기적으로 읽어옴
- readFileSync 함수: 파일을 읽어오고 그 내용을 반환 */
const conf = JSON.parse(data); /*
- 읽어온 JSON 형식의 데이터를 JavaScript 객체로 파싱
- JSON.parse 함수: database.json 파일의 내용을 JavaScript 객체로 변환 */
const mysql = require('mysql2'); /*
- mysql2: MySQL과 Node.js를 연결하기 위한 MySQL 클라이언트 모듈
- 높은 성능과 추가적인 기능을 제공하는 MySQL 드라이버 */

// MySQL 데이터베이스와 연결하기 위한 Connection Pool 생성
const pool = mysql.createPool({
  connectionLimit: 10, /*
  - MySQL 연결 풀에서 동시에 유지할 수 있는 최대 연결 수
  - 연결 풀은 애플리케이션이 데이터베이스에 연결할 때마다 매번 새로운 연결을 만드는 대신, 이미 만들어진 연결을 재사용하는 기능을 제공 */
  host: conf.host,
  port: conf.port,
  user: conf.user,
  password: conf.password,
  database: conf.database
}); /*
- pool: 여러 클라이언트가 동시에 데이터베이스에 연결할 수 있도록 연결을 관리하는 객체
- createPool 함수: pool의 설정 정보를 인자로 받아 MySQL 데이터베이스와의 연결을 수립 */

/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/

// API 엔드포인트 정의 및 구현
// /api/users 경로로 들어오는 GET 요청에 대한 핸들러
app.get('/api/users', (req, res) => {
  const query = "SELECT * FROM posts";
  pool.query(query, (err, rows, fields) => {
    res.send(rows);
  });
}); /*
- 데이터베이스의 posts 테이블에서 모든 글을 조회한 뒤, 결과를 클라이언트에게 전송
- res.send(rows)를 통해 데이터베이스 쿼리 결과인 rows를 클라이언트에게 응답으로 전송 */

// /api/users/:num 경로로 들어오는 GET 요청에 대한 핸들러
app.get('/api/users/:num', (req, res) => {
  const num = req.params.num;
  const query = 'SELECT * FROM posts WHERE num = ?';
  pool.query(query, [num], (err, rows, fields) => {
    if (rows && rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json(err);
    }
  });
}); /*
- :num은 동적인 URL 파라미터로, 실제 요청된 URL에서 해당 부분의 값을 req.params.num을 통해 가져옴
- 데이터베이스의 posts 테이블에서 해당하는 num 값에 해당하는 글을 조회한 뒤, 결과를 클라이언트에게 전송
- res.send(rows)를 통해 데이터베이스 쿼리 결과인 rows를 클라이언트에게 응답으로 전송
- 만약 결과가 있고, 결과 배열의 길이가 1 이상이면 결과 배열의 첫 번째 항목을 JSON 형태로 클라이언트에게 응답으로 전송
- 에러 발생 시, 에러 메시지를 JSON 형태로 클라이언트에게 응답으로 전송

+ res.send(results): 데이터의 타입에 따라 적절한 방식으로 클라이언트에게 응답으로 전송
- 데이터가 문자열이면 문자열로, 객체나 배열이면 JSON 형태로 클라이언트에게 전송됨.
- 일반적인 응답 메서드로, 다양한 데이터 타입 처리 가능

+ res.json(results[0]): JSON 형태로 데이터를 클라이언트에게 응답으로 전송
- results[0]은 객체 또는 배열이 될 수 있으며, 이는 주로 JSON 데이터를 전송할 때 사용

+ fields: 주로 쿼리 결과의 메타데이터를 확인하거나 특정한 작업을 수행할 때 활용
- 일반적인 CRUD 작업에서는 주로 rows(results)에 실제 데이터에 집중하며, fields는 디버깅이나 특별한 경우에 활용 */

/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/

// /api/users 경로로 들어오는 POST 요청에 대한 핸들러
app.post('/api/users', (req, res) => {
  const { title, author, content } = req.body;
  const writeData = [title, author, content]; // MySQL 데이터베이스에 추가할 데이터 배열로 정의
  const query = "INSERT INTO posts (title, author, content, w_time) VALUES (?, ?, ?, NOW())";
  pool.query(query, writeData, (err, rows, fields) => {
    res.send(rows);
  });
}); /*
- 클라이언트에서 전달된 데이터를 기반으로 MySQL 데이터베이스에 새로운 글을 추가
- pool.query를 사용하여 SQL 쿼리를 실행하고, 결과를 클라이언트에게 응답으로 전송 */

// /api/users/:num 경로로 들어오는 PATCH 요청에 대한 핸들러
app.patch('/api/users/:num', (req, res) => {
  const num = req.params.num;
  const updateData = req.body; // post와는 다르게 배열로 정의하지 않음, 밑의 주석은 배열로 정의했을 경우
  const query = "UPDATE posts SET title=?, content=?, w_time=NOW() WHERE num=?";
  pool.query(query, [updateData.title, updateData.content, num], (err, rows, fields) => { /*
  const { title, content } = req.body;
  const updateData = [title, content, num];
  const query = "UPDATE posts SET title=?, content=?, w_time=NOW() WHERE num=?";
  pool.query(query, updateData, (err, rows, fields) => { */
    res.send(rows);
  });
}); /*
- 클라이언트에서 전달된 데이터를 기반으로 MySQL 데이터베이스에서 특정 글을 업데이트
- pool.query를 사용하여 SQL UPDATE 쿼리를 실행하고, 결과에 따라 성공 또는 실패를 클라이언트에게 응답으로 전송

+ HTTP 상태 코드로 에러 검출 가능
pool.query('UPDATE posts SET title=?, content=?, w_time=NOW() WHERE num=?', [updateData.title, updateData.content, num], (err, rows, fields) => {
  if (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  } else {
    res.status(200).json(rows);
  }
});
- status(): HTTP 상태 코드를 설정하는 메소드, 상태 코드를 작성하지 않았을 경우 응답 상태 코드는 기본 200으로 간주
- 1xx (Informational): 요청을 받았으며 프로세스를 계속한다.
- 2xx (Successful): 요청을 성공적으로 받았고 이해했으며, 처리했다.
- 3xx (Redirection): 요청을 완료하려면 추가 동작이 필요하다.
- 4xx (Client Error): 요청에 문제가 있어서 요청을 처리할 수 없다.
- 5xx (Server Error): 서버에서 요청을 처리하는 동안 오류가 발생했다.
*/

/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/

// 서버 리스닝
app.listen(port, () => console.log(`Listening on port ${port}`)); /*
- app.listen(): Express 애플리케이션을 특정 포트에서 실행하기 위한 메서드, 서버를 시작하고 클라이언트 요청을 수신할 수 있도록 설정
- Express 애플리케이션을 지정된 포트에서 실행하고, 서버가 시작되면 해당 포트에서 들어오는 요청을 처리 */

/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------*/

/*
+ pool 대신 connection을 사용했을 경우
const connection = mysql.createConnection({
  host: conf.host,
  port: conf.port,
  user: conf.user,
  password: conf.password,
  database: conf.database
});
app.get('/api/users',(req, res) => {
  connection.query(
    "SELECT * FROM posts",
    (err, rows, fields) => {
      res.send(rows);
    }
  );
});

+ Write.js에서 Content-Type으로 multipart/form-data 사용했을 경우 / npm install multer
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.post('/api/users', upload.none(), (req, res) => {
  let sql = 'INSERT INTO posts (title, author, content, w_time) VALUES (?, ?, ?, NOW())';
  let title = req.body.title;
  let author = req.body.author;
  let content = req.body.content;
  // console.log(title);
  // console.log(content);
  // console.log(author);
  let params = [title, author, content];
  connection.query(sql, params,
    (err, rows, fields) => {
      res.send(rows);
    }
  );
});
*/