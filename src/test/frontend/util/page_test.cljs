(ns frontend.util.page-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.state :as state]
            [frontend.util.page :as page-util]
            [promesa.core :as p]))

(def ^:private route-uuid #uuid "00000000-0000-0000-0000-000000000001")

(def ^:private stale-editor-args
  [{:block {:db/id 20
            :block/page {:db/id 10
                         :block/uuid #uuid "00000000-0000-0000-0000-000000000002"}}}])

(defn- <current-page-id
  "Resolves `page-util/<get-current-page-id` with the given route, editor args and
   the entity that the worker finds for the route's uuid"
  [{:keys [route editor-args route-entity]}]
  (p/with-redefs [state/get-current-page (constantly route)
                  state/get-editor-args (constantly editor-args)
                  state/<invoke-db-worker (fn [api _repo _selector lookup]
                                            (is (= :thread-api/pull api))
                                            (is (= [:block/uuid route-uuid] lookup))
                                            (p/resolved route-entity))]
    (page-util/<get-current-page-id)))

(deftest get-current-page-id-test
  (async done
    (-> (p/let [route (str route-uuid)
                from-page-route (<current-page-id {:route route
                                                   :route-entity {:db/id 40}})
                from-page-route-with-stale-editor (<current-page-id {:route route
                                                                     :editor-args stale-editor-args
                                                                     :route-entity {:db/id 40}})
                from-block-route (<current-page-id {:route route
                                                    :editor-args stale-editor-args
                                                    :route-entity {:db/id 50 :block/page {:db/id 40}}})
                from-missing-route-entity (<current-page-id {:route route
                                                             :editor-args stale-editor-args
                                                             :route-entity nil})
                from-editor-block-page (<current-page-id {:route nil :editor-args stale-editor-args})
                from-editor-page-block (<current-page-id {:route nil :editor-args [{:block {:db/id 30}}]})
                from-nothing (<current-page-id {:route nil :editor-args nil})]
          (testing "uses the page in the route when the editor state is cleared"
            (is (= 40 from-page-route)))
          (testing "prefers the route over the page of the last edited block"
            (is (= 40 from-page-route-with-stale-editor)))
          (testing "uses the page of a block that was opened as a page"
            (is (= 40 from-block-route)))
          (testing "falls back to the editor when the route's entity is not found"
            (is (= 10 from-missing-route-entity)))
          (testing "falls back to the page of the last edited block when not on a page route"
            (is (= 10 from-editor-block-page)))
          (testing "falls back to the last edited block when it is itself a page"
            (is (= 30 from-editor-page-block)))
          (testing "returns nil when there is no page route and no editor state"
            (is (nil? from-nothing))))
        (p/catch (fn [error] (is false (str error))))
        (p/finally done))))
