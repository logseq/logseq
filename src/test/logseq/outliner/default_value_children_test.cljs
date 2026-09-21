(ns logseq.outliner.default-value-children-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.property :as outliner-property]))

(defn- child-titles
  [block]
  (->> (:block/_parent block)
       ldb/sort-by-order
       (mapv :block/title)))

(defn- create-text-property-with-default-value
  [title]
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "sibling"}]}]})
        property (d/entity @conn :user.property/p1)]
    (outliner-property/create-property-text-block!
     conn (:db/id property) :logseq.property/default-value title {})
    (let [property' (d/entity @conn :user.property/p1)
          default-value (:logseq.property/default-value property')]
      {:conn conn
       :property property'
       :default-value default-value
       :sibling (db-test/find-block-by-content @conn "sibling")})))

(deftest default-value-block-rejects-children
  (testing "insert as child of a property default-value is rejected"
    (let [{:keys [conn default-value]} (create-text-property-with-default-value "hello world")]
      (is (= "hello world" (:block/title default-value)))
      (is (= (:db/id default-value)
             (:db/id (:logseq.property/default-value (d/entity @conn :user.property/p1)))))
      (outliner-core/insert-blocks!
       conn
       [{:block/uuid (random-uuid)
         :block/title "nice"}]
       default-value
       {:sibling? false
        :keep-uuid? true})
      (let [default-value' (d/entity @conn (:db/id default-value))]
        (is (empty? (child-titles default-value')))
        (is (nil? (db-test/find-block-by-content @conn "nice"))))))

  (testing "move as child of a property default-value is rejected"
    (let [{:keys [conn default-value sibling]} (create-text-property-with-default-value "hello world")
          original-parent-id (:db/id (:block/parent sibling))]
      (outliner-core/move-blocks! conn [sibling] default-value {:sibling? false})
      (let [default-value' (d/entity @conn (:db/id default-value))
            sibling' (d/entity @conn (:db/id sibling))]
        (is (empty? (child-titles default-value')))
        (is (= original-parent-id (:db/id (:block/parent sibling')))))))

  (testing "regular text property values still allow children"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:p1 {:logseq.property/type :default}}
                 :pages-and-blocks
                 [{:page {:block/title "page1"
                          :build/properties {:p1 "text value"}}}]})
          text-value (db-test/find-block-by-content @conn "text value")]
      (outliner-core/insert-blocks!
       conn
       [{:block/uuid (random-uuid)
         :block/title "text child"}]
       text-value
       {:sibling? false
        :keep-uuid? true})
      (is (= ["text child"] (child-titles (d/entity @conn (:db/id text-value))))))))
