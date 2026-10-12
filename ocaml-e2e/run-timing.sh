#!/bin/bash
# Serial per-file timing of the melange e2e suite.
# Writes per-file wall time + per-test durations to timing/<ts>/.
set -u
cd "$(dirname "$0")"
OUT_DIR="timing/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT_DIR"
TSV="$OUT_DIR/files.tsv"
printf "file\twall_s\texit\ttests_pass\ttests_fail\tduration_ms_reported\n" > "$TSV"

TEST_DIR=_build/default/test/test_node/test
for f in "$TEST_DIR"/test_*.js; do
  name=$(basename "$f" .js)
  log="$OUT_DIR/$name.log"
  start=$(date +%s.%N)
  node --test "$f" > "$log" 2>&1
  rc=$?
  end=$(date +%s.%N)
  wall=$(echo "$end - $start" | bc)
  pass=$(grep -c "^ℹ pass" /dev/null 2>/dev/null; grep -oP '^ℹ pass \K\d+' "$log" | head -1)
  fail=$(grep -oP '^ℹ fail \K\d+' "$log" | head -1)
  dur=$(grep -oP '^ℹ duration_ms \K[\d.]+' "$log" | head -1)
  printf "%s\t%.2f\t%d\t%s\t%s\t%s\n" "$name" "$wall" "$rc" "${pass:-?}" "${fail:-?}" "${dur:-?}" | tee -a "$TSV"
done
