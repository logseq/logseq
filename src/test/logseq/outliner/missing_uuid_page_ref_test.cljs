(ns logseq.outliner.missing-uuid-page-ref-test
  "Saving [[<uuid-with-no-entity>]] must not emit :block/uuid nil (db-test#1372)."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.page :as outliner-page]))

(def ^:private missing-uuid-title "00000000-0000-4000-8000-000000000001")

(defn- missing-uuid-page-ref
  [parsed-uuid]
  {:block/type "page"
   :block/name missing-uuid-title
   :block/title missing-uuid-title
   :block/uuid parsed-uuid})

(deftest save-block-missing-uuid-page-ref-does-not-throw
  (testing "saving [[<uuid-with-no-entity>]] persists plain text instead of rejecting the tx"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "host"}]}])
          host (db-test/find-block-by-content @conn "host")
          parsed-uuid (random-uuid)]
      (is (nil? (outliner-page/create @conn missing-uuid-title {:uuid parsed-uuid})))
      (outliner-core/save-block! conn
                                 {:block/uuid (:block/uuid host)
                                  :block/title (page-ref/->page-ref parsed-uuid)
                                  :block/raw-title (page-ref/->page-ref parsed-uuid)
                                  :block/refs [(missing-uuid-page-ref parsed-uuid)]})
      (let [saved (d/entity @conn (:db/id host))]
        (is (= missing-uuid-title (:block/title saved)))
        (is (empty? (map :block/uuid (:block/refs saved))))
        (is (nil? (d/entity @conn [:block/uuid (parse-uuid missing-uuid-title)])))))))

(deftest apply-ops-missing-uuid-save-does-not-block-sibling-insert
  (testing "a refused/nil page create must not fail an unrelated insert in the same apply-ops batch"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "host"}]}])
          host (db-test/find-block-by-content @conn "host")
          parsed-uuid (random-uuid)
          inserted-uuid (random-uuid)]
      (outliner-op/apply-ops!
       conn
       [[:save-block [{:block/uuid (:block/uuid host)
                       :block/title (page-ref/->page-ref parsed-uuid)
                       :block/raw-title (page-ref/->page-ref parsed-uuid)
                       :block/refs [(missing-uuid-page-ref parsed-uuid)]}
                      {}]]
        [:insert-blocks [[{:block/uuid inserted-uuid
                           :block/title "sibling insert"}]
                         (:block/uuid host)
                         {:sibling? true
                          :keep-uuid? true}]]]
       {})
      (let [saved (d/entity @conn (:db/id host))
            inserted (d/entity @conn [:block/uuid inserted-uuid])]
        (is (= missing-uuid-title (:block/title saved)))
        (is (= "sibling insert" (:block/title inserted)))))))
