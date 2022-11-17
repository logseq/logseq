(ns frontend.extensions.sci
  (:require [sci.core :as sci]
            [frontend.util :as util]
            [goog.dom]
            [goog.object]
            [goog.string]))

;; Some helpers
(def sum (partial apply +))

(defn average [coll]
  (/ (reduce + coll) (count coll)))

(defn eval-string
  "Second arg is a map of options for sci/eval-string"
  ([s]
   (eval-string s {}))
  ([s options]
   (try
     (sci/eval-string s (merge-with merge
                                    {:bindings {'sum sum
                                                'average average
                                                'parseFloat js/parseFloat
                                                'isNaN js/isNaN
                                                'log js/console.log
                                                'pprint util/pp-str}}
                                    options))
     (catch :default e
       (println "Query: sci eval failed:")
       (js/console.error e)))))

(defn call-fn
  [f & args]
  (apply f args))

(defn eval-result
  "Evaluate code with sci in a block context"
  [code block]
  [:div
   [:code "Results:"]
   [:div.results.mt-1
    (let [result (eval-string code {:bindings {'block block}
                                    :classes {'logseq-api js/logseq.api
                                              'logseq-gp js/logseq.graph_parser
                                              :allow :all}})]
      (if (and (vector? result) (:hiccup (meta result)))
        result
        [:pre.code (str result)]))]])
