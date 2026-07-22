(ns db-namespace-package
  (:require [logseq.melange.bridge.db.rules :as db-rules]))

(defn- check
  [label expected actual]
  (when-not (= expected actual)
    (throw (js/Error. (str label ": expected " expected ", got " actual)))))

(defn -main
  []
  (let [parent-rule (get db-rules/rules :parent)]
    (check "typed rule values decode to ClojureScript"
           true
           (and (vector? parent-rule)
                (vector? (first parent-rule))
                (list? (ffirst parent-rule))
                (symbol? (first (ffirst parent-rule)))
                (keyword? (second (second (first parent-rule)))))))
  (check "Rules.fullDependencies interop"
         #{:root :child :leaf}
         (#'db-rules/get-full-deps
          [:root]
          {:root #{:child}
           :child #{:leaf}})))
