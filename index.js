const http = require('http');
const port = 3010;

// Helpers
const bodyParser = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try { resolve((body) ? JSON.parse(body) : null) } catch (e) { reject({ status: 400, message: 'bad_json' }) }
    });
  });
}
const send = res => ({ status, body, headers }) => {
  res.writeHead(status, { ...headers, "Content-Type": "application/json" });
  res.write(JSON.stringify(body));
  res.end();
}
const errorHandler = res => error => res.send({ status: error.status || 500, body: { error } });

// Controllers
const ok = (req, res) => res.send({ status: 200, body: { result: 'OK' } });
const mirrorHeaders = (req, res) => res.send({ status: 200, body: { result: 'OK' }, headers: req.headers });
const mirrorBody = async (req, res) => res.send({ status: 200, body: req.body, headers: req.headers });
const errorInternal = async (req, res) => res.send({ status: 500, body: { error: 'internal_error' } });
const errorMissing = async (req, res) => res.send({ status: 404, body: { error: 'missing_resource' } });
const errorTimeout = async (req, res) => {
  setTimeout(() => res.send({ status: 200, body: { resutl: '5 secconds later...' } }), 5000);
}

// Routes
const apis = {
  POST: {
    '/api/mirror/body': mirrorBody,
  },
  GET: {
    '/api/ok': ok,
    '/api/mirror/headers': mirrorHeaders,
    '/api/error/internal': errorInternal,
    '/api/error/missing': errorMissing,
    '/api/error/timeout': errorTimeout,
  },
}
// Server
const server = async (req, res) => {
  try {
    const { method, url } = req;
    console.log(method, url);
    // Adding helpers
    res.send = send(res);
    res.errorHandler = errorHandler(res);
    req.body = await bodyParser(req);
    // API Routing
    if (apis[method][url]) apis[method][url](req, res);
    else res.send({ status: 404, body: { result: 'missing_resource' } });
  } catch (error) {
    res.errorHandler(error);
  }
}
http.createServer(server).listen(port, () => console.log(`Server up at ${port}`));