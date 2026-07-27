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

(deftest editor-placeholder-preserves-the-rendered-height-test
  (is (= 8133
         (#'lazy-editor/editor-placeholder-height
          #js {:height 8133}
          {:data-lang "calc"}
          (apply str (repeat 350 "1 + 2\n")))))
  (is (= 8120
         (#'lazy-editor/editor-placeholder-height
          nil
          {:data-lang "calc"}
          (apply str (repeat 350 "1 + 2\n")))))
  (is (= 1024
         (#'lazy-editor/editor-placeholder-height
          nil
          {:data-lang "clojure"}
          (apply str (repeat 350 "1 + 2\n"))))))
