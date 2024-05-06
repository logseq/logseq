(ns frontend.handler.db-based.property-async-test
  (:require [frontend.handler.db-based.property :as db-property-handler]
            [frontend.db :as db]
            [clojure.test :refer [is testing async use-fixtures]]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [datascript.core :as d]
            [promesa.core :as p]
            [frontend.db.conn :as conn]
            [frontend.state :as state]
            [frontend.handler.editor :as editor-handler]))

(def repo test-helper/test-db-name-db-version)

(def init-data (test-helper/initial-test-page-and-blocks))

(def fbid (:block/uuid (second init-data)))

(use-fixtures :each
  {:before (fn []
             (async done
                    (test-helper/start-test-db! {:db-graph? true})
                    (p/let [_tx-report (d/transact! (conn/get-db repo false) init-data)]
                      (done))))
   :after test-helper/destroy-test-db!})

;; property-create-new-block
;; get-property-block-created-block
(deftest-async text-block-test
  (testing "Add property and create a block value"
    (let [repo (state/get-current-repo)
          fb (db/entity [:block/uuid fbid])
          k :user.property/property-1]
      (p/do!
       ;; add property
       (db-property-handler/upsert-property! repo k {:type :default} {})
       (p/let [property (db/entity k)
               {:keys [block-id]} (db-property-handler/create-property-text-block! fb property "Block content" editor-handler/wrap-parse-block {})
               {:keys [from-property-id]} (db-property-handler/get-property-block-created-block [:block/uuid block-id])]
         (is (= from-property-id (:db/id property))))))))

;; collapse-expand-property!
(deftest-async collapse-expand-property-test
  (testing "Collapse and expand property"
    (let [repo (state/get-current-repo)
          fb (db/entity [:block/uuid fbid])
          k :user.property/property-1]
      (p/do!
       ;; add property
       (db-property-handler/upsert-property! repo k {:type :default} {})
       (let [property (db/entity k)]
         (p/do!
          (db-property-handler/create-property-text-block! fb property "Block content" editor-handler/wrap-parse-block {})
            ;; collapse property-1
          (db-property-handler/collapse-expand-property! repo fb property true)
          (is (=
               [(:db/id property)]
               (map :db/id (:block/collapsed-properties (db/entity [:block/uuid fbid])))))

            ;; expand property-1
          (db-property-handler/collapse-expand-property! repo fb property false)
          (is (nil? (:block/collapsed-properties (db/entity [:block/uuid fbid]))))))))))
