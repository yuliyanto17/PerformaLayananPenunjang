const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = 3001;
const DIST = path.join(__dirname, "performa-layanan-admin", "dist");
const CERT = "F:/EDP/ssl/cert.pem";
const KEY  = "F:/EDP/ssl/key.pem";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript",
  ".mjs":  "application/javascript",
  ".css":  "text/css",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".webp": "image/webp",
};

const sslOptions = {
  cert: fs.readFileSync(CERT),
  key:  fs.readFileSync(KEY),
};

https.createServer(sslOptions, (req, res) => {
  const urlPath = req.url.split("?")[0];
  let filePath = path.join(DIST, urlPath === "/" ? "index.html" : urlPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";

  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000",
  });

  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, () => {
  console.log(`Admin HTTPS running → https://192.168.200.155:${PORT}`);
});
