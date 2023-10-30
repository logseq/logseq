(ns frontend.db.rtc-test
  (:require ["/frontend/idbkv" :as idb-keyval]
            [cljs.core.async :as async :refer [<! go timeout]]
            [clojure.test :as t :refer [deftest is use-fixtures]]
            [frontend.db.rtc.fixture :as rtc-fixture]
            [frontend.db.rtc.idb-keyval-mock :as idb-keyval-mock :include-macros true]
            [frontend.db.rtc.op :as rtc-op]
            [frontend.handler.page :as page-handler]
            [frontend.test.helper :as test-helper :include-macros true]
            [spy.core :as spy]))

(use-fixtures :each
  test-helper/start-and-destroy-db-map-fixture
  rtc-fixture/listen-test-db-fixture
  rtc-fixture/start-and-stop-rtc-loop-fixture
  rtc-fixture/clear-ops-idb-stores-fixture)


(deftest check-idbkv-mocked
  (idb-keyval-mock/with-reset-idb-keyval-mock reset
    (is (= idb-keyval-mock/Store (type (idb-keyval/newStore "db-name" "store-name"))))
    (reset)))

(deftest rtc-loop-init-test
  (let [ws @(:*ws @rtc-fixture/*test-rtc-state)
        push-data-fn (:push-data-fn ws)
        last-ws-msg (first (spy/last-call push-data-fn))]
    (is (= "register-graph-updates" (:action last-ws-msg)))))


(deftest gen-local-ops-test--create-page
  (t/async
   done
   (idb-keyval-mock/with-reset-idb-keyval-mock reset
     (go
       (page-handler/create! "gen-local-ops-test-1" {:redirect? false :create-first-block? false})
       (<! (timeout 500))
       (let [{:keys [ops]} (<! (rtc-op/<get-ops&local-tx test-helper/test-db))]
         (is (= 1 (count ops)))
         (is (= "update-page" (first (second (first ops))))))
       (reset)
       (done)))))
