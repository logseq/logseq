(ns frontend.components.reference-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is]]
            [frontend.components.reference :as reference]
            [frontend.components.views :as views]
            [frontend.db.hooks :as db-hooks]
            [frontend.state :as state]
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

(deftest reference-views-mount-only-when-matches-exist-test
  (let [page-uuid (random-uuid)
        page {:block/uuid page-uuid
              :block/tx-id 12
              :block/title "Referenced page"}
        block-calls (atom [])
        resource-calls (atom [])
        view-calls (atom [])]
    (with-redefs [db-hooks/use-block
                  (fn [requested-uuid]
                    (swap! block-calls conj requested-uuid)
                    page)
                  db-hooks/use-resource
                  (fn [resource-key]
                    (swap! resource-calls conj resource-key)
                    (case (first resource-key)
                      :block-ref-count 2
                      :block-unlinked-ref-exists true))
                  state/get-ref-open-blocks-level (constantly 0)
                  views/build-columns (fn [& _] [])
                  views/view
                  (fn [option]
                    (swap! view-calls conj option)
                    [:span (name (:view-feature-type option))])]
      (render-static
       (reference/references page-uuid {:linked-refs-section? true}))
      (render-static
       (reference/unlinked-references page-uuid {}))
      (is (= [page-uuid page-uuid] @block-calls))
      (is (= [[:block-ref-count page-uuid]
              [:block-unlinked-ref-exists page-uuid]]
             @resource-calls))
      (is (= [:linked-references :unlinked-references]
             (mapv :view-feature-type @view-calls)))
      (is (every? #(= page-uuid (:view-parent-uuid %)) @view-calls))
      (is (not-any? #(map? (:view-parent %)) @view-calls)
          "Reference views never retain a graph entity as membership state."))
    (reset! view-calls [])
    (with-redefs [db-hooks/use-block (constantly page)
                  db-hooks/use-resource
                  (fn [resource-key]
                    (case (first resource-key)
                      :block-ref-count 0
                      :block-unlinked-ref-exists false))
                  views/build-columns (fn [& _] [])
                  views/view (fn [option]
                               (swap! view-calls conj option)
                               [:span])]
      (render-static (reference/references page-uuid {}))
      (render-static (reference/unlinked-references page-uuid {}))
      (is (empty? @view-calls)
          "Empty reference sections must not create persistent views."))))
