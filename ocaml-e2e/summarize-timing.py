#!/usr/bin/env python3
"""Aggregate a timing/<ts>/ run dir: per-file wall time, test counts, total."""
import re, sys, glob, os

d = sys.argv[1]
rows = []
tot_wall = 0.0
tot_pass = tot_fail = 0
for log in sorted(glob.glob(os.path.join(d, "test_*.log"))):
    name = os.path.basename(log)[:-4]
    txt = open(log).read()
    tests = re.findall(r"[✔✖] (.+?) \((\d+(?:\.\d+)?)ms\)", txt)
    pass_n = len([t for t in tests if txt.split(t[0])[0]])
    p = re.search(r"ℹ pass (\d+)", txt)
    f = re.search(r"ℹ fail (\d+)", txt)
    dur = re.search(r"ℹ duration_ms ([\d.]+)", txt)
    # wall time from tsv if present
    p_n = int(p.group(1)) if p else 0
    f_n = int(f.group(1)) if f else 0
    d_ms = float(dur.group(1)) if dur else 0.0
    rows.append((name, d_ms / 1000, p_n, f_n, tests))
    tot_pass += p_n
    tot_fail += f_n

# merge wall times from files.tsv
tsv = os.path.join(d, "files.tsv")
wall = {}
if os.path.exists(tsv):
    for line in open(tsv):
        parts = line.rstrip("\n").split("\t")
        if len(parts) >= 3 and parts[0] not in ("file",):
            try:
                wall[parts[0]] = float(parts[1])
            except ValueError:
                pass

print(f"{'file':<42} {'wall_s':>8} {'pass':>5} {'fail':>5} {'ntests':>6}")
for name, d_s, p_n, f_n, tests in rows:
    w = wall.get(name, 0.0)
    tot_wall += w
    print(f"{name:<42} {w:>8.2f} {p_n:>5} {f_n:>5} {len(tests):>6}")
print(f"{'TOTAL':<42} {tot_wall:>8.2f} {tot_pass:>5} {tot_fail:>5} {sum(len(r[4]) for r in rows):>6}")

print("\nslowest tests:")
alltests = [(t[0], float(t[1]) / 1000, n) for n, _, _, _, ts in rows for t in ts]
for tname, tsec, fname in sorted(alltests, key=lambda x: -x[1])[:15]:
    print(f"  {tsec:>7.2f}s  {tname}  ({fname})")
