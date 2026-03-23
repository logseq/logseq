#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { execFileSync } from 'child_process';

const root = process.cwd();

function parseArgs(argv) {
  const args = new Map();
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args.set(arg, next);
      i += 1;
    } else {
      args.set(arg, 'true');
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const outJson = resolve(root, args.get('--output-json') || 'tmp/logseq_dependency_audit.json');
const outMd = resolve(root, args.get('--output-md') || 'tmp/logseq_dependency_audit_report.md');
const staleMonths = Number(args.get('--stale-months') || 36);
// When true (pass --include-prerelease flag), annotate in Risk column if a newer
// pre-release exists upstream. Target version is ALWAYS the latest stable release.
const includePrerelease = args.get('--include-prerelease') === 'true';

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------

function isMobilePackage(pkg) {
  if (pkg.startsWith('@capacitor/')) return true;
  if (pkg.startsWith('@capacitor-community/')) return true;
  if (pkg.startsWith('@capgo/')) return true;
  if (pkg.startsWith('@jcesarmobile/')) return true;
  const lower = pkg.toLowerCase();
  return ['capacitor', 'cordova', 'ionic'].some(kw => lower.includes(kw));
}

function isToolchainPackage(ecosystem, pkg) {
  if (ecosystem === 'npm') {
    if (pkg === 'electron') return true;
    if (pkg.startsWith('@electron-forge/')) return true;
    if (pkg.startsWith('@electron/')) return true;
    if (pkg.startsWith('electron-forge')) return true;
    if (pkg === 'electron-builder') return true;
    if (pkg === 'shadow-cljs') return true;
    return false;
  }
  if (ecosystem === 'clj' || ecosystem === 'bb-pod') {
    return [
      'org.clojure/clojure',
      'org.clojure/clojurescript',
      'thheller/shadow-cljs',
      'clj-kondo/clj-kondo',
    ].includes(pkg);
  }
  return false;
}

function isLocalDep(entry) {
  return entry.versionKind === 'local/root';
}

// ---------------------------------------------------------------------------
// Shell + file helpers
// ---------------------------------------------------------------------------

function sh(cmd, argsList = []) {
  return execFileSync(cmd, argsList, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function listTrackedAndUnignoredFiles() {
  return sh('git', ['ls-files', '-co', '--exclude-standard'])
    .split('\n').map(l => l.trim()).filter(Boolean);
}

function discoverManifestFiles() {
  const files = listTrackedAndUnignoredFiles();
  return {
    packageFiles: files.filter(f => f.endsWith('package.json') && !f.includes('/node_modules/')).sort(),
    depsFiles: files.filter(f => (f.endsWith('deps.edn') || f.endsWith('nbb.edn')) && !f.includes('/node_modules/')).sort(),
    bbFiles: files.filter(f => f.endsWith('bb.edn') && !f.includes('/node_modules/')).sort(),
  };
}

function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), 'utf8'));
}

// ---------------------------------------------------------------------------
// Parse entries
// ---------------------------------------------------------------------------

function parsePackageEntries(packageFiles) {
  const entries = [];
  for (const rel of packageFiles) {
    const data = readJson(rel);
    for (const section of ['dependencies', 'devDependencies']) {
      for (const [pkg, current] of Object.entries(data[section] || {})) {
        entries.push({ ecosystem: 'npm', file: rel, section, package: pkg, current });
      }
    }
  }
  return entries;
}

