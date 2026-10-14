"""Validate measured native interaction scenarios; exit nonzero on failure."""

import argparse
import json
import math
from pathlib import Path


def percentile(values, fraction):
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, int(len(ordered) * fraction))]


def validate_idle(rows):
    first, last = rows[0], rows[-1]
    duration = last["time_s"] - first["time_s"]
    if duration < 10:
        return ["Idle recording requires at least 10 seconds"]
    allocated = last["gc"]["allocated_bytes"] - first["gc"]["allocated_bytes"]
    host_allocated = last["gc"]["host_allocated_bytes"] - first["gc"]["host_allocated_bytes"]
    minor = last["gc"]["minor_collections"] - first["gc"]["minor_collections"]
    renders = last["gpu_submitted"] - first["gpu_submitted"]
    layouts = last["layout_count"] - first["layout_count"]
    events = last["event_count"] - first["event_count"]
    if min(allocated, host_allocated, minor, renders, layouts, events) < 0:
        raise ValueError("Idle metrics counters moved backwards")
    errors = []
    if allocated / duration > 256 * 1024:
        errors.append(f"Idle allocation {allocated / duration:.0f} bytes/s exceeds 256 KiB/s")
    if host_allocated / duration > 256 * 1024:
        errors.append(f"Idle host allocation {host_allocated / duration:.0f} bytes/s exceeds 256 KiB/s")
    if minor / duration > 0.1:
        errors.append(f"Idle minor GC {minor / duration:.2f}/s exceeds 0.1/s")
    if renders / duration > 1.1:
        errors.append(f"Idle rendering {renders / duration:.2f}/s exceeds metrics refresh cadence")
    if layouts:
        errors.append(f"Idle layout ran {layouts} times")
    if events:
        errors.append(f"Idle recording contains {events} user events")
    return errors


def validate(samples, *, scenario, refresh_hz, duration_s):
    if refresh_hz <= 0 or scenario not in ("buttons", "scroll", "typing", "enter", "reflow"):
        raise ValueError("Invalid native acceptance scenario or refresh rate")
    editing = scenario in ("typing", "enter", "reflow")
    cpu_budget = 1000 / (60 if editing else 120)
    display_budget = 1000 / 60 if editing else 1000 / min(120, refresh_hz)
    requirements = {"active_frame": (20, cpu_budget), "gpu_execute": (120, 1000 / 120),
                    "input_latency": (20, 32), "presentation_interval": (120, display_budget)}
    if editing:
        requirements["layout"] = (20, 1000 / 60)
    errors = []
    if duration_s < 10:
        errors.append(f"Recording duration {duration_s:.2f}s is below 10s")
    for phase, (minimum, budget) in requirements.items():
        values = samples.get(phase, [])
        if len(values) < minimum:
            errors.append(f"{phase}: {len(values)} samples, requires {minimum}")
            continue
        if any(not math.isfinite(value) or value < 0 for value in values):
            raise ValueError(f"Invalid timings in {phase}")
        p95 = percentile(values, 0.95)
        if p95 > budget:
            errors.append(f"{phase}: p95 {p95:.3f}ms exceeds {budget:.3f}ms")
    intervals = samples.get("presentation_interval", [])
    if len(intervals) >= 120:
        fps = 1000 * len(intervals) / sum(intervals)
        minimum_fps = 60 if editing else min(120, refresh_hz) * 0.95
        if fps < minimum_fps:
            errors.append(f"Actual FPS {fps:.2f} is below {minimum_fps:.2f}")
    return errors


def collect(rows, *, warmup_s, end_s):
    samples, seen = {}, {}
    started = rows[0]["time_s"]
    included_times = []
    for row in rows:
        elapsed = row["time_s"] - started
        include = elapsed >= warmup_s and (end_s is None or elapsed <= end_s)
        if include:
            included_times.append(row["time_s"])
        for name, phase in row["phases"].items():
            total = phase["total"]
            previous = seen.get(name, 0)
            if total < previous:
                raise ValueError("Metrics recording contains a counter reset")
            values = phase["samples_ms"]
            fresh = total - previous
            if include and fresh > len(values):
                raise ValueError(f"Metrics export lost {fresh - len(values)} samples in {name}")
            if include and fresh:
                samples.setdefault(name, []).extend(values[-fresh:])
            seen[name] = total
    duration = included_times[-1] - included_times[0] if len(included_times) >= 2 else 0
    return samples, duration


