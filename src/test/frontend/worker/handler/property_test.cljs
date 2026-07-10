(ns frontend.worker.handler.property-test
  (:require [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [frontend.worker.handler.property :as worker-property]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
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
                          :block/tags :logseq.class/Tag}
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
         (is (= ["Page A"] (map :block/title (:initial-choices data)))))
       (p/catch
        (fn [error]
          (is false (str error))))
       (p/finally done)))))
