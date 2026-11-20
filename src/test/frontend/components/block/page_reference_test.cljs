(ns frontend.components.block.page-reference-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [goog.object :as gobj]))

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

(deftest unresolved-page-reference-shows-its-name-test
  (let [page {:block/name "2026-09-21"}]
    (testing "a reference without a label"
      (doseq [label [nil ""]]
        (let [html (render-static (block/page-cp-inner {:label label} page))]
          (is (string/includes? html ">2026-09-21<")
              "A ref whose page lookup missed shows the ref text, not an empty [[]]."))))
    (testing "a reference with a label"
      (let [html (render-static (block/page-cp-inner {:label "the day"} page))]
        (is (string/includes? html ">the day<"))
        (is (not (string/includes? html "2026-09-21")))))))
