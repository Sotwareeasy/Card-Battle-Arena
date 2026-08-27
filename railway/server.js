const fs = require('fs');
const jsonServer = require('json-server');

// Si se define DB_PATH (ej. un volumen persistente de Railway montado en /data),
// se usa esa ruta. Si el archivo aún no existe ahí, se copia la semilla versionada
// (db.json) una sola vez, para no perder los datos en cada redeploy.
const DB_PATH = process.env.DB_PATH || 'db.json';

if (DB_PATH !== 'db.json' && !fs.existsSync(DB_PATH)) {
  fs.copyFileSync('db.json', DB_PATH);
}

const server = jsonServer.create();
const router = jsonServer.router(DB_PATH);
const middlewares = jsonServer.defaults();

server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

server.use(middlewares);
server.use(router);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`JSON Server running on port ${PORT}`);
});