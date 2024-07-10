(ns logseq.db.frontend.inputs-test
  (:require [cljs.test :refer [deftest is]]
            [cljs-time.core :as t]
            [datascript.core :as d]
            [logseq.common.util.date-time :as date-time-util]
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
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/title "page1"}
             :blocks [{:block/title "parent"
                       :build/children
                       [{:block/title "child 1"}
                        {:block/title "child 2"}]}]}])]
    (is (= ["child 2" "child 1" "parent"]
           (map :block/title
                (custom-query @conn
                              {:inputs [:current-page]
                               :query '[:find (pull ?b [*])
                                        :in $ ?current-page
                                        :where [?b :block/page ?bp]
                                        [?bp :block/name ?current-page]]
                               :input-options {:current-page-fn (constantly "page1")}})))
        ":current-page input resolves to current page name")

    (is (= []
           (map :block/title
                (custom-query @conn
                              {:inputs [:current-page]
                               :query '[:find (pull ?b [*])
                                        :in $ ?current-page
                                        :where [?b :block/page ?bp]
                                        [?bp :block/name ?current-page]]})))
        ":current-page input doesn't resolve when :current-page-fn not provided")

    (is (= ["child 1" "child 2"]
           (let [block-uuid (-> (d/q '[:find (pull ?b [:block/uuid])
                                       :where [?b :block/title "parent"]] @conn)
                                ffirst
                                :block/uuid)]
             (map :block/title
                  (custom-query @conn
                                {:inputs [:current-block]
                                 :query '[:find (pull ?b [*])
                                          :in $ ?current-block
                                          :where [?b :block/parent ?current-block]]
                                 :input-options {:current-block-uuid block-uuid}}))))
        ":current-block input resolves to current block's :db/id")

    (is (thrown-with-msg?
         js/Error
         #"Nothing found for entity"
         (custom-query @conn
                       {:inputs [:current-block]
                        :query '[:find (pull ?b [*])
                                 :in $ ?current-block
                                 :where [?b :block/parent ?current-block]]
                        :input-options {:current-block-uuid nil}}))
        ":current-block input doesn't resolve and fails when :current-block-uuid is not provided")

    (is (thrown-with-msg?
         js/Error
         #"Nothing found for entity"
         (custom-query @conn
                       {:inputs [:current-block]
                        :query '[:find (pull ?b [*])
                                 :in $ ?current-block
                                 :where [?b :block/parent ?current-block]]
                        :input-options {:current-block-uuid :magic}}))
        ":current-block input doesn't resolve and fails when :current-block-uuid is invalid")

    (is (= ["parent"]
           (let [block-uuid (-> (d/q '[:find (pull ?b [:block/uuid])
                                       :where [?b :block/title "child 1"]] @conn)
                                ffirst
                                :block/uuid)]
             (map :block/title
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
             :blocks [{:block/title "b1"}]}
            {:page {:build/journal 20230107}
             :blocks [{:block/title "b2"}]}])]
    (is (= ["b2"]
           (with-redefs [t/today (constantly (t/date-time 2023 1 7))]
             (map :block/title
                  (custom-query @conn
                                {:inputs [:3d-before :today]
                                 :query '[:find (pull ?b [*])
                                          :in $ ?start ?end %
                                          :where (between ?b ?start ?end)]}))))
        ":Xd-before and :today resolve to correct journal range")

    (is (= ["b1"]
           (with-redefs [t/today (constantly (t/date-time 2022 12 31))]
             (map :block/title
                  (custom-query @conn
                                {:inputs [:tomorrow :4d-after]
                                 :query '[:find (pull ?b [*])
                                          :in $ ?start ?end %
                                          :where (between ?b ?start ?end)]}))))
        ":tomorrow and :Xd-after resolve to correct journal range")))

(defn- block-with-content [db block-content]
  (-> (d/q '[:find (pull ?b [:block/uuid])
             :in $ ?content
             :where [?b :block/title ?content]]
           db block-content)
      ffirst))

(defn- blocks-on-journal-page-from-block-with-content [db page-input block-content current-page-date]
  (map :block/title
       (custom-query db
                     {:inputs [page-input]
                      :query '[:find (pull ?b [*])
                               :in $ ?page
                               :where [?b :block/page ?e]
                               [?e :block/name ?page]]
                      :input-options
                      {:current-block-uuid (get (block-with-content db block-content) :block/uuid)
                       :current-page-fn (constantly
                                         (date-time-util/int->journal-title (date-time-util/date->int current-page-date)
                                                                            "MMM do, yyyy"))}})))

