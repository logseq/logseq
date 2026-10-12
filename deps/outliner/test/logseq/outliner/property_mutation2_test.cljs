(ns logseq.outliner.property-mutation2-test
  "Second-run mutation survivors in logseq.outliner.property."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.property :as outliner-property]))

(def ^:private always-invalid-schema [:fn (constantly false)])

(defn- capture-tx-metas!
  "Collects the tx-meta of every transaction on conn into the returned atom."
  [conn]
  (let [tx-metas (atom [])]
    (d/listen! conn ::capture (fn [tx-report] (swap! tx-metas conj (:tx-meta tx-report))))
    tx-metas))

(defn- tx-meta-of
  "Runs f and returns the tx-meta of the last transaction it made on conn."
  [conn f]
  (let [tx-metas (capture-tx-metas! conn)]
    (f)
    (d/unlisten! conn ::capture)
    (select-keys (last @tx-metas) [:outliner-op :property-id])))

;; Fails if, in `throw-error-if-read-only-property`, the body becomes `nil`.
;; Fails if, in `raw-set-block-property!`, `:db/ident` becomes `:db/retract`.
(deftest read-only-property-edits-throw-the-read-only-error
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])
        b1 (db-test/find-block-by-content @conn "b1")
        read-only-message #"Read-only property value shouldn't be edited"]
    (is (thrown-with-msg? js/Error read-only-message
                          (outliner-property/set-block-property! conn (:db/id b1) :logseq.property/built-in? true)))
    (is (thrown-with-msg? js/Error read-only-message
                          (outliner-property/batch-set-property! conn [(:block/uuid b1)] :logseq.property/built-in? true)))
    (is (thrown-with-msg? js/Error read-only-message
                          (outliner-property/batch-remove-property! conn [(:block/uuid b1)] :logseq.property/built-in?)))
    (is (thrown-with-msg? js/Error read-only-message
                          (outliner-property/remove-block-property! conn (:db/id b1) :logseq.property/built-in?)))
    (is (thrown-with-msg? js/Error read-only-message
                          (outliner-property/create-property-text-block!
                           conn (:db/id b1) :logseq.property/built-in? "x" {})))))

;; Fails if, in `validate-property-value-aux`, the body becomes `nil`.
;; Fails if, in `validate-property-value`, the body becomes `nil`, `:logseq.property/type` becomes `:logseq.property/ui-position`, `:db.cardinality/many` becomes `:db.cardinality/one`, `:db/cardinality` becomes `:db/id` or the `:many?` key is dropped.
(deftest validate-property-value-wraps-single-value-for-many-properties
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:dt-many {:logseq.property/type :datetime :db/cardinality :db.cardinality/many}
                            :dt {:logseq.property/type :datetime}}})
        db @conn
        many-property (d/entity db :user.property/dt-many)
        one-property (d/entity db :user.property/dt)
        timestamp 1700000000000]
    (is (nil? (outliner-property/validate-property-value db many-property timestamp)))
    (is (= ["should be a datetime"] (outliner-property/validate-property-value db many-property "x")))
    (is (nil? (outliner-property/validate-property-value db one-property timestamp)))
    (is (= ["should be a datetime"] (outliner-property/validate-property-value db one-property #{timestamp})))
    (is (= ["should be a datetime"] (outliner-property/validate-property-value db one-property "x")))))

;; Fails if, in `validate!`, `:db/valueType` becomes `:db/add` or `:logseq.property/empty-placeholder` becomes `:logseq.property/hide-empty-value`.
(deftest validate!-skips-empty-placeholder-only-for-ref-properties
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:txt {:logseq.property/type :default}
                            :dt {:logseq.property/type :datetime}}})
        ref-property (d/entity @conn :user.property/txt)
        non-ref-property (d/entity @conn :user.property/dt)
        validate! #'outliner-property/validate!]
    (is (nil? (validate! ref-property always-invalid-schema :logseq.property/empty-placeholder)))
    (is (thrown-with-msg? js/Error #"Schema validation failed"
                          (validate! ref-property always-invalid-schema :logseq.property/hide-empty-value)))
    (is (thrown-with-msg? js/Error #"Schema validation failed"
                          (validate! non-ref-property always-invalid-schema :logseq.property/empty-placeholder)))))

;; Fails if, in `throw-error-if-invalid-new-property-value`, the body becomes `nil`.
(deftest batch-set-property-validates-a-new-default-value
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:txt {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        b1 (db-test/find-block-by-content @conn "b1")]
    (is (thrown-with-msg? js/Error #"Schema validation failed"
                          (outliner-property/batch-set-property! conn [(:block/uuid b1)] :user.property/txt true)))))

