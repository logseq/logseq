#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { spawnSync } from 'child_process';

const repoRoot = process.cwd();

function parseArgs(argv) {
  const out = {
    scope: 'electron',
    format: 'table',
    verbose: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--scope' && argv[i + 1]) {
      out.scope = argv[i + 1];
      i += 1;
    } else if (arg === '--format' && argv[i + 1]) {
      out.format = argv[i + 1];
      i += 1;
    } else if (arg === '--verbose' || arg === '-v') {
      out.verbose = true;
    }
  }

  return out;
}

function scopeConfig(scope) {
  switch (scope) {
    case 'electron':
      return {
        name: 'electron',
        sourceDirs: ['src/electron/electron'],
        packageDirs: ['static/node_modules', 'resources/node_modules', 'node_modules'],
        requireCwds: ['static', 'resources', '.'],
      };
    case 'all-node':
      // Covers all shadow-cljs :node-script/:node-test builds in this repo, plus
      // deps/ sub-projects that have their own Node-targeted CLJS source.
      //
      // Basis:
      //  - src/electron/electron              ← :electron :node-script (Electron main process)
      //  - src/test                           ← :test/:test-no-worker :node-test (test runner)
      //  - deps/cli/src                       ← CLI tool (nbb Node script)
      //  - deps/db-sync/src+test              ← DB sync server / Node adapter
      //  - deps/db/script+test                ← DB utility scripts (Node)
      //  - deps/graph-parser/src+test+script  ← Parser CLI + tests
      //  - deps/publishing/script+test        ← Publishing scripts
      //
      // Browser/Worker builds (app, db-worker, inference-worker, mobile) are
      // intentionally excluded because their npm deps are resolved at bundle
      // time via webpack/shadow-cljs and never require()-called directly.
      return {
        name: 'all-node',
        sourceDirs: [
          'src/electron/electron',
          'src/test',
          'deps/cli/src',
          'deps/db-sync/src',
          'deps/db-sync/test',
          'deps/db/script',
          'deps/db/test',
          'deps/graph-parser/src',
          'deps/graph-parser/test',
          'deps/graph-parser/script',
          'deps/publishing/script',
          'deps/publishing/test',
        ],
        packageDirs: ['static/node_modules', 'resources/node_modules', 'node_modules'],
        requireCwds: ['static', 'resources', '.'],
      };
    default:
      throw new Error(`Unknown scope: ${scope}`);
  }
}

const SKIP_DIRS = new Set(['node_modules', '.git', '.shadow-cljs', '.nbb']);

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkFiles(abs, out);
    } else if (/\.(clj|cljs|cljc)$/.test(entry.name)) {
      out.push(abs);
    }
  }
  return out;
}

function rel(p) {
  return relative(repoRoot, p).replace(/\\/g, '/');
}

const NODE_BUILTINS = new Set([
  'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console',
  'constants', 'crypto', 'dgram', 'diagnostics_channel', 'dns', 'domain',
  'events', 'fs', 'http', 'http2', 'https', 'inspector', 'module', 'net',
  'os', 'path', 'perf_hooks', 'process', 'punycode', 'querystring',
  'readline', 'repl', 'stream', 'string_decoder', 'sys', 'timers',
  'tls', 'trace_events', 'tty', 'url', 'util', 'v8', 'vm',
  'wasi', 'worker_threads', 'zlib',
]);

function isNodeBuiltin(name) {
  return NODE_BUILTINS.has(name) || name.startsWith('node:');
}

function basePackageName(name) {
  if (name.startsWith('@')) {
    const parts = name.split('/');
    return parts.length >= 2 ? parts.slice(0, 2).join('/') : name;
  }
  return name.split('/')[0];
}

