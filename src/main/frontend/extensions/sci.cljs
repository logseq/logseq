(ns frontend.extensions.sci
  "Provides a consistent approach to sci evaluation. Used in at least the following places:
- For :view evaluation
- For :result-transform evaluation
- For cljs evaluation in Src blocks
- For evaluating {{function }} under query tables"
  (:require [sci.core :as sci]
            [frontend.util :as util]
            [goog.dom]
            [goog.object]
            [goog.string]
            [lambdaisland.glogi :as log]))

;; Helper fns for eval-string
;; ==========================
(def ^:private sum (partial apply +))

(defn- average [coll]
  (/ (reduce + coll) (count coll)))

(defn- call-api
  "Given a fn name from logseq.api, invokes it with the given arguments"
  [fn-name & args]
  (when-not (aget js/window.logseq "api" fn-name)
    (throw (ex-info "Api function does not exist" {:fn fn-name})))
  (apply js-invoke (aget js/window.logseq "api") fn-name args))

(def ^:private default-user-namespace
  {'sum sum
   'average average
   'parseFloat js/parseFloat
   'isNaN js/isNaN
   'log js/console.log
   'pprint util/pp-str
   ;; Provide to all evals as it useful in most contexts
   'call-api call-api})

(defn- normalize-sci-options
  [options]
  (let [namespaces (or (:namespaces options) {})
        user-namespace (or (get namespaces 'user) (:bindings options))]
    (-> options
        (dissoc :bindings)
        (assoc :namespaces
               (assoc namespaces 'user (merge default-user-namespace user-namespace))))))

;; Public fns
;; ==========
(defn eval-string
  "Second arg is a map of options for sci/eval-string"
  ([s]
   (eval-string s {}))
  ([s options]
   (try
     (sci/eval-string s (normalize-sci-options options))
     (catch :default e
       (log/error :sci-eval-failed e)))))

(defn call-fn
  [f & args]
  (apply f args))

(defn eval-result
  "Evaluate code with sci in a block context"
  [code block]
  [:div
   [:code "Results:"]
   [:div.results.mt-1
    (let [result (eval-string code {:bindings {'block block}})]
      (if (and (vector? result) (:hiccup (meta result)))
        result
        [:pre.code (str result)]))]])
