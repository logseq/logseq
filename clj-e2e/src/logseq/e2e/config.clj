(ns logseq.e2e.config)

(defonce *port (atom 3002))
(defonce *headless (atom true))
(defonce *slow-mo (atom 100))                  ; Set `slow-mo` lower to find more flaky tests