;; Fails if, in `update-property`, the `:outliner-op` key is dropped, the `:property-id` key is dropped or `:db/id` becomes `:db/ident`.
;; Fails if, in `create-property-text-block!`, the `:outliner-op` key is dropped.
;; Fails if, in `batch-remove-property!`, the `:outliner-op` key is dropped.
;; Fails if, in `remove-block-property!`, `:logseq.property/status` becomes `:logseq.property/template-applied-to`.
;; Fails if, in `upsert-property!`, the `:outliner-op` key is dropped.
;; Fails if, in `batch-delete-property-value!`, the `:outliner-op` key is dropped.
;; Fails if, in `upsert-closed-value!`, the `:outliner-op` key is dropped.
;; Fails if, in `delete-closed-value!`, the `:outliner-op` key is dropped.
;; Fails if, in `class-add-property!`, the `:outliner-op` key is dropped.
;; Fails if, in `class-remove-property!`, the `:outliner-op` key is dropped.
(deftest tx-meta-of-property-operations
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:txt {:logseq.property/type :default}
                            :steps {:logseq.property/type :default
                                    :db/cardinality :db.cardinality/many
                                    :logseq.property/public? true}}
               :classes {:c1 {}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}
                                            {:block/title "b2"}
                                            {:block/title "b3"}]}]})
        b1 (db-test/find-block-by-content @conn "b1")
        b2 (db-test/find-block-by-content @conn "b2")
        b3 (db-test/find-block-by-content @conn "b3")
        txt-id (:db/id (d/entity @conn :user.property/txt))]
    (is (= {:outliner-op :upsert-property}
           (tx-meta-of conn #(outliner-property/upsert-property! conn nil {:logseq.property/type :default} {:property-name "np"}))))
    (is (= {:outliner-op :update-property :property-id txt-id}
           (tx-meta-of conn #(outliner-property/upsert-property! conn :user.property/txt {:db/cardinality :many} {}))))
    (is (= {:outliner-op :create-property-text-block}
           (tx-meta-of conn #(outliner-property/create-property-text-block! conn (:db/id b1) :user.property/txt "text" {}))))
    (outliner-property/batch-set-property! conn [(:block/uuid b2) (:block/uuid b3)] :logseq.property/status :logseq.property/status.doing)
    (is (= {:outliner-op :remove-block-property}
           (tx-meta-of conn #(outliner-property/remove-block-property! conn (:db/id b2) :logseq.property/status))))
    (is (= {:outliner-op :batch-remove-property}
           (tx-meta-of conn #(outliner-property/batch-remove-property! conn [(:block/uuid b3)] :logseq.property/status))))
    (outliner-property/batch-set-property! conn [(:block/uuid b1)] :user.property/steps ["one" "two"])
    (let [step-id (:db/id (first (:user.property/steps (d/entity @conn (:db/id b1)))))]
      (is (= {:outliner-op :batch-delete-property-value}
             (tx-meta-of conn #(outliner-property/delete-property-value! conn (:db/id b1) :user.property/steps step-id)))))
    (is (= {:outliner-op :class-add-property}
           (tx-meta-of conn #(outliner-property/class-add-property! conn :user.class/c1 :user.property/txt))))
    (is (= {:outliner-op :class-remove-property}
           (tx-meta-of conn #(outliner-property/class-remove-property! conn :user.class/c1 :user.property/txt))))
    (is (= {:outliner-op :upsert-closed-value}
           (tx-meta-of conn #(outliner-property/upsert-closed-value! conn :user.property/txt {:value "choice"}))))
    (let [value-uuid (:block/uuid (first (:block/_closed-value-property (d/entity @conn :user.property/txt))))]
      (is (= {:outliner-op :delete-closed-value}
             (tx-meta-of conn #(outliner-property/delete-closed-value! conn (:db/id (d/entity @conn :user.property/txt)) [:block/uuid value-uuid])))))))

;; Fails if, in `remove-block-property!`, `:logseq.property/default-value` becomes `:logseq.property/description`, the `{:db/id (:db/id block)` tx entry is dropped, `:db/id` becomes `:db/ident` or `:logseq.property/empty-placeholder` becomes `:logseq.property/hide-empty-value`.
(deftest remove-block-property-resets-a-default-value-to-the-empty-placeholder
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:txt {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        txt-id (:db/id (d/entity @conn :user.property/txt))
        b1-id (:db/id (db-test/find-block-by-content @conn "b1"))
        value-uuid (outliner-property/create-property-text-block! conn nil :user.property/txt "dv" {:set-block-property? false})
        value-id (:db/id (d/entity @conn [:block/uuid value-uuid]))]
    (d/transact! conn [[:db/add txt-id :logseq.property/default-value value-id]
                       [:db/add b1-id :user.property/txt value-id]])
    (is (= {:outliner-op :remove-block-property}
           (tx-meta-of conn #(outliner-property/remove-block-property! conn b1-id :user.property/txt))))
    (is (= :logseq.property/empty-placeholder
           (:db/ident (:user.property/txt (d/entity @conn b1-id)))))))

;; Fails if, in `remove-block-property!`, the `:outliner-op` key is dropped.
(deftest remove-block-property-on-class-extends-resets-to-root-with-meta
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:B {}
                         :C {:build/class-extends [:B]}}})
        class-id (:db/id (d/entity @conn :user.class/C))]
    (is (= {:outliner-op :remove-block-property}
           (tx-meta-of conn #(outliner-property/remove-block-property! conn class-id :logseq.property.class/extends))))
    (is (= [:logseq.class/Root]
           (:logseq.property.class/extends (db-test/readable-properties (d/entity @conn :user.class/C)))))))

;; Fails if, in `build-closed-value-tx`, the `:block/title` key is dropped, `:block/title` becomes `:block/uuid`, `:logseq.property/icon` becomes `:logseq.property/order-list-type`, `:property/closed-values` becomes `:property/create-error`, the `:icon` key is dropped, the `:db/id` key is dropped or `:db/id` becomes `:db/ident`.
;; Fails if, in `upsert-closed-value!`, `:logseq.property/description` becomes `:logseq.property/empty-placeholder`, the `:db/id` key is dropped, the `:block/title` key is dropped, `:db/id` becomes `:db/ident`, `:block/title` becomes `:block/uuid` or `:block/uuid` becomes `:block/_alias`.
(deftest upsert-closed-value-orders-edits-and-describes-choices
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:txt {:logseq.property/type :default}}})
        property-id (:db/id (d/entity @conn :user.property/txt))
        choices (fn [] (sort-by :block/order (:block/_closed-value-property (d/entity @conn :user.property/txt))))]
    (d/transact! conn [{:db/id property-id :block/updated-at 0}])
    (outliner-property/upsert-closed-value! conn :user.property/txt {:value "first" :icon {:type :emoji :id "smile"}})
    (outliner-property/upsert-closed-value! conn :user.property/txt {:value "second" :description "second description"})
    (let [[first-choice second-choice] (choices)]
      (is (= ["first" "second"] (map db-property/closed-value-content (choices))))
      (is (= (db-order/gen-key (:block/order first-choice) nil) (:block/order second-choice)))
      (is (= property-id (:db/id (first (:block/closed-value-property first-choice)))))
      (is (= {:type :emoji :id "smile"} (:logseq.property/icon first-choice)))
      (is (< 0 (:block/updated-at (d/entity @conn property-id))))
      (is (= "second description"
             (db-property/property-value-content (:logseq.property/description second-choice))))
      (let [description-id (:db/id (:logseq.property/description second-choice))]
        (outliner-property/upsert-closed-value! conn :user.property/txt {:id (:block/uuid second-choice)
                                                                         :value "renamed"
                                                                         :description "new description"
                                                                         :icon {:type :emoji :id "star"}})
        (let [edited (d/entity @conn (:db/id second-choice))]
          (is (= "renamed" (db-property/closed-value-content edited)))
          (is (= {:type :emoji :id "star"} (:logseq.property/icon edited)))
          (is (= property-id (:db/id (first (:block/closed-value-property edited)))))
          (is (= description-id (:db/id (:logseq.property/description edited))))
          (is (= "new description" (:block/title (d/entity @conn description-id)))))
        (outliner-property/upsert-closed-value! conn :user.property/txt {:id (:block/uuid second-choice)
                                                                         :value "renamed"})
        (is (nil? (:logseq.property/icon (d/entity @conn (:db/id second-choice)))))))))

(defn- entities-without-uuid
  "Entities that only carry an updated-at, left behind by a tx map missing its :db/id."
  [db]
  (d/q '[:find [?e ...] :where [?e :block/updated-at] (not [?e :block/uuid])] db))

;; Fails if, in `add-existing-values-to-closed-values!`, the `:db/id` key is dropped or the `:outliner-op` key is dropped.
;; Fails if, in `delete-closed-value!`, the `:db/id` key is dropped.
(deftest add-existing-and-delete-closed-value-touch-the-property
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1" :build/properties {:num 1}}]}])
        property-id (:db/id (d/entity @conn :user.property/num))
        value-uuid (:block/uuid (:user.property/num (db-test/find-block-by-content @conn "b1")))]
    (d/transact! conn [{:db/id property-id :block/updated-at 0}])
    (is (= {:outliner-op :add-existing-values-to-closed-values}
           (tx-meta-of conn #(outliner-property/add-existing-values-to-closed-values! conn :user.property/num [value-uuid]))))
    (is (< 0 (:block/updated-at (d/entity @conn property-id))))
    (is (empty? (entities-without-uuid @conn)))
    (d/transact! conn [{:db/id property-id :block/updated-at 0}])
    (outliner-property/delete-closed-value! conn property-id [:block/uuid value-uuid])
    (is (< 0 (:block/updated-at (d/entity @conn property-id))))
    (is (empty? (entities-without-uuid @conn)))))

;; Fails if, in `build-closed-value-tx`, the `:block/closed-value-property` key is dropped or `:block/closed-value-property` becomes `:block/name`.
(deftest upsert-closed-value-turns-an-existing-value-block-into-a-choice
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:txt {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        property-id (:db/id (d/entity @conn :user.property/txt))
        b1 (db-test/find-block-by-content @conn "b1")]
    (outliner-property/set-block-property! conn (:db/id b1) :user.property/txt "existing value")
    (let [value-uuid (:block/uuid (:user.property/txt (d/entity @conn (:db/id b1))))]
      (is (empty? (:block/_closed-value-property (d/entity @conn :user.property/txt))))
      (outliner-property/upsert-closed-value! conn :user.property/txt {:id value-uuid :value "existing value"})
      (is (= [property-id]
             (map :db/id (:block/closed-value-property (d/entity @conn [:block/uuid value-uuid]))))))))

;; Fails if, in `throw-error-if-deleting-protected-property`, the body becomes `nil`.
;; Fails if, in `validate-batch-deletion-of-property`, `:db/ident` becomes `:db/retract`.
(deftest protected-property-deletion-is-rejected
  (let [conn (db-test/create-conn)
        task-uuid (:block/uuid (d/entity @conn :logseq.class/Task))]
    (is (thrown-with-msg? js/Error #"Property is protected"
                          (outliner-property/batch-remove-property! conn [task-uuid] :block/tags)))))

;; Fails if, in `should-add-task-tag-for-property?`, `:block/tags` becomes `:block/title`.
(deftest setting-status-on-an-untitled-block-of-a-status-class-adds-no-task-tag
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Project {:build/class-properties [:logseq.property/status]}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "" :build/tags [:Project]}]}]})
        block (db-test/find-block-by-content @conn "")]
    (outliner-property/batch-set-property! conn [(:block/uuid block)] :logseq.property/status :logseq.property/status.doing)
    (is (= [:user.class/Project]
           (mapv :db/ident (:block/tags (d/entity @conn (:db/id block))))))))

;; Fails if, in `class-lookup-ref?`, `:block/uuid` becomes `:block/_alias`.
(deftest class-extends-accepts-a-uuid-lookup-ref
  (let [conn (db-test/create-conn-with-blocks {:classes {:B {} :C {}}})
        b (d/entity @conn :user.class/B)
        c (d/entity @conn :user.class/C)]
    (outliner-property/set-block-property! conn (:db/id c) :logseq.property.class/extends [:block/uuid (:block/uuid b)])
    (is (= [:user.class/B]
           (:logseq.property.class/extends (db-test/readable-properties (d/entity @conn :user.class/C)))))))

;; Fails if, in `validate-batch-set-property`, `:logseq.property.class/extends` becomes `:logseq.property.class/properties`.
(deftest batch-set-property-rejects-an-extends-cycle
  (let [conn (db-test/create-conn-with-blocks {:classes {:A {} :B {:build/class-extends [:A]}}})
        a (d/entity @conn :user.class/A)
        b (d/entity @conn :user.class/B)]
    (is (thrown-with-msg? js/Error #"Extends cycle"
                          (outliner-property/batch-set-property! conn [(:block/uuid a)] :logseq.property.class/extends (:db/id b))))))

;; Fails if, in `resolve-update-cardinality`, `:logseq.property/type` becomes `:logseq.property/ui-position`.
;; Fails if, in `update-datascript-schema`, `:db/valueType` becomes `:db/add`.
;; Fails if, in `schema-for-update`, `:db.cardinality/one` becomes `:db.cardinality/many`.
;; Fails if, in `update-property`, `:block/title` becomes `:block/uuid`, `:db/cardinality` becomes `:db/id`, `:logseq.property/type` becomes `:logseq.property/ui-position` or `:property/closed-values` becomes `:property/create-error`.
;; Fails if, in `upsert-property!`, `:logseq.property/type` becomes `:logseq.property/ui-position` or `:db/cardinality` becomes `:db/id`.
(deftest upsert-property-schema-update-rules
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:chk {:logseq.property/type :checkbox}
                            :txt {:logseq.property/type :default}
                            :many-txt {:logseq.property/type :default :db/cardinality :db.cardinality/many}
                            :choices {:logseq.property/type :default
                                      :build/closed-values [{:uuid (random-uuid) :value "x"}]}
                            :Num {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1" :build/properties {:many-txt #{"a" "b"}}}]}]})
        tx-count (fn [f] (let [tx-metas (capture-tx-metas! conn)]
                           (f)
                           (d/unlisten! conn ::capture)
                           (count @tx-metas)))]
    (outliner-property/upsert-property! conn :user.property/chk {:db/cardinality :many} {})
    (is (not (db-property/many? (d/entity @conn :user.property/chk))) "A checkbox stays single-valued")
    (outliner-property/upsert-property! conn :user.property/chk {:logseq.property/type :default} {})
    (is (= :db.type/ref (:db/valueType (d/entity @conn :user.property/chk))) "Becoming a default property makes it a ref")
    (outliner-property/upsert-property! conn :user.property/many-txt {:db/cardinality :db.cardinality/many} {})
    (is (db-property/many? (d/entity @conn :user.property/many-txt))
        "A many property with data keeps accepting :many")
    (is (= 0 (tx-count #(outliner-property/upsert-property! conn :user.property/txt {} {:property-name "txt"})))
        "An unchanged name changes nothing")
    (is (= 0 (tx-count #(outliner-property/upsert-property! conn :user.property/txt {:logseq.property/type :default :db/cardinality :one} {})))
        "An unchanged schema changes nothing")
    (is (< 0 (tx-count #(outliner-property/upsert-property! conn :user.property/choices {:logseq.property/type :default} {})))
        "A property with closed values refreshes its datascript schema")
    (is (not (db-property/many? (d/entity @conn :user.property/choices)))
        "Refreshing the schema keeps a single-valued property single-valued")
    (d/transact! conn [[:db/retract (:db/id (d/entity @conn :user.property/txt)) :db/valueType]])
    (outliner-property/upsert-property! conn :user.property/txt {:logseq.property/type :default} {})
    (is (= :db.type/ref (:db/valueType (d/entity @conn :user.property/txt)))
        "A default property without a ref value type gets it back")
    (is (some? (outliner-property/upsert-property! conn :user.property/Num {} {:property-name "NUM"}))
        "A property can be renamed to a different case of its own name")
    (is (thrown-with-msg? js/Error #"checkbox property doesn't allow multiple values"
                          (outliner-property/upsert-property! conn nil {:logseq.property/type :checkbox :db/cardinality :db.cardinality/many}
                                                              {:property-name "cm"})))))

;; Fails if, in `db-ident->eid`, `:db/id` becomes `:db/ident`.
(deftest db-ident->eid-resolves-or-rejects-idents
  (let [conn (db-test/create-conn)]
    (is (= (:db/id (d/entity @conn :logseq.property/status))
           (#'outliner-property/db-ident->eid @conn :logseq.property/status)))
    (is (thrown-with-msg? js/Error #"Wrong property db/ident"
                          (#'outliner-property/db-ident->eid @conn :user.property/nope)))))

;; Fails if, in `raw-set-block-property!`, the `:outliner-op` key is dropped.
;; Fails if, in `set-block-db-attribute!`, `:logseq.property.class/extends` becomes `:logseq.property.class/properties`, `:db/retract` becomes `:db/valueType`, `:logseq.class/Root` becomes `:logseq.class/Tag` or the `:outliner-op` key is dropped.
(deftest raw-property-writes-use-the-save-block-tx-meta
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:chk {:logseq.property/type :checkbox}}
               :classes {:B {} :C {}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        b1 (db-test/find-block-by-content @conn "b1")
        b-id (:db/id (d/entity @conn :user.class/B))]
    (is (= {:outliner-op :save-block}
           (tx-meta-of conn #(#'outliner-property/raw-set-block-property! conn b1 (d/entity @conn :user.property/chk) true))))
    (is (true? (:user.property/chk (d/entity @conn (:db/id b1)))))
    (is (= {:outliner-op :save-block}
           (tx-meta-of conn #(#'outliner-property/set-block-db-attribute!
                              conn (d/entity @conn :user.class/C) (d/entity @conn :logseq.property.class/extends)
                              :logseq.property.class/extends b-id b-id))))
    (is (= [:user.class/B]
           (:logseq.property.class/extends (db-test/readable-properties (d/entity @conn :user.class/C)))))))

;; Fails if, in `build-property-value-tx-data`, `:logseq.property/template-applied-to` becomes `:logseq.property/type`, `:block/tags` becomes `:block/title` or `:logseq.class/Template` becomes `:logseq.class/Page`.
(deftest setting-template-applied-to-tags-the-block-as-a-template
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:c1 {}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        b1 (db-test/find-block-by-content @conn "b1")]
    (outliner-property/batch-set-property! conn [(:block/uuid b1)] :logseq.property/template-applied-to (:db/id (d/entity @conn :user.class/c1)))
    (is (= #{:logseq.class/Template}
           (set (map :db/ident (:block/tags (d/entity @conn (:db/id b1)))))))))

;; Fails if, in `throw-error-if-invalid-alias`, `:db/id` becomes `:db/ident`.
(deftest batch-set-alias-again-on-its-own-owner-is-allowed
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "A"}}
               {:page {:block/title "B"}}])
        a (ldb/get-page @conn "A")
        b (ldb/get-page @conn "B")]
    (outliner-property/batch-set-property! conn [(:block/uuid a)] :block/alias (:db/id b))
    (outliner-property/batch-set-property! conn [(:block/uuid a)] :block/alias (:db/id b))
    (is (= [(:db/id b)] (map :db/id (:block/alias (d/entity @conn (:db/id a))))))))

;; Fails if, in `upsert-property!`, `:block/uuid` becomes `:block/_alias`, the `[:db/retract db-id :block/tags :logse...` tx entry is dropped, `:block/tags` becomes `:block/title` or `:logseq.class/Page` becomes `:logseq.class/Root`.
(deftest upsert-property-converting-a-page-keeps-its-uuid-and-drops-the-page-tag
  (let [conn (db-test/create-conn)
        [_ page-uuid] (outliner-page/create! conn "PlainPage" {})
        page (d/entity @conn [:block/uuid page-uuid])]
    (is (contains? (set (map :db/ident (:block/tags page))) :logseq.class/Page))
    (outliner-property/upsert-property! conn nil {:logseq.property/type :default}
                                        {:property-name "PlainPage" :properties {:db/id (:db/id page)}})
    (let [converted (d/entity @conn (:db/id page))]
      (is (= page-uuid (:block/uuid converted)))
      (is (not (contains? (set (map :db/ident (:block/tags converted))) :logseq.class/Page))))))

;; Fails if, in `find-or-create-property-value`, `:logseq.property/value` becomes `:logseq.property/choice-classes`.
(deftest batch-set-property-picks-existing-closed-values
  (let [number-choice-uuid (random-uuid)
        text-choice-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:properties {:num {:build/closed-values [{:uuid number-choice-uuid :value 2}]
                                  :logseq.property/type :number}
                            :choice {:build/closed-values [{:uuid text-choice-uuid :value "foo"}]
                                     :logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        b1 (db-test/find-block-by-content @conn "b1")]
    (outliner-property/batch-set-property! conn [(:block/uuid b1)] :user.property/num 2)
    (outliner-property/batch-set-property! conn [(:block/uuid b1)] :user.property/choice "foo")
    (let [block (d/entity @conn (:db/id b1))]
      (is (= number-choice-uuid (:block/uuid (:user.property/num block))))
      (is (= text-choice-uuid (:block/uuid (:user.property/choice block)))))))

;; Fails if, in `convert-ref-property-value`, `:db/id` becomes `:db/ident`.
;; Fails if, in `set-block-property!`, the `:block-id` key is dropped.
(deftest set-block-property-creates-values-under-the-block
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:txt {:logseq.property/type :default}
                            :pg {:logseq.property/type :page}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}
                                  {:page {:block/title "Existing"}}]})
        b1 (db-test/find-block-by-content @conn "b1")
        existing (ldb/get-page @conn "Existing")]
    (outliner-property/set-block-property! conn (:db/id b1) :user.property/txt "some text")
    (is (= (:db/id b1) (:db/id (:block/parent (:user.property/txt (d/entity @conn (:db/id b1)))))))
    (outliner-property/set-block-property! conn (:db/id b1) :user.property/pg "Existing")
    (is (= (:db/id existing) (:db/id (:user.property/pg (d/entity @conn (:db/id b1))))))))

;; Fails if, in `remove-status!`, `:logseq.property/status` becomes `:logseq.property/template-applied-to`, `:logseq.property/empty-placeholder` becomes `:logseq.property/hide-empty-value`, `:db/ident` becomes `:db/retract` or the `[:db/retract (:db/id block) :logseq.p...` tx entry is dropped.
(deftest remove-status-keeps-a-placeholder-status-and-drops-task-with-real-status
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "placeholder" :build/tags [:logseq.class/Task]}
                         {:block/title "doing" :build/tags [:logseq.class/Task]}]}])
        placeholder-id (:db/id (db-test/find-block-by-content @conn "placeholder"))
        doing-id (:db/id (db-test/find-block-by-content @conn "doing"))
        task-idents (fn [id] (set (map :db/ident (:block/tags (d/entity @conn id)))))]
    (d/transact! conn [[:db/add placeholder-id :logseq.property/status :logseq.property/empty-placeholder]
                       [:db/add doing-id :logseq.property/status :logseq.property/status.doing]])
    (outliner-property/batch-remove-property! conn [placeholder-id] :logseq.property/status)
    (is (= :logseq.property/empty-placeholder (:db/ident (:logseq.property/status (d/entity @conn placeholder-id)))))
    (is (contains? (task-idents placeholder-id) :logseq.class/Task))
    (outliner-property/remove-block-property! conn doing-id :logseq.property/status)
    (is (nil? (:logseq.property/status (d/entity @conn doing-id))))
    (is (not (contains? (task-idents doing-id) :logseq.class/Task)))))

;; Fails if, in `batch-delete-property-value!`, `:db/id` becomes `:db/ident`.
(deftest delete-property-value-from-a-plain-block
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:steps {:logseq.property/type :default
                                    :db/cardinality :db.cardinality/many
                                    :logseq.property/public? true}}
               :classes {:c1 {} :c2 {}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1" :build/properties {:steps #{"one" "two"}}}
                                            {:block/title "b2" :build/tags [:c1 :c2]}]}]})
        b1-id (:db/id (db-test/find-block-by-content @conn "b1"))
        b2-id (:db/id (db-test/find-block-by-content @conn "b2"))
        step-ids (mapv :db/id (:user.property/steps (d/entity @conn b1-id)))]
    (outliner-property/delete-property-value! conn b1-id :user.property/steps (first step-ids))
    (is (= [(second step-ids)] (mapv :db/id (:user.property/steps (d/entity @conn b1-id)))))
    (outliner-property/delete-property-value! conn b1-id :user.property/steps (second step-ids))
    (is (nil? (:user.property/steps (d/entity @conn b1-id))))
    (outliner-property/delete-property-value! conn b2-id :block/tags (:db/id (d/entity @conn :user.class/c1)))
    (is (= #{:user.class/c2} (set (map :db/ident (:block/tags (d/entity @conn b2-id))))))))

;; Fails if, in `get-block-classes`, the body becomes `nil`, the `(sort-by :block/name)` step is dropped, `:block/tags` becomes `:block/title`, `:block/name` becomes `:block/order`, `filter` becomes `remove`, the `(filter (fn [class]` step is dropped or `:logseq.property.class/properties` becomes `:logseq.property.class/extends`.
;; Fails if, in `get-block-classes-properties`, the `(sort-by :block/name)` step is dropped, `:block/name` becomes `:block/order`, the `(filter (fn [class]` step is dropped, the `distinct` step is dropped or the `:classes` key is dropped.
;; Fails if, in `get-block-full-properties`, the body becomes `nil`, the `(common-util/distinct-by :db/id)` step is dropped or `:block/properties` becomes `:block/tags`.
(deftest block-classes-and-properties-are-sorted-filtered-and-distinct
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:zeta {:build/class-properties [:p1 :shared]}
                         :alpha {:build/class-properties [:p2 :shared]}
                         :empty {}}
               :properties {:p1 {:logseq.property/type :default}
                            :p2 {:logseq.property/type :default}
                            :shared {:logseq.property/type :default}
                            :own {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"
                                             :build/tags [:zeta :alpha :empty]
                                             :build/properties {:shared "s" :own "o"}}]}]})
        b1-id (:db/id (db-test/find-block-by-content @conn "b1"))
        idents (fn [entities] (mapv :db/ident entities))
        {:keys [classes all-classes classes-properties]} (outliner-property/get-block-classes-properties @conn b1-id)]
    (is (= [:user.class/alpha :user.class/empty :user.class/zeta] (idents classes)))
    (is (= [:user.class/alpha :user.class/zeta] (idents all-classes)))
    (is (= [:user.property/p2 :user.property/shared :user.property/p1] (idents classes-properties)))
    (is (= [:user.class/alpha :user.class/zeta] (idents (outliner-property/get-block-classes @conn b1-id))))
    (let [full-properties (outliner-property/get-block-full-properties @conn b1-id)]
      (is (every? (set (idents full-properties))
                  [:user.property/own :user.property/shared :user.property/p1 :user.property/p2]))
      (is (= (count full-properties) (count (distinct (map :db/id full-properties))))))))

;; Fails if, in `get-class-properties`, the `(common-util/distinct-by :db/id)` step is dropped.
(deftest class-properties-include-parent-class-properties-once
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:parent {:build/class-properties [:p1 :shared]}
                         :child {:build/class-extends [:parent]
                                 :build/class-properties [:shared :p2]}}
               :properties {:p1 {:logseq.property/type :default}
                            :p2 {:logseq.property/type :default}
                            :shared {:logseq.property/type :default}}})]
    (is (= #{:user.property/p1 :user.property/p2 :user.property/shared}
           (set (map :db/ident (outliner-property/get-class-properties (d/entity @conn :user.class/child))))))
    (is (= 3 (count (outliner-property/get-class-properties (d/entity @conn :user.class/child)))))))

