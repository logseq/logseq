// Load the existing OCaml read API only for publishing. Calls stay in this
// page's thread and operate on its in-memory DataScript connection.
let memory;
function load() {
  return memory ??= import("../../db-worker/_build/default/js_api/js_api/lib/publishing_memory.js");
}
export async function open(repo, transit) {
  (await load()).open_db(repo, transit);
}
export async function invoke(name, args) {
  const db = await load();
  return new Promise((resolve, reject) =>
    db.invoke_transit(name, args, resolve, reject));
}
