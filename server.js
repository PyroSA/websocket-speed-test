const http = require('http');
const fs = require('fs');
const wsServer = require('./wsServer');

// HTTP

const respondFile = function(res, file, type) {
  const stream = fs.createReadStream(`./public/${file}`);
  console.log('returning', file)
  res.writeHead(200, { 'Content-Type': type });
  stream.pipe(res);
}

let counter = 0;
const httpServer = http.createServer((req, res) => {
  counter += 1;
  const index = counter;
  console.log(`${index}: ${req.method}: ${req.url}`);
  switch(req.url) {
    case '/scripts/client.js': return respondFile(res, 'scripts/client.js', 'application/javascript');
    case '/favicon.ico': return respondFile(res, 'favicon.ico', 'image/x-icon');
    case '/index.html': return respondFile(res, 'index.html', 'text/html');
    default: res.writeHead(302, { 'Location': '/index.html' });
  };
  res.end();
});
httpServer.listen(8000);

// Web Socket

wsServer({
  server: httpServer,
  path: '/websocket/',
  perMessageDeflate: false
});
