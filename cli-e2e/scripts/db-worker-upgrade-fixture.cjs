// An independently running worker using the pre-registration HTTP/lock contract.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const options = JSON.parse(process.argv[2]);
const { root, graphsDir, repo, revision, owner = 'cli', stubborn, health = {} } = options;
const directory = path.join(graphsDir, encodeURIComponent(repo).replace(/%20/g, ' ').replace(/~/g, '%7E').replace(/%/g, '~'));
fs.mkdirSync(directory, { recursive: true });
const lock = { repo: `logseq_db_${repo}`, pid: process.pid, 'lock-id': `lock-${process.pid}`, 'owner-source': owner };
const stateFile = path.join(options.lifecycleDir, repo, 'state.json');
let record;
if (options.registered) {
  const state = JSON.parse(fs.readFileSync(stateFile));
  record = { pid: process.pid, ticket: `legacy-${process.pid}`, generation: state.generation,
    owner, root, graphsDir, lifecycleDir: options.lifecycleDir, repo };
  state.workers = [record];
  fs.writeFileSync(stateFile, JSON.stringify(state));
  Object.assign(lock, { ticket: record.ticket, generation: record.generation,
    storage: { root, graphsDir, lifecycleDir: options.lifecycleDir } });
}
fs.writeFileSync(path.join(directory, 'db-worker.lock'), JSON.stringify(lock));
const db = new (require('node:sqlite').DatabaseSync)(path.join(directory, 'db.sqlite'));
db.exec("CREATE TABLE upgrade_probe(value TEXT); INSERT INTO upgrade_probe VALUES ('keep database')");
db.close();
const server = http.createServer((request, response) => {
  response.setHeader('Connection', 'close');
  if (request.url === '/healthz') {
    const payload = { ...lock, host: '127.0.0.1', port: server.address().port,
      'root-dir': root, revision, status: 'ready', ...health };
    if (options.omitLockId) delete payload['lock-id'];
    response.end(JSON.stringify(payload));
  } else if (request.url === '/v1/shutdown' && request.method === 'POST') {
    fs.writeFileSync(path.join(directory, 'shutdown-requested'), 'yes');
    if (options.replaceRegistration) {
      const state = JSON.parse(fs.readFileSync(stateFile));
      state.workers[0].ticket = 'replacement-ticket';
      fs.writeFileSync(stateFile, JSON.stringify(state));
    }
    if (options.replaceLock) fs.writeFileSync(path.join(directory, 'db-worker.lock'), JSON.stringify({ ...lock, 'lock-id': 'replacement' }));
    response.end('{}');
    if (!stubborn) server.close(() => process.exit(0));
  } else { response.statusCode = 404; response.end(); }
});
if (stubborn) process.on('SIGTERM', () => {});
server.listen(0, '127.0.0.1', () => {
  fs.appendFileSync(path.join(root, 'server-list'), `${process.pid} ${server.address().port}\n`);
  if (record) fs.writeFileSync(path.join(path.dirname(stateFile), `runtime-${record.ticket}.json`),
    JSON.stringify({ ...record, lock, port: server.address().port, phase: 'ready' }));
  if (options.malformedLock !== undefined) fs.writeFileSync(path.join(directory, 'db-worker.lock'), options.malformedLock);
  if (options.noLock) fs.unlinkSync(path.join(directory, 'db-worker.lock'));
  process.send({ port: server.address().port, directory });
});
