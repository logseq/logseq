(ns frontend.test-runner
  "shadow-cljs test runner for :node-test that provides most of the same options
  as
  https://github.com/cognitect-labs/test-runner#invoke-with-clojure--m-clojuremain.
  This gives the user a fair amount of control over which tests and namespaces
  to call from the commandline. Once this test runner is stable enough we should
  contribute it upstream"
  {:dev/always true} ;; necessary for test-data freshness
  (:require [shadow.test.env :as env]
            [clojure.tools.cli :as cli]
            [shadow.test.node :as node]
            [clojure.string :as str]
            ["util" :as util]))

(defn- print-summary
  "Print help summary given args and opts strings"
  [options-summary additional-msg]
  (println (util/format "Usage: %s [OPTIONS]\nOptions:\n%s%s"
                        "$0"
                        options-summary
                        additional-msg)))

(defn- parse-options
  "Processes a command's functionality given a cli options definition, arguments
  and primary command fn. This handles option parsing, handles any errors with
  parsing and then returns options"
  [args cli-opts & parse-opts-options]
  (let [{:keys [errors] :as parsed-input}
        (apply cli/parse-opts args cli-opts parse-opts-options)]
    (if (seq errors)
      (do (println (str/join "\n" (into ["Options failed to parse:"] errors)))
        (js/process.exit 1))
      parsed-input)))

(defn- run-test-options
  "Given available tests namespaces as symbols, test vars and options,
returns run options for selected tests to run"
  [namespaces
   vars
   {:keys [include exclude namespace namespace-regex]}]
  (let [focused-tests (cond
                        (seq include)
                        (map symbol (filter (fn [v]
                                              (let [metadata (meta v)]
                                                (some metadata include)))
                                            vars))
                        exclude
                        (map symbol (remove (comp exclude meta) vars)))
        test-syms (cond (some? focused-tests)
                    focused-tests
                    namespace
                    [namespace]
                    namespace-regex
                    (filter #(re-find namespace-regex (str %)) namespaces))]
    ;; NOTE: If include points to a nonexistent metadata flag, this results in test-syms being '().
    ;; We would expect no tests to run but instead the node test runner runs all tests.
    ;; We may want to workaround this
    (cond-> {}
            (some? test-syms)
            (assoc :test-syms test-syms))))

(def cli-options
  [["-h" "--help"]
   ["-i" "--include INCLUDE"
    :default #{}
    :parse-fn keyword
    :multi true :update-fn conj
    :desc "Run only tests with this metadata keyword. Can be specified more than once"]
   ;; TODO: Fix and enable once it's determined if this is an internal or shadow bug
   #_["-e" "--exclude EXCLUDE" :parse-fn keyword]
   ["-n" "--namespace NAMESPACE"
    :parse-fn symbol :desc "Specific namespace to test"]
   ["-r" "--namespace-regex REGEX"
    :parse-fn re-pattern :desc "Regex for namespaces to test"]])

;; Necessary to have test-data in this ns for freshness. Relying on
;; node/reset-test-data! was buggy
(defn ^:dev/after-load reset-test-data! []
  (-> (env/get-test-data)
      (env/reset-test-data!)))

(defn main [& args]
  ;; Load test data as is done with shadow.test.node/main
  (reset-test-data!)

  (let [{:keys [options summary]} (parse-options args cli-options)]
    (if (:help options)
      (do
        (print-summary summary
                       "\n\nNone of these options can be composed. Defaults to running all tests")
        (js/process.exit 0))
      (node/execute-cli
       (run-test-options (keys (env/get-tests)) (env/get-test-vars) options)))))