function parseDepsEntries(depsFiles) {
  if (depsFiles.length === 0) return [];
  const bbCode = `
(require '[clojure.edn :as edn]
         '[clojure.java.io :as io]
         '[clojure.data.json :as json])
(let [files ${JSON.stringify(depsFiles)}]
  (println
   (json/write-str
    (mapcat
     (fn [f]
       (let [m (edn/read-string (slurp (io/file f)))
             main-deps (or (:deps m) {})
             alias-deps (mapcat
                          (fn [[alias-key alias-val]]
                            (let [extra (or (:extra-deps alias-val) {})
                                  replace (or (:replace-deps alias-val) {})]
                              (map (fn [[lib opts]]
                                     {:ecosystem "clj"
                                      :file f
                                      :package (str lib)
                                      :alias (name alias-key)
                                      :current (or (:mvn/version opts) (:git/tag opts) (:sha opts) (:git/sha opts) (:local/root opts))
                                      :version-kind (cond
                                                      (:mvn/version opts) "mvn/version"
                                                      (:git/tag opts) "git/tag"
                                                      (:sha opts) "sha"
                                                      (:git/sha opts) "git/sha"
                                                      (:local/root opts) "local/root"
                                                      :else "unknown")})
                                   (merge extra replace))))
                          (or (:aliases m) {}))]
         (concat
           (for [[lib opts] main-deps]
             {:ecosystem "clj"
              :file f
              :package (str lib)
              :current (or (:mvn/version opts) (:git/tag opts) (:sha opts) (:git/sha opts) (:local/root opts))
              :version-kind (cond
                              (:mvn/version opts) "mvn/version"
                              (:git/tag opts) "git/tag"
                              (:sha opts) "sha"
                              (:git/sha opts) "git/sha"
                              (:local/root opts) "local/root"
                              :else "unknown")})
           alias-deps)))
     files))))`;
  return JSON.parse(sh('bb', ['-e', bbCode])).map(e => {
    if (e['version-kind']) { e.versionKind = e['version-kind']; delete e['version-kind']; }
    return e;
  });
}

function parseBbEntries(bbFiles) {
  if (bbFiles.length === 0) return [];
  const bbCode = `
(require '[clojure.edn :as edn]
         '[clojure.java.io :as io]
         '[clojure.data.json :as json])
(let [files ${JSON.stringify(bbFiles)}]
  (println
   (json/write-str
    (mapcat
     (fn [f]
       (let [m (edn/read-string (slurp (io/file f)))
             bb-deps (or (:deps m) {})
             bb-pods (or (:pods m) {})]
         (concat
           (for [[lib opts] bb-deps]
             {:ecosystem "clj"
              :file f
              :section "bb-deps"
              :package (str lib)
              :current (or (:mvn/version opts) (:git/tag opts) (:sha opts) (:git/sha opts) (:local/root opts))
              :version-kind (cond
                              (:mvn/version opts) "mvn/version"
                              (:git/tag opts) "git/tag"
                              (:sha opts) "sha"
                              (:git/sha opts) "git/sha"
                              (:local/root opts) "local/root"
                              :else "unknown")})
           (for [[lib opts] bb-pods]
             {:ecosystem "bb-pod"
              :file f
              :section "pods"
              :package (str lib)
              :current (:version opts)
              :version-kind "pod-version"}))))
     files))))`;
  return JSON.parse(sh('bb', ['-e', bbCode])).map(e => {
    if (e['version-kind']) { e.versionKind = e['version-kind']; delete e['version-kind']; }
    return e;
  });
}

// ---------------------------------------------------------------------------
// Lockfile resolution (yarn.lock v1)
// ---------------------------------------------------------------------------

function parseYarnLock(lockPath) {
  const resolved = new Map();
  if (!existsSync(lockPath)) return resolved;
  const content = readFileSync(lockPath, 'utf8');
  let currentSpecs = null;
  let currentVersion = null;
  for (const line of content.split('\n')) {
    if (line.startsWith('#') || line.trim() === '') continue;
    if (!line.startsWith(' ') && line.endsWith(':')) {
      if (currentSpecs && currentVersion) {
        for (const spec of currentSpecs) resolved.set(spec, currentVersion);
      }
      currentSpecs = line.slice(0, -1).split(', ').map(s => s.replace(/^"|"$/g, ''));
      currentVersion = null;
    } else if (line.startsWith('  version ')) {
      currentVersion = line.replace(/^  version "?/, '').replace(/"$/, '');
    }
  }
  if (currentSpecs && currentVersion) {
    for (const spec of currentSpecs) resolved.set(spec, currentVersion);
  }
  return resolved;
}

function findLockFileForPackageJson(packageJsonPath) {
  const dir = dirname(join(root, packageJsonPath));
  const yarnLock = join(dir, 'yarn.lock');
  if (existsSync(yarnLock)) return yarnLock;
  return null;
}

const lockCache = new Map();
function getResolvedVersion(packageJsonPath, pkg, specifier) {
  const lockPath = findLockFileForPackageJson(packageJsonPath);
  if (!lockPath) return null;
  if (!lockCache.has(lockPath)) lockCache.set(lockPath, parseYarnLock(lockPath));
  const lock = lockCache.get(lockPath);
  return lock.get(`${pkg}@${specifier}`) || null;
}

