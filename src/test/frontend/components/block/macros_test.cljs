(ns frontend.components.block.macros-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.block.macros :as block-macros]
            [goog.object :as gobj]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]))

(defn- render-static
  [element]
  (let [previous-react (gobj/get js/globalThis "React")]
    (gobj/set js/globalThis "React" react)
    (try
      (.renderToStaticMarkup react-dom-server element)
      (finally
        (if (some? previous-react)
          (gobj/set js/globalThis "React" previous-react)
          (js-delete js/globalThis "React"))))))

(defn- render-function-macro
  [query-result arguments]
  (with-redefs [hooks/use-memo (fn [f _deps] (f))
                hooks/use-atom (fn [a] [@a #(reset! a %)])]
    (render-static
     (block/macro-function-cp {:query-result (atom query-result)}
                              arguments))))

(deftest function-macro-evaluates-hash-map-and-result
  (testing "{{function (hash-map 1 2)}} returns a CLJS map"
    (is (= {1 2}
           (block-macros/function-macro
            [(random-uuid)]
            ["(hash-map 1 2)"]))))

  (testing "{{function result}} returns a collection, not a React child"
    (let [result (block-macros/function-macro
                  [(random-uuid) (random-uuid)]
                  ["result"])]
      (is (seq result))
      (is (every? map? result)))))

(deftest function-result-hiccup-is-react-safe
  (testing "Maps and other collections become printable text"
    (let [hiccup (block-macros/function-result->hiccup {1 2})]
      (is (vector? hiccup))
      (is (string? (last hiccup)))
      (is (string/includes? (last hiccup) "1"))
      (is (string/includes? (last hiccup) "2"))))

  (testing "Scalar values stay renderable"
    (is (= [:span.function-macro-result 3]
           (block-macros/function-result->hiccup 3)))
    (is (= [:span.function-macro-result "ok"]
           (block-macros/function-result->hiccup "ok"))))

  (testing "Hiccup vectors are left intact"
    (is (= [:div "hi"]
           (block-macros/function-result->hiccup [:div "hi"])))))

(deftest function-macro-hashmap-renders-as-text
  (testing "Pretty-printed hashmap hiccup is a valid React tree"
    (let [markup (render-static
                  (hsx/create-element
                   (block-macros/function-result->hiccup {1 2})))]
      (is (string/includes? markup "1"))
      (is (string/includes? markup "2"))))

  (testing "Result component pretty-prints hashmap values"
    (let [markup (render-static
                  (block/macro-function-result-cp
                   [(random-uuid)]
                   ["(hash-map 1 2)"]))]
      (is (string/includes? markup "1"))
      (is (string/includes? markup "2"))))

  (testing "Hashmap results are pretty-printed instead of crashing React"
    (let [markup (render-function-macro [(random-uuid)] ["(hash-map 1 2)"])]
      (is (string/includes? markup "1"))
      (is (string/includes? markup "2"))))

  (testing "Query result collections are pretty-printed instead of crashing React"
    (let [markup (render-function-macro [(random-uuid)] ["result"])]
      (is (string/includes? markup ":block/properties"))))

  (testing "Scalar results still render"
    (let [markup (render-function-macro [(random-uuid) (random-uuid)] ["(count result)"])]
      (is (string/includes? markup "2"))))

  (testing "A hashmap function does not prevent a sibling function from rendering"
    (let [rows [(random-uuid) (random-uuid)]
          markup (with-redefs [hooks/use-memo (fn [f _deps] (f))
                               hooks/use-atom (fn [a] [@a #(reset! a %)])]
                   (render-static
                    (hsx/create-element
                     [:div
                      (block/macro-function-cp {:query-result (atom rows)}
                                               ["(hash-map 1 2)"])
                      (block/macro-function-cp {:query-result (atom rows)}
                                               ["(count result)"])])))]
      (is (string/includes? markup "1"))
      (is (string/includes? markup "2")))))
