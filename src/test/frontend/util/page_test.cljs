(ns frontend.util.page-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.db.subs :as db-subs]
            [frontend.state :as state]
            [frontend.util.page :as page-util]))

(def ^:private page-uuid #uuid "11111111-1111-1111-1111-111111111111")
(def ^:private other-page-uuid #uuid "33333333-3333-3333-3333-333333333333")
(def ^:private block-uuid #uuid "22222222-2222-2222-2222-222222222222")

(deftest get-current-page-uses-route-when-editor-args-are-cleared
  (testing "Ctrl+K clears editor state; the open page route still identifies the page"
    (with-redefs [state/get-current-page (constantly (str page-uuid))
                  state/get-editor-args (constantly nil)]
      (is (= [:block/uuid page-uuid] (page-util/get-current-page-id)))
      (is (= page-uuid (page-util/get-current-page-uuid))))))

(deftest get-current-page-prefers-route-over-stale-editor-args
  (testing "The visible page wins over a stale last-edited block"
    (with-redefs [state/get-current-page (constantly (str page-uuid))
                  state/get-editor-args
                  (constantly [{:block {:db/id 99
                                        :block/page {:db/id 88
                                                     :block/uuid other-page-uuid}}}])]
      (is (= [:block/uuid page-uuid] (page-util/get-current-page-id)))
      (is (= page-uuid (page-util/get-current-page-uuid))))))

(deftest get-current-page-falls-back-to-editor-args-without-route
  (testing "Non-page routes still use the last edited block's page"
    (with-redefs [state/get-current-page (constantly nil)
                  state/get-current-route (constantly :home)
                  state/get-editor-args
                  (constantly [{:block {:db/id 7
                                        :block/page {:db/id 5
                                                     :block/uuid page-uuid}}}])]
      (is (= 5 (page-util/get-current-page-id)))
      (is (= page-uuid (page-util/get-current-page-uuid))))))

(deftest get-current-page-resolves-name-route-via-page-identity
  (testing "Title-addressed :page routes resolve through the :page-identity snapshot"
    (with-redefs [state/get-current-page (constantly "qa-b-sentinel")
                  db-subs/resource-snapshot
                  (fn [key]
                    (if (= key [:page-identity "qa-b-sentinel"])
                      {:status :ready :value page-uuid}
                      {:status :loading}))
                  state/get-editor-args (constantly nil)]
      (is (= [:block/uuid page-uuid] (page-util/get-current-page-id)))
      (is (= page-uuid (page-util/get-current-page-uuid))))))

(deftest get-current-page-resolves-zoomed-block-to-host-page
  (testing "A :page route on a block uuid resolves to the block's host page"
    (let [host {:db/id 5 :block/uuid page-uuid}
          zoomed {:db/id 9
                  :block/uuid block-uuid
                  :block/page host}]
      (with-redefs [state/get-current-page (constantly (str block-uuid))
                    db-subs/block-snapshot
                    (fn [id]
                      (if (= id block-uuid)
                        {:status :ready :value zoomed}
                        {:status :loading}))
                    state/get-editor-args (constantly nil)]
        (is (= 5 (page-util/get-current-page-id)))
        (is (= page-uuid (page-util/get-current-page-uuid)))))))

(deftest get-current-page-resolves-page-block-route-to-host-page
  (testing ":page-block routes resolve the zoomed heading through :route-block, then its host page"
    (let [zoomed {:db/id 9
                  :block/uuid block-uuid
                  :block/page {:db/id 5 :block/uuid page-uuid}}]
      (with-redefs [state/get-current-page (constantly nil)
                    state/get-current-route (constantly :page-block)
                    state/get-route-match
                    (constantly {:data {:name :page-block}
                                 :path-params {:name "qa-b-sentinel"
                                               :block-route-name "only in graph b"}})
                    db-subs/resource-snapshot
                    (fn [key]
                      (if (= key [:route-block "qa-b-sentinel" "only in graph b"])
                        {:status :ready :value block-uuid}
                        {:status :loading}))
                    db-subs/block-snapshot
                    (fn [id]
                      (if (= id block-uuid)
                        {:status :ready :value zoomed}
                        {:status :loading}))
                    state/get-editor-args (constantly nil)]
        (is (= 5 (page-util/get-current-page-id)))
        (is (= page-uuid (page-util/get-current-page-uuid)))))))
