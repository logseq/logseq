(ns logseq.e2e.config)

(defonce *port (atom 3002))
(defonce *headless (atom true))
(defonce *slow-mo
  ;; The default slow-mo is intentionally conservative to reduce flakes in CI,
  ;; but it's painful for local iteration. Set `LOGSEQ_E2E_FAST=1` to run with
  ;; minimal delays.
  (atom (if (= "1" (System/getenv "LOGSEQ_E2E_FAST"))
          0
          100)))
