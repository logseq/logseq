(ns frontend.worker.handler.property-test
  (:require [cljs.test :refer [async deftest is testing thrown-with-msg?]]
            [datascript.core :as d]
            [frontend.worker.handler.property :as worker-property]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.property :as outliner-property]
            [promesa.core :as p]))

(deftest property-node-selector-data-prepares-class-options-and-initial-choices
  (async done
    (let [conn (d/create-conn db-schema/schema)
          page-uuid #uuid "11111111-1111-1111-1111-111111111111"]
      (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
      (d/transact! conn [{:db/id -1
                          :db/ident :user.class/Topic
                          :block/title "Topic"
                          :block/name "topic"
                          :block/tags :logseq.class/Tag
                          :logseq.property.class/extends :logseq.class/Tag}
                         {:block/title "Page A"
                          :block/name "page-a"
                          :block/uuid page-uuid
                          :block/tags -1}])
      (->
       (p/let [topic-class (select-keys (d/entity @conn :user.class/Topic)
                                        [:db/id :db/ident :block/title])
               topic-class-id (:db/id topic-class)
               property {:db/ident :block/tags
                         :logseq.property/type :node
                         :logseq.property/classes [topic-class]}
               data (worker-property/property-node-selector-data
                     @conn
                     {:property property
                      :block {:db/id (:db/id (d/entity @conn [:block/uuid page-uuid]))}})]
         (is (some #(= :user.class/Topic (:db/ident %)) (:all-classes data)))
         (is (not-any? #(= :logseq.class/Root (:db/ident %)) (:class-options data)))
         (is (contains? (:structured-children-by-class-id data) topic-class-id))
         (is (some #(= :logseq.class/Tag (:db/ident %))
                   (get (:extends-by-class-id data) topic-class-id)))
         (is (= ["Page A"] (map :block/title (:initial-choices data)))))
       (p/catch
        (fn [error]
          (is false (str error))))
       (p/finally done)))))

(deftest display-properties-hides-hide-by-default-properties-on-nodes
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:keywords {:logseq.property/type :default
                                       :logseq.property/hide? true}
                            :author {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "Work"
                                          :build/properties {:keywords "clojure"
                                                             :author "Ada"}}}]})
        page (db-test/find-page-by-title @conn "Work")
        result (worker-property/display-properties @conn page {:page-title? true} false)
        full-ids (set (map :property-id (:full-properties result)))
        hidden-ids (set (map :property-id (:hidden-properties result)))]
    (testing "hide-by-default still hides the property on nodes that use it"
      (is (contains? hidden-ids :user.property/keywords))
      (is (not (contains? full-ids :user.property/keywords))))
    (testing "visible properties still appear on the node"
      (is (contains? full-ids :user.property/author))
      (is (not (contains? hidden-ids :user.property/author))))))

(deftest display-property-map-reflects-default-value-entity-updates
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (d/transact! conn [{:db/ident :user.property/color
                        :block/uuid (random-uuid)
                        :block/title "Color"
                        :block/tags :logseq.class/Property
                        :logseq.property/type :default}
                       {:db/ident :user.property/color.red
                        :block/uuid (random-uuid)
                        :block/title "Red"
                        :block/closed-value-property :user.property/color}
                       [:db/add :user.property/color
                        :logseq.property/default-value
                        :user.property/color.red]])
    (let [before (worker-property/display-property-map @conn :user.property/color)]
      (d/transact! conn [[:db/add :user.property/color.red :block/title "Crimson"]])
      (let [after (worker-property/display-property-map @conn :user.property/color)]
        (is (= "Red" (get-in before [:logseq.property/default-value :block/title])))
        (is (= "Crimson" (get-in after [:logseq.property/default-value :block/title])))))))

(defn- positioned-idents
  [db block-id position]
  (set (map :db/ident (worker-property/block-positioned-properties db block-id position))))

(deftest task-tag-only-positions-default-status
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page"}
                :blocks [{:block/title "task only"
                          :build/tags [:logseq.class/Task]}
                         {:block/title "task doing"
                          :build/tags [:logseq.class/Task]
                          :build/properties {:logseq.property/status :logseq.property/status.doing}}
                         {:block/title "plain"}]}])
        db @conn
        task-only (db-test/find-block-by-content db "task only")
        task-doing (db-test/find-block-by-content db "task doing")
        plain (db-test/find-block-by-content db "plain")]
    (testing "tagging only #Task still positions the class default status"
      (is (contains? (positioned-idents db (:db/id task-only) :block-left)
                     :logseq.property/status))
      (is (nil? (worker-property/entity-direct-value db task-only :logseq.property/status))
          "Status is resolved from the property default, not a written datom"))
    (testing "explicit status still positions"
      (is (contains? (positioned-idents db (:db/id task-doing) :block-left)
                     :logseq.property/status))
      (is (some? (worker-property/entity-direct-value db task-doing :logseq.property/status))))
    (testing "unset priority stays hidden because it has no default"
      (is (not (contains? (positioned-idents db (:db/id task-only) :block-left)
                          :logseq.property/priority))))
    (testing "No priority writes empty-placeholder and still positions the dashed chip"
      (d/transact! conn [{:db/id (:db/id plain)
                          :logseq.property/priority :logseq.property/empty-placeholder}])
      (is (contains? (positioned-idents @conn (:db/id plain) :block-left)
                     :logseq.property/priority)))
    (testing "untagged blocks do not get a status icon"
      (is (not (contains? (positioned-idents db (:db/id plain) :block-left)
                          :logseq.property/status))))
    (testing "removing the default hides empty status again"
      (d/transact! conn [[:db/retract :logseq.property/status :logseq.property/default-value]])
      (is (not (contains? (positioned-idents @conn (:db/id task-only) :block-left)
                          :logseq.property/status))))))