function collectUsages(files) {
  const usages = [];

  const npmImportRe = /\["([^"]+)"\s*:(?:as|refer|default)\b[^\]]*\]/g;
  const jsRequireRe = /js\/require\s+"([^"]+)"/g;
  const dynamicImportRe = /dynamic-import\s+"([^"]+)"/g;

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(npmImportRe)) {
      const pkg = m[1];
      if (pkg.startsWith('/')) continue;
      usages.push({
        kind: 'npm-import',
        packageName: pkg,
        file: rel(file),
      });
    }
    for (const m of text.matchAll(jsRequireRe)) {
      usages.push({
        kind: 'js-require',
        packageName: m[1],
        file: rel(file),
      });
    }
    for (const m of text.matchAll(dynamicImportRe)) {
      usages.push({
        kind: 'dynamic-import',
        packageName: m[1],
        file: rel(file),
      });
    }
  }

  return usages;
}

function findPackageJson(packageName, packageDirs) {
  for (const dir of packageDirs) {
    const pkgJson = join(repoRoot, dir, packageName, 'package.json');
    if (existsSync(pkgJson)) {
      return pkgJson;
    }
  }
  return null;
}

function packageMeta(packageName, packageDirs) {
  const pkgJsonPath = findPackageJson(packageName, packageDirs);
  if (!pkgJsonPath) {
    return {
      found: false,
      packageJsonPath: '',
      version: '',
      type: '',
      exportsRequire: '',
      exportsImport: '',
      main: '',
      esmOnly: false,
    };
  }

  const json = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
  const exportsObj = json.exports;
  const exportsStr = JSON.stringify(exportsObj || {});
  const exportsRequire = exportsStr.includes('"require"');
  const exportsImport = exportsStr.includes('"import"');
  const type = json.type || 'commonjs';
  const main = json.main || '';

  // Top-level "default" in exports enables Node 22+ require(esm);
  // only an exports map with exclusively "import" conditionals (no "require", no "default")
  // will structurally block require().
  const exportsHasTopDefault =
    typeof exportsObj === 'object' &&
    exportsObj !== null &&
    !Array.isArray(exportsObj) &&
    'default' in exportsObj;

  const esmOnly =
    type === 'module' &&
    typeof exportsObj === 'object' &&
    exportsObj !== null &&
    exportsImport &&
    !exportsRequire &&
    !exportsHasTopDefault;

  return {
    found: true,
    packageJsonPath: rel(pkgJsonPath),
    version: json.version || '',
    type,
    exportsRequire: exportsRequire ? 'yes' : 'no',
    exportsImport: exportsImport ? 'yes' : 'no',
    main,
    esmOnly,
  };
}

function runProbe(kind, packageName, cwd) {
  return kind === 'import'
    ? tryImport(packageName, cwd)
    : tryRequire(packageName, cwd);
}

function formatProbeResults(kind, packageName, cwds) {
  return cwds.map((cwd) => `${cwd}=${runProbe(kind, packageName, cwd)}`).join(';');
}

