(ns frontend.components.lazy-editor-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.lazy-editor :as lazy-editor]
            [shadow.loader :as loader]))

(deftest node-tests-bypass-the-async-code-editor-module-test
  (let [load-calls (atom [])]
    (with-redefs [loader/load (fn [& args]
                                (swap! load-calls conj args))]
      (#'lazy-editor/load-code-editor!))
    (is (empty? @load-calls))))
