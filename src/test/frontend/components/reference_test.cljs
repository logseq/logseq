(ns frontend.components.reference-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.components.reference :as reference]
            [frontend.components.views :as views]
            [frontend.db.hooks :as db-hooks]
            [frontend.state :as state]
            [goog.object :as gobj]))

(defn- reference-source
  []
  (.toString
   (fs/readFileSync
    (node-path/join (.cwd js/process)
                    "src/main/frontend/components/reference.cljs")
    "utf8")))

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

(deftest linked-and-unlinked-references-use-only-the-page-uuid-test
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
                    2)
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
      (is (= [[:block-ref-count page-uuid]] @resource-calls)
          "Unlinked references render their view without a precheck request.")
      (is (= [:linked-references :unlinked-references]
             (mapv :view-feature-type @view-calls)))
      (is (every? #(= page-uuid (:view-parent-uuid %)) @view-calls))
      (is (not-any? #(map? (:view-parent %)) @view-calls)
          "Reference views never retain a graph entity as membership state."))))

(deftest references-have-no-mount-time-loader-or-local-membership-copy-test
  (let [source (reference-source)]
    (is (string/includes? source "db-hooks/use-block"))
    (is (string/includes? source "db-hooks/use-resource"))
    (is (string/includes? source ":block-ref-count"))
    (is (string/includes? source ":linked-references"))
    (is (string/includes? source ":unlinked-references"))
    (testing "membership is owned by the mounted view-data resource"
      (doseq [forbidden ["[frontend.db.async"
                         "state/<invoke-db-worker"
                         ":thread-api/block-refs-check"
                         "hooks/use-effect"
                         "hooks/use-state"
                         "p/let"
                         "react/q"
                         "db-hooks/use-query"
                         ":db/id"]]
        (is (not (string/includes? source forbidden))
            (str "Reference UI retains a local loader: " forbidden))))))
