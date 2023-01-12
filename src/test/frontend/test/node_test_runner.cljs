(ns frontend.test.node-test-runner
  "Application agnostic shadow-cljs test runner for :node-test that provides the
  same test selection options as
  https://github.com/cognitect-labs/test-runner#invoke-with-clojure--m-clojuremain.
  This gives the user a fair amount of control over which tests and namespaces
  to call from the commandline. Once this test runner is stable enough we should
  contribute it upstream"
  {:dev/always true} ;; necessary for test-data freshness
  (:require [shadow.test.env :as env]
            [clojure.tools.cli :as cli]
            [clojure.string :as str]
            [clojure.set :as set]
            [shadow.test :as st]
            [cljs.test :as ct]
            [goog.string :as gstring]))

;; Cljs.test customization
;; Inherit behavior from default reporter
(derive ::node ::ct/default)

;; Needed for process to exit correctly
(defmethod ct/report [::node :end-run-tests] [m]
  (if (ct/successful? m)
    (js/process.exit 0)
    (js/process.exit 1)))

;; Improves on default error behavior by printing full stacktrace.
;; clojure.test runner does this but cljs.test does not - https://github.com/clojure/clojure/blob/9af0d1d9a0dc34c406c3588dfe9b60dbe4530981/src/clj/clojure/test.clj#L384-L395
(defmethod ct/report [::node :error] [m]
  ;; Add to counter for ::node
  (ct/inc-report-counter! :error)

  ;; Print standard error messages
  (let [env (ct/get-current-env)]
    (binding [ct/*current-env* (assoc env :reporter ::ct/default)]
      (ct/report m)))

  ;; Also print stacktrace
  (when (.hasOwnProperty (:actual m) "stack")
    (println (.-stack (:actual m)))))

;; CLI utils
;; =========

(defn- print-summary
  "Print help summary given args and opts strings"
  [options-summary additional-msg]
  (println (gstring/format "Usage: %s [OPTIONS]\nOptions:\n%s%s"
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

(defn- get-selected-tests
  "Given available tests namespaces as symbols, test vars and user options,
returns selected tests and namespaces to run"
  [test-namespaces
   test-vars
   {:keys [include exclude namespace namespace-regex vars]}]
  (let [focused-tests (cond
                        (seq vars)
                        vars
                        (seq include)
                        (map symbol (filter
                                     #(seq (set/intersection include (set (keys (meta %)))))
                                     test-vars))
                        (seq exclude)
                        (map symbol (remove
                                     #(seq (set/intersection exclude (set (keys (meta %)))))
                                     test-vars)))
        test-syms (cond (some? focused-tests)
                    focused-tests
                    namespace
                    [namespace]
                    namespace-regex
                    (filter #(re-find namespace-regex (str %)) test-namespaces))]
    test-syms))

;; This is a patched version of https://github.com/thheller/shadow-cljs/blob/f271b3c40d3ccd4e587b0ffeaa2713d2f642114a/src/main/shadow/test/node.cljs#L44-L56
;; that consistently works for all symbols
(defn find-matching-test-vars
  "Converts symbols to vars"
  [test-syms all-test-vars]
  (let [test-namespaces
        (->> test-syms (filter simple-symbol?) (set))
        test-var-syms
        (->> test-syms (filter qualified-symbol?) (set))]
    (->> all-test-vars
         (filter (fn [the-var]
                   (let [{:keys [ns] :as m} (meta the-var)]
                     (or (contains? test-namespaces ns)
                         ;; PATCH: (symbol SYMBOL SYMBOL) leads to buggy equality behavior
                         ;; in cljs. In clj, this throws an exception. Modified to
                         ;; (symbol STRING STRING) to avoid bug
                         (contains? test-var-syms
                                    (symbol (name ns) (name (:name m)))))))))))

(defn- get-selected-vars
  "Given test selections from user options, returns the selected tests as
  vars"
  [test-namespaces test-vars options]
  (->> [:include :exclude :namespace :namespace-regex :vars]
       ;; Only AND options users have specified
       (filter #(let [val (get options %)]
                  ;; Some options default to empty so we have filter these out
                  (if (coll? val) (seq val) (some? val))))
       (map #(get-selected-tests test-namespaces test-vars (select-keys options [%])))
       (map #(set (find-matching-test-vars % test-vars)))
       (apply set/intersection)))

;; Main test functionality
;; =======================

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
   ;; --test is long name for compatibility with older runner
   ["-v" "--test VAR" "Fully qualified var to test"
    :id :vars
    :default #{}
    :default-desc ""
    :parse-fn symbol
    :multi true
    :update-fn conj]
   ["-n" "--namespace NAMESPACE"
    :parse-fn symbol :desc "Specific namespace to test"]
   ["-r" "--namespace-regex REGEX"
    :parse-fn re-pattern :desc "Regex for namespaces to test"]])

;; get-test-data is a macro so this namespace REQUIRES :dev/always hint ns so
;; that it is always recompiled
(defn ^:dev/after-load reset-test-data! []
  (-> (env/get-test-data)
      (env/reset-test-data!)))

(defn- run-tests
  [test-namespaces test-vars options]
  ;; We define a custom runner so we can inherit behavior from the default
  ;; runner and improve on it
  (let [test-env (ct/empty-env ::node)
        selected-vars (get-selected-vars test-namespaces test-vars options)]

    (if (some? selected-vars)
      ;; Don't run tests if none are selected
      (let [test-vars (if (empty? selected-vars) [] selected-vars)]
        (st/run-test-vars test-env test-vars))
      (st/run-all-tests test-env nil))))

(defn parse-and-run-tests
  "Main entry point for custom test runners"
  [args]
  (let [{:keys [options summary]} (parse-options args cli-options)]
    (if (:help options)
      (do
        (print-summary summary
                       "\n\nMultiple options are ANDed. Defaults to running all tests")
        (js/process.exit 0))
      (run-tests (keys (env/get-tests)) (env/get-test-vars) options))))

(defn main
  "Main entry point if this ns is configured as a test runner"
  [& args]
  (reset-test-data!)
  (parse-and-run-tests args))
