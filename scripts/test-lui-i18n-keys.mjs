/**
 * Fail if deps/ui OCaml sources reference translation keys missing from
 * resources/dicts/en.edn, or pass hardcoded string literals to user-facing
 * LUI text props without routing through I18n. Complements
 * bb lang:validate-translations (AST) with a lightweight Node scan that
 * does not require opam.
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
/** Labelled LUI props that commonly carry user-visible copy. */
const UI_PROP = new RegExp(
  String.raw`~(text|label|placeholder|title|description|message|hint)\s*:\s*"(${STR})"`,
  "g",
);
/**
 * Allowlist for non-UI / master-also-hardcoded / brand / glyph literals.
 * Keep entries exact (unescaped OCaml string contents).
 */
const HARDCODED_ALLOW = new Set([
  // Glyphs / separators / keyboard
  "#",
  "x",
  "/",
  "s",
  "-",
  ":",
  ",",
  "\n",
  "{}",
  "~",
  "Esc",
  "D",
  "404",
  "Ag",
  "then",
  // Brands / formats master also leaves untranslated
  "GitHub",
  "SQLite",
  "URL",
  // a11y / technical labels without matching master dict keys
  "rating info",
  "rtc collaborators",
  "rtc sync",
  "View actions",
]);

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
  const moduleAliases = new Set(["I18n", "Electron_i18n"]);
  // Bare call names that are bound to I18n.t / tf / t1 in this file
  // (e.g. `let t = I18n.t` in handbook.ml / plugins_view.ml).
  const bareAliases = new Set();
  const isI18nCore =
    path.endsWith("/core/i18n.ml") || path.endsWith("\\core\\i18n.ml");
  if (isI18nCore) {
    bareAliases.add("t");
    bareAliases.add("tf");
    bareAliases.add("t1");
  }
  for (const line of text.split("\n")) {
    const mod = line.match(/^\s*module\s+([A-Za-z_][A-Za-z0-9_']*)\s*=\s*I18n\b/);
    if (mod) moduleAliases.add(mod[1]);
    const letAlias = line.match(
      /^\s*let\s+(t|tf|t1)\s*=\s*(?:[A-Za-z_][A-Za-z0-9_']*\.)?(?:t|tf|t1|I18n\.t|I18n\.tf|I18n\.t1)\b/,
    );
    if (letAlias) bareAliases.add(letAlias[1]);
  }
  for (const m of text.matchAll(MODULE_ALIAS)) moduleAliases.add(m[1]);
  const found = [];
  const add = (key, line) => {
    const k = unescapeOcaml(key);
    if (KEY_SHAPE.test(k)) found.push({ key: k, line });
  };
  for (const m of text.matchAll(QUAL)) {
    if (moduleAliases.has(m[1])) {
      const line = text.slice(0, m.index).split("\n").length;
      add(m[3], line);
    }
  }
  // Scan bare t/tf/t1 only when this file aliases them to I18n helpers
  // (or inside i18n.ml itself). Avoids false positives from other `t` binders.
  if (bareAliases.size > 0) {
    for (const m of text.matchAll(BARE)) {
      if (!bareAliases.has(m[1])) continue;
      const line = text.slice(0, m.index).split("\n").length;
      add(m[2], line);
    }
  }
  return found;
}

function extractHardcodedProps(path, text) {
  const found = [];
  for (const m of text.matchAll(UI_PROP)) {
    const lit = unescapeOcaml(m[2]);
    if (lit.length === 0) continue;
    if (HARDCODED_ALLOW.has(lit)) continue;
    const line = text.slice(0, m.index).split("\n").length;
    found.push({ prop: m[1], lit, line, path });
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

test("LUI UI text props do not take hardcoded English literals", () => {
  const hits = [];
  for (const path of walkMl(uiSrc)) {
    const text = readFileSync(path, "utf8");
    for (const { prop, lit, line } of extractHardcodedProps(path, text)) {
      hits.push(`${relative(root, path)}:${line}: ~${prop}:"${lit}"`);
    }
  }
  assert.deepEqual(
    hits,
    [],
    `Hardcoded UI string props (route through I18n or add to HARDCODED_ALLOW):\n${hits.join("\n")}`,
  );
});
