(ns logseq.db.frontend.property.type-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.test.helper :as db-test]))

(deftest asset-property-type-registered
  (testing ":asset is exposed to users"
    (is (some #{:asset} db-property-type/user-built-in-property-types)))

  (testing ":asset is treated as a ref type"
    (is (contains? db-property-type/user-ref-property-types :asset))
    (is (contains? db-property-type/all-ref-property-types :asset)))

  (testing ":asset validator requires a datascript db"
    (is (contains? db-property-type/property-types-with-db :asset)))

  (testing ":asset is deliberately excluded from single-value-only sets"
    (is (not (contains? db-property-type/cardinality-property-types :asset))
        ":asset should not be in cardinality-property-types yet — many-cardinality UI isn't supported")
    (is (not (contains? db-property-type/closed-value-property-types :asset))
        ":asset should not support closed values")))

(deftest asset-entity-validator
  (testing "asset-entity? accepts blocks tagged :logseq.class/Asset and rejects others"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "plain-block"}
                            {:block/title "my-asset"
                             :build/tags [:logseq.class/Asset]}]}]})
          db @conn
          asset-block (db-test/find-block-by-content db "my-asset")
          plain-block (db-test/find-block-by-content db "plain-block")
          ;; asset-entity? is private; reach through the registered schema
          asset-fn (last (:asset db-property-type/built-in-validation-schemas))]
      (is (some? asset-block))
      (is (some? plain-block))
      (testing "asset block validates"
        (is (true? (boolean (asset-fn db (:db/id asset-block))))))
      (testing "non-asset block does not validate"
        (is (not (asset-fn db (:db/id plain-block)))))
      (testing "nonexistent id does not validate"
        (is (not (asset-fn db 9999999)))))))
