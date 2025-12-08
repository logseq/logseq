(ns frontend.worker.migrate-test
  (:require ["fs" :as fs-node]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.db.migrate :as db-migrate]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]))

(deftest test-fix-rename-parent-to-extends
  (testing "Rename parent to extends"
    (let [db-transit (str (fs-node/readFileSync "src/test/migration/64.8.transit"))
          db (ldb/read-transit-str db-transit)
          tx-data (db-migrate/fix-rename-parent-to-extends db)]
      (is (= (->> tx-data
                  (map (fn [data]
                         (cond
                           (and (map? data) (:block/created-at data))
                           (dissoc data :block/created-at :block/updated-at)
                           (and (map? data) (:block/order data))
                           (dissoc data :block/order)
                           :else
                           data))))
             [{:db/id 35,
               :db/ident :logseq.property.class/extends,
               :block/title "Extends",
               :block/name "extends"}
              [:db/retract 161 :logseq.property/parent]
              [:db/add 161 :logseq.property.class/extends 1]
              [:db/retract 163 :logseq.property/parent]
              [:db/add 163 :logseq.property.class/extends 162]
              [:db/retract 139 :logseq.property/parent]
              [:db/add 139 :logseq.property.class/extends 137]
              [:db/retract 138 :logseq.property/parent]
              [:db/add 138 :logseq.property.class/extends 1]
              [:db/retract 140 :logseq.property/parent]
              [:db/add 140 :logseq.property.class/extends 1]
              [:db/retract 158 :logseq.property/parent]
              [:db/add 158 :block/parent 155]
              [:db/retract 134 :logseq.property/parent]
              [:db/add 134 :logseq.property.class/extends 133]
              [:db/retract 3 :logseq.property/parent]
              [:db/add 3 :logseq.property.class/extends 1]
              [:db/retract 142 :logseq.property/parent]
              [:db/add 142 :logseq.property.class/extends 1]
              [:db/retract 135 :logseq.property/parent]
              [:db/add 135 :logseq.property.class/extends 133]
              [:db/retract 133 :logseq.property/parent]
              [:db/add 133 :logseq.property.class/extends 1]
              [:db/retract 162 :logseq.property/parent]
              [:db/add 162 :logseq.property.class/extends 161]
              [:db/retract 144 :logseq.property/parent]
              [:db/add 144 :logseq.property.class/extends 1]
              [:db/retract 155 :logseq.property/parent]
              [:db/add 155 :block/parent 154]
              [:db/retract 165 :logseq.property/parent]
              [:db/add 165 :logseq.property.class/extends 162]
              [:db/retract 143 :logseq.property/parent]
              [:db/add 143 :logseq.property.class/extends 1]
              [:db/retract 136 :logseq.property/parent]
              [:db/add 136 :logseq.property.class/extends 1]
              [:db/retract 2 :logseq.property/parent]
              [:db/add 2 :logseq.property.class/extends 1]
              [:db/retract 4 :logseq.property/parent]
              [:db/add 4 :logseq.property.class/extends 1]
              [:db/retract 156 :logseq.property/parent]
              [:db/add 156 :block/parent 155]
              [:db/retract 141 :logseq.property/parent]
              [:db/add 141 :logseq.property.class/extends 1]
              [:db/retract 137 :logseq.property/parent]
              [:db/add 137 :logseq.property.class/extends 1]
              {:block/name (string/lower-case common-config/library-page-name),
               :block/title common-config/library-page-name,
               :block/uuid #uuid "00000004-1294-7765-6000-000000000000",
               :block/tags #{:logseq.class/Page},
               :logseq.property/built-in? true}
              {:db/id 154,
               :block/parent
               [:block/uuid #uuid "00000004-1294-7765-6000-000000000000"],
               ;; :block/order "a6"
               }
              {:db/id 155,
               ;; :block/order "a7"
               }
              {:db/id 156,
               ;; :block/order "a8"
               }
              {:db/id 158,
               ;; :block/order "a9"
               }])))))

(deftest ensure-built-in-data-exists!
  (let [db-transit (str (fs-node/readFileSync "src/test/migration/64.8.transit"))
        db (ldb/read-transit-str db-transit)
        conn (d/conn-from-db db)
        initial-version (:kv/value (d/entity @conn :logseq.kv/graph-initial-schema-version))
        graph-created-at (:kv/value (d/entity @conn :logseq.kv/graph-created-at))
        _ (assert (= {:major 64 :minor 8} initial-version))
        _ (assert (some? graph-created-at))
        _ (db-migrate/ensure-built-in-data-exists! conn)]
    (is (= initial-version
           (:kv/value (d/entity @conn :logseq.kv/graph-initial-schema-version)))
        "Initial version not changed by fn")
    (is (= graph-created-at
           (:kv/value (d/entity @conn :logseq.kv/graph-created-at)))
        "Graph created at not changed by fn")))

(deftest test-separate-classes-and-properties
  (testing "Separate properties from classes"
    (let [db-transit (str (fs-node/readFileSync "src/test/migration/65.0.transit"))
          db (ldb/read-transit-str db-transit)
          tx-data (db-migrate/separate-classes-and-properties db)
          new-property (first tx-data)]
      (is (= (dissoc new-property
                     :block/updated-at
                     :block/created-at
                     :db/ident
                     :block/uuid
                     :block/order)
             {:db/index true,
              :logseq.property/type :node,
              :db/valueType :db.type/ref,
              :block/tags #{:logseq.class/Property},
              :block/title "Book",
              :db/cardinality :db.cardinality/one,
              :logseq.property/classes 156,
              :block/name "book"}))
      (is (= (rest tx-data)
             [[:db/retract 156 :block/tags :logseq.class/Property]
              [:db/retract 156 :logseq.property/type]
              [:db/retract 156 :db/cardinality]
              [:db/retract 156 :db/valueType]
              [:db/retract 156 :db/index]
              [:db/retract 156 :logseq.property/classes]
              [:db/retract 156 :logseq.property/hide?]
              [:db/retract 156 :logseq.property/public?]
              [:db/retract 156 :logseq.property/view-context]
              [:db/retract 156 :logseq.property/ui-position]
              [:db/retract 156 :logseq.property/default-value]
              [:db/retract 156 :logseq.property/hide-empty-value]
              [:db/retract 156 :logseq.property/enable-history?]
              [:db/retract 157 :user.class/Book-FrG9O7sY 155]
              [:db/add 157 (:db/ident new-property) 155]])))))
