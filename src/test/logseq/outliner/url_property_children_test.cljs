(ns logseq.outliner.url-property-children-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(defn- child-titles
  [block]
  (->> (:block/_parent block)
       ldb/sort-by-order
       (mapv :block/title)))

(deftest url-property-value-rejects-children
  (testing "insert as child of a URL property value is rejected"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:url {:logseq.property/type :url}}
                 :pages-and-blocks
                 [{:page {:block/title "page1"
                          :build/properties {:url "https://logseq.com"}}
                   :blocks [{:block/title "sibling"}]}]})
          url-value (db-test/find-block-by-content @conn "https://logseq.com")]
      (is (= :url (:logseq.property/type (:logseq.property/created-from-property url-value))))
      (outliner-core/insert-blocks!
       conn
       [{:block/uuid (random-uuid)
         :block/title "url child"}]
       url-value
       {:sibling? false
        :keep-uuid? true})
      (let [url-value' (d/entity @conn (:db/id url-value))]
        (is (empty? (child-titles url-value')))
        (is (nil? (db-test/find-block-by-content @conn "url child"))))))

  (testing "indent under a URL property value is rejected"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:url-many {:logseq.property/type :url
                                         :db/cardinality :db.cardinality/many}}
                 :pages-and-blocks
                 [{:page {:block/title "page1"
                          :build/properties {:url-many #{"https://a.example"
                                                         "https://b.example"}}}}]})
          page (ldb/get-page @conn "page1")
          [url-a url-b] (->> (:user.property/url-many page)
                             ldb/sort-by-order)
          left (ldb/get-left-sibling url-b)
          original-parent-id (:db/id (:block/parent url-b))]
      (is (= 2 (count [url-a url-b])))
      (is (= (:db/id url-a) (:db/id left))
          "The later URL value is a property-value sibling of the earlier one")
      (outliner-core/indent-outdent-blocks! conn [url-b] true)
      (let [url-a' (d/entity @conn (:db/id url-a))
            url-b' (d/entity @conn (:db/id url-b))]
        (is (empty? (child-titles url-a')))
        (is (= original-parent-id (:db/id (:block/parent url-b')))))))

  (testing "move as child of a URL property value is rejected"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:url {:logseq.property/type :url}}
                 :pages-and-blocks
                 [{:page {:block/title "page1"
                          :build/properties {:url "https://logseq.com"}}
                   :blocks [{:block/title "sibling"}]}]})
          url-value (db-test/find-block-by-content @conn "https://logseq.com")
          sibling (db-test/find-block-by-content @conn "sibling")
          original-parent-id (:db/id (:block/parent sibling))]
      (outliner-core/move-blocks! conn [sibling] url-value {:sibling? false})
      (let [url-value' (d/entity @conn (:db/id url-value))
            sibling' (d/entity @conn (:db/id sibling))]
        (is (empty? (child-titles url-value')))
        (is (= original-parent-id (:db/id (:block/parent sibling')))))))

  (testing "sibling insert next to a URL property value still works"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:url {:logseq.property/type :url}}
                 :pages-and-blocks
                 [{:page {:block/title "page1"
                          :build/properties {:url "https://logseq.com"}}}]})
          url-value (db-test/find-block-by-content @conn "https://logseq.com")]
      (outliner-core/insert-blocks!
       conn
       [{:block/uuid (random-uuid)
         :block/title "after url"}]
       url-value
       {:sibling? true
        :keep-uuid? true})
      (let [inserted (db-test/find-block-by-content @conn "after url")
            url-value' (d/entity @conn (:db/id url-value))]
        (is (some? inserted))
        (is (= (:db/id (:block/parent url-value'))
               (:db/id (:block/parent inserted))))
        (is (empty? (child-titles url-value')))))))

(deftest default-property-value-allows-children
  (testing "insert as child of a default/text property value is allowed"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:default {:logseq.property/type :default}}
                 :pages-and-blocks
                 [{:page {:block/title "page1"
                          :build/properties {:default "text value"}}}]})
          text-value (db-test/find-block-by-content @conn "text value")]
      (is (= :default (:logseq.property/type (:logseq.property/created-from-property text-value))))
      (outliner-core/insert-blocks!
       conn
       [{:block/uuid (random-uuid)
         :block/title "text child"}]
       text-value
       {:sibling? false
        :keep-uuid? true})
      (let [text-value' (d/entity @conn (:db/id text-value))]
        (is (= ["text child"] (child-titles text-value'))))))

  (testing "indent under a default/text property value is allowed"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:default-many {:logseq.property/type :default
                                             :db/cardinality :db.cardinality/many}}
                 :pages-and-blocks
                 [{:page {:block/title "page1"
                          :build/properties {:default-many #{"text a" "text b"}}}}]})
          page (ldb/get-page @conn "page1")
          [text-a text-b] (->> (:user.property/default-many page)
                               ldb/sort-by-order)
          left (ldb/get-left-sibling text-b)]
      (is (= 2 (count [text-a text-b])))
      (is (= (:db/id text-a) (:db/id left))
          "The later text value is a property-value sibling of the earlier one")
      (outliner-core/indent-outdent-blocks! conn [text-b] true)
      (let [text-a' (d/entity @conn (:db/id text-a))
            text-b' (d/entity @conn (:db/id text-b))]
        (is (= [(:block/title text-b)] (child-titles text-a')))
        (is (= (:db/id text-a') (:db/id (:block/parent text-b'))))))))
