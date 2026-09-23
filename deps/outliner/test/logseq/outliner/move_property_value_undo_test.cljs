(ns logseq.outliner.move-property-value-undo-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.op.construct :as op-construct]))

(defn- child-titles
  [block]
  (->> (:block/_parent block)
       (remove :logseq.property/created-from-property)
       ldb/sort-by-order
       (mapv :block/title)))

(defn- undo-op!
  [conn tx-meta apply-forward!]
  (let [db-before @conn]
    (apply-forward!)
    (let [{:keys [inverse-outliner-ops]}
          (op-construct/derive-history-outliner-ops
           db-before @conn [] tx-meta)]
      (is (seq inverse-outliner-ops)
          "Forward op has an inverse op")
      (outliner-op/apply-ops! conn inverse-outliner-ops {})
      inverse-outliner-ops)))

(defn- undo-move!
  [conn value dest]
  (let [value-uuid (:block/uuid value)
        dest-uuid (:block/uuid dest)
        tx-meta {:outliner-op :move-blocks
                 :outliner-ops [[:move-blocks [[value-uuid]
                                               dest-uuid
                                               {:sibling? false}]]]}]
    (undo-op! conn tx-meta
              #(outliner-core/move-blocks! conn [value] dest {:sibling? false}))))

(defn- undo-delete!
  [conn value]
  (let [value-uuid (:block/uuid value)
        tx-meta {:outliner-op :delete-blocks
                 :outliner-ops [[:delete-blocks [[value-uuid] {}]]]}]
    (undo-op! conn tx-meta
              #(outliner-core/delete-blocks! conn [value] {}))))

(deftest undo-move-restores-text-and-url-property-values
  (doseq [[property-type property-key value-title]
          [[:default :p-text "text property value"]
           [:url :p-url "https://logseq.com"]]]
    (testing (str (name property-type) " property value")
      (let [conn (db-test/create-conn-with-blocks
                  {:properties {property-key {:logseq.property/type property-type}}
                   :pages-and-blocks
                   [{:page {:block/title "page"}
                     :blocks [{:block/title "node"
                               :build/properties {property-key value-title}
                               :build/children [{:block/title "child"}]}
                              {:block/title "dest"}]}]})
            property-ident (keyword "user.property" (name property-key))
            node (db-test/find-block-by-content @conn "node")
            dest (db-test/find-block-by-content @conn "dest")
            value (get node property-ident)
            value-uuid (:block/uuid value)]
        (is (some? (:db/id value)))
        (is (= property-ident
               (:db/ident (:logseq.property/created-from-property value))))
        (is (= ["child"] (child-titles node)))

        (let [inverse (undo-move! conn value dest)
              restored (d/entity @conn [:block/uuid value-uuid])
              node' (d/entity @conn (:db/id node))
              dest' (d/entity @conn (:db/id dest))]
          (is (= :move-blocks (ffirst inverse)))
          (is (= property-ident
                 (get-in inverse [0 1 2 :created-from-property]))
              "Inverse move reattaches the original property identity")
          (is (= property-ident
                 (:db/ident (:logseq.property/created-from-property restored)))
              "Undo restores the block as a property value")
          (is (= (:db/id restored)
                 (:db/id (get node' property-ident)))
              "The node still owns the property value")
          (is (= (:db/id node')
                 (:db/id (:block/parent restored))))
          (is (= ["child"] (child-titles node'))
              "The restored value is not a normal child block")
          (is (not= (:db/id dest')
                    (:db/id (:block/parent restored)))))))))

(deftest undo-delete-restores-text-and-url-property-values
  (doseq [[property-type property-key value-title]
          [[:default :p-text "text property value"]
           [:url :p-url "https://logseq.com"]]]
    (testing (str (name property-type) " property value")
      (let [conn (db-test/create-conn-with-blocks
                  {:properties {property-key {:logseq.property/type property-type}}
                   :pages-and-blocks
                   [{:page {:block/title "page"}
                     :blocks [{:block/title "node"
                               :build/properties {property-key value-title}
                               :build/children [{:block/title "child"}]}]}]})
            property-ident (keyword "user.property" (name property-key))
            node (db-test/find-block-by-content @conn "node")
            value (get node property-ident)
            value-uuid (:block/uuid value)]
        (is (some? (:db/id value)))
        (is (= property-ident
               (:db/ident (:logseq.property/created-from-property value))))
        (is (= ["child"] (child-titles node)))

        (let [inverse (undo-delete! conn value)
              restored (d/entity @conn [:block/uuid value-uuid])
              node' (d/entity @conn (:db/id node))]
          (is (= :insert-blocks (ffirst inverse)))
          (is (= property-ident
                 (get-in inverse [0 1 2 :created-from-property]))
              "Inverse insert reattaches the original property identity")
          (is (= property-ident
                 (:db/ident (:logseq.property/created-from-property restored)))
              "Undo restores the block as a property value")
          (is (= (:db/id restored)
                 (:db/id (get node' property-ident)))
              "The node still owns the property value")
          (is (= (:db/id node')
                 (:db/id (:block/parent restored))))
          (is (= ["child"] (child-titles node'))
              "The restored value is not a normal child block"))))))

(deftest moving-non-page-or-non-normal-page-to-library-is-rejected
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p-text {:logseq.property/type :default}}
               :classes {:SomeTag {}}
               :pages-and-blocks
               [{:page {:block/title "page"}
                 :blocks [{:block/title "node"}]}
                {:page {:block/title "normal page"}}]})
        library (ldb/get-library-page @conn)]
    (is (some? library) "Built-in Library page exists")
    (doseq [[label entity] [["block" (db-test/find-block-by-content @conn "node")]
                            ["class" (d/entity @conn :user.class/SomeTag)]
                            ["property" (d/entity @conn :user.property/p-text)]]]
      (testing (str "moving a " label " to Library is a no-op")
        (outliner-core/move-blocks! conn [entity] library {:sibling? false})
        (is (not= (:db/id library)
                  (:db/id (:block/parent (d/entity @conn (:db/id entity)))))
            (str "The " label " was not moved"))))
    (testing "moving a normal page to Library is allowed"
      (let [page (db-test/find-page-by-title @conn "normal page")]
        (outliner-core/move-blocks! conn [page] library {:sibling? false})
        (is (= (:db/id library)
               (:db/id (:block/parent (d/entity @conn (:db/id page))))))))))

(deftest undo-delete-restores-many-text-property-values
  (doseq [value-title ["alpha" "beta"]]
    (testing (str "delete " value-title)
      (let [conn (db-test/create-conn-with-blocks
                  {:properties {:p-many {:logseq.property/type :default
                                         :db/cardinality :many}}
                   :pages-and-blocks
                   [{:page {:block/title "page"}
                     :blocks [{:block/title "node"
                               :build/properties {:p-many #{"alpha" "beta"}}
                               :build/children [{:block/title "child"}]}]}]})
            node (db-test/find-block-by-content @conn "node")
            values (:user.property/p-many node)
            value (some #(when (= value-title (:block/title %)) %) values)
            value-uuid (:block/uuid value)]
        (is (some? (:db/id value)))
        (let [inverse (undo-delete! conn value)
              restored (d/entity @conn [:block/uuid value-uuid])
              node' (d/entity @conn (:db/id node))]
          (is (= :insert-blocks (ffirst inverse)))
          (is (= :user.property/p-many
                 (get-in inverse [0 1 2 :created-from-property])))
          (is (= :user.property/p-many
                 (:db/ident (:logseq.property/created-from-property restored))))
          (is (= #{(:db/id restored)}
                 (->> (:user.property/p-many node')
                      (filter #(= value-title (:block/title %)))
                      (map :db/id)
                      set)))
          (is (= 2 (count (:user.property/p-many node'))))
          (is (= ["child"] (child-titles node'))))))))
