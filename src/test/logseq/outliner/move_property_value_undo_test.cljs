(ns logseq.outliner.move-property-value-undo-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
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

(defn- promote-moved-block-to-page!
  "Mirrors worker pipeline/toggle-page-and-block when a block is moved to Library."
  [conn block]
  (let [id (:db/id block)
        entity (d/entity @conn id)
        children-page-tx (keep (fn [child-id]
                                 (let [child (d/entity @conn child-id)]
                                   (when (and child (not (ldb/page? child)))
                                     {:db/id child-id
                                      :block/page id})))
                               (ldb/get-block-full-children-ids @conn id))]
    (d/transact! conn
                 (concat
                  [{:db/id id
                    :block/name (common-util/page-name-sanity-lc (:block/title entity))
                    :block/tags :logseq.class/Page}
                   [:db/retract id :block/page]]
                  children-page-tx))))

(defn- undo-library-move!
  [conn value]
  (let [value-uuid (:block/uuid value)
        library (ldb/get-library-page @conn)
        library-uuid (:block/uuid library)
        tx-meta {:outliner-op :move-blocks
                 :outliner-ops [[:move-blocks [[value-uuid]
                                               library-uuid
                                               {:sibling? false}]]]}]
    (assert library "Library page exists")
    (undo-op! conn tx-meta
              #(do
                 (outliner-core/move-blocks! conn [value] library {:sibling? false})
                 (let [moved (d/entity @conn [:block/uuid value-uuid])]
                   (is (some? moved) "Moved value still exists")
                   (is (= (:db/id library) (:db/id (:block/parent moved)))
                       "Value is under Library before page promotion")
                   (promote-moved-block-to-page! conn moved)
                   (let [page (d/entity @conn [:block/uuid value-uuid])]
                     (is (ldb/page? page) "Library move promotes the value to a page")
                     (is (nil? (:logseq.property/created-from-property page))
                         "Promotion is not still marked as a property value")))))))

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

(deftest undo-library-move-restores-text-and-url-property-values
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
            library (ldb/get-library-page @conn)
            value (get node property-ident)
            value-uuid (:block/uuid value)]
        (is (some? library) "Built-in Library page exists")
        (is (some? (:db/id value)))
        (is (= property-ident
               (:db/ident (:logseq.property/created-from-property value))))
        (is (= ["child"] (child-titles node)))

        (let [inverse (undo-library-move! conn value)
              restored (d/entity @conn [:block/uuid value-uuid])
              node' (d/entity @conn (:db/id node))
              library' (d/entity @conn (:db/id library))]
          (is (= :move-blocks (ffirst inverse)))
          (is (= property-ident
                 (get-in inverse [0 1 2 :created-from-property]))
              "Inverse move reattaches the original property identity")
          (is (not (ldb/page? restored))
              "Undo demotes the Library page back to a block")
          (is (nil? (:block/name restored)))
          (is (= property-ident
                 (:db/ident (:logseq.property/created-from-property restored)))
              "Undo restores the block as a property value")
          (is (= (:db/id restored)
                 (:db/id (get node' property-ident)))
              "The node still owns the property value")
          (is (= (:db/id node')
                 (:db/id (:block/parent restored))))
          (is (= (:db/id (:block/page node'))
                 (:db/id (:block/page restored)))
              "The restored value belongs to the original page")
          (is (= ["child"] (child-titles node'))
              "The restored value is not a normal child block")
          (is (not= (:db/id library')
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
