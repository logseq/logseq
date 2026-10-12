(ns logseq.outliner.property-mutation2-app-test
  "Second-run mutation survivors in logseq.outliner.property that only the app
  build reaches: positioned properties read :block.temp/property-keys and
  :logseq.property/hide-empty-value through entity-plus (nbb lacks it)."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.property :as outliner-property]))

(defn- positioned-idents
  "The idents of the block's :properties-position properties, without the block's own :block/tags."
  [db block-id]
  (->> (outliner-property/get-block-positioned-properties db block-id :properties)
       (map :db/ident)
       (remove #{:block/tags})))

(deftest positioned-properties-include-own-and-class-properties-once
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:c1 {:build/class-properties [:p1 :shared]}}
               :properties {:p1 {:logseq.property/type :default}
                            :shared {:logseq.property/type :default}
                            :own {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"
                                             :build/tags [:c1]
                                             :build/properties {:shared "s" :own "o"}}]}]})
        b1-id (:db/id (db-test/find-block-by-content @conn "b1"))
        idents (positioned-idents @conn b1-id)]
    (is (= #{:user.property/own :user.property/shared :user.property/p1} (set idents)))
    (is (= 3 (count idents)))))

(deftest hidden-properties-are-not-positioned
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:c1 {:build/class-properties [:shown :hide-empty :hidden]}}
               :properties {:shown {:logseq.property/type :default}
                            :hide-empty {:logseq.property/type :default}
                            :hidden {:logseq.property/type :default :logseq.property/hide? true}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1" :build/tags [:c1]}]}]})
        b1-id (:db/id (db-test/find-block-by-content @conn "b1"))]
    (d/transact! conn [{:db/id (:db/id (d/entity @conn :user.property/hide-empty))
                        :logseq.property/hide-empty-value true}])
    (is (= [:user.property/shown] (positioned-idents @conn b1-id)))))

(deftest tag-class-pages-leave-out-properties-of-their-own-tags
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:m {:build/class-properties [:owner]}
                         :k {}}
               :properties {:owner {:logseq.property/type :default}}})
        k-id (:db/id (d/entity @conn :user.class/k))]
    (d/transact! conn [[:db/add k-id :block/tags (:db/id (d/entity @conn :user.class/m))]])
    (is (contains? (set (map :db/ident (:block/tags (d/entity @conn k-id)))) :user.class/m))
    (is (not (contains? (set (positioned-idents @conn k-id)) :user.property/owner)))))

(deftest task-subclass-blocks-position-their-empty-class-properties
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:project {:build/class-extends [:logseq.class/Task]
                                   :build/class-properties [:owner]}}
               :properties {:owner {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1" :build/tags [:project]}]}]})
        b1-id (:db/id (db-test/find-block-by-content @conn "b1"))]
    (is (contains? (set (positioned-idents @conn b1-id)) :user.property/owner))))

(deftest positioned-properties-are-sorted-by-property-order
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}
                            :p2 {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1" :build/properties {:p1 "one" :p2 "two"}}]}]})
        b1-id (:db/id (db-test/find-block-by-content @conn "b1"))
        unordered (vec (positioned-idents @conn b1-id))]
    (is (= 2 (count unordered)))
    (d/transact! conn [[:db/add (:db/id (d/entity @conn (first unordered))) :block/order "a1"]
                       [:db/add (:db/id (d/entity @conn (second unordered))) :block/order "a0"]])
    (is (= (vec (reverse unordered)) (positioned-idents @conn b1-id)))))