def validate_functionality(evidence, *, scenario):
    if evidence is None:
        return ["Functional evidence is missing"]
    errors = []
    if scenario in ("typing", "enter"):
        expected = evidence["expected_text"]
        if expected != evidence["actual_text"]:
            errors.append("Persisted text differs from the expected text")
        if scenario == "typing" and len(expected) < 200:
            errors.append("Typing scenario requires at least 200 characters")
        duration = evidence["input_duration_s"]
        if not math.isfinite(duration) or duration <= 0:
            raise ValueError("Input duration must be positive and finite")
        if scenario == "typing":
            if len(expected) / duration < 20:
                errors.append("Typing scenario requires at least 20 characters/s")
            if not evidence["caret_correct"]:
                errors.append("Caret does not match the committed text")
            ime_expected = evidence["ime_expected_text"]
            if not ime_expected or ime_expected.isascii():
                errors.append("Typing scenario requires non-ASCII IME evidence")
            if ime_expected != evidence["ime_actual_text"]:
                errors.append("IME composition differs from the expected text")
        if scenario == "enter":
            presses = evidence["enter_presses"]
            created = evidence["after_blocks"] - evidence["before_blocks"]
            if presses < 50:
                errors.append("Enter scenario requires at least 50 presses")
            if created != presses:
                errors.append(f"Created {created} blocks for {presses} Enter presses")
            if presses / duration < 10:
                errors.append("Enter scenario requires at least 10 presses/s")
            if not evidence["final_block_focused"]:
                errors.append("Editor focus did not follow the final block")
    elif scenario == "scroll":
        before, after, reversed_offset = (evidence[key] for key in
            ("before_offset", "after_offset", "reversed_offset"))
        if not (after > before and reversed_offset < after):
            errors.append("Scroll did not move and reverse")
        if (evidence["scrollbar_initial"] or not evidence["scrollbar_after_scroll"]
                or evidence["scrollbar_after_idle"]):
            errors.append("Scrollbar visibility does not match the interaction")
    elif scenario == "buttons":
        actions = evidence["actions"]
        if len(actions) < 20:
            errors.append("Button scenario requires at least 20 clicks")
        for action in actions:
            if action["actual"] != action["expected"]:
                errors.append(f"{action['name']}: unexpected click result")
    elif scenario == "reflow":
        if not evidence["caret_on_visual_line"] or not evidence["content_preserved"]:
            errors.append("Reflow lost caret geometry or content")
    else:
        raise ValueError("Invalid native acceptance scenario")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("recording", type=Path)
    parser.add_argument("--scenario", required=True, choices=("buttons", "scroll", "typing", "enter", "reflow", "idle"))
    parser.add_argument("--refresh-hz", required=True, type=float)
    parser.add_argument("--warmup-s", type=float, default=5)
    parser.add_argument("--end-s", type=float)
    parser.add_argument("--evidence", type=Path,
                        help="Observed UI results and persisted data for this scenario")
    args = parser.parse_args()
    rows = [json.loads(line) for line in args.recording.read_text().splitlines() if line]
    if args.scenario == "idle":
        started = rows[0]["time_s"]
        rows = [row for row in rows if row["time_s"] - started >= args.warmup_s
                and (args.end_s is None or row["time_s"] - started <= args.end_s)]
        errors = validate_idle(rows)
        print(json.dumps({"scenario": "idle", "pass": not errors, "errors": errors}, indent=2))
        return 1 if errors else 0
    samples, duration = collect(rows, warmup_s=args.warmup_s, end_s=args.end_s)
    errors = validate(samples, scenario=args.scenario, refresh_hz=args.refresh_hz, duration_s=duration)
    evidence = json.loads(args.evidence.read_text()) if args.evidence else None
    functional_errors = validate_functionality(evidence, scenario=args.scenario)
    print(json.dumps({"scenario": args.scenario, "duration_s": duration, "timing_pass": not errors,
                      "functional_pass": not functional_errors,
                      "pass": not errors and not functional_errors,
                      "functional_errors": functional_errors,
                      "errors": errors, "phases": {name: {"count": len(values),
                          "p95_ms": percentile(values, 0.95), "max_ms": max(values)}
                          for name, values in samples.items() if values}}, indent=2))
    return 1 if errors or functional_errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
