const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3001;

// Certificados autofirmados para desarrollo
// En producción, deberías usar certificados reales de Let's Encrypt u otro proveedor
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificates', 'localhost.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certificates', 'localhost.crt'))
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(PORT, (err) => {
    if (err) throw err;
    ////console.log(`> Ready on https://localhost:${PORT}`);
  });
});
