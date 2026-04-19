(ns logseq.e2e.config)

(def ^:private default-port 3002)

(defn- resolve-port
  []
  (let [port (some-> (System/getProperty "port")
                     parse-long)]
    (if (pos-int? port) port default-port)))

(defonce *port (atom (resolve-port)))
(defonce *headless (atom true))
(defonce *slow-mo
  ;; The default slow-mo is intentionally conservative to reduce flakes in CI,
  ;; but it's painful for local iteration. Set `LOGSEQ_E2E_FAST=1` to run with
  ;; minimal delays.
  (atom (if (= "1" (System/getenv "LOGSEQ_E2E_FAST"))
          0
          100)))