;; reader-3 additions

(defn- thrown-message
  [f]
  (try (f) nil (catch :default e (ex-message e))))

;; Fails if, in `validate-property-name-update`, `:block/title` becomes `:block/uuid`.
(deftest upsert-property-keeps-an-unchanged-name-without-validating-it
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:hash {:logseq.property/type :default :block/title "#hashy"}}})]
    (is (= "#hashy" (:block/title (d/entity @conn :user.property/hash))))
    (is (nil? (thrown-message #(outliner-property/upsert-property! conn :user.property/hash {} {:property-name "#hashy"}))))))

;; Fails if, in `upsert-property!`, the `:properties` key is dropped.
(deftest upsert-property-creates-a-property-with-the-given-properties
  (let [conn (db-test/create-conn)
        property (outliner-property/upsert-property! conn nil {:logseq.property/type :default}
                                                     {:property-name "with props"
                                                      :properties {:logseq.property/hide? true}})]
    (is (true? (:logseq.property/hide? (d/entity @conn (:db/ident property)))))))

;; Fails if, in `batch-set-property!`, `:logseq.property.class/extends` becomes `:logseq.property.class/properties`.
(deftest batch-set-class-extends-accepts-lookup-refs
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:A {} :D {}}})
        d-uuid (:block/uuid (d/entity @conn :user.class/D))]
    (outliner-property/batch-set-property! conn [d-uuid] :logseq.property.class/extends [[:db/ident :user.class/A]])
    (is (= [:user.class/A]
           (:logseq.property.class/extends (db-test/readable-properties (d/entity @conn :user.class/D)))))))

