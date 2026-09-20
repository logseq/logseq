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

(defn- undo-move!
  [conn value dest]
  (let [db-before @conn
        value-uuid (:block/uuid value)
        dest-uuid (:block/uuid dest)
        tx-meta {:outliner-op :move-blocks
                 :outliner-ops [[:move-blocks [[value-uuid]
                                               dest-uuid
                                               {:sibling? false}]]]}]
    (outliner-core/move-blocks! conn [value] dest {:sibling? false})
    (let [{:keys [inverse-outliner-ops]}
          (op-construct/derive-history-outliner-ops
           db-before @conn [] tx-meta)]
      (is (seq inverse-outliner-ops)
          "Move has an inverse op")
      (outliner-op/apply-ops! conn inverse-outliner-ops {})
      inverse-outliner-ops)))

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
