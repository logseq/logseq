import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";

const source = readFileSync(new URL("./app.js", import.meta.url), "utf8");

async function runCallback(search, pending) {
  const elements = new Map();
  const requests = [];
  let stored = pending ? JSON.stringify(pending) : null;
  const context = {
    URL, URLSearchParams, Error,
    location: {pathname: "/callback", origin: "https://tasks.example", search},
    history: {replaceState() {}},
    document: {createElement() {return {};}, querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, {
        textContent: "", addEventListener() {}, replaceChildren() {}, append() {}
      });
      return elements.get(selector);
    }},
    sessionStorage: {
      getItem() {return stored;},
      setItem(_key, value) {stored = value;},
      removeItem() {stored = null;}
    },
    async fetch(url) {
      requests.push(url);
      return {ok: true, status: 200, async json() {
        if (url === "/config.json") return {apiBase: "https://sync.example", clientId: "client"};
        if (url.endsWith("/oauth/token")) return {
          access_token: "access", refresh_token: "refresh", graph_id: "graph", scope: "logseq/read"
        };
        return {tasks: []};
      }};
    }
  };
  await runInNewContext(source, context);
  return {requests, session: stored && JSON.parse(stored), error: elements.get("#signed-out-status").textContent};
}

for (const [name, search, pending] of [
  ["mismatched state", "?code=code&state=wrong", {state: "expected", verifier: "verifier"}],
  ["missing state", "?code=code", {state: "expected", verifier: "verifier"}],
  ["missing pending request", "?code=code&state=expected", null],
  ["missing verifier", "?code=code&state=expected", {state: "expected"}],
  ["missing code", "?state=expected", {state: "expected", verifier: "verifier"}],
  ["unsolicited error", "?error=access_denied&state=wrong", {state: "expected", verifier: "verifier"}]
]) {
  test(`callback rejects ${name} before token exchange`, async () => {
    const result = await runCallback(search, pending);
    assert.equal(result.requests.some(url => url.endsWith("/oauth/token")), false);
    assert.match(result.error, /Invalid sign-in callback/);
    assert.equal(Boolean(result.session?.accessToken), false);
  });
}

test("callback exchanges the code for its pending request", async () => {
  const result = await runCallback("?code=code&state=expected", {state: "expected", verifier: "verifier"});
  assert.equal(result.session.accessToken, "access");
  assert.equal(result.session.verifier, undefined);
  assert.equal(result.error, "");
});
