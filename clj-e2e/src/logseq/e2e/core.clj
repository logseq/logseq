(ns logseq.e2e.core
  (:require [eftest.runner :as eftest]))

(defn -main
  [& _args]
  (println "\nRunning tests...")
  (let [{:keys [fail error]} (eftest/run-tests (eftest/find-tests "test") {:multithread? :namespaces})
        exit-code (cond
                    (and (pos? fail)
                         (pos? error)) 30
                    (pos? error)       20
                    (pos? fail)        10
                    :else              0)]
    (System/exit exit-code)))
