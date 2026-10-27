(ns frontend.util.page-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.state :as state]
            [frontend.util.page :as page-util]))

(deftest get-current-page-id-test
  (let [route-page-uuid #uuid "00000000-0000-0000-0000-000000000001"
        stale-editor-args [{:block {:db/id 20
                                    :block/page {:db/id 10
                                                 :block/uuid #uuid "00000000-0000-0000-0000-000000000002"}}}]]
    (testing "uses the page in the route when the editor state is cleared"
      (with-redefs [state/get-current-page (constantly (str route-page-uuid))
                    state/get-editor-args (constantly nil)]
        (is (= [:block/uuid route-page-uuid] (page-util/get-current-page-id)))))

    (testing "prefers the route over the page of the last edited block"
      (with-redefs [state/get-current-page (constantly (str route-page-uuid))
                    state/get-editor-args (constantly stale-editor-args)]
        (is (= [:block/uuid route-page-uuid] (page-util/get-current-page-id)))))

    (testing "falls back to the page of the last edited block when not on a page route"
      (with-redefs [state/get-current-page (constantly nil)
                    state/get-editor-args (constantly stale-editor-args)]
        (is (= 10 (page-util/get-current-page-id)))))

    (testing "falls back to the last edited block when it is itself a page"
      (with-redefs [state/get-current-page (constantly nil)
                    state/get-editor-args (constantly [{:block {:db/id 30}}])]
        (is (= 30 (page-util/get-current-page-id)))))

    (testing "returns nil when there is no page route and no editor state"
      (with-redefs [state/get-current-page (constantly nil)
                    state/get-editor-args (constantly nil)]
        (is (nil? (page-util/get-current-page-id)))))))
