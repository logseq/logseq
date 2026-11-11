(ns frontend.worker.handler.property-1522-test
  "logseq/db-test#1522: opening the picker of a :node property on a large
  graph must not cost time per class or per node of the graph."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.handler.property :as worker-property]
            [frontend.worker.plain-value :as worker-plain]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(def ^:private class-count 300)
(def ^:private page-count 3000)
(def ^:private object-count 8000)

(defn- large-graph-conn
  []
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (d/transact! conn
                 (vec
                  (for [i (range class-count)]
                    {:db/ident (keyword "user.class" (str "C" i))
                     :block/uuid (random-uuid)
                     :block/title (str "Class " i)
                     :block/name (str "class " i)
                     :block/tags :logseq.class/Tag
                     :logseq.property.class/extends (if (and (pos? i) (zero? (mod i 3)))
                                                      (keyword "user.class" (str "C" (dec i)))
                                                      :logseq.class/Root)})))
    (d/transact! conn [{:db/ident :user.property/up
                        :block/uuid (random-uuid)
                        :block/title "UP"
                        :block/name "up"
                        :block/tags :logseq.class/Property
                        :logseq.property/type :node
                        :db/valueType :db.type/ref
                        :db/cardinality :db.cardinality/many}])
    (d/transact! conn
                 (vec
                  (for [i (range page-count)]
                    {:block/uuid (random-uuid)
                     :block/title (str "Page " i)
                     :block/name (str "page " i)
                     :block/tags :logseq.class/Page})))
    (let [page-ids (vec (map :e (d/datoms @conn :avet :block/tags
                                          (:db/id (d/entity @conn :logseq.class/Page)))))]
      (d/transact! conn
                   (vec
                    (for [i (range object-count)]
                      {:block/uuid (random-uuid)
                       :block/title (str "Object " i)
                       :block/name (str "object " i)
                       :block/tags [(keyword "user.class" (str "C" (mod i class-count)))
                                    :logseq.class/Page]
                       :user.property/up (nth page-ids (mod i (count page-ids)))}))))
    conn))

(defn- elapsed-ms
  [f]
  (let [start (js/performance.now)]
    (f)
    (- (js/performance.now) start)))

(deftest node-property-selector-data-work-does-not-grow-with-graph
  (let [conn (large-graph-conn)
        db @conn
        property (d/entity db :user.property/up)
        option {:property {:db/id (:db/id property)
                           :db/ident :user.property/up
                           :logseq.property/type :node}
                :block {:db/id (:e (first (d/datoms db :avet :user.property/up)))}}
        tag-summaries (volatile! 0)
        structured-children-queries (volatile! 0)
        attribute-value->plain worker-plain/attribute-value->plain
        get-structured-children db-class/get-structured-children
        result (volatile! nil)
        selector-ms (with-redefs [worker-plain/attribute-value->plain
                                  (fn [db attr value]
                                    (when (= :block/tags attr) (vswap! tag-summaries inc))
                                    (attribute-value->plain db attr value))
                                  db-class/get-structured-children
                                  (fn [db class-id]
                                    (vswap! structured-children-queries inc)
                                    (get-structured-children db class-id))]
                      (elapsed-ms #(vreset! result (worker-property/property-node-selector-data db option))))
        values-ms (elapsed-ms #(doall (db-view/get-property-values db :user.property/up {})))]
    (prn :property-node-selector-data-ms selector-ms
         :get-property-values-ms values-ms
         :tag-summaries @tag-summaries
         :structured-children-queries @structured-children-queries)
    (is (<= page-count (count (:initial-choices @result)))
        "every page UP points to is a choice")
    (is (every? #(seq (get-in % [:value :block/tags])) (take 10 (:initial-choices @result)))
        "choices still carry their tags")
    (is (<= @tag-summaries (inc class-count))
        "each tag is summarized once, not once per choice")
    (is (zero? @structured-children-queries)
        "a property without classes queries no class descendants")))
