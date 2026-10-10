(ns logseq.db.common.view-custom-status-test
  "Custom Status closed values without :db/ident must keep :block/order
   in compiled ClojureScript query/table sort and group-by."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.common.order :as db-order]
            [logseq.db.common.view :as db-view]
            [logseq.db.test.helper :as db-test]))

(defn- create-view-id
  [conn feature-type & {:keys [view-for-id]}]
  (let [tx (d/transact! conn [(cond-> {:db/id -100
                                       :block/title "Test view"
                                       :block/uuid (random-uuid)
                                       :logseq.property.view/feature-type feature-type
                                       :logseq.property.view/type :logseq.property.view/type.table}
                                view-for-id
                                (assoc :logseq.property/view-for view-for-id))])]
    (get-in tx [:tempids -100])))

(defn- result-titles
  [conn result]
  (mapv (fn [id] (:block/title (d/entity @conn id))) (:data result)))

(defn- add-custom-status-between-todo-and-doing!
  [conn]
  (let [status (d/entity @conn :logseq.property/status)
        todo (d/entity @conn :logseq.property/status.todo)
        doing (d/entity @conn :logseq.property/status.doing)
        tx {:db/id -1
            :block/uuid (random-uuid)
            :block/title "Waiting"
            :block/name "waiting"
            :block/closed-value-property (:db/id status)
            :block/parent (:db/id status)
            :block/page (:db/id status)
            :logseq.property/created-from-property (:db/id status)
            :logseq.property/icon {:type :emoji :id "⏳" :name "hourglass"}
            :block/order (db-order/gen-key (:block/order todo) (:block/order doing)
                                           :max-key-atom (atom nil))}
        tempids (:tempids (d/transact! conn [tx]))]
    (is (string? (:block/order todo)))
    (is (string? (:block/order doing)))
    (is (neg? (compare (:block/order todo) (:block/order doing))))
    (d/entity @conn (get tempids -1))))

(defn- topic-page
  [conn title class-id]
  (d/entity @conn
            (d/q '[:find ?e .
                   :in $ ?title ?class
                   :where
                   [?e :block/title ?title]
                   [?e :block/tags ?class]]
                 @conn title class-id)))

(deftest query-and-class-objects-respect-custom-status-order-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "Row Doing" :build/tags [:Topic]
                        :build/properties {:logseq.property/status :logseq.property/status.doing}}}
                {:page {:block/title "Row Todo" :build/tags [:Topic]
                        :build/properties {:logseq.property/status :logseq.property/status.todo}}}
                {:page {:block/title "Row Waiting" :build/tags [:Topic]}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        custom (add-custom-status-between-todo-and-doing! conn)
        waiting (topic-page conn "Row Waiting" class-id)
        _ (d/transact! conn [{:db/id (:db/id waiting)
                              :logseq.property/status (:db/id custom)}])
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        query-ids (mapv :db/id [waiting
                                (topic-page conn "Row Todo" class-id)
                                (topic-page conn "Row Doing" class-id)])
        class-sorted (db-view/get-view-data
                      @conn view-id
                      {:view-feature-type :class-objects
                       :view-for-id class-id
                       :sorting [{:id :logseq.property/status :asc? true}]})
        query-sorted (db-view/get-view-data
                      @conn view-id
                      {:view-feature-type :query-result
                       :query-entity-ids query-ids
                       :sorting [{:id :logseq.property/status :asc? true}]})
        _ (d/transact! conn [[:db/add view-id :logseq.property.view/group-by-property :logseq.property/status]
                             [:db/add view-id :logseq.property.view/sort-groups-desc? false]])
        class-grouped (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                           :view-for-id class-id})
        query-grouped (db-view/get-view-data
                       @conn view-id
                       {:view-feature-type :query-result
                        :query-entity-ids query-ids})
        group-titles (fn [result]
                       (mapv (fn [[group _rows]]
                               (or (:block/title group) group))
                             (:data result)))]
    (is (nil? (:db/ident custom))
        "Regression covers a custom Status choice that has no :db/ident.")
    (is (some? (:block/closed-value-property custom)))
    (is (= ["Row Todo" "Row Waiting" "Row Doing"] (result-titles conn class-sorted))
        "Flat Status sort must follow :block/order for a custom closed value.")
    (is (= ["Row Todo" "Row Waiting" "Row Doing"] (result-titles conn query-sorted))
        "Standard Query sort must follow :block/order for a custom closed value.")
    (is (= ["Todo" "Waiting" "Doing"] (group-titles class-grouped))
        "Group-by Status must keep the custom closed value as an entity and sort by :block/order.")
    (is (= ["Todo" "Waiting" "Doing"] (group-titles query-grouped))
        "Standard Query group-by Status must respect the configured closed-value order.")
    (is (= {:type :emoji :id "⏳" :name "hourglass"}
           (some (fn [[group _rows]]
                   (when (= "Waiting" (:block/title group))
                     (:logseq.property/icon group)))
                 (:data query-grouped)))
        "Grouped custom Status still carries its icon.")))