(def ^:private target-uuid #uuid "77777777-7777-4777-8777-000000000001")

(defn- node-values-conn
  "b1 holds two :node values: a hidden value block of the property whose title is
  target's uuid, and the page other."
  []
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:nodes {:logseq.property/type :node :db/cardinality :db.cardinality/many}}
               :pages-and-blocks [{:page {:block/title "target" :block/uuid target-uuid :build/keep-uuid? true}}
                                  {:page {:block/title "other"}}
                                  {:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        b1 (db-test/find-block-by-content @conn "b1")
        prop-id (:db/id (d/entity @conn :user.property/nodes))
        value-uuid (random-uuid)]
    (d/transact! conn [{:block/uuid value-uuid
                        :block/title (str target-uuid)
                        :block/page (:db/id (:block/page b1))
                        :block/parent (:db/id b1)
                        :block/order "a0"
                        :logseq.property/created-from-property prop-id}])
    (d/transact! conn [[:db/add (:db/id b1) :user.property/nodes [:block/uuid value-uuid]]
                       [:db/add (:db/id b1) :user.property/nodes (:db/id (db-test/find-page-by-title @conn "other"))]])
    {:conn conn :b1-id (:db/id b1) :value-uuid value-uuid}))

;; Fails if, in `node-value-target-id`, the body becomes `nil`, `:db/ident` becomes `:db/retract`, `:logseq.property/created-from-property` becomes `:logseq.property/deadline`, the `parse-uuid` step is dropped, `:block/title` becomes `:block/uuid`, `:db/id` becomes `:db/ident` or `:block/uuid` becomes `:block/_alias`.
;; Fails if, in `batch-delete-property-value!`, `:logseq.property/type` becomes `:logseq.property/ui-position`.
(deftest delete-node-value-by-the-id-of-the-node-its-value-block-targets
  (let [{:keys [conn b1-id value-uuid]} (node-values-conn)
        target-id (:db/id (d/entity @conn [:block/uuid target-uuid]))]
    (outliner-property/delete-property-value! conn b1-id :user.property/nodes target-id)
    (is (= #{"other"} (set (map :block/title (:user.property/nodes (d/entity @conn b1-id))))))
    (is (not-any? #(= value-uuid (:block/uuid %)) (:user.property/nodes (d/entity @conn b1-id))))))

;; Fails if, in `node-value-target-id`, `:db/id` becomes `:db/ident`.
(deftest delete-node-value-does-not-match-a-class-value-by-its-ident
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:nodes {:logseq.property/type :node :db/cardinality :db.cardinality/many}}
               :classes {:K {}}
               :pages-and-blocks [{:page {:block/title "other"}}
                                  {:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        b1-id (:db/id (db-test/find-block-by-content @conn "b1"))]
    (d/transact! conn [[:db/add b1-id :user.property/nodes (:db/id (d/entity @conn :user.class/K))]
                       [:db/add b1-id :user.property/nodes (:db/id (db-test/find-page-by-title @conn "other"))]])
    (outliner-property/delete-property-value! conn b1-id :user.property/nodes :user.class/K)
    (is (= 2 (count (:user.property/nodes (d/entity @conn b1-id)))))))

;; Fails if, in `batch-delete-property-value!`, `:db/ident` becomes `:db/retract`.
(deftest delete-property-value-skips-the-property-entity-itself
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:nodes {:logseq.property/type :node :db/cardinality :db.cardinality/many}}
               :pages-and-blocks [{:page {:block/title "A"}}
                                  {:page {:block/title "B"}}]})
        prop-id (:db/id (d/entity @conn :user.property/nodes))
        a-id (:db/id (db-test/find-page-by-title @conn "A"))
        b-id (:db/id (db-test/find-page-by-title @conn "B"))]
    (d/transact! conn [[:db/add prop-id :user.property/nodes a-id]
                       [:db/add prop-id :user.property/nodes b-id]])
    (outliner-property/delete-property-value! conn prop-id :user.property/nodes a-id)
    (is (= #{a-id b-id} (set (map :db/id (:user.property/nodes (d/entity @conn prop-id))))))))

;; Fails if, in `batch-delete-property-value!`, `:block/tags` becomes `:block/title`.
(deftest delete-property-value-rejects-removing-the-page-tag
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:K {}}
               :pages-and-blocks [{:page {:block/title "page1" :build/tags [:K]}}]})
        page-id (:db/id (db-test/find-page-by-title @conn "page1"))
        page-tag-id (:db/id (d/entity @conn :logseq.class/Page))]
    (is (= "This page cannot be converted to a block"
           (thrown-message #(outliner-property/delete-property-value! conn page-id :block/tags page-tag-id))))
    (is (contains? (set (map :db/ident (:block/tags (d/entity @conn page-id)))) :logseq.class/Page))))

;; Fails if, in `set-block-property!`, `:block/tags` becomes `:block/title`.
(deftest set-block-property-validates-tags
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:K {}}})
        status-id (:db/id (d/entity @conn :logseq.property/status))]
    (is (= "Can't add tag on built-in \"Status\""
           (thrown-message #(outliner-property/set-block-property! conn status-id :block/tags :user.class/K))))
    (is (not-any? #{:user.class/K} (map :db/ident (:block/tags (d/entity @conn status-id)))))))

;; Fails if, in `get-class-properties`, the `(ldb/sort-by-order)` step is dropped.
(deftest get-class-properties-sorts-by-property-order
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:k {:build/class-properties [:p1 :p2]}}
               :properties {:p1 {:logseq.property/type :default}
                            :p2 {:logseq.property/type :default}}})
        idents #(mapv :db/ident (outliner-property/get-class-properties (d/entity @conn :user.class/k)))
        set-order (vec (map :db/ident (:logseq.property.class/properties (d/entity @conn :user.class/k))))]
    (d/transact! conn [[:db/add (:db/id (d/entity @conn (first set-order))) :block/order "a1"]
                       [:db/add (:db/id (d/entity @conn (second set-order))) :block/order "a0"]])
    (is (= (vec (reverse set-order)) (idents)))))

;; Fails if, in `class-add-property!`, `:logseq.property/empty-placeholder` becomes `:logseq.property/hide-empty-value`.
(deftest class-add-property-adds-hide-empty-value
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:k {}}})]
    (outliner-property/class-add-property! conn :user.class/k :logseq.property/hide-empty-value)
    (is (contains? (set (map :db/ident (:logseq.property.class/properties (d/entity @conn :user.class/k))))
                   :logseq.property/hide-empty-value))))

