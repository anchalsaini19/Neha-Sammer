import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 8080;
const ROOT = path.resolve('d:/wedding');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  let reqUrl = decodeURI(req.url.split('?')[0]);
  if (reqUrl === '/' || reqUrl === '') reqUrl = 'index.html';
  if (reqUrl.startsWith('/')) reqUrl = reqUrl.substring(1);
  
  const filePath = path.resolve(ROOT, reqUrl);
  
  if (!filePath.toLowerCase().startsWith(ROOT.toLowerCase())) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + reqUrl);
      return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Local wedding server running at http://localhost:${PORT}/`);
});
