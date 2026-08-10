(ns frontend.components.query-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is]]
            [frontend.components.query :as query]
            [frontend.components.query.result :as query-result]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [goog.object :as gobj]
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

(deftest built-in-custom-query-detection-requires-stable-title-key
  (let [repo-config {:default-queries
                     {:journals [{:title-key :journal.default-query/doing
                                  :query '[:find ?b]
                                  :inputs [:today]}]}}]
    (is (true? (#'query/built-in-custom-query? repo-config
                                                {:title-key :journal.default-query/doing
                                                 :query '[:find ?b]
                                                 :inputs [:today]})))
    (is (false? (#'query/built-in-custom-query? repo-config
                                                 {:query '[:find ?b]
                                                  :inputs [:today]})))
    (is (false? (#'query/built-in-custom-query? repo-config
                                                 {:title-key :journal.default-query/todo
                                                  :query '[:find ?b]
                                                  :inputs [:today]})))))

(deftest resolve-built-in-query-allows-explicit-built-in-queries
  (let [repo-config {:default-queries {:journals []}}]
    (is (true? (#'query/resolve-built-in-query? repo-config true {:title "TODO"})))
    (is (false? (#'query/resolve-built-in-query? repo-config false {:title "TODO"})))))

(deftest built-in-block-query-preserves-default-page-grouping-test
  (let [captured-options (atom nil)
        current-block {:block/uuid (random-uuid)}
        result [(random-uuid)]]
    (with-redefs [rfx/use-sub (constantly {})
                  state/get-current-repo (constantly "query-test")
                  hooks/use-memo (fn [f _deps] (f))
                  hooks/use-atom (fn [a] [@a #(reset! a %)])
                  query-result/use-query-result (fn [_config _query] result)
                  ui/foldable (fn [_title body _opts] (body))]
      (render-static
       (query/custom-query*
        {:built-in-query? true
         :current-block current-block
         :->hiccup (fn [_result options _attrs]
                     (reset! captured-options options)
                     [:div])}
        {:query '[:find ?b]}))
      (is (true? (:group-by-page? @captured-options))
          "Ordinary built-in block queries should keep the master default."))))
