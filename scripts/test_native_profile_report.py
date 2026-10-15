import copy
import unittest

from native_profile_report import summarize


class NativeProfileReportTest(unittest.TestCase):
    def run_data(self):
        def row(time, enters, allocated, total_ms, values):
            return {"time_s": time, "enter_downs": enters,
                    "gc": {"host_allocated_bytes": allocated, "heap_bytes": 2000,
                           "live_bytes": 1000, "minor_collections": enters,
                           "major_collections": 1},
                    "process_memory": {"window_visible": False, "width": 1440, "height": 900,
                                       "pixel_width": 2880, "pixel_height": 1800},
                    "phases": {"events": {"total": enters, "total_ms": total_ms,
                                           "samples_ms": values}}}
        return {"provenance": {"scenario": "enter", "executable_sha256": "a",
                               "graph_sha256": "b", "input_sha256": "c",
                               "build_profile": "release", "backend": "cocoa",
                               "viewport": [1440, 900, 2880, 1800],
                               "raster_workers": 4, "profiler": False},
                "window": {"start_s": 10, "end_s": 12},
                "metrics": [row(9, 0, 0, 0, []), row(10, 0, 100, 0, []),
                            row(11, 1, 200, 20, [20]), row(12, 2, 300, 50, [20, 30])],
                "memory": [{"seconds": i, "processes": {
                    "gui": {"rss_bytes": 100 + i * 10, "footprint_bytes": 50 + i * 5},
                    "worker": {"rss_bytes": 30, "footprint_bytes": 20}}}
                           for i in range(4)],
                "actions": {"counter": "enter_downs", "expected": 2, "injected": 2,
                            "persisted": 2, "ui_settled": True},
                "exit_code": 0}

    def test_completed_actions_normalize_cost_and_memory_includes_worker(self):
        report = summarize(self.run_data())
        self.assertTrue(report["workload_complete"])
        self.assertEqual(100, report["host_bytes_per_completed_action"])
        self.assertEqual(25, report["phases"]["events"]["ms_per_completed_action"])
        self.assertEqual(160, report["memory"]["peak_rss_bytes"])
        self.assertEqual(85, report["memory"]["peak_footprint_bytes"])
        self.assertFalse(report["window_visible_throughout"])

    def test_guarded_and_partial_runs_have_no_completed_action_cost(self):
        for field, value in (("persisted", 1), ("injected", 3), ("ui_settled", False)):
            data = self.run_data()
            data["actions"][field] = value
            report = summarize(data)
            self.assertFalse(report["workload_complete"])
            self.assertIsNone(report["host_bytes_per_completed_action"])
        data = self.run_data()
        data["exit_code"] = -9
        self.assertFalse(summarize(data)["workload_complete"])

    def test_profiler_results_cannot_be_timing_baselines(self):
        data = self.run_data()
        for row in data["metrics"]:
            row["process_memory"]["window_visible"] = True
        data["provenance"]["profiler"] = True
        self.assertFalse(summarize(data)["timing_baseline_eligible"])

    def test_timing_baseline_requires_visibility_for_the_entire_window(self):
        data = self.run_data()
        for row in data["metrics"]:
            row["process_memory"]["window_visible"] = True
        self.assertTrue(summarize(data)["timing_baseline_eligible"])
        for index in (1, 2, 3):
            with self.subTest(hidden_row=index):
                hidden = copy.deepcopy(data)
                hidden["metrics"][index]["process_memory"]["window_visible"] = False
                report = summarize(hidden)
                self.assertTrue(report["workload_complete"])
                self.assertFalse(report["timing_baseline_eligible"])

    def test_hidden_setup_outside_the_window_does_not_disqualify_the_baseline(self):
        data = self.run_data()
        for row in data["metrics"][1:]:
            row["process_memory"]["window_visible"] = True
        self.assertTrue(summarize(data)["timing_baseline_eligible"])

    def test_counter_reset_and_missing_provenance_fail(self):
        for path in (("metrics",), ("provenance",)):
            data = self.run_data()
            if path[0] == "metrics":
                data["metrics"][-1]["gc"]["host_allocated_bytes"] = 1
            else:
                del data["provenance"]["graph_sha256"]
            with self.assertRaises((ValueError, KeyError)):
                summarize(data)

    def test_lifetime_work_survives_ring_overrun_but_quantiles_are_unknown(self):
        data = self.run_data()
        data["metrics"][-1]["phases"]["events"]["total"] = 500
        report = summarize(data)
        self.assertEqual(50, report["phases"]["events"]["total_ms"])
        self.assertIsNone(report["phases"]["events"]["p95_ms"])
        self.assertIn("events", report["lost_timing_samples"])

    def test_empty_action_window_does_not_divide_by_zero(self):
        data = self.run_data()
        data["actions"].update(expected=0, injected=0, persisted=0)
        for row in data["metrics"]:
            row["enter_downs"] = 0
        self.assertIsNone(summarize(data)["host_bytes_per_completed_action"])

    def test_memory_peak_uses_simultaneous_samples_not_individual_peaks(self):
        data = self.run_data()
        data["memory"][0]["processes"]["worker"]["rss_bytes"] = 50
        report = summarize(data)
        self.assertEqual(160, report["memory"]["peak_rss_bytes"])

    def test_duplicate_time_nonfinite_values_and_missing_process_fail(self):
        for change in ("time", "nan", "process"):
            data = copy.deepcopy(self.run_data())
            if change == "time":
                data["metrics"][-1]["time_s"] = 11
            elif change == "nan":
                data["memory"][0]["processes"]["gui"]["rss_bytes"] = float("nan")
            else:
                del data["memory"][1]["processes"]["worker"]
            with self.assertRaises(ValueError):
                summarize(data)

    def test_few_observations_report_maximum_without_a_p95_claim(self):
        phase = summarize(self.run_data())["phases"]["events"]
        self.assertEqual(30, phase["max_ms"])
        self.assertIsNone(phase["p95_ms"])

    def test_memory_samples_require_the_gui_role(self):
        data = self.run_data()
        for row in data["memory"]:
            row["processes"]["second_worker"] = row["processes"].pop("gui")
        with self.assertRaises(ValueError):
            summarize(data)

    def test_actual_viewport_and_visibility_must_match_provenance(self):
        for field, value in (("pixel_width", 1440), ("window_visible", "false")):
            data = self.run_data()
            data["metrics"][-1]["process_memory"][field] = value
            with self.assertRaises(ValueError):
                summarize(data)


if __name__ == "__main__":
    unittest.main()
