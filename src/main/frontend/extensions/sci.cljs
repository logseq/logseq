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
  [s]
  (try
    (sci/eval-string s {:bindings {'sum sum
                                   'average average
                                   'parseFloat js/parseFloat
                                   'custom-js (if (exists? js/customJs) js/customJs (Empty.))
                                   'isNaN js/isNaN
                                   'log js/console.log
                                   'pprint util/pp-str}
                        :classes {'gstring goog.string 'gdom goog.dom 'gobj goog.object 'logseq-api js/logseq.api 'logseq-gp js/logseq.graph_parser :allow :all}})
    (catch :default e
      (println "Query: sci eval failed:")
      (js/console.error e))))

(defn call-fn
  [f & args]
  (apply f args))

(defn eval-result
  [code block]
  [:div
   [:code "Results:"]
   [:div.results.mt-1
    (let [fn-code (str "(fn [block] " code ")")
          f (eval-string fn-code)
          result (call-fn f block)]
      (if (and (vector? result) (:hiccup (meta result))) result [:pre.code (str result)]))]])