// ---------------------------------------------------------------------------
// Version utilities
// ---------------------------------------------------------------------------

function coerceVersion(raw) {
  if (typeof raw !== 'string') return null;
  const match = raw.match(/(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?|\d+\.\d+|\d+)/);
  return match ? match[1] : null;
}

function splitVersionParts(version) {
  return String(version).split(/[^0-9A-Za-z]+/).filter(Boolean)
    .map(p => /^\d+$/.test(p) ? Number(p) : p);
}

function compareVersions(a, b) {
  const aa = splitVersionParts(a);
  const bb = splitVersionParts(b);
  const len = Math.max(aa.length, bb.length);
  for (let i = 0; i < len; i += 1) {
    const left = aa[i], right = bb[i];
    if (left === undefined) return -1;
    if (right === undefined) return 1;
    if (left === right) continue;
    if (typeof left === 'number' && typeof right === 'number') return left < right ? -1 : 1;
    return String(left).localeCompare(String(right));
  }
  return 0;
}

function unique(items) { return [...new Set(items)]; }

function majorOf(version) {
  const base = coerceVersion(version);
  if (!base) return null;
  return Number(base.split('.')[0]);
}

function versionPrefix(raw) {
  if (typeof raw !== 'string') return '';
  const m = raw.match(/^(\^|~|>=?|<=?)/);
  return m ? m[1] : '';
}

function formatTarget(currentRaw, latestBase) {
  if (!latestBase) return '';
  return `${versionPrefix(currentRaw)}${latestBase}`;
}

