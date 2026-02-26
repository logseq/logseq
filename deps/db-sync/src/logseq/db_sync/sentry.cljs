(ns logseq.db-sync.sentry)

(defn- not-blank [v]
  (when (and (string? v) (seq v)) v))

(defn- parse-sample-rate [v]
  (let [n (js/parseFloat v)]
    (when (and (not (js/isNaN n)) (<= 0 n 1)) n)))

(defn options-from-env [^js env]
  (let [dsn (not-blank (aget env "SENTRY_DSN"))
        release (not-blank (aget env "SENTRY_RELEASE"))
        environment (not-blank (aget env "SENTRY_ENVIRONMENT"))
        traces-sample-rate (parse-sample-rate (aget env "SENTRY_TRACES_SAMPLE_RATE"))]
    (when dsn
      (cond-> {:dsn dsn}
        release (assoc :release release)
        environment (assoc :environment environment)
        traces-sample-rate (assoc :tracesSampleRate traces-sample-rate)))))
