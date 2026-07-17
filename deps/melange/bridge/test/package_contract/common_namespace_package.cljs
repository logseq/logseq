(ns common-namespace-package
  (:require ["@logseq/melange-js-api/common" :as common-api]
            [logseq.melange.bridge.common.collection :as collection]))

(defn- check
  [label expected actual]
  (when-not (= expected actual)
    (throw (js/Error. (str label ": expected " expected ", got " actual)))))

(defn -main
  []
  (let [string-util (.-StringUtil common-api)]
    (check "static ClojureScript package loading"
           true
           (fn? (.-splitFirst string-util)))
    (check "JavaScript array converts to a ClojureScript vector"
           ["a" "b:c"]
           (vec (.splitFirst string-util ":" "a:b:c"))))
  (check "nil, false, and map values cross the runtime boundary"
         [false {:present 1}]
         (vec (collection/fast-remove-nils
               [nil false {:present 1 :missing nil}]))))