(deftest get-class-properties-keeps-closed-values-for-icons
  (let [conn (db-test/create-conn-with-blocks
              {:properties
               {:my-status {:logseq.property/type :default
                            :build/closed-values
                            [{:value "Todo"  :uuid (random-uuid)
                              :icon {:type :tabler-icon :id "circle"}}
                             {:value "Doing" :uuid (random-uuid)
                              :icon {:type :tabler-icon :id "circle-half"}}]}
                :note {:logseq.property/type :default}}
               :classes {:MyTask {:build/class-properties [:my-status :note]}}
               :pages-and-blocks
               [{:page {:block/title "Page"}
                 :blocks [{:block/title "task1"
                           :build/tags [:MyTask]
                           :build/properties {:my-status "Doing"}}]}]})
        db @conn
        class (d/entity db :user.class/MyTask)
        properties (worker-property/get-class-properties db class)
        by-ident (into {} (map (juxt :db/ident identity)) properties)
        status (get by-ident :user.property/my-status)
        note (get by-ident :user.property/note)]

    (testing "closed values survive the worker boundary"
      (is (some? status) "The tag's property is returned")
      (is (= #{"Todo" "Doing"}
             (set (map :block/title (:property/closed-values status))))
          "Closed values are attached, which is what gates the icon render path in select-item"))

    (testing "each closed value keeps its icon"
      (is (= #{"circle" "circle-half"}
             (set (map #(get-in % [:logseq.property/icon :id])
                       (:property/closed-values status))))
          "Without the icon the tag table falls back to plain text (issue #1173)"))

    (testing "properties without closed values are unchanged"
      (is (some? note))
      (is (not (contains? note :property/closed-values))
          "Plain properties keep their existing map shape"))))

(def ^:private status-choice-titles
  #{"Backlog" "Todo" "Doing" "In Review" "Done" "Canceled"})

(deftest property-closed-values-include-every-status-choice
  (let [conn (db-test/create-conn)
        db @conn
        reverse-titles (set (map :block/title
                                 (db-property/get-closed-property-values db :logseq.property/status)))
        display (worker-property/display-property-map db :logseq.property/status)
        class-props (worker-property/get-class-properties db (d/entity db :logseq.class/Task))
        task-status (some #(when (= :logseq.property/status (:db/ident %)) %) class-props)]
    (testing "reverse lookup is the complete set"
      (is (= status-choice-titles reverse-titles)))
    (testing "display-property-map used by use-block snapshots is complete"
      (is (= status-choice-titles
             (set (map :block/title (:property/closed-values display)))))
      (is (every? :db/ident (:property/closed-values display)))
      (is (every? #(get-in % [:logseq.property/icon :id])
                  (:property/closed-values display))
          "Icons must survive so tag tables do not regress #1173"))
    (testing "Task class properties used by tag tables are complete"
      (is (= status-choice-titles
             (set (map :block/title (:property/closed-values task-status)))))
      (is (every? #(get-in % [:logseq.property/icon :id])
                  (:property/closed-values task-status))))))

(deftest property-closed-values-keep-choice-classes-for-scoped-tags
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:t1 {:build/class-properties [:priority]}
                         :t2 {}}
               :properties {:priority {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "b1" :build/tags [:t1]}
                          {:block/title "b2" :build/tags [:t2]}]}]})
        t1 (:db/id (d/entity @conn :user.class/t1))
        _ (outliner-property/upsert-closed-value! conn :user.property/priority
                                                  {:value "P1"
                                                   :scoped-class-id t1})
        db @conn
        closed (worker-property/property-closed-values db (d/entity db :user.property/priority))
        p1 (first closed)]
    (is (= ["P1"] (map :block/title closed)))
    (is (= [t1] (map :db/id (:logseq.property/choice-classes p1)))
        "Scoped tag ids must survive flattening so other tags do not see this choice")))

(deftest pull-default-value-property-rejects-virtual-closed-values-attr
  (let [conn (d/create-conn db-schema/schema)
        _ (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
        db @conn]
    (is (some? (d/entity db :logseq.property/default-value)))
    (is (thrown-with-msg?
         js/Error
         #"db\.type/ref"
         (d/pull db '[* {:property/closed-values [*]}] :logseq.property/default-value))
        "The default-value config used to pull this virtual attr and the submenu never rendered.")
    (is (= :logseq.property/default-value
           (:db/ident (d/pull db '[*] :logseq.property/default-value)))
        "A wildcard pull still loads the built-in default-value property.")))
