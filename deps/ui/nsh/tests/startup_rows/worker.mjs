// A test client of the existing daemon protocol, not a database/worker fixture.
// All writes use production outliner operations and normal listener/SSE delivery.
import assert from "node:assert/strict";
import {realpathSync} from "node:fs";
import transit from "transit-js";

const spec = JSON.parse(process.argv[2]);
assert.ok(Number.isInteger(spec.port) && spec.port > 0 && spec.port < 65536);
assert.ok([1000, 100000].includes(spec.count));
assert.ok(typeof spec.repo === "string" && spec.repo.length > 0);
// Recheck ownership for every helper invocation, including edit/clear. Never
// treat a reused loopback port or a graph title as evidence of private storage.
const healthResponse = await fetch(`http://127.0.0.1:${spec.port}/healthz`, {signal: AbortSignal.timeout(5000)});
assert.equal(healthResponse.status, 200);
const health = await healthResponse.json();
assert.equal(realpathSync(health.storage.root), realpathSync(process.env.LOGSEQ_ROOT_DIR));
assert.equal(health.repo, spec.repo);
const keyword = transit.keyword;
const map = (fields) => transit.map(Object.entries(fields).flatMap(([key, value]) => [keyword(key), value]));
const uuid = (index) => `23456789-1234-4abc-8def-${String(index).padStart(12, "0")}`;
const title = (index) => `NSH bounded row ${index} sentinel`;
const get = (value, name) => transit.isMap(value) ? value.get(keyword(name)) : undefined;
async function invoke(method, args) {
  const response = await fetch(`http://127.0.0.1:${spec.port}/v1/invoke`, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({method, argsTransit: transit.writer("json").write(args)}),
    signal: AbortSignal.timeout(180000),
  });
  const envelope = await response.json();
  assert.equal(response.status, 200, JSON.stringify(envelope).slice(0, 4096));
  assert.equal(envelope.ok, true, JSON.stringify(envelope).slice(0, 4096));
  assert.equal(typeof envelope.resultTransit, "string");
  const result = transit.reader("json").read(envelope.resultTransit);
  assert.ok(!get(result, "error"), String(get(result, "error")));
  return result;
}
async function apply(op, args) {
  return invoke("thread-api/apply-outliner-ops", [spec.repo, [[keyword(op), args]], map({})]);
}
async function countChildren(page) {
  assert.match(page, /^[0-9a-f-]{36}$/);
  const query = `[:find (count ?b) . :where [?p :block/uuid #uuid "${page}"] [?b :block/parent ?p] [?b :block/uuid ?u]]`;
  // endpoint_db.q applies the query and any bindings from one inputs vector.
  const count = await invoke("thread-api/q", [spec.repo, [query]]);
  assert.ok(Number.isSafeInteger(count) && count >= 0, "worker query returns an exact child count");
  return count;
}
const started = performance.now();
let result;
switch (spec.action) {
  case "prepare": {
    const pages = await invoke("thread-api/get-latest-journals", [spec.repo, 1, 0]);
    assert.ok(Array.isArray(pages) && pages.length === 1, "actual startup created today's journal");
    const page = String(get(pages[0], "block/uuid"));
    const pageTitle = get(pages[0], "block/title");
    assert.ok(typeof pageTitle === "string" && pageTitle.length > 0);
    assert.equal(await countChildren(page), 0, "fresh private journal has no test blocks");
    result = {page, pageTitle};
    break;
  }
  case "seed": {
    const blocks = Array.from({length: spec.count}, (_, index) => map({
      "block/uuid": transit.uuid(uuid(index)), "block/title": title(index),
    }));
    await apply("insert-blocks", [blocks, transit.uuid(spec.page), map({
      "sibling?": false, "bottom?": true, "keep-uuid?": true, "outliner-op": keyword("insert-blocks"),
    })]);
    assert.equal(await countChildren(spec.page), spec.count);
    result = {count: spec.count};
    break;
  }
  case "edit":
    await apply("save-block", [map({"block/uuid": transit.uuid(uuid(0)), "block/title": spec.title}),
      map({"retract-attributes?": false})]);
    assert.equal(await countChildren(spec.page), spec.count);
    result = {uuid: uuid(0), title: spec.title};
    break;
  case "clear":
    await apply("delete-blocks", [Array.from({length: spec.count}, (_, index) => transit.uuid(uuid(index))), map({})]);
    assert.equal(await countChildren(spec.page), 0);
    result = {count: 0};
    break;
  default: throw new Error(`Unknown production row action: ${spec.action}`);
}
console.log(JSON.stringify({...result, workerElapsedMs: performance.now() - started}));
