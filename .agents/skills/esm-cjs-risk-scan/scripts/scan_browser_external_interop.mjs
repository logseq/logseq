#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const repoRoot = process.cwd();

function parseArgs(argv) {
  const out = {
    format: 'json',
    sourceDirs: [
      'src/main/frontend',
      'deps/publish/src',
      'deps/publishing/src',
    ],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--format' && argv[i + 1]) {
      out.format = argv[i + 1];
      i += 1;
    } else if (arg === '--source-dir' && argv[i + 1]) {
      out.sourceDirs = argv[i + 1].split(',').map((s) => s.trim()).filter(Boolean);
      i += 1;
    }
  }

  return out;
}

const SKIP_DIRS = new Set(['node_modules', '.git', '.shadow-cljs', '.nbb', 'target']);
const FILE_EXT_RE = /\.(cljs|cljc)$/;

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkFiles(abs, out);
    } else if (FILE_EXT_RE.test(entry.name)) {
      out.push(abs);
    }
  }
  return out;
}

function rel(p) {
  return relative(repoRoot, p).replace(/\\/g, '/');
}

function basePackageName(name) {
  if (name.startsWith('@')) {
    const parts = name.split('/');
    return parts.length >= 2 ? parts.slice(0, 2).join('/') : name;
  }
  return name.split('/')[0];
}

function isRelativeOrAbsolute(name) {
  return name.startsWith('.') || name.startsWith('/');
}

function readPackageMeta(packageName) {
  const baseName = basePackageName(packageName);
  const packageJsonPath = join(repoRoot, 'node_modules', baseName, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return {
      packageName: baseName,
      found: false,
      type: '',
      main: '',
      module: '',
      exports: false,
      browser: false,
    };
  }

  const json = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  return {
    packageName: baseName,
    found: true,
    version: json.version || '',
    type: json.type || 'commonjs',
    main: json.main || '',
    module: json.module || '',
    exports: Boolean(json.exports),
    browser: Boolean(json.browser),
    packageJsonPath: rel(packageJsonPath),
  };
}

function extractNames(body, key) {
  const re = new RegExp(`${key}\\s+\\[([^\\]]*)\\]`);
  const m = body.match(re);
  if (!m) return [];
  return m[1].trim().split(/\s+/).filter((name) => name && !name.startsWith('^'));
}

function extractSymbol(body, key) {
  const re = new RegExp(`${key}\\s+([^\\s\\]]+)`);
  const m = body.match(re);
  return m ? m[1] : '';
}

function classifyRequireBody(body) {
  const names = extractNames(body, ':refer');
  const defaultName = extractSymbol(body, ':default');
  const alias = extractSymbol(body, ':as');

  if (defaultName) {
    return {
      importMode: 'default',
      local: defaultName,
      names: [],
    };
  }
  if (names.length > 0) {
    return {
      importMode: 'named',
      local: '',
      names,
    };
  }
  if (alias) {
    return {
      importMode: 'namespace',
      local: alias,
      names: [],
    };
  }
  return {
    importMode: 'side-effect',
    local: '',
    names: [],
  };
}

function extractNsForm(text) {
  const start = text.search(/\(ns\s/);
  if (start < 0) return '';

  let depth = 0;
  let inString = false;
  let inComment = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];

    if (inComment) {
      if (ch === '\n') inComment = false;
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === ';') {
      inComment = true;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '(') {
      depth += 1;
      continue;
    }
    if (ch === ')') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return text.slice(start);
}

