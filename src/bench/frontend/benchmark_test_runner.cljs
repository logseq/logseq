(ns frontend.benchmark-test-runner
  "Runs a benchmark"
  (:require #_[shadow.test.env :as env]
    [clojure.edn :as edn]
    [lambdaisland.glogi.console :as glogi-console]
    ;; activate humane test output for all tests
    ;;[pjstadig.humane-test-output]
    #_[frontend.test.helper :as test-helper]
    [frontend.macros :refer [slurped]]
    [clojure.pprint :as pprint]
    [clojure.test :refer [run-tests deftest testing]]
    [fipp.edn :as fipp]))

(def onboarding
  (edn/read-string (slurped "resources/whiteboard/onboarding.edn")))

(defn print-prefix-map* [prefix m print-one writer opts]
  (pr-sequential-writer
    writer
    (fn [e w opts]
      (do (print-one (key e) w opts)
          (-write w \space)
          (print-one (val e) w opts)))
    (str prefix "{") ", " "}\n"
    opts (seq m)))

(deftest test-pp-str
  (testing "pp-str benchmark"
    (simple-benchmark []
                      (with-out-str (pprint/pprint onboarding))
                      10)
    (simple-benchmark []
                      (with-out-str (fipp/pprint onboarding))
                      10)
    (simple-benchmark []
                      (with-redefs [print-prefix-map print-prefix-map*]
                        (pr-str onboarding))
                      10)
    (simple-benchmark []
                      (pr-str onboarding)
                      10)
    (with-redefs [print-prefix-map print-prefix-map*]
      (println (pr-str onboarding)))
    #_(simple-benchmark []
                        (util/pp-str onboarding)
                        10)))

#_(defn -main [& args]
  []
  (glogi-console/install!) ;; see log messages
  (run-tests))
