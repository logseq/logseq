(ns logseq.db.frontend.inputs-test
  (:require [cljs.test :refer [deftest is]]
            [cljs-time.core :as t]
            [datascript.core :as d]
            [logseq.db.frontend.rules :as rules]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.inputs :as db-inputs]
            [logseq.db.sqlite.build :as sqlite-build]))

(defn- custom-query [db {:keys [inputs query input-options]}]
  (let [q-args (cond-> (mapv #(db-inputs/resolve-input db % input-options) inputs)
                 (contains? (set query) '%)
                 (conj (rules/extract-rules rules/db-query-dsl-rules [:between])))]
    (->> (apply d/q query db q-args)
         (map first))))

(deftest resolve-input-for-page-and-block-inputs
  (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
        parent-uuid (random-uuid)
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/original-name "page1"}
             :blocks [{:block/content "parent"
                       :block/uuid parent-uuid}
                      {:block/content "child 1"
                       :block/parent {:db/id [:block/uuid parent-uuid]}}
                      {:block/content "child 2"
                       :block/parent {:db/id [:block/uuid parent-uuid]}}]}])]
    (is (= ["child 2" "child 1" "parent"]
           (map :block/content
                (custom-query @conn
                              {:inputs [:current-page]
                               :query '[:find (pull ?b [*])
                                        :in $ ?current-page
                                        :where [?b :block/page ?bp]
                                        [?bp :block/name ?current-page]]
                               :input-options {:current-page-fn (constantly "page1")}})))
        ":current-page input resolves to current page name")

    (is (= []
           (map :block/content
                (custom-query @conn
                              {:inputs [:current-page]
                               :query '[:find (pull ?b [*])
                                        :in $ ?current-page
                                        :where [?b :block/page ?bp]
                                        [?bp :block/name ?current-page]]})))
        ":current-page input doesn't resolve when :current-page-fn not provided")

    (is (= ["child 1" "child 2"]
           (let [block-uuid (-> (d/q '[:find (pull ?b [:block/uuid])
                                       :where [?b :block/content "parent"]] @conn)
                                ffirst
                                :block/uuid)]
             (map :block/content
                  (custom-query @conn
                                {:inputs [:current-block]
                                 :query '[:find (pull ?b [*])
                                          :in $ ?current-block
                                          :where [?b :block/parent ?current-block]]
                                 :input-options {:current-block-uuid block-uuid}}))))
        ":current-block input resolves to current block's :db/id")

    (is (= []
           (map :block/content
                (custom-query @conn
                              {:inputs [:current-block]
                               :query '[:find (pull ?b [*])
                                        :in $ ?current-block
                                        :where [?b :block/parent ?current-block]]})))
        ":current-block input doesn't resolve when :current-block-uuid is not provided")

    (is (= []
           (map :block/content
                (custom-query @conn
                              {:inputs [:current-block]
                               :query '[:find (pull ?b [*])
                                        :in $ ?current-block
                                        :where [?b :block/parent ?current-block]]
                               :input-options {:current-block-uuid :magic}})))
        ":current-block input doesn't resolve when current-block-uuid is invalid")

    (is (= ["parent"]
           (let [block-uuid (-> (d/q '[:find (pull ?b [:block/uuid])
                                       :where [?b :block/content "child 1"]] @conn)
                                ffirst
                                :block/uuid)]
             (map :block/content
                  (custom-query @conn
                                {:inputs [:parent-block]
                                 :query '[:find (pull ?parent-block [*])
                                          :in $ ?parent-block
                                          :where [?parent-block :block/parent]]
                                 :input-options {:current-block-uuid block-uuid}}))))
        ":parent-block input resolves to parent of current blocks's :db/id")))

(deftest resolve-input-for-journal-date-inputs
  (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
        _ (sqlite-build/create-blocks
           conn
           [{:page {:build/journal 20230101}
             :blocks [{:block/content "b1"}]}
            {:page {:build/journal 20230107}
             :blocks [{:block/content "b2"}]}])]
    (is (= ["b2"]
           (with-redefs [t/today (constantly (t/date-time 2023 1 7))]
             (map :block/content
                  (custom-query @conn
                                {:inputs [:3d-before :today]
                                 :query '[:find (pull ?b [*])
                                          :in $ ?start ?end %
                                          :where (between ?b ?start ?end)]}))))
        ":Xd-before and :today resolve to correct journal range")

    (is (= ["b1"]
           (with-redefs [t/today (constantly (t/date-time 2022 12 31))]
             (map :block/content
                  (custom-query @conn
                                {:inputs [:tomorrow :4d-after]
                                 :query '[:find (pull ?b [*])
                                          :in $ ?start ?end %
                                          :where (between ?b ?start ?end)]}))))
        ":tomorrow and :Xd-after resolve to correct journal range")))