(ns frontend.test.node-test-runner
  "shadow-cljs test runner for :node-test that provides the same test selection
  options as
  https://github.com/cognitect-labs/test-runner#invoke-with-clojure--m-clojuremain.
  This gives the user a fair amount of control over which tests and namespaces
  to call from the commandline. Once this test runner is stable enough we should
  contribute it upstream"
  {:dev/always true} ;; necessary for test-data freshness
  (:require [shadow.test.env :as env]
            [clojure.tools.cli :as cli]
            [shadow.test.node :as node]
            [clojure.string :as str]
            [clojure.set :as set]
            ["util" :as util]
            ;; activate humane test output for all tests
            [pjstadig.humane-test-output]))

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
                        (map symbol (filter
                                     #(seq (set/intersection include (set (keys (meta %)))))
                                     vars))
                        (seq exclude)
                        (map symbol (remove
                                     #(seq (set/intersection exclude (set (keys (meta %)))))
                                     vars)))
        test-syms (cond (some? focused-tests)
                    focused-tests
                    namespace
                    [namespace]
                    namespace-regex
                    (filter #(re-find namespace-regex (str %)) namespaces))]
    (cond-> {}
            (some? test-syms)
            (assoc :test-syms test-syms))))

(def cli-options
  [["-h" "--help"]
   ["-i" "--include INCLUDE"
    :default #{}
    :default-desc ""
    :parse-fn keyword
    :multi true
    :update-fn conj
    :desc "Run only tests with this metadata keyword"]
   ["-e" "--exclude EXCLUDE"
    :default #{}
    :default-desc ""
    :parse-fn keyword
    :multi true
    :update-fn conj
    :desc "Exclude tests that have this keyword"]
   ["-n" "--namespace NAMESPACE"
    :parse-fn symbol :desc "Specific namespace to test"]
   ["-r" "--namespace-regex REGEX"
    :parse-fn re-pattern :desc "Regex for namespaces to test"]])

;; Necessary to have test-data in this ns for freshness. Relying on
;; node/reset-test-data! was buggy
(defn ^:dev/after-load reset-test-data! []
  (-> (env/get-test-data)
      (env/reset-test-data!)))

;; This is a patched version of https://github.com/thheller/shadow-cljs/blob/f271b3c40d3ccd4e587b0ffeaa2713d2f642114a/src/main/shadow/test/node.cljs#L44-L56
;; that consistently works for all symbols
(defn find-matching-test-vars [test-syms]
  (let [test-namespaces
        (->> test-syms (filter simple-symbol?) (set))
        test-var-syms
        (->> test-syms (filter qualified-symbol?) (set))]
    (->> (env/get-test-vars)
         (filter (fn [the-var]
                   (let [{:keys [ns] :as m} (meta the-var)]
                     (or (contains? test-namespaces ns)
                         ;; PATCH: (symbol SYMBOL SYMBOL) leads to buggy equality behavior
                         ;; in cljs. In clj, this throws an exception. Modified to
                         ;; (symbol STRING STRING) to avoid bug
                         (contains? test-var-syms
                                    (symbol (name ns) (name (:name m)))))))))))

(defn main [& args]
  ;; Load test data as is done with shadow.test.node/main
  (reset-test-data!)

  (let [{:keys [options summary]} (parse-options args cli-options)]
    (if (:help options)
      (do
        (print-summary summary
                       "\n\nNone of these options can be composed. Defaults to running all tests")
        (js/process.exit 0))
      (with-redefs [node/find-matching-test-vars find-matching-test-vars]
        (let [opts (run-test-options (keys (env/get-tests)) (env/get-test-vars) options)]
          ;; If :test-syms is specified but empty, skip execute-cli because the
          ;; user has specified an empty test selection
          (if (and (seq opts) (empty? (:test-syms opts)))
            (do (println "No tests found.")
              (js/process.exit 0))
            (node/execute-cli opts)))))))
