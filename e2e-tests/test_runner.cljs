(ns test-runner
  "Originally copied from https://github.com/nextjournal/clerk/blob/6a7690caf436b3e5eb210ea06fb31bb9f7ba3387/ui_tests/playwright_tests.cljs"
  {:clj-kondo/config '{:skip-comments false}}
  (:require [clojure.test :as t]
            [srs-test]))

(defmethod t/report [:cljs.test/default :begin-test-var] [m]
  (println "===" (-> m :var meta :name))
  (println))

(defn print-summary []
  (t/report (assoc (:report-counters (t/get-current-env)) :type :summary)))

(defmethod t/report [:cljs.test/default :end-test-vars] [_]
  (let [env (t/get-current-env)
        counters (:report-counters env)
        failures (:fail counters)
        errors (:error counters)]
    (when (or (pos? failures)
              (pos? errors))
      (set! (.-exitCode js/process) 1))
    (print-summary)))

(defn get-test-vars [nss]
  (->> (ns-publics nss)
       vals
       (filter (comp :test meta))))

(defn -main [& _args]
  (t/test-vars (get-test-vars 'srs-test)))
