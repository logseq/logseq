(ns logseq.e2e.settings
  (:require [logseq.e2e.assert :as assert]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(def ^:private e2e-init-script
  "localStorage.setItem('preferred-language', '\"en\"'); localStorage.setItem('developer-mode', '\"true\"');")

(def ^:private refresh-ready-script
  "(() => document.documentElement.lang === 'en'
           && localStorage.getItem('preferred-language') === '\"en\"'
           && localStorage.getItem('developer-mode') === '\"true\"')()")

(defn install-init-script!
  [ctx]
  (.addInitScript ctx e2e-init-script))

(defn wait-test-env-ready!
  []
  (loop [remaining 20]
    (if (w/eval-js refresh-ready-script)
      true
      (if (zero? remaining)
        (throw (ex-info "test env not ready after refresh" {}))
        (do
          (util/wait-timeout 250)
          (recur (dec remaining)))))))

(defn- test-env-ready?
  []
  (try
    (wait-test-env-ready!)
    true
    (catch Throwable _e
      false)))

(defn refresh-test-env!
  []
  (loop [attempt 0]
    (w/refresh)
    (assert/assert-graph-loaded?)
    (if (test-env-ready?)
      true
      (if (< attempt 2)
        (recur (inc attempt))
        (wait-test-env-ready!)))))

(defn developer-mode
  []
  (w/eval-js e2e-init-script)
  (assert/assert-in-normal-mode?))
