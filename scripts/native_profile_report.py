"""Summarize controlled native runs without treating partial workloads as passes."""

import argparse
import json
import math
from pathlib import Path


def finite_nonnegative(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
        raise ValueError("Expected a finite nonnegative measurement")
    return value


def increasing_times(rows, key):
    times = [finite_nonnegative(row[key]) for row in rows]
    if len(times) < 2 or any(b <= a for a, b in zip(times, times[1:])):
        raise ValueError("A recording needs at least two strictly increasing timestamps")


def delta(rows, read):
    values = [finite_nonnegative(read(row)) for row in rows]
    if any(b < a for a, b in zip(values, values[1:])):
        raise ValueError("A cumulative measurement moved backwards")
    return values[-1] - values[0]


def p95(values):
    return sorted(values)[min(len(values) - 1, int(len(values) * .95))] if values else None


def summarize(data):
    provenance = data["provenance"]
    for name in ("scenario", "executable_sha256", "graph_sha256", "input_sha256",
                 "build_profile", "backend", "viewport", "raster_workers", "profiler"):
        if name not in provenance:
            raise ValueError(f"Missing experiment provenance: {name}")
    if type(provenance["profiler"]) is not bool:
        raise ValueError("Profiler mode must be explicit")
    rows = data["metrics"]
    increasing_times(rows, "time_s")
    start, end = (finite_nonnegative(data["window"][key]) for key in ("start_s", "end_s"))
    rows = [row for row in rows if start <= row["time_s"] <= end]
    if len(rows) < 2 or rows[0]["time_s"] != start or rows[-1]["time_s"] != end:
        raise ValueError("Window boundaries must be recorded metrics timestamps")
    for row in rows:
        memory = row["process_memory"]
        actual = [memory[key] for key in ("width", "height", "pixel_width", "pixel_height")]
        if actual != provenance["viewport"] or type(memory["window_visible"]) is not bool:
            raise ValueError("Viewport or visibility does not match the experiment provenance")
    duration = end - start
    actions = data["actions"]
    handled = delta(rows, lambda row: row[actions["counter"]])
    for name in ("expected", "injected", "persisted"):
        value = actions[name]
        if value is not None and (type(value) is not int or value < 0):
            raise ValueError("Action counts must be nonnegative integers or unknown")
    if type(actions["ui_settled"]) is not bool:
        raise ValueError("UI settlement evidence must be explicit")
    complete = (data["exit_code"] == 0 and actions["ui_settled"]
                and handled == actions["injected"] == actions["persisted"] == actions["expected"])
    visible = all(row["process_memory"]["window_visible"] for row in rows)
    denominator = handled if complete and handled else None
    allocated = delta(rows, lambda row: row["gc"]["host_allocated_bytes"])
    phases, lost = {}, []
    for name in rows[0]["phases"]:
        count = delta(rows, lambda row: row["phases"][name]["total"])
        work = delta(rows, lambda row: row["phases"][name]["total_ms"])
        values, previous, missing = [], rows[0]["phases"][name]["total"], False
        for row in rows[1:]:
            phase = row["phases"][name]
            fresh = phase["total"] - previous
            if type(fresh) is not int:
                raise ValueError("Phase counts must be integers")
            samples = [finite_nonnegative(value) for value in phase["samples_ms"]]
            if fresh > len(samples):
                missing = True
            elif fresh:
                values.extend(samples[-fresh:])
            previous = phase["total"]
        if missing:
            lost.append(name)
        phases[name] = {"count": count, "total_ms": work,
                        "ms_per_completed_action": work / denominator if denominator else None,
                        "p95_ms": None if missing or len(values) < 20 else p95(values),
                        "max_ms": None if missing or not values else max(values)}
    memory = data["memory"]
    increasing_times(memory, "seconds")
    identities = set(memory[0]["processes"])
    if identities != {"gui", "worker"} or any(set(row["processes"]) != identities for row in memory):
        raise ValueError("Memory samples must include the same GUI and worker processes")
    totals = {name: [sum(finite_nonnegative(process[name]) for process in row["processes"].values())
                     for row in memory] for name in ("rss_bytes", "footprint_bytes")}
    memory_summary = {"samples": len(memory), "duration_s": memory[-1]["seconds"] - memory[0]["seconds"]}
    for name, values in totals.items():
        peak_index = max(range(len(values)), key=values.__getitem__)
        memory_summary["peak_" + name] = values[peak_index]
        memory_summary["peak_" + name + "_processes"] = memory[peak_index]["processes"]
        memory_summary["final_" + name] = values[-1]
    memory_summary["physical_peak_limit_bytes"] = 100_000_000
    memory_summary["physical_peak_within_limit"] = memory_summary["peak_footprint_bytes"] <= 100_000_000
    return {"kind": "diagnostic", "provenance": provenance, "duration_s": duration,
            "workload_complete": complete, "handled_actions": handled, "actions": actions,
            "timing_baseline_eligible": complete and visible and not provenance["profiler"] and not lost,
            "window_visible_throughout": visible,
            "host_allocated_bytes": allocated, "host_bytes_per_s": allocated / duration,
            "host_bytes_per_completed_action": allocated / denominator if denominator else None,
            "minor_collections": delta(rows, lambda row: row["gc"]["minor_collections"]),
            "major_collections": delta(rows, lambda row: row["gc"]["major_collections"]),
            "heap_delta_bytes": rows[-1]["gc"]["heap_bytes"] - rows[0]["gc"]["heap_bytes"],
            "last_gc_live_delta_bytes": rows[-1]["gc"]["live_bytes"] - rows[0]["gc"]["live_bytes"],
            "lost_timing_samples": lost, "phases": phases, "memory": memory_summary,
            "notes": ["Memory covers the complete external recording, including startup; metrics use the explicit native-clock window.",
                      "Phase durations can overlap; do not add parent and nested phases or interpret their sum as CPU time.",
                      "Live bytes are the last GC observation, not exact current survivors. RSS and footprint are different accounting views.",
                      "This diagnostic report does not replace functional, visible-presentation, or sustained-idle acceptance."]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("recording", type=Path, help="Experiment JSON with provenance, metrics, memory, actions, and outcome")
    args = parser.parse_args()
    print(json.dumps(summarize(json.loads(args.recording.read_text())), indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
