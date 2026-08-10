(ns logseq.graph-parser.block-test
  (:require [cljs.test :refer [deftest are testing is]]
            [datascript.core :as d]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.test.helper :as db-test]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.mldoc :as gp-mldoc]))

(defn- extract-properties
  [properties user-config]
  (gp-block/extract-properties
   (map
    (fn [[k v]]
      (let [mldoc-ast (gp-mldoc/get-references v (gp-mldoc/default-config :markdown))]
        [k v mldoc-ast]))
    properties)
   user-config))

(deftest test-fix-duplicate-id
  (are [x y]
       (let [result (gp-block/fix-duplicate-id (gp-block/block-keywordize x))]
         (and (:block/uuid result)
              (not= (:uuid x) (:block/uuid result))
              (= (select-keys result
                              [:block/properties :block/title :block/properties-text-values :block/properties-order]) (gp-block/block-keywordize y))))
    {:properties {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :tags [], :format :markdown, :meta {:start_pos 51, :end_pos 101}, :macros [], :title "bar\nid:: 63f199bc-c737-459f-983d-84acfcda14fe", :properties-text-values {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :level 1, :uuid #uuid "63f199bc-c737-459f-983d-84acfcda14fe", :properties-order [:id]}
    {:properties {},
     :title "bar",
     :properties-text-values {},
     :properties-order []}

    {:properties {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :tags [], :format :org, :meta {:start_pos 51, :end_pos 101}, :macros [], :title "bar\n:id: 63f199bc-c737-459f-983d-84acfcda14fe", :properties-text-values {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :level 1, :uuid #uuid "63f199bc-c737-459f-983d-84acfcda14fe", :properties-order [:id]}
    {:properties {},
     :title "bar",
     :properties-text-values {},
     :properties-order []}

    {:properties {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :tags [], :format :markdown, :meta {:start_pos 51, :end_pos 101}, :macros [], :title "bar\n  \n  id:: 63f199bc-c737-459f-983d-84acfcda14fe\nblock body", :properties-text-values {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :level 1, :uuid #uuid "63f199bc-c737-459f-983d-84acfcda14fe", :properties-order [:id]}
    {:properties {},
     :title "bar\nblock body",
     :properties-text-values {},
     :properties-order []}))

(deftest test-extract-properties
  (are [x y] (= (:properties (extract-properties x {})) y)
       ;; Built-in properties
    [["background-color" "#000000"]] {:background-color "#000000"}
    [["alias" "[[name/with space]]"]] {:alias #{"name/with space"}}
    [["tags" "[[foo]], [[bar]]"]] {:tags #{"foo" "bar"}}
    [["tags" "[[foo]] [[bar]]"]] {:tags #{"foo" "bar"}}
    [["tags" "bar"]] {:tags #{"bar"}}
    [["file-path" "file:///home/x, y.pdf"]] {:file-path "file:///home/x, y.pdf"}

       ;; User properties
    [["year" "1000"]] {:year 1000}
    [["year" "\"1000\""]] {:year "\"1000\""}
    [["year" "1000"] ["alias" "[[name/with space]]"]] {:year 1000, :alias #{"name/with space"}}
    [["year" "1000"] ["tags" "[[name/with space]]"]] {:year 1000, :tags #{"name/with space"}}
    [["year" "1000"] ["tags" "[[name/with space]], [[another]]"]] {:year 1000, :tags #{"name/with space" "another"}}
    [["year" "1000"] ["alias" "[[name/with space]], [[another]]"]] {:year 1000, :alias #{"name/with space" "another"}}
    [["year" "1000"] ["alias" "[[name/with space]], [[another [[nested]]]]"]] {:year 1000, :alias #{"name/with space" "another [[nested]]"}}
    [["year" "1000"] ["alias" "[[name/with space]], [[[[nested]] another]]"]] {:year 1000, :alias #{"name/with space" "[[nested]] another"}}
    [["foo" "bar"]] {:foo "bar"}
    [["foo" "[[bar]], [[baz]]"]] {:foo #{"bar" "baz"}}
    [["foo" "[[bar]], [[baz]]"]] {:foo #{"bar" "baz"}}
    [["foo" "[[bar]], [[baz]]"]] {:foo #{"bar" "baz"}}
    [["foo" "[[bar]], [[nested [[baz]]]]"]] {:foo #{"bar" "nested [[baz]]"}}
    [["foo" "[[bar]], [[nested [[baz]]]]"]] {:foo #{"bar" "nested [[baz]]"}}
    [["foo" "[[bar]], [[baz, test]]"]] {:foo #{"bar" "baz, test"}}
    [["foo" "[[bar]], [[baz, test, [[nested]]]]"]] {:foo #{"bar" "baz, test, [[nested]]"}})

  (testing "page-refs"
    (are [x y] (= (vec (:page-refs
                        (extract-properties x {:property-pages/enabled? true}))) y)
      [["year" "1000"]] ["year"]
      [["year" "\"1000\""]] ["year"]
      [["year" "1000"] ["month" "12"]] ["year" "month"]
      [["foo" "[[bar]] test"]] ["bar" "foo"]
      [["foo" "[[bar]] test [[baz]]"]] ["bar" "baz" "foo"]
      [["foo" "[[bar]] test [[baz]] [[nested [[baz]]]]"]] ["bar" "baz" "nested [[baz]]" "foo"]
      [["foo" "#bar, #baz"]] ["bar" "baz" "foo"]
      [["foo" "[[nested [[page]]]], test"]] ["nested [[page]]" "foo"])

    (are [x y] (= (vec (:page-refs
                        (extract-properties x {:property-pages/enabled? false}))) y)
      [["year" "1000"]] []
      [["year" "1000"] ["month" "12"]] []
      [["foo" "[[bar]] test"]] ["bar"])

    (is (= ["year"]
           (:page-refs
            (extract-properties [["year" "1000"] ["month" "12"]]
                                {:property-pages/enabled? true
                                 :property-pages/excludelist #{:month :day}})))
        ":property-pages/exclude-list excludes specified properties")

    (is (= ["year"]
           (:page-refs
            (extract-properties [["year" "1000"]]
                                {})))
        "Default to enabled when :property-pages/enabled? is not in config")

    (is (= ["foo" "bar" "tags"]
           (:page-refs
            (extract-properties
             ;; tags is linkable and background-color is not
             [["tags" "[[foo]], [[bar]]"] ["background-color" "#008000"]]
             {:property-pages/enabled? true})))
        "Only editable linkable built-in properties have page-refs in property values")))

(deftest test-page-name-map-namespace-for-slash-journals
  (testing "slash-formatted journals do not keep namespace metadata"
    (let [journal (gp-block/page-name->map "2026/05/18" nil false "yyyy/MM/dd")]
      (is (= 20260518 (:block/journal-day journal)))
      (is (= "2026/05/18" (:block/title journal)))
      (is (= "may 18th, 2026" (:block/name journal)))
      (is (= (common-uuid/gen-uuid :journal-page-uuid 20260518)
             (:block/uuid journal)))
      (is (nil? (:block/namespace journal)))))
  (testing "non-journal slash pages keep namespace metadata"
    (is (= {:block/name "project"}
           (:block/namespace (gp-block/page-name->map "project/child" nil false "yyyy/MM/dd"))))))

(deftest existing-journal-reference-reuses-stored-identity-test
  (testing "a legacy journal name is not rewritten while parsing a reference"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:build/journal 20260727}}]})
          journal (db-test/find-journal-by-journal-day @conn 20260727)
          journal-uuid (:block/uuid journal)]
      (d/transact! conn [[:db/add :logseq.class/Journal
                          :logseq.property.journal/title-format "yyyy-MM-dd"]
                         {:db/id (:db/id journal)
                          :block/title "2026-07-27"
                          :block/name "2026-07-27"}])
      (let [reference (gp-block/page-name->map "2026-07-27" @conn false "yyyy-MM-dd")]
        (is (= {:block/uuid journal-uuid
                :block/title "2026-07-27"
                :block/name "2026-07-27"
                :block/journal-day 20260727}
               (select-keys reference
                            [:block/uuid :block/title :block/name :block/journal-day]))))))

  (testing "an existing journal is found by day after the configured format changes"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:build/journal 20260727}}]})
          journal (db-test/find-journal-by-journal-day @conn 20260727)
          journal-uuid (:block/uuid journal)]
      (d/transact! conn [[:db/add :logseq.class/Journal
                          :logseq.property.journal/title-format "yyyy-MM-dd"]
                         {:db/id (:db/id journal)
                          :block/title "2026-07-27"
                          :block/name "2026-07-27"}])
      (d/transact! conn [[:db/add :logseq.class/Journal
                          :logseq.property.journal/title-format "dd/MM/yyyy"]])
      (let [reference (gp-block/page-name->map "27/07/2026" @conn false "dd/MM/yyyy")]
        (is (= {:block/uuid journal-uuid
                :block/title "2026-07-27"
                :block/name "2026-07-27"
                :block/journal-day 20260727}
               (select-keys reference
                            [:block/uuid :block/title :block/name :block/journal-day])))))))

(defn find-block-for-content
  [db content]
  (->> (d/q '[:find (pull ?b [* {:block/refs [:block/uuid]}])
              :in $ ?content
              :where [?b :block/title ?content]]
            db
            content)
       (map first)
       first))