// ---------------------------------------------------------------------------
// Network fetchers
// ---------------------------------------------------------------------------

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'user-agent': 'logseq-dependency-audit', ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;
  async function run() {
    while (index < items.length) {
      const i = index++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

async function fetchNpmPackageMeta(pkg) {
  try {
    const data = await fetchJson(`https://registry.npmjs.org/${encodeURIComponent(pkg).replace('%40', '@')}`);
    // dist-tags.latest is always the stable release per npm convention
    const latest = data['dist-tags']?.latest || null;
    const latestMeta = latest ? data.versions?.[latest] : null;
    // Only scan dist-tags for a newer pre-release when --include-prerelease is set
    let absoluteLatest = null;
    if (includePrerelease && data['dist-tags']) {
      const tagVersions = Object.values(data['dist-tags']);
      const best = tagVersions.slice().sort((a, b) => -compareVersions(a, b))[0];
      if (best && best !== latest && compareVersions(best, latest) > 0 && isPrerelease(best)) absoluteLatest = best;
    }
    return {
      latest,
      absoluteLatest,
      latestPublishedAt: latest && data.time ? data.time[latest] || null : null,
      latestDeprecated: latestMeta?.deprecated || null,
      raw: data,
    };
  } catch (error) {
    return { latest: null, error: String(error) };
  }
}

async function fetchCljPackageMeta(pkg) {
  const [group, artifact] = pkg.includes('/') ? pkg.split('/') : [pkg, pkg];
  if (!group || !artifact) return { latest: null, error: 'invalid-coordinates' };
  try {
    const clojars = await fetchJson(`https://clojars.org/api/artifacts/${encodeURIComponent(group)}/${encodeURIComponent(artifact)}`);
    const absoluteLatest = clojars.latest_version || clojars.latest_release || null;
    let stableLatest = clojars.latest_release || absoluteLatest;
    // Clojars sometimes marks a pre-release as latest_release; always scan recent_versions for true stable
    if (stableLatest && isPrerelease(stableLatest) && Array.isArray(clojars.recent_versions)) {
      const stable = clojars.recent_versions.find(v => !isPrerelease(v.version));
      if (stable) stableLatest = stable.version;
    }
    // target (latest) is ALWAYS the stable version
    const latest = (stableLatest && !isPrerelease(stableLatest)) ? stableLatest : null;
    let publishedAt = null;
    if (clojars.recent_versions && Array.isArray(clojars.recent_versions)) {
      const entry = clojars.recent_versions.find(v => v.version === latest);
      if (entry?.created) publishedAt = entry.created;
    }
    const result = { latest, latestPublishedAt: publishedAt };
    // Only annotate pre-release info when --include-prerelease flag is set
    if (includePrerelease && absoluteLatest && absoluteLatest !== latest && isPrerelease(absoluteLatest)) {
      result.absoluteLatest = absoluteLatest;
    }
    return result;
  } catch (_) {
    try {
      const q = `https://search.maven.org/solrsearch/select?q=g:%22${encodeURIComponent(group)}%22+AND+a:%22${encodeURIComponent(artifact)}%22&rows=1&wt=json`;
      const maven = await fetchJson(q);
      const doc = maven.response?.docs?.[0];
      const mavenLatest = doc?.latestVersion || null;
      const ts = doc?.timestamp;
      // Maven Central solr only exposes the absolute latest version.
      // If it's a pre-release, we cannot determine the stable version from this API.
      const result = { latest: mavenLatest, latestPublishedAt: ts ? new Date(ts).toISOString() : null };
      if (mavenLatest && isPrerelease(mavenLatest)) {
        if (includePrerelease) result.absoluteLatest = mavenLatest;
        result.latest = null; // cannot determine stable from Maven Central solr
      }
      return result;
    } catch (error) {
      return { latest: null, error: String(error) };
    }
  }
}

function npmCurrentVersionMeta(rawRegistry, currentBase) {
  if (!rawRegistry || !currentBase) return null;
  return rawRegistry.versions?.[currentBase] || null;
}

async function fetchOsvBatch(queries) {
  if (queries.length === 0) return [];
  const results = [];
  for (let i = 0; i < queries.length; i += 100) {
    const batch = queries.slice(i, i + 100);
    try {
      const data = await fetchJson('https://api.osv.dev/v1/querybatch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ queries: batch }),
      });
      results.push(...(data.results || []));
    } catch (error) {
      for (let j = 0; j < batch.length; j += 1) results.push({ vulns: [] });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Analysis helpers
// ---------------------------------------------------------------------------

function monthsBetween(iso) {
  if (!iso) return null;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return null;
  return (Date.now() - ts) / (1000 * 60 * 60 * 24 * 30.4375);
}

function normalizeCurrent(entry) {
  if (entry.ecosystem === 'npm') return coerceVersion(entry.current);
  if (entry.ecosystem === 'bb-pod') return coerceVersion(entry.current);
  if (entry.versionKind === 'mvn/version') return coerceVersion(entry.current) || entry.current;
  return null;
}

function isPrerelease(version) {
  if (typeof version !== 'string') return false;
  // Require a hyphen before the pre-release keyword so normal words aren't matched.
  // Handles: -alpha1, -alpha.1, -RC2, -SNAPSHOT, -M22, -beta3, -canary-xxx, -nightly-xxx, -dev.xxx
  return /-(SNAPSHOT|RC\d*|alpha\d*|beta\d*|M\d+|milestone|preview|nightly|canary|dev\b|next\b|pre\b)/i.test(version);
}

function latestStatus(latest, currentsNormalized, currentsRaw) {
  if (!latest) return 'unknown';
  // Raw string equality check for non-semver versions (e.g. b.47, date-based)
  if (currentsRaw && currentsRaw.length > 0 && currentsRaw.every(c => c === latest)) return 'latest';
  if (currentsNormalized.length === 0) return 'unknown';
  if (currentsNormalized.every(c => compareVersions(c, latest) === 0)) return 'latest';
  if (currentsNormalized.some(c => compareVersions(c, latest) < 0)) return 'outdated';
  return 'manual';
}

function needsManualReview(entries) {
  return entries.some(entry => {
    if (entry.versionKind && !['mvn/version', 'pod-version'].includes(entry.versionKind)) return true;
    if (typeof entry.current !== 'string') return false;
    return ['github:', 'http:', 'https:', 'git+', 'file:'].some(p => entry.current.startsWith(p));
  });
}

// ---------------------------------------------------------------------------
// Batch classification
// ---------------------------------------------------------------------------

const BATCH_ORDER = [
  'toolchain',
  'root-js-incremental',
  'root-js-major',
  'clj-libraries',
  'deps-islands',
  'packages-ui',
  'mobile-capacitor',
  'infra-islands',
];

function classifyBatch(item) {
  const first = item.entries[0];

  if (isToolchainPackage(item.ecosystem, item.package)) return 'toolchain';
  if (isMobilePackage(item.package)) return 'mobile-capacitor';
  if (first.file.startsWith('packages/ui/')) return 'packages-ui';

  if (item.ecosystem === 'clj') return 'clj-libraries';

  if (first.file.startsWith('deps/') || first.file.startsWith('libs/')) return 'deps-islands';

  if (first.file === 'package.json' || first.file === 'resources/package.json') {
    const currentMajor = majorOf(item.currents[0]);
    const latestMajor = majorOf(item.latest);
    if (currentMajor !== null && latestMajor !== null && latestMajor > currentMajor) return 'root-js-major';
    return 'root-js-incremental';
  }

  return 'infra-islands';
}

function batchTitle(batch) {
  return {
    'toolchain': 'Batch 1: Toolchain',
    'root-js-incremental': 'Batch 2: Root JS Incremental',
    'root-js-major': 'Batch 3: Root JS Major / High-Risk',
    'clj-libraries': 'Batch 4: Clojure / Babashka Libraries',
    'deps-islands': 'Batch 5: deps/* & libs/* Package Islands',
    'packages-ui': 'Batch 6: packages/ui',
    'mobile-capacitor': 'Batch 7: Mobile / Capacitor',
    'infra-islands': 'Batch 8: Infra / Build Islands',
    'manual-review': 'Manual Review',
  }[batch] || batch;
}

// ---------------------------------------------------------------------------
// Risk assessment
// ---------------------------------------------------------------------------

function riskNotes(item) {
  const notes = [];
  if (item.alreadyResolved) notes.push('already resolved in lockfile');
  if (item.deprecatedCurrent) notes.push('current deprecated');
  if (item.latestDeprecated) notes.push('latest deprecated');
  if (item.vulns && item.vulns.length > 0) notes.push(`OSV: ${item.vulns.map(v => v.id).join(', ')}`);
  if (item.staleMonths != null && item.staleMonths >= staleMonths) {
    notes.push(`stale ${Math.floor(item.staleMonths)}mo`);
  }
  if (item.absoluteLatest) notes.push(`newer pre-release: ${item.absoluteLatest}`);
  return notes;
}

// ---------------------------------------------------------------------------
// Markdown helpers
// ---------------------------------------------------------------------------

function esc(v) { return String(v ?? '').replace(/\|/g, '\\|'); }
function row(vals) { return `| ${vals.map(esc).join(' | ')} |`; }

// ---------------------------------------------------------------------------
// JSON compaction — strip null / false / default-empty fields
// ---------------------------------------------------------------------------

function compactItem(item) {
  const out = { pkg: item.package, eco: item.ecosystem, batch: item.batch, status: item.latestStatus };
  if (item.currents.length === 1) out.current = item.currents[0]; else out.currents = item.currents;
  if (item.latest) out.latest = item.latest;
  if (item.target) out.target = item.target;
  if (item.roots.length === 1) out.file = item.roots[0]; else out.files = item.roots;
  if (item.aliases && item.aliases.length > 0) out.aliases = item.aliases;
  if (item.riskNotesList && item.riskNotesList.length > 0) out.risk = item.riskNotesList;
  if (item.inconsistent) out.inconsistent = true;
  if (item.manualReview) out.manualReview = true;
  if (item.alreadyResolved) out.alreadyResolved = true;
  if (item.vulns && item.vulns.length > 0) out.vulns = item.vulns.map(v => v.id);
  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { packageFiles, depsFiles, bbFiles } = discoverManifestFiles();
  const packageEntries = parsePackageEntries(packageFiles);
  const depsEntries = parseDepsEntries(depsFiles);
  const bbEntries = parseBbEntries(bbFiles);
  const allEntries = [...packageEntries, ...depsEntries, ...bbEntries];

  // Exclude project-internal local/root deps (e.g. logseq/db, logseq/common)
  const filteredEntries = allEntries.filter(e => !isLocalDep(e));

  const grouped = new Map();
  for (const entry of filteredEntries) {
    const eco = entry.ecosystem === 'bb-pod' ? 'clj' : entry.ecosystem;
    const key = `${eco}|${entry.package}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(entry);
  }

  const npmPackages = unique(filteredEntries.filter(e => e.ecosystem === 'npm').map(e => e.package)).sort();
  const cljPackages = unique(
    filteredEntries.filter(e =>
      (e.ecosystem === 'clj' && e.versionKind === 'mvn/version') ||
      e.ecosystem === 'bb-pod'
    ).map(e => e.package)
  ).sort();

  process.stderr.write(`Fetching metadata for ${npmPackages.length} npm + ${cljPackages.length} clj packages...\n`);

  const npmMeta = new Map(await mapWithConcurrency(npmPackages, 12, async pkg => [pkg, await fetchNpmPackageMeta(pkg)]));
  const cljMeta = new Map(await mapWithConcurrency(cljPackages, 12, async pkg => [pkg, await fetchCljPackageMeta(pkg)]));

  // OSV queries
  const osvQueries = [];
  const osvLookup = [];
  for (const [key, entries] of grouped.entries()) {
    const sample = entries[0];
    const normalized = normalizeCurrent(sample);
    if (!normalized) continue;
    if (sample.ecosystem === 'npm') {
      osvLookup.push(key);
      osvQueries.push({ package: { ecosystem: 'npm', name: sample.package }, version: normalized });
    } else if (sample.versionKind === 'mvn/version' || sample.ecosystem === 'bb-pod') {
      const [group, artifact] = sample.package.includes('/') ? sample.package.split('/') : [sample.package, sample.package];
      if (!group || !artifact) continue;
      osvLookup.push(key);
      osvQueries.push({ package: { ecosystem: 'Maven', name: `${group}:${artifact}` }, version: normalized });
    }
  }
  const osvResults = await fetchOsvBatch(osvQueries);
  const osvMap = new Map();
  osvLookup.forEach((key, idx) => { osvMap.set(key, osvResults[idx]?.vulns || []); });

  // Build items
  const items = [];
  for (const [key, entries] of [...grouped.entries()].sort()) {
    const ecosystem = key.split('|')[0];
    const pkg = key.slice(key.indexOf('|') + 1);
    const meta = ecosystem === 'npm' ? (npmMeta.get(pkg) || {}) : (cljMeta.get(pkg) || {});
    const currents = unique(entries.map(e => e.current)).sort();
    const currentsNormalized = unique(entries.map(e => normalizeCurrent(e)).filter(Boolean)).sort(compareVersions);
    const currentBase = currentsNormalized[0] || null;
    const currentMeta = ecosystem === 'npm' ? npmCurrentVersionMeta(meta.raw, currentBase) : null;
    const aliases = unique(entries.filter(e => e.alias).map(e => `${e.file}:${e.alias}`));
    const latest = meta.latest || null;

    // Detect if lockfile already resolves to >= stable latest (zero install risk)
    let alreadyResolved = false;
    if (ecosystem === 'npm' && latest) {
      const npmEntries = entries.filter(e => e.ecosystem === 'npm');
      const rangeEntries = npmEntries.filter(e => versionPrefix(e.current));
      if (rangeEntries.length > 0 && rangeEntries.length === npmEntries.length) {
        alreadyResolved = rangeEntries.every(e => {
          const resolved = getResolvedVersion(e.file, pkg, e.current);
          return resolved && compareVersions(resolved, latest) >= 0;
        });
      }
    }
    // An item that is "already resolved" AND whose declared base is already at
    // latest does not need any update — treat as truly up-to-date
    if (alreadyResolved) {
      const declaredBase = coerceVersion(entries[0]?.current);
      if (declaredBase && compareVersions(declaredBase, latest) >= 0) {
        // declared range base >= latest → nothing to do, will become latestStatus='latest'
        alreadyResolved = false;
      }
    }

    const item = {
      ecosystem, package: pkg, entries,
      roots: unique(entries.map(e => e.file)).sort(),
      aliases: aliases.length > 0 ? aliases : undefined,
      currents, currentsNormalized, latest,
      latestPublishedAt: meta.latestPublishedAt || null,
      staleMonths: monthsBetween(meta.latestPublishedAt),
      deprecatedCurrent: currentMeta?.deprecated || null,
      latestDeprecated: meta.latestDeprecated || null,
      vulns: osvMap.get(key) || [],
      inconsistent: unique(currentsNormalized.length > 0 ? currentsNormalized : currents).length > 1,
      manualReview: needsManualReview(entries),
      alreadyResolved,
    };

    if (latest && currents.length > 0) item.target = formatTarget(currents[0], latest);
    item.absoluteLatest = meta.absoluteLatest || null;
    // latestStatus is always based on declared version vs upstream stable latest
    // (alreadyResolved only marks zero install-risk, does not count as "up to date")
    item.latestStatus = latestStatus(item.latest, item.currentsNormalized, item.currents);
    item.riskNotesList = riskNotes(item);
    item.batch = classifyBatch(item);
    items.push(item);
  }

  // Categorize
  const outdated = items.filter(i => i.latestStatus === 'outdated').sort((a, b) => a.package.localeCompare(b.package));
  const latestRisky = items.filter(i => i.latestStatus === 'latest' && i.riskNotesList.length > 0).sort((a, b) => a.package.localeCompare(b.package));
  const manual = items.filter(i => i.manualReview || i.latestStatus === 'manual' || i.latestStatus === 'unknown').sort((a, b) => a.package.localeCompare(b.package));
  const inconsistent = items.filter(i => i.inconsistent).sort((a, b) => a.package.localeCompare(b.package));
  const alreadyResolvedItems = items.filter(i => i.alreadyResolved).sort((a, b) => a.package.localeCompare(b.package));

  const batchGroups = new Map();
  for (const item of outdated) {
    if (!batchGroups.has(item.batch)) batchGroups.set(item.batch, []);
    batchGroups.get(item.batch).push(item);
  }

  // -------------------------------------------------------------------------
  // JSON output (compact, no null/false/empty defaults)
  // -------------------------------------------------------------------------
  const payload = {
    generatedAt: new Date().toISOString(),
    scope: {
      manifests: [...packageFiles, ...depsFiles, ...bbFiles],
      npmEntries: packageEntries.length,
      cljEntries: depsEntries.length + bbEntries.length,
      uniqueLibs: items.length,
    },
    summary: {
      outdated: outdated.length,
      latestRisky: latestRisky.length,
      inconsistent: inconsistent.length,
      manualReview: manual.length,
      alreadyResolved: alreadyResolvedItems.length,
    },
    batches: BATCH_ORDER.filter(b => batchGroups.has(b)).map(b => ({
      id: b,
      title: batchTitle(b),
      count: batchGroups.get(b).length,
      items: batchGroups.get(b).map(compactItem),
    })),
  };
  if (manual.length > 0) payload.manualReview = manual.map(compactItem);
  if (alreadyResolvedItems.length > 0) {
    payload.alreadyResolved = alreadyResolvedItems.map(i => {
      const o = { pkg: i.package, current: i.currents[0], latest: i.latest };
      if (i.roots.length === 1) o.file = i.roots[0]; else o.files = i.roots;
      return o;
    });
  }
  if (latestRisky.length > 0) payload.latestRisky = latestRisky.map(compactItem);
  if (inconsistent.length > 0) payload.inconsistent = inconsistent.map(compactItem);

  mkdirSync(dirname(outJson), { recursive: true });
  writeFileSync(outJson, JSON.stringify(payload, null, 2));

  // -------------------------------------------------------------------------
  // Markdown output — batch-centric, agent-friendly
  // -------------------------------------------------------------------------
  const title = 'Logseq Dependency Upgrade Plan';
  const L = [];

  L.push(`# ${title}`);
  L.push('');
  L.push(`Generated: ${new Date().toISOString().slice(0, 10)}`);
  L.push('');

  // Summary
  L.push('## Summary');
  L.push('');
  L.push(row(['Metric', 'Count']));
  L.push(row(['---', '---']));
  L.push(row(['Manifests scanned', String(packageFiles.length + depsFiles.length + bbFiles.length)]));
  L.push(row(['Unique libraries', String(items.length)]));
  L.push(row(['Outdated', String(outdated.length)]));
  L.push(row(['Already resolved via lockfile', String(alreadyResolvedItems.length)]));
  L.push(row(['Latest but risky', String(latestRisky.length)]));
  L.push(row(['Cross-root inconsistent', String(inconsistent.length)]));
  L.push(row(['Manual review needed', String(manual.length)]));
  L.push('');

  // Already resolved via lockfile — informational only
  // These items also appear in the Upgrade Batches below (with "already resolved" risk note);
  // their lockfile is already at latest so only the package.json declaration needs updating.
  if (alreadyResolvedItems.length > 0) {
    L.push('## Already Resolved via Lockfile');
    L.push('');
    L.push('These declare a version range whose lockfile has **already resolved to the latest** version. They appear again in the Upgrade Batches with the `already resolved in lockfile` risk note — only the declared version in the manifest needs updating (`yarn install` is NOT required, making this zero-risk).');
    L.push('');
    L.push(row(['Package', 'Declared Range', 'Lockfile Resolved (= Latest)', 'File(s)']));
    L.push(row(['---', '---', '---', '---']));
    for (const item of alreadyResolvedItems) {
      L.push(row([
        `\`${item.package}\``,
        `\`${item.currents[0]}\``,
        `\`${item.latest}\``,
        item.roots.map(f => `\`${f}\``).join(', '),
      ]));
    }
    L.push('');
  }

  // Upgrade Batches — main content
  L.push('## Upgrade Batches');
  L.push('');
  L.push('Each batch is self-contained. Process in order. After completing a batch, overwrite its **Status** line and table, then update Summary counts.');
  L.push('');

  for (const batchId of BATCH_ORDER) {
    const batchItems = batchGroups.get(batchId) || [];
    L.push(`### ${batchTitle(batchId)}`);
    L.push('');
    L.push(`**Status:** pending | **Count:** ${batchItems.length}`);
    L.push('');
    if (batchItems.length === 0) {
      L.push('No outdated libraries in this batch.');
      L.push('');
      continue;
    }
    L.push(row(['Package', 'Current', 'Target', 'File(s)', 'Risk']));
    L.push(row(['---', '---', '---', '---', '---']));
    for (const item of batchItems) {
      const target = item.target || item.latest || '';
      const filesStr = item.roots.map(f => `\`${f}\``).join(', ');
      const aliasNote = item.aliases ? ` (aliases: ${item.aliases.join(', ')})` : '';
      L.push(row([
        `\`${item.package}\``,
        `\`${item.currents.join(', ')}\``,
        `\`${target}\``,
        `${filesStr}${aliasNote}`,
        item.riskNotesList.join('; '),
      ]));
    }
    L.push('');
  }

  // Manual review
  if (manual.length > 0) {
    L.push('### Manual Review');
    L.push('');
    L.push('Non-standard sources (git SHA, git tag, github:, etc.) — cannot be auto-upgraded.');
    L.push('');
    L.push(row(['Package', 'Current', 'Latest', 'File(s)', 'Reason']));
    L.push(row(['---', '---', '---', '---', '---']));
    for (const item of manual) {
      let reason;
      if (item.manualReview) reason = 'Non-standard source';
      else if (item.latestStatus === 'manual') reason = 'Current newer than upstream latest';
      else reason = 'Cannot determine latest';
      const aliasNote = item.aliases ? ` (aliases: ${item.aliases.join(', ')})` : '';
      L.push(row([
        `\`${item.package}\``,
        `\`${item.currents.join(', ')}\``,
        `\`${item.latest || 'N/A'}\``,
        `${item.roots.map(f => `\`${f}\``).join(', ')}${aliasNote}`,
        reason,
      ]));
    }
    L.push('');
  }

  // Cross-root inconsistencies
  if (inconsistent.length > 0) {
    L.push('## Cross-Root Inconsistencies');
    L.push('');
    L.push(row(['Package', 'Versions Found', 'Latest', 'File(s)']));
    L.push(row(['---', '---', '---', '---']));
    for (const item of inconsistent) {
      L.push(row([
        `\`${item.package}\``,
        `\`${item.currents.join(', ')}\``,
        `\`${item.latest || 'N/A'}\``,
        item.roots.map(f => `\`${f}\``).join(', '),
      ]));
    }
    L.push('');
  }

  // Latest but risky
  if (latestRisky.length > 0) {
    L.push('## Latest but Risky');
    L.push('');
    L.push(row(['Package', 'Current', 'File(s)', 'Risk']));
    L.push(row(['---', '---', '---', '---']));
    for (const item of latestRisky) {
      L.push(row([
        `\`${item.package}\``,
        `\`${item.currents[0]}\``,
        item.roots.map(f => `\`${f}\``).join(', '),
        item.riskNotesList.join('; '),
      ]));
    }
    L.push('');
  }

  mkdirSync(dirname(outMd), { recursive: true });
  writeFileSync(outMd, `${L.join('\n')}`);
  process.stderr.write(`Written: ${outJson}\n`);
  process.stderr.write(`Written: ${outMd}\n`);
}

await main();