function tryRequire(packageName, cwd) {
  const cmd = [
    'node',
    '-e',
    `try{require(${JSON.stringify(packageName)});console.log("OK")}catch(e){console.log("ERR:"+(e.code||e.message))}`,
  ];

  try {
    const result = spawnSync(cmd[0], cmd.slice(1), {
      cwd: join(repoRoot, cwd),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
    const line = output.split(/\r?\n/).find(Boolean) || '';
    return line || `ERR:spawn-exit-${result.status}`;
  } catch (e) {
    return `ERR:${e.code || e.message}`;
  }
}

function tryImport(packageName, cwd) {
  const cmd = [
    'node',
    '-e',
    `import(${JSON.stringify(packageName)}).then(()=>console.log("OK")).catch(e=>console.log("ERR:"+(e.code||e.message)))`,
  ];

  try {
    const result = spawnSync(cmd[0], cmd.slice(1), {
      cwd: join(repoRoot, cwd),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
    const line = output.split(/\r?\n/).find(Boolean) || '';
    return line || `ERR:spawn-exit-${result.status}`;
  } catch (e) {
    return `ERR:${e.code || e.message}`;
  }
}

function shouldSkipRequireProbe(packageName) {
  return packageName === 'electron';
}

// Returns true if the probe error is caused by electron runtime not being
// available (not a real ESM-loading failure). This happens when a package
// imports from the 'electron' framework internally — it loads fine via
// require() inside Electron but fails in a plain-node probe context.
function isElectronRuntimeError(probePart) {
  const result = probePart.includes('=')
    ? probePart.split('=').slice(1).join('=')
    : probePart;
  if (result === 'OK' || result.startsWith('skip=')) return false;
  return (
    result.includes('\'electron\'') ||
    result.includes('"electron"') ||
    result.includes('BrowserWindow') ||
    result.includes('ipcMain') ||
    result.includes('ipcRenderer')
  );
}

// Returns true when every probe failure is either an electron-runtime error or
// a plain MODULE_NOT_FOUND (package not installed at that CWD), AND at least
// one probe location produced an electron-runtime error. This distinguishes
// "real" electron-dep packages from packages that simply aren't installed anywhere.
function probeAllElectronErrors(probeStr) {
  if (!probeStr || probeStr === '-' || probeStr.startsWith('skip=SKIP:')) return false;
  const parts = probeStr.split(';');
  const probed = parts.filter((p) => !p.includes('SKIP:'));
  if (probed.length === 0) return false;
  let hasElectronErr = false;
  for (const p of probed) {
    const result = p.includes('=') ? p.split('=').slice(1).join('=') : p;
    if (result === 'OK') continue;
    if (isElectronRuntimeError(p)) { hasElectronErr = true; continue; }
    // MODULE_NOT_FOUND means the package simply isn't installed at this CWD — neutral.
    if (result.includes('MODULE_NOT_FOUND')) continue;
    // Any other error (ERR_REQUIRE_ESM, syntax errors, etc.) is a real failure.
    return false;
  }
  return hasElectronErr;
}

function probeHasSuccess(result) {
  return result.split(';').some((part) =>
    part === 'OK' ||
    part.includes('=OK') ||
    part.startsWith('skip=SKIP:')
  );
}

function probeHasActualOk(result) {
  return result.split(';').some((part) => part === 'OK' || part.includes('=OK'));
}

// Returns true if any probe failed with a real loading error (not just the
// package being absent at that CWD). MODULE_NOT_FOUND is neutral — the package
// simply isn't installed there. Everything else (ERR_PACKAGE_PATH_NOT_EXPORTED,
// ERR_REQUIRE_ESM, syntax errors, etc.) is a genuine incompatibility.
function probeHasRealError(probeStr) {
  if (!probeStr || probeStr === '-' || probeStr.startsWith('skip=SKIP:')) return false;
  return probeStr.split(';').some((p) => {
    const result = p.includes('=') ? p.split('=').slice(1).join('=') : p;
    if (result === 'OK' || result.startsWith('SKIP:')) return false;
    if (result.includes('MODULE_NOT_FOUND')) return false;
    return true;
  });
}

function moduleMode(entry) {
  if (entry.type === 'builtin') return 'builtin';
  if (!entry.type || entry.type === '-') return '-';
  if (entry.type !== 'module') return 'cjs-or-nonmodule';
  // Only treat as require-compatible if some CWD succeeds AND no CWD produces
  // a real loading error. A mix of OK + real-error means the package fails in
  // some installations (e.g. S:ERR(ERR_PACKAGE_PATH_NOT_EXPORTED) .:OK).
  if (probeHasActualOk(entry.requireProbe || '') && !probeHasRealError(entry.requireProbe || '')) {
    return 'module-require-compatible';
  }
  // ESM package whose probe failures are all caused by missing Electron runtime,
  // not a real loading failure. require() succeeds in actual Electron context.
  if (probeAllElectronErrors(entry.requireProbe || '')) return 'module-electron-dep';
  if (probeHasActualOk(entry.importProbe || '')) return 'module-import-only';
  return 'module-unloadable';
}

function classify(entry) {
  if (entry.kind === 'relative-require') return 'info';
  if (entry.kind === 'dynamic-import') return probeHasSuccess(entry.importProbe) ? 'ok' : 'high';
  if (entry.kind === 'js-require') {
    if (probeHasSuccess(entry.requireProbe)) return 'ok';
    // Probe fails only because Electron runtime is absent — not a loading error
    if (probeAllElectronErrors(entry.requireProbe)) return 'ok';
    return 'high';
  }
  if (entry.kind === 'npm-import') {
    // Use probe-based moduleMode as authoritative classifier.
    // Static esmOnly is only metadata; the actual load result determines risk.
    const mode = entry.moduleMode;
    if (mode === 'module-electron-dep') return 'ok';
    if (mode === 'module-unloadable') return 'high';
    if (mode === 'module-import-only') return 'medium';
    return 'ok';
  }
  return 'ok';
}

function simplifyProbe(probeStr, verbose) {
  if (!probeStr || probeStr === '-') return '-';
  if (probeStr === 'ALL:OK') return 'ALL:OK';
  if (probeStr === 'builtin') return 'BUILTIN';
  if (probeStr.startsWith('skip=SKIP:')) {
    const reason = probeStr.replace('skip=SKIP:', '');
    const shortNames = {
      'electron-runtime-package': 'electron',
      'dynamic-import-callsite': 'dynamic',
      'relative-path-or-builtin': 'relative',
    };
    return 'SKIP(' + (shortNames[reason] || reason.substring(0, 15)) + ')';
  }

  const parts = probeStr.split(';').map((p) => {
    const eqIdx = p.indexOf('=');
    if (eqIdx === -1) return { cwd: p, ok: p === 'OK', detail: p };
    const cwd = p.substring(0, eqIdx);
    const result = p.substring(eqIdx + 1);
    const cwdShort = cwd === 'static' ? 'S' : cwd === 'resources' ? 'R' : cwd === '.' ? '.' : cwd;
    if (result === 'OK') return { cwd: cwdShort, ok: true, detail: 'OK' };
    const errMsg = result.replace(/^ERR:/, '');
    const isElectronDep = isElectronRuntimeError(p);
    let detail;
    if (isElectronDep) {
      detail = 'ERR(e-dep)';
    } else if (verbose) {
      detail = 'ERR(' + errMsg.substring(0, 25) + ')';
    } else {
      detail = 'ERR';
    }
    return { cwd: cwdShort, ok: false, detail };
  });

  if (parts.every((p) => p.ok)) return 'ALL:OK';
  if (parts.every((p) => !p.ok)) {
    const hasEdep = parts.some((p) => p.detail === 'ERR(e-dep)');
    const allEdepOrPlain = parts.every((p) => p.detail === 'ERR(e-dep)' || p.detail === 'ERR');
    if (hasEdep && allEdepOrPlain) return 'ALL:ERR(e-dep)';
    return 'ALL:ERR';
  }
  return parts.map((p) => p.cwd + ':' + (p.ok ? 'OK' : p.detail)).join(' ');
}

function pad(str, len) {
  str = String(str);
  return str.length >= len ? str : str + ' '.repeat(len - str.length);
}

function renderTable(results, summary, args) {
  const line = '='.repeat(76);
  const thinLine = '-'.repeat(76);

  console.log(line);
  console.log('  ESM/CJS RISK SCAN');
  console.log(line);
  console.log('  Scope:    ' + summary.scope);
  console.log('  Files:    ' + summary.files_scanned);
  console.log('  Packages: ' + summary.unique_packages + ' unique');
  console.log('  Usages:   ' + summary.usages + ' total');
  console.log(thinLine);
  console.log(
    '  [!!] HIGH: ' + String(summary.high).padEnd(3, ' ') +
    '    [!] MEDIUM: ' + String(summary.medium).padEnd(3, ' ')
  );
  console.log(
    '  [ok] OK:   ' + String(summary.ok).padEnd(3, ' ') +
    '    [i] INFO:   ' + String(summary.info).padEnd(3, ' ')
  );
  console.log(line);
  console.log('');

  const riskOrder = ['high', 'medium', 'ok', 'info'];

  for (const risk of riskOrder) {
    const items = results.filter((r) => r.risk === risk);
    const header = {
      high: 'HIGH RISK',
      medium: 'MEDIUM RISK',
      ok: 'OK',
      info: 'INFO',
    }[risk];
    console.log(
      '--- ' + header + ' (' + items.length + ') ' +
      thinLine.substring(header.length + 10)
    );

    if (items.length === 0) {
      console.log('  (none)');
      console.log('');
      continue;
    }

    if (risk === 'high' || risk === 'medium') {
      for (const r of items) {
        const marker = risk === 'high' ? '[!!]' : '[!]';
        console.log('');
        console.log(
          '  ' + marker + ' ' + r.packageName + '  v' + (r.version || '-')
        );
        console.log(
          '      kind: ' + r.kind +
          ' | type: ' + (r.type || '-') +
          ' | mode: ' + (r.moduleMode || '-')
        );
        console.log(
          '      exports: require=' + (r.exportsRequire || '-') +
          ' import=' + (r.exportsImport || '-')
        );
        console.log(
          '      require: ' + simplifyProbe(r.requireProbe, true)
        );
        console.log(
          '      import:  ' + simplifyProbe(r.importProbe, true)
        );
        console.log('      file: ' + r.file);
      }
    } else {
      const typeShort = (t) => {
        if (!t || t === '-') return '-';
        if (t === 'builtin') return 'blt';
        if (t === 'module') return 'esm';
        return 'cjs';
      };
      const modeShort = (m) => {
        if (!m || m === '-') return '-';
        const map = {
          'builtin': 'blt',
          'cjs-or-nonmodule': 'cjs',
          'module-require-compatible': 'esm-req',
          'module-electron-dep': 'esm-edep',
          'module-import-only': 'esm-imp',
          'module-unloadable': 'esm-?',
          'relative-or-builtin': 'rel',
        };
        return map[m] || m.substring(0, 8);
      };

      const colPkg =
        Math.max(7, ...items.map((r) => r.packageName.length)) + 2;
      const colVer =
        Math.max(7, ...items.map((r) => (r.version || '-').length)) + 2;
      const colKind =
        Math.max(12, ...items.map((r) => r.kind.length)) + 2;
      const colType = 6;
      const colMode =
        Math.max(8, ...items.map((r) => modeShort(r.moduleMode).length)) + 2;
      const colProbe =
        Math.max(
          14,
          ...items.map(
            (r) => simplifyProbe(r.requireProbe, args.verbose).length
          )
        ) + 2;

      console.log(
        '  ' +
        pad('PACKAGE', colPkg) +
        pad('VER', colVer) +
        pad('KIND', colKind) +
        pad('TYPE', colType) +
        pad('MODE', colMode) +
        pad('REQUIRE', colProbe) +
        'FILE'
      );
      console.log(
        '  ' +
        '-'.repeat(colPkg + colVer + colKind + colType + colMode + colProbe + 40)
      );

      for (const r of items) {
        const reqProbe = simplifyProbe(r.requireProbe, args.verbose);
        console.log(
          '  ' +
          pad(r.packageName, colPkg) +
          pad(r.version || '-', colVer) +
          pad(r.kind, colKind) +
          pad(typeShort(r.type), colType) +
          pad(modeShort(r.moduleMode), colMode) +
          pad(reqProbe, colProbe) +
          r.file
        );
      }
    }
    console.log('');
  }

  console.log(line);
  console.log('  NOTES');
  console.log('  - Probe CWDs: S=static/  R=resources/  .=root/');
  console.log(
    '  - For electron scope, static/ is the primary runtime directory.'
  );
  console.log(
    '    Errors in R or . are expected for Electron-only packages.'
  );
  console.log(
    '  - Packages with S:OK but R:ERR/.:ERR are normal — installed'
  );
  console.log(
    '    only in static/node_modules (the Electron app directory).'
  );
  console.log('  - Use --format=tsv for machine-readable output.');
  console.log(
    '  - Use --verbose (-v) for full error messages in probes.'
  );
  console.log(line);
}

function renderTsv(results, summary) {
  console.log('SUMMARY');
  for (const [k, v] of Object.entries(summary)) {
    console.log(k + '=' + v);
  }
  console.log('');
  console.log('RESULTS');
  console.log(
    [
      'risk', 'kind', 'package', 'version', 'type', 'module_mode',
      'exports_require', 'exports_import', 'require_probe',
      'import_probe', 'file',
    ].join('\t')
  );
  for (const r of results) {
    console.log(
      [
        r.risk,
        r.kind,
        r.packageName,
        r.version || '-',
        r.type || '-',
        r.moduleMode || '-',
        r.exportsRequire || '-',
        r.exportsImport || '-',
        r.requireProbe || '-',
        r.importProbe || '-',
        r.file,
      ].join('\t')
    );
  }
}

function renderJson(results, summary) {
  console.log(JSON.stringify({ summary, results }, null, 2));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = scopeConfig(args.scope);
  const files = cfg.sourceDirs.flatMap((dir) => walkFiles(join(repoRoot, dir)));
  const rawUsages = collectUsages(files);
  const deduped = new Map();

  for (const usage of rawUsages) {
    const key = `${usage.kind}::${usage.packageName}::${usage.file}`;
    deduped.set(key, usage);
  }

  const results = [];

  for (const usage of deduped.values()) {
    if (usage.kind === 'js-require' && (usage.packageName.startsWith('.') || usage.packageName.includes('/') && !usage.packageName.startsWith('@') && !usage.packageName.includes('node_modules'))) {
      results.push({
        ...usage,
        packageJsonPath: '',
        version: '',
        type: '',
        exportsRequire: '',
        exportsImport: '',
        main: '',
        esmOnly: false,
        requireProbe: 'skip=SKIP:relative-path-or-builtin',
        importProbe: 'skip=SKIP:relative-path-or-builtin',
        moduleMode: 'relative-or-builtin',
        risk: 'info',
      });
      continue;
    }

    if (isNodeBuiltin(usage.packageName)) {
      const baseName = basePackageName(usage.packageName);
      if (!findPackageJson(baseName, cfg.packageDirs)) {
        results.push({
          ...usage,
          packageJsonPath: '',
          version: '',
          type: 'builtin',
          exportsRequire: '-',
          exportsImport: '-',
          main: '',
          esmOnly: false,
          requireProbe: 'ALL:OK',
          importProbe: 'ALL:OK',
          moduleMode: 'builtin',
          risk: 'ok',
        });
        continue;
      }
    }

    const baseName = basePackageName(usage.packageName);
    const meta = packageMeta(baseName, cfg.packageDirs);
    const requireProbe = usage.kind === 'dynamic-import'
      ? 'skip=SKIP:dynamic-import-callsite'
      : shouldSkipRequireProbe(usage.packageName)
      ? 'skip=SKIP:electron-runtime-package'
      : formatProbeResults('require', usage.packageName, cfg.requireCwds);
    const importProbe = shouldSkipRequireProbe(usage.packageName)
      ? 'skip=SKIP:electron-runtime-package'
      : formatProbeResults('import', usage.packageName, cfg.requireCwds);

    const entry = {
      ...usage,
      ...meta,
      requireProbe,
      importProbe,
    };
    entry.moduleMode = moduleMode(entry);
    entry.risk = classify(entry);
    results.push(entry);
  }

  results.sort((a, b) => {
    const rank = { high: 0, medium: 1, ok: 2, info: 3 };
    return rank[a.risk] - rank[b.risk] ||
      a.packageName.localeCompare(b.packageName) ||
      a.file.localeCompare(b.file);
  });

  const uniquePkgs = new Set(results.map((r) => r.packageName)).size;

  const summary = {
    scope: cfg.name,
    files_scanned: files.length,
    unique_packages: uniquePkgs,
    usages: results.length,
    high: results.filter((x) => x.risk === 'high').length,
    medium: results.filter((x) => x.risk === 'medium').length,
    ok: results.filter((x) => x.risk === 'ok').length,
    info: results.filter((x) => x.risk === 'info').length,
  };

  switch (args.format) {
    case 'tsv':
      renderTsv(results, summary);
      break;
    case 'json':
      renderJson(results, summary);
      break;
    case 'table':
    default:
      renderTable(results, summary, args);
      break;
  }
}

main();