function collectUsages(files) {
  const usages = [];
  const requireVectorRe = /\["([^"]+)"((?:[^\[\]]|\[[^\]]*\])*)\]/g;

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const nsForm = extractNsForm(text);
    if (!nsForm.includes(':require')) continue;

    for (const m of nsForm.matchAll(requireVectorRe)) {
      const packageName = m[1];
      if (isRelativeOrAbsolute(packageName)) continue;
      if (!readPackageMeta(packageName).found) continue;

      const body = m[2] || '';
      const usage = classifyRequireBody(body);
      usages.push({
        packageName,
        basePackageName: basePackageName(packageName),
        file: rel(file),
        ...usage,
      });
    }
  }
  return usages;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function isSideEffectPackage(packageName) {
  return packageName.endsWith('.css') ||
    packageName.startsWith('codemirror/') ||
    packageName.includes('/mode/') ||
    packageName.includes('/theme/');
}

function inferCandidateKind(packageName, usages) {
  const modes = uniqueSorted(usages.map((u) => u.importMode));
  const names = uniqueSorted(usages.flatMap((u) => u.names || []));
  const locals = uniqueSorted(usages.map((u) => u.local).filter(Boolean));
  const files = uniqueSorted(usages.map((u) => u.file));

  if (isSideEffectPackage(packageName) || modes.every((mode) => mode === 'side-effect')) {
    return {
      kind: 'side-effect',
      confidence: 'high',
      reason: 'required for side effects only',
      files,
    };
  }

  if (modes.every((mode) => mode === 'named')) {
    return {
      kind: 'named',
      names,
      confidence: 'high',
      reason: 'CLJS requires named exports with :refer',
      files,
    };
  }

  if (modes.includes('default')) {
    return {
      kind: 'default',
      confidence: 'high',
      reason: 'CLJS requires a default export with :default',
      files,
    };
  }

  if (modes.includes('namespace')) {
    return {
      kind: 'namespace',
      confidence: 'medium',
      reason: 'CLJS aliases the module namespace with :as; verify whether call sites expect namespace or default',
      locals,
      files,
    };
  }

  return {
    kind: 'namespace',
    confidence: 'low',
    reason: 'fallback candidate; inspect call sites before using',
    files,
  };
}

function buildReport(sourceDirs) {
  const files = sourceDirs.flatMap((dir) => walkFiles(join(repoRoot, dir)));
  const usages = collectUsages(files);
  const grouped = new Map();

  for (const usage of usages) {
    const key = usage.packageName;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(usage);
  }

  const candidates = [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([packageName, packageUsages]) => ({
      packageName,
      meta: readPackageMeta(packageName),
      usageModes: uniqueSorted(packageUsages.map((u) => u.importMode)),
      usages: packageUsages,
      manifest: inferCandidateKind(packageName, packageUsages),
    }));

  const manifestCandidate = Object.fromEntries(candidates.map((candidate) => {
    const entry = { kind: candidate.manifest.kind };
    if (candidate.manifest.names?.length) entry.names = candidate.manifest.names;
    return [candidate.packageName, entry];
  }));

  return {
    summary: {
      scanner: 'browser-external-interop',
      sourceDirs: sourceDirs.filter((dir) => existsSync(join(repoRoot, dir))),
      filesScanned: files.length,
      usages: usages.length,
      packages: candidates.length,
    },
    manifestCandidate,
    candidates,
  };
}

function formatTsObject(value, indent = 0) {
  const pad = ' '.repeat(indent);
  const childPad = ' '.repeat(indent + 2);

  if (Array.isArray(value)) {
    return `[${value.map((item) => formatTsObject(item, 0)).join(', ')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    const body = entries.map(([key, child]) => {
      const property = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
      return `${childPad}${property}: ${formatTsObject(child, indent + 2)}`;
    }).join(',\n');
    return `{\n${body},\n${pad}}`;
  }

  return JSON.stringify(value);
}

function printReport(report, format) {
  if (format === 'json') {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (format === 'ts') {
    console.log('// Candidate manifest for vite.config.shared.ts. Review before committing.');
    console.log(`export const externalInteropManifest = ${formatTsObject(report.manifestCandidate)} as const;`);
    return;
  }

  throw new Error(`Unknown format: ${format}`);
}

const args = parseArgs(process.argv.slice(2));
printReport(buildReport(args.sourceDirs), args.format);
