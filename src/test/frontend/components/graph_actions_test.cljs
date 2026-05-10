(ns frontend.components.graph-actions-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.graph-actions :as graph-actions]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]))

(deftest activate-node-uses-worker-payload
  (let [redirects* (atom [])
        sidebar* (atom [])
        page-node {:db-id 101 :uuid "11111111-1111-1111-1111-111111111111" :page? true}
        block-node {:db-id 202 :uuid "22222222-2222-2222-2222-222222222222" :page? false}]
    (with-redefs [route-handler/redirect-to-page! (fn [uuid]
                                                    (swap! redirects* conj uuid))
                  state/get-current-repo (constantly "logseq_db_test")
                  state/sidebar-add-block! (fn [repo db-id block-type]
                                             (swap! sidebar* conj [repo db-id block-type]))]
      (graph-actions/activate-node! page-node #js {:shiftKey false})
      (graph-actions/activate-node! page-node #js {:shiftKey true})
      (graph-actions/activate-node! block-node #js {:shiftKey true})

      (is (= ["11111111-1111-1111-1111-111111111111"] @redirects*))
      (is (= [["logseq_db_test" 101 :page]
              ["logseq_db_test" 202 :block]]
             @sidebar*)))))

(deftest redirect-to-node-prefers-block-uuid-over-label
  (let [redirects* (atom [])
        page-uuid #uuid "33333333-3333-3333-3333-333333333333"
        page-node {:db-id 303
                   :block/uuid page-uuid
                   :page? true
                   :label "Ordinary Page"}]
    (with-redefs [route-handler/redirect-to-page! (fn [page-ref]
                                                    (swap! redirects* conj page-ref))]
      (graph-actions/redirect-to-node! page-node)

      (is (= [page-uuid] @redirects*)))))

(deftest redirect-to-node-requires-uuid
  (let [redirects* (atom [])]
    (with-redefs [route-handler/redirect-to-page! (fn [page-ref]
                                                    (swap! redirects* conj page-ref))]
      (graph-actions/redirect-to-node! {:db-id 404
                                        :page? true
                                        :label "Ordinary Page"})

      (is (empty? @redirects*)))))
