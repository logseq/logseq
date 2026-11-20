/**
 * Fail if deps/ui OCaml sources reference translation keys missing from
 * resources/dicts/en.edn. Complements bb lang:validate-translations (AST)
 * with a lightweight Node scan that does not require opam.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const uiSrc = join(root, "deps/ui/src");
const enEdn = join(root, "resources/dicts/en.edn");

const STR = String.raw`(?:\\[\s\S]|[^"\\])*`;
const QUAL = new RegExp(
  String.raw`\b([A-Za-z_][A-Za-z0-9_']*)\.(t|tf|t1)\s*(?:\(\s*)?"(${STR})"`,
  "g",
);
const BARE = new RegExp(
  String.raw`(?<![\w.])(t|tf|t1)\s*(?:\(\s*)?"(${STR})"`,
  "g",
);
const MODULE_ALIAS = /\bmodule\s+([A-Za-z_][A-Za-z0-9_']*)\s*=\s*I18n\b/g;
const KEY_SHAPE = /^[A-Za-z][A-Za-z0-9._-]*(?:\/[A-Za-z0-9._-]+)+$/;
const EDN_KEY = /:([A-Za-z][A-Za-z0-9._-]*\/[A-Za-z0-9._/-]*)\b/g;

function walkMl(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walkMl(path, out);
    else if (name.endsWith(".ml")) out.push(path);
  }
  return out;
}

function unescapeOcaml(s) {
  return s.replace(/\\(?:\n\s*|["\\nrt])/g, (m) => {
    if (m.startsWith("\\\n")) return "";
    return ({ "\\\"": "\"", "\\\\": "\\", "\\n": "\n", "\\r": "\r", "\\t": "\t" })[m] ?? m;
  });
}

function loadEnKeys() {
  const text = readFileSync(enEdn, "utf8");
  const keys = new Set();
  for (const m of text.matchAll(EDN_KEY)) keys.add(m[1]);
  return keys;
}

function extractKeys(path, text) {
  const aliases = new Set(["I18n"]);
  for (const m of text.matchAll(MODULE_ALIAS)) aliases.add(m[1]);
  // common short aliases used across deps/ui
  for (const line of text.split("\n")) {
    const mod = line.match(/^\s*module\s+([A-Za-z_][A-Za-z0-9_']*)\s*=\s*I18n\b/);
    if (mod) aliases.add(mod[1]);
    const letAlias = line.match(
      /^\s*let\s+(t|tf|t1)\s*=\s*(?:[A-Za-z_][A-Za-z0-9_']*\.)?(?:t|tf|t1|I18n\.t|I18n\.tf|I18n\.t1)\b/,
    );
    if (letAlias) aliases.add(letAlias[1]);
  }
  const found = [];
  const add = (key, line) => {
    const k = unescapeOcaml(key);
    if (KEY_SHAPE.test(k)) found.push({ key: k, line });
  };
  for (const m of text.matchAll(QUAL)) {
    if (aliases.has(m[1]) || m[1] === "I18n" || m[1] === "Electron_i18n") {
      const line = text.slice(0, m.index).split("\n").length;
      add(m[3], line);
    }
  }
  // Bare t/tf/t1 only in i18n.ml helpers (avoids false positives)
  if (path.endsWith("/core/i18n.ml") || path.endsWith("\\core\\i18n.ml")) {
    for (const m of text.matchAll(BARE)) {
      const line = text.slice(0, m.index).split("\n").length;
      add(m[2], line);
    }
  }
  return found;
}

test("LUI I18n.t/tf/t1 keys exist in resources/dicts/en.edn", () => {
  const enKeys = loadEnKeys();
  assert.ok(enKeys.size > 1000, `expected a full English dictionary, got ${enKeys.size}`);
  const missing = [];
  for (const path of walkMl(uiSrc)) {
    const text = readFileSync(path, "utf8");
    for (const { key, line } of extractKeys(path, text)) {
      if (!enKeys.has(key)) {
        missing.push(`${relative(root, path)}:${line}: ${key}`);
      }
    }
  }
  assert.deepEqual(
    missing,
    [],
    `Missing OCaml translation keys:\n${missing.join("\n")}`,
  );
});