(deftest resolve-input-for-query-page
  (let [current-date (t/date-time 2023 1 1)
        conn (d/create-conn db-schema/schema-for-db-based-graph)
        _ (sqlite-build/create-blocks
           conn
           [{:page {:build/journal 20221231} :blocks [{:block/title "-1d"}]}
            {:page {:build/journal 20230101} :blocks [{:block/title "now"}]}
            {:page {:build/journal 20230102} :blocks [{:block/title "+1d"}]}])
        db @conn]
    (is (= ["now"] (blocks-on-journal-page-from-block-with-content db :current-page "now" current-date))
        ":current-page resolves to the stateful page when called from a block on the stateful page")

    (is (= ["now"] (blocks-on-journal-page-from-block-with-content db :query-page "now" current-date))
        ":query-page resolves to the stateful page when called from a block on the stateful page")

    (is (= ["now"] (blocks-on-journal-page-from-block-with-content db :current-page "+1d" current-date))
        ":current-page resolves to the stateful page when called from a block on another page")

    (is (= ["+1d"] (blocks-on-journal-page-from-block-with-content db :query-page "+1d" current-date))
        ":query-page resolves to the parent page when called from another page")))

(defn- blocks-journaled-between-inputs [db a b]
  ;; reverse is for sort order and may be brittle
  (reverse
   (map :block/title
        (custom-query db
                      {:inputs [a b]
                       :query '[:find (pull ?b [*])
                                :in $ ?start ?end %
                                :where (between ?b ?start ?end)]}))))

(deftest resolve-input-for-relative-date-queries
  (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
        _ (sqlite-build/create-blocks
           conn
           [{:page {:build/journal 20220101} :blocks [{:block/title "-1y"}]}
            {:page {:build/journal 20221201} :blocks [{:block/title "-1m"}]}
            {:page {:build/journal 20221225} :blocks [{:block/title "-1w"}]}
            {:page {:build/journal 20221231} :blocks [{:block/title "-1d"}]}
            {:page {:build/journal 20230101} :blocks [{:block/title "now"}]}
            {:page {:build/journal 20230102} :blocks [{:block/title "+1d"}]}
            {:page {:build/journal 20230108} :blocks [{:block/title "+1w"}]}
            {:page {:build/journal 20230201} :blocks [{:block/title "+1m"}]}
            {:page {:build/journal 20240101} :blocks [{:block/title "+1y"}]}])
        db @conn]
    (with-redefs [t/today (constantly (t/date-time 2023 1 1))]
      (is (= ["now" "-1d" "-1w" "-1m" "-1y"] (blocks-journaled-between-inputs db :-365d :today))
          ":-365d and today resolve to correct journal range")

      (is (= ["now" "-1d" "-1w" "-1m" "-1y"] (blocks-journaled-between-inputs db :-1y :today))
          ":-1y and today resolve to correct journal range")

      (is (= ["now" "-1d" "-1w" "-1m"] (blocks-journaled-between-inputs db :-1m :today))
          ":-1m and today resolve to correct journal range")

      (is (= ["now" "-1d" "-1w"] (blocks-journaled-between-inputs db :-1w :today))
          ":-1w and today resolve to correct journal range")

      (is (= ["now" "-1d"] (blocks-journaled-between-inputs db :-1d :today))
          ":-1d and today resolve to correct journal range")

      (is (= ["+1y" "+1m" "+1w" "+1d" "now"] (blocks-journaled-between-inputs db :today :+365d))
          ":+365d and today resolve to correct journal range")

      (is (= ["+1y" "+1m" "+1w" "+1d" "now"] (blocks-journaled-between-inputs db :today :+1y))
          ":+1y and today resolve to correct journal range")

      (is (= ["+1m" "+1w" "+1d" "now"] (blocks-journaled-between-inputs db :today :+1m))
          ":+1m and today resolve to correct journal range")

      (is (= ["+1w" "+1d" "now"] (blocks-journaled-between-inputs db :today :+1w))
          ":+1w and today resolve to correct journal range")

      (is (= ["+1d" "now"] (blocks-journaled-between-inputs db :today :+1d))
          ":+1d and today resolve to correct journal range")

      (is (= ["+1d" "now"] (blocks-journaled-between-inputs db :today :today/+1d))
          ":today/+1d and today resolve to correct journal range"))))
