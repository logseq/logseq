(ns logseq.e2e.config)

(def ^:private default-port 3002)

(defn- resolve-port
  []
  (let [port (some-> (System/getProperty "port")
                     parse-long)]
    (prn :resolved-port port)
    (if (pos-int? port) port default-port)))

(defonce *port (atom (resolve-port)))
(defonce *headless (atom true))
(defonce *slow-mo (atom 100))                  ; Set `slow-mo` lower to find more flaky tests
