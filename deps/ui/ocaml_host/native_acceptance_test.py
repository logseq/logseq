import unittest
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from native_acceptance import collect, validate, validate_functionality, validate_idle


class NativeAcceptanceTest(unittest.TestCase):
    def memory_rows(self):
        memory = {"footprint_bytes": 40_000_000, "peak_footprint_bytes": 50_000_000,
                  "rss_bytes": 120_000_000, "window_visible": True,
                  "width": 1440, "height": 900, "pixel_width": 2880, "pixel_height": 1800}
        return [{"time_s": time, "process_memory": dict(memory), "gpu_submitted": 1,
                 "layout_count": 1, "event_count": 0,
                 "gc": {"allocated_bytes": 1000, "host_allocated_bytes": 1000,
                        "minor_collections": 1}}
                for time in range(606)]

    def run_memory_recording(self, rows, warmup=0):
        with tempfile.TemporaryDirectory() as directory:
            recording = Path(directory) / "recording.jsonl"
            recording.write_text("".join(json.dumps(row) + "\n" for row in rows))
            return subprocess.run([sys.executable, str(Path(__file__).with_name("native_acceptance.py")),
                                   str(recording), "--scenario", "idle", "--refresh-hz", "100",
                                   "--warmup-s", str(warmup)], capture_output=True, text=True)

    def test_memory_cli_accepts_physical_budget_with_separate_rss(self):
        result = self.run_memory_recording(self.memory_rows())
        self.assertEqual(0, result.returncode, result.stderr)

    def test_memory_cli_rejects_transient_startup_peak(self):
        rows = self.memory_rows()
        rows[0]["process_memory"].update(footprint_bytes=110_000_000)
        for row in rows:
            row["process_memory"]["peak_footprint_bytes"] = 110_000_000
        result = self.run_memory_recording(rows, warmup=5)
        self.assertEqual(1, result.returncode, result.stdout)
        self.assertIn("100 MB", result.stdout)

    def test_memory_cli_rejects_lifetime_peak_between_samples(self):
        rows = self.memory_rows()
        rows[-1]["process_memory"]["peak_footprint_bytes"] = 100_000_001
        result = self.run_memory_recording(rows)
        self.assertEqual(1, result.returncode, result.stdout)
        self.assertIn("100 MB", result.stdout)

    def test_memory_cli_rejects_rss_above_protection_limit(self):
        rows = self.memory_rows()
        rows[-1]["process_memory"]["rss_bytes"] = 200_000_001
        result = self.run_memory_recording(rows)
        self.assertEqual(1, result.returncode, result.stdout)
        self.assertIn("200 MB", result.stdout)

    def test_memory_cli_rejects_invisible_window(self):
        rows = self.memory_rows()
        rows[-1]["process_memory"]["window_visible"] = False
        result = self.run_memory_recording(rows)
        self.assertEqual(1, result.returncode, result.stdout)
        self.assertIn("invisible", result.stdout)

    def test_memory_cli_allows_invisible_startup_before_warmup(self):
        rows = self.memory_rows()
        rows[0]["process_memory"]["window_visible"] = False
        result = self.run_memory_recording(rows, warmup=5)
        self.assertEqual(0, result.returncode, result.stderr)

    def test_memory_cli_rejects_reduced_startup_viewport(self):
        rows = self.memory_rows()
        rows[0]["process_memory"].update(width=640, height=480,
                                         pixel_width=1280, pixel_height=960)
        result = self.run_memory_recording(rows)
        self.assertEqual(1, result.returncode, result.stdout)
        self.assertIn("viewport", result.stdout)

    def test_memory_cli_rejects_reduced_pixel_resolution(self):
        rows = self.memory_rows()
        rows[0]["process_memory"].update(pixel_width=1440, pixel_height=900)
        result = self.run_memory_recording(rows)
        self.assertEqual(1, result.returncode, result.stdout)
        self.assertIn("viewport", result.stdout)

    def test_memory_cli_rejects_visibility_sampling_gaps(self):
        rows = self.memory_rows()
        result = self.run_memory_recording([rows[0], rows[-1]])
        self.assertEqual(1, result.returncode, result.stdout)
        self.assertIn("gap", result.stdout)

    def test_memory_cli_rejects_missing_process_evidence(self):
        rows = self.memory_rows()
        del rows[1]["process_memory"]
        result = self.run_memory_recording(rows)
        self.assertEqual(1, result.returncode, result.stdout)
        self.assertIn("memory evidence", result.stdout)

    def test_memory_cli_rejects_invalid_measurements(self):
        rows = self.memory_rows()
        rows[1]["process_memory"]["footprint_bytes"] = -1
        result = self.run_memory_recording(rows)
        self.assertNotEqual(0, result.returncode, result.stdout)
        self.assertIn("Invalid process memory", result.stderr)

    def test_idle_requires_ten_minutes(self):
        first = {"time_s": 0, "gpu_submitted": 10, "layout_count": 5, "event_count": 0,
                 "gc": {"allocated_bytes": 100000, "host_allocated_bytes": 100000, "minor_collections": 2}}
        last = {**first, "time_s": 24}
        self.assertTrue(any("600 seconds" in error for error in validate_idle([first, last])))

    def test_idle_rejects_rendering_and_gc_churn(self):
        rows = [{"time_s": 0, "gpu_submitted": 10, "layout_count": 5, "event_count": 0,
                 "gc": {"allocated_bytes": 100000, "host_allocated_bytes": 100000, "minor_collections": 2}},
                {"time_s": 600, "gpu_submitted": 1210, "layout_count": 5, "event_count": 0,
                 "gc": {"allocated_bytes": 600100000, "host_allocated_bytes": 600100000, "minor_collections": 1002}}]
        errors = validate_idle(rows)
        self.assertTrue(any("allocation" in error for error in errors))
        self.assertTrue(any("minor GC" in error for error in errors))
        self.assertTrue(any("render" in error for error in errors))
        rows[-1].update(gpu_submitted=20, gc={"allocated_bytes": 1100000, "host_allocated_bytes": 1100000,
                                            "minor_collections": 3})
        self.assertEqual([], validate_idle(rows))
        rows[-1]["layout_count"] = 6
        self.assertTrue(any("layout" in error for error in validate_idle(rows)))

    def test_idle_rejects_uncollected_host_allocation(self):
        rows = [{"time_s": 0, "gpu_submitted": 10, "layout_count": 5, "event_count": 0,
                 "gc": {"allocated_bytes": 100000, "host_allocated_bytes": 100000, "minor_collections": 2}},
                {"time_s": 600, "gpu_submitted": 20, "layout_count": 5, "event_count": 0,
                 "gc": {"allocated_bytes": 100000, "host_allocated_bytes": 600100000, "minor_collections": 2}}]
        self.assertTrue(any("host allocation" in error for error in validate_idle(rows)))

    def test_idle_rejects_user_input(self):
        rows = [{"time_s": 0, "gpu_submitted": 10, "layout_count": 5, "event_count": 1,
                 "gc": {"allocated_bytes": 100000, "host_allocated_bytes": 100000, "minor_collections": 2}},
                {"time_s": 600, "gpu_submitted": 20, "layout_count": 5, "event_count": 2,
                 "gc": {"allocated_bytes": 100000, "host_allocated_bytes": 100000, "minor_collections": 2}}]
        self.assertTrue(any("event" in error for error in validate_idle(rows)))

    def typing_evidence(self):
        return {"expected_text": "abcdefghijklmnopqrst" * 10,
                "actual_text": "abcdefghijklmnopqrst" * 10,
                "input_duration_s": 10, "caret_correct": True,
                "ime_expected_text": "快速输入中文", "ime_actual_text": "快速输入中文"}

    def enter_evidence(self):
        return {"before_blocks": 1, "after_blocks": 51, "enter_presses": 50,
                "expected_text": "abc", "actual_text": "abc",
                "input_duration_s": 5, "final_block_focused": True}

    def test_typing_requires_fast_input_caret_and_ime(self):
        evidence = self.typing_evidence()
        self.assertEqual([], validate_functionality(evidence, scenario="typing"))
        for key, value in [("input_duration_s", 20), ("caret_correct", False),
                           ("ime_actual_text", "快速输入")]:
            invalid = dict(evidence, **{key: value})
            self.assertTrue(validate_functionality(invalid, scenario="typing"), key)

    def test_enter_requires_fast_input_and_final_focus(self):
        evidence = self.enter_evidence()
        self.assertEqual([], validate_functionality(evidence, scenario="enter"))
        for key, value in [("input_duration_s", 10), ("final_block_focused", False)]:
            invalid = dict(evidence, **{key: value})
            self.assertTrue(validate_functionality(invalid, scenario="enter"), key)

    def test_rejects_missing_functional_evidence(self):
        self.assertTrue(validate_functionality(None, scenario="enter"))

    def test_catches_lost_enter_from_persisted_counts(self):
        evidence = self.enter_evidence()
        evidence["after_blocks"] = 49
        errors = validate_functionality(evidence, scenario="enter")
        self.assertTrue(any("48" in error and "50" in error for error in errors))
        evidence["after_blocks"] = 51
        self.assertEqual([], validate_functionality(evidence, scenario="enter"))

    def test_catches_dropped_or_reordered_text(self):
        evidence = self.typing_evidence()
        self.assertEqual([], validate_functionality(evidence, scenario="typing"))
        evidence["actual_text"] = evidence["actual_text"][1:]
        self.assertTrue(validate_functionality(evidence, scenario="typing"))

    def test_scroll_requires_movement_reversal_and_hidden_scrollbar(self):
        evidence = {"before_offset": 0, "after_offset": 400, "reversed_offset": 200,
                    "scrollbar_initial": False, "scrollbar_after_scroll": True,
                    "scrollbar_after_idle": False}
        self.assertEqual([], validate_functionality(evidence, scenario="scroll"))
        evidence["after_offset"] = 0
        self.assertTrue(validate_functionality(evidence, scenario="scroll"))
        evidence["after_offset"] = 400
        evidence["scrollbar_initial"] = True
        self.assertTrue(validate_functionality(evidence, scenario="scroll"))

    def test_buttons_require_twenty_correct_results(self):
        evidence = {"actions": [{"name": "dialog", "expected": "open", "actual": "open"}] * 20}
        self.assertEqual([], validate_functionality(evidence, scenario="buttons"))
        evidence["actions"][0] = {"name": "dialog", "expected": "open", "actual": "closed"}
        self.assertTrue(validate_functionality(evidence, scenario="buttons"))

    def samples(self, interval=8.0):
        return {
            "active_frame": [2.0] * 200,
            "gpu_execute": [3.0] * 200,
            "layout": [4.0] * 25,
            "input_latency": [8.0] * 25,
            "presentation_interval": [interval] * 1200,
        }

    def test_detects_measured_layout_gpu_and_input_bottlenecks(self):
        samples = self.samples()
        samples.update(layout=[86.353] * 25, gpu_execute=[32.083] * 200,
                       input_latency=[101.773] * 25)
        errors = validate(samples, scenario="typing", refresh_hz=100, duration_s=12)
        self.assertTrue(any("layout" in error for error in errors))
        self.assertTrue(any("gpu_execute" in error for error in errors))
        self.assertTrue(any("input_latency" in error for error in errors))

    def test_detects_editing_frame_drops_even_with_fast_cpu(self):
        errors = validate(self.samples(25.0), scenario="enter", refresh_hz=100, duration_s=12)
        self.assertTrue(any("presentation_interval" in error for error in errors))
        self.assertTrue(any("FPS" in error for error in errors))

    def test_refuses_cpu_loop_intervals_as_display_evidence(self):
        samples = self.samples()
        del samples["presentation_interval"]
        samples["loop_interval"] = [8.0] * 1200
        errors = validate(samples, scenario="scroll", refresh_hz=120, duration_s=12)
        self.assertTrue(any("presentation_interval" in error for error in errors))

    def test_refuses_short_or_idle_only_recordings(self):
        samples = self.samples()
        samples["active_frame"] = []
        samples["input_latency"] = []
        errors = validate(samples, scenario="buttons", refresh_hz=120, duration_s=2)
        self.assertGreaterEqual(len(errors), 3)

    def test_accepts_120_fps_work_budget_on_100_hz_display(self):
        self.assertEqual([], validate(self.samples(10.0), scenario="scroll", refresh_hz=100, duration_s=12))

    def test_editing_accepts_60_fps_but_retains_gpu_budget(self):
        samples = self.samples(16.0)
        samples["active_frame"] = [12.0] * 200
        samples["layout"] = [12.0] * 25
        self.assertEqual([], validate(samples, scenario="typing", refresh_hz=100, duration_s=12))
        samples["gpu_execute"] = [12.0] * 200
        self.assertTrue(validate(samples, scenario="typing", refresh_hz=100, duration_s=12))

    def test_collects_only_fresh_samples_after_warmup(self):
        rows = [
            {"time_s": 10, "phases": {"active_frame": {"total": 2, "samples_ms": [80, 90]}}},
            {"time_s": 11, "phases": {"active_frame": {"total": 3, "samples_ms": [80, 90, 2]}}},
            {"time_s": 12, "phases": {"active_frame": {"total": 4, "samples_ms": [90, 2, 3]}}},
            {"time_s": 13, "phases": {"active_frame": {"total": 4, "samples_ms": [90, 2, 3]}}},
        ]
        samples, duration = collect(rows, warmup_s=1, end_s=None)
        self.assertEqual(samples["active_frame"], [2, 3])
        self.assertEqual(duration, 2)

    def test_refuses_silent_sample_loss(self):
        rows = [{"time_s": 10, "phases": {"active_frame": {"total": 1000, "samples_ms": [2] * 240}}}]
        with self.assertRaisesRegex(ValueError, "lost"):
            collect(rows, warmup_s=0, end_s=None)


if __name__ == "__main__":
    unittest.main()
