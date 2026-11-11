const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const exec = require('node:util').promisify(execFile);
const os = require('node:os');
const test = require('node:test');
const repo = path.resolve(__dirname, '../..');
const transit = require(path.join(repo, 'cli/node_modules/transit-js'));

test('CLI metadata writes preserve named links, backlinks and recurring journal refs', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-cli-metadata-refs-'));
  const graph = 'combined-metadata-refs';
  const cli = path.join(repo, 'static/logseq-cli.js');
  const report = { checks: 0, stages: [], failures: [] };
  let server;
  async function command(...args) {
    try {
      const { stdout } = await exec(process.execPath, [cli, '--root-dir', root, '--graph', graph,
        '--output', 'json', '--timeout-ms', '120000', ...args], { timeout: 130000 });
      const result = JSON.parse(stdout);
      assert.equal(result.status, 'ok', stdout);
      return result.data;
    } catch (error) { throw Error(`${args.join(' ')}\n${error.stdout || ''}\n${error.stderr || error.message}`); }
  }
  async function query(q) { return (await command('query', '--query', q)).result; }
  async function id(title) { return query(`[:find ?e . :where [?e :block/title ${JSON.stringify(title)}]]`); }
  async function uuid(eid) { return query(`[:find ?u . :where [${eid} :block/uuid ?u]]`); }
  async function titleRefs(eid) { return (await query(`[:find [?title ...] :where [${eid} :block/refs ?r] [?r :block/title ?title]]`)).sort(); }
  async function backlinkUUIDs(eid) {
    const response = await fetch(server['base-url'] + '/v1/invoke', { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'thread-api/get-block-refs',
        argsTransit: transit.writer('json').write([server.repo, eid]) }) });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    const blocks = transit.reader('json').read(result.resultTransit);
    const entries = [];
    if (Array.isArray(blocks)) entries.push(...blocks);
    else if (blocks && blocks.tag === 'list') entries.push(...blocks.rep);
    else if (blocks && typeof blocks.forEach === 'function') blocks.forEach(value => entries.push(value));
    else if (blocks) throw Error('Backlink result shape: ' + require('node:util').inspect(blocks, {depth: 3}));
    return entries.map(block => String(block.get(transit.keyword('block/uuid'))));
  }
  function equal(label, actual, expected) {
    report.checks++;
    if (JSON.stringify(actual) !== JSON.stringify(expected)) report.failures.push({ label, actual, expected });
  }
  async function checkpoint(label, block, required, absent = []) {
    const actual = await titleRefs(block);
    report.stages.push({ label, refs: actual });
    for (const name of required) {
      equal(label + ' refs include ' + name, actual.includes(name), true);
      const target = await id(name);
      const membership = await query(`[:find ?tag . :where [${block} :block/tags ?tag] [(= ?tag ${target})]]`);
      equal(label + (membership ? ' tag membership excluded from linked references on ' : ' UI backlinks include source on ') + name,
        (await backlinkUUIDs(target)).includes(await uuid(block)), !membership);
    }
    for (const name of absent) {
      equal(label + ' refs exclude ' + name, actual.includes(name), false);
      const target = await id(name);
      if (target) equal(label + ' UI backlinks exclude source on ' + name,
        (await backlinkUUIDs(target)).includes(await uuid(block)), false);
    }
  }
  async function refreshServer() {
    server = (await command('server', 'list')).servers.find(item => item.graph === graph);
    equal('worker owned by CLI', server['owner-source'], 'cli');
  }
  async function main() {
    await command('graph', 'create');
    for (const name of ['Home', 'Alpha', 'Beta', 'T1', 'T2']) await command('upsert', 'page', '--page', name);
    for (const name of ['Topic', 'Topic2']) await command('upsert', 'tag', '--name', name);
    for (const name of ['p1', 'p2']) await command('upsert', 'property', '--name', name, '--type', 'node');
    await refreshServer();
    const created = await command('upsert', 'block', '--target-page', 'Home', '--content', 'initial [[Alpha]]', '--update-tags', '["Topic"]');
    const block = created.result[0];
    await checkpoint('create with tag', block, ['Alpha', 'Tags', 'Topic']);
    await command('upsert', 'block', '--id', String(block), '--content', 'updated [[Beta]] and [[Namespace/Child]]');
    await checkpoint('named and namespace update', block, ['Beta', 'Child', 'Tags', 'Topic'], ['Alpha']);
    await command('upsert', 'block', '--id', String(block), '--update-tags', '["Topic2"]');
    await checkpoint('subsequent tag operation', block, ['Beta', 'Child', 'Tags', 'Topic', 'Topic2'], ['Alpha']);
    const p1 = await id('p1'), p2 = await id('p2'), t1 = await id('T1'), t2 = await id('T2');
    const legacy = (await command('upsert', 'block', '--target-page', 'Home', '--content', 'legacy [[Alpha]] and [[Namespace/Child]]')).result[0];
    report.legacyStoredTitle = await query(`[:find ?title . :where [${legacy} :block/title ?title]]`);
    await checkpoint('raw named links before metadata', legacy, ['Alpha', 'Child']);
    await command('upsert', 'block', '--id', String(legacy), '--update-tags', '["Topic"]');
    await checkpoint('raw named links after separate tag write', legacy, ['Alpha', 'Child', 'Tags', 'Topic']);
    await command('upsert', 'block', '--id', String(legacy), '--update-properties', `{${p1} ${t1} ${p2} ${t2}}`);
    await checkpoint('raw named links after separate property write', legacy, ['Alpha', 'Child', 'p1', 'p2', 'T1', 'T2']);
    await command('upsert', 'block', '--id', String(block), '--update-properties', `{${p1} ${t1} ${p2} ${t2}}`);
    await checkpoint('subsequent two-node-property operation', block, ['Beta', 'Child', 'T1', 'T2', 'p1', 'p2']);
    await command('upsert', 'block', '--id', String(block), '--content', 'replacement [[Alpha]] and [[Namespace/Other]]',
      '--remove-tags', '["Topic"]', '--update-properties', `{${p1} ${t2}}`, '--remove-properties', `[${p2}]`);
    await checkpoint('combined title and metadata replacement', block, ['Alpha', 'Other', 'Tags', 'Topic2', 'p1', 'T2'], ['Beta', 'Child', 'Topic', 'p2', 'T1']);
    await command('upsert', 'block', '--id', String(block), '--remove-tags', '["Topic2"]', '--remove-properties', `[${p1}]`);
    await checkpoint('metadata removed', block, ['Alpha', 'Other'], ['Tags', 'Topic2', 'p1', 'T2']);
    const tasks = [];
    for (const temporal of ['scheduled', 'deadline']) {
      const property = ':logseq.property/' + temporal;
      const task = (await command('upsert', 'block', '--target-page', 'Home', '--content', temporal + ' [[Alpha]] and [[Namespace/Child]]')).result[0];
      await command('upsert', 'task', '--id', String(task), '--status', 'todo');
      const stamp = new Date(2026, 10, 8, 12).getTime();
      await command('upsert', 'block', '--id', String(task), '--update-properties',
        `{${property} ${stamp} :logseq.property.repeat/repeated? true :logseq.property.repeat/recur-frequency 1 :logseq.property.repeat/recur-unit :logseq.property.repeat/recur-unit.week :logseq.property.repeat/repeat-type :logseq.property.repeat/repeat-type.plus :logseq.property.repeat/temporal-property ${property}}`);
      for (const day of [20261115, 20261122]) {
        await command('upsert', 'task', '--id', String(task), '--status', 'done');
        const actual = await query(`[:find [?day ...] :where [${task} :block/refs ?j] [?j :block/journal-day ?day]]`);
        equal(temporal + ' journal refs ' + day, actual, [day]);
        const stored = await query(`[:find ?stamp . :where [${task} ${property} ?stamp]]`);
        const date = new Date(stored);
        equal(temporal + ' stored date ' + day, Number(`${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`), day);
        const journal = await query(`[:find ?j . :where [?j :block/journal-day ${day}]]`);
        equal(temporal + ' new journal UI backlinks ' + day, (await backlinkUUIDs(journal)).includes(await uuid(task)), true);
        const oldDay = day === 20261115 ? 20261108 : 20261115;
        const old = await query(`[:find ?j . :where [?j :block/journal-day ${oldDay}]]`);
        if (old) equal(temporal + ' old journal UI backlinks removed ' + oldDay, (await backlinkUUIDs(old)).includes(await uuid(task)), false);
        await checkpoint(temporal + ' completion ' + day, task, day === 20261115 ? ['Alpha', 'Child', 'Tags', 'Task', 'Status'] : ['Beta', 'Other', 'Tags', 'Task', 'Status'], day === 20261122 ? ['Alpha', 'Child'] : []);
        if (day === 20261115) await command('upsert', 'block', '--id', String(task), '--content', temporal + ' replacement [[Beta]] and [[Namespace/Other]]');
      }
      tasks.push({ task, temporal });
    }
    await command('server', 'restart');
    await refreshServer();
    await checkpoint('restart raw named links', legacy, ['Alpha', 'Child', 'Tags', 'Topic', 'p1', 'p2', 'T1', 'T2']);
    await checkpoint('restart ordinary block', block, ['Alpha', 'Other'], ['Beta', 'Child', 'Tags', 'Topic', 'Topic2', 'p1', 'p2', 'T1', 'T2']);
    for (const {task, temporal} of tasks) {
      await checkpoint('restart ' + temporal, task, ['Beta', 'Other', 'Tags', 'Task', 'Status'], ['Alpha', 'Child']);
      equal('restart ' + temporal + ' journal refs', await query(`[:find [?day ...] :where [${task} :block/refs ?j] [?j :block/journal-day ?day]]`), [20261122]);
    }
    const beforeRenameTitle = await query(`[:find ?title . :where [${legacy} :block/title ?title]]`);
    const alpha = await id('Alpha'), child = await id('Child');
    equal('created named and namespace links use Desktop UUID storage', beforeRenameTitle,
      `legacy [[${await uuid(alpha)}]] and [[${await uuid(child)}]]`);
    await command('upsert', 'page', '--id', String(alpha), '--rename', 'Renamed Alpha');
    await command('upsert', 'page', '--id', String(child), '--rename', 'Renamed Child');
    await command('upsert', 'block', '--id', String(legacy), '--update-tags', '["Topic2"]');
    await checkpoint('rename then metadata', legacy, ['Renamed Alpha', 'Renamed Child', 'Topic', 'Topic2', 'Tags', 'p1', 'p2', 'T1', 'T2']);
    equal('rename preserves stored UUID title', await query(`[:find ?title . :where [${legacy} :block/title ?title]]`), beforeRenameTitle);
    await command('server', 'restart');
    await refreshServer();
    await checkpoint('restart after rename', legacy, ['Renamed Alpha', 'Renamed Child', 'Topic', 'Topic2', 'Tags', 'p1', 'p2', 'T1', 'T2']);
    await command('graph', 'validate');
  }
  t.after(async () => {
    let teardownError;
    try {
      await command('server', 'stop');
      const logs = fs.readdirSync(root, { recursive: true }).filter(name => /db-worker-node-.*\.log$/.test(name));
      const errors = logs.flatMap(name => fs.readFileSync(path.join(root, name), 'utf8')
        .split('\n').filter(line => /ERROR|Exception|invalid-data/.test(line)));
      t.diagnostic(`Checked ${logs.length} worker log(s): ${errors.length} error line(s)`);
      for (const line of errors) t.diagnostic(line);
    } catch (error) {
      teardownError = error;
      throw error;
    } finally {
      try {
        fs.rmSync(root, { recursive: true, force: true });
      } catch (cleanupError) {
        if (teardownError) throw new AggregateError([teardownError, cleanupError], 'Teardown and directory cleanup failed', { cause: teardownError });
        throw cleanupError;
      }
    }
  });
  await main();
  t.diagnostic(`${report.stages.length} stages, ${report.checks} reference and backlink checks`);
  assert.deepEqual(report.failures, [], JSON.stringify(report, null, 2));
});
