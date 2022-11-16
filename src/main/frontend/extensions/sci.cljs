(ns frontend.extensions.sci
  (:require [sci.core :as sci]
            [frontend.util :as util]))

;; Some helpers
(def sum (partial apply +))

(defn average [coll]
  (/ (reduce + coll) (count coll)))

(defn eval-string
  ([s]
   (eval-string s {}))
  ([s ns]
  (try
    (sci/eval-string s {:bindings {'sum sum
                                   'average average
                                   'parseFloat js/parseFloat
                                   'custom-js (if (exists? js/customJs) js/customJs (Empty.))
                                   'isNaN js/isNaN
                                   'log js/console.log
                                   'pprint util/pp-str}
                        :namespaces ns
                        :classes {'logseq-api js/logseq.api 'logseq-gp js/logseq.graph_parser :allow :all}
                        })
    (catch :default e
      (println "Query: sci eval failed:")
      (js/console.error e)))))

(defn call-fn
  [f & args]
  (apply f args))

(defn eval-result
  [code block]
  [:div
   [:code "Results:"]
   [:div.results.mt-1
    (let [editor-ns {'block (sci/new-var 'block block)}
          result (eval-string code {'editor editor-ns})]
      (if (and (vector? result) (:hiccup (meta result))) result [:pre.code (str result)]))]])