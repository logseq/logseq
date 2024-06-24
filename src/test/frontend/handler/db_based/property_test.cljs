(ns frontend.handler.db-based.property-test
  (:require [logseq.outliner.property :as outliner-property]
            [frontend.db :as db]
            [clojure.test :refer [deftest is testing use-fixtures]]
            [frontend.test.helper :as test-helper]
            [datascript.core :as d]))

(def init-data (test-helper/initial-test-page-and-blocks))
(defn start-and-destroy-db
  [f]
  (test-helper/db-based-start-and-destroy-db
   f
   {:init-data (fn [conn] (d/transact! conn init-data))}))

;; init page id
;; (def pid (:block/uuid (first init-data)))
;; first block id
(def fbid (:block/uuid (second init-data)))

(use-fixtures :each start-and-destroy-db)

;; collapse-expand-property!
(deftest collapse-expand-property-test
  (testing "Collapse and expand property"
    (let [conn (db/get-db false)
          fb (db/entity [:block/uuid fbid])
          k :user.property/property-1]
      ;; add property
      (outliner-property/upsert-property! conn k {:type :default} {})
      (let [property (db/entity k)]
        (outliner-property/create-property-text-block! conn
                                                       (:db/id fb)
                                                       (:db/id property)
                                                       "Block content"
                                                       {})
            ;; collapse property-1
        (outliner-property/collapse-expand-block-property! conn (:db/id fb) (:db/id property) true)
        (is (=
             [(:db/id property)]
             (map :db/id (:block/collapsed-properties (db/entity [:block/uuid fbid])))))

            ;; expand property-1
        (outliner-property/collapse-expand-block-property! conn (:db/id fb) (:db/id property) false)
        (is (nil? (:block/collapsed-properties (db/entity [:block/uuid fbid]))))))))


#_(cljs.test/run-tests)
