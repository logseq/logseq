(ns logseq.graph-parser.block-test
  (:require [cljs.test :refer [deftest are testing is]]
            [datascript.core :as d]
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

(defn find-block-for-content
  [db content]
  (->> (d/q '[:find (pull ?b [* {:block/refs [:block/uuid]}])
              :in $ ?content
              :where [?b :block/title ?content]]
            db
            content)
       (map first)
       first))

(deftest timestamps-preserve-repeater-metadata
  (testing "non-recurring scheduled or deadline omits all repeat keys"
    (let [ts {"Scheduled" {:date {:year 2024 :month 4 :day 1}
                           :active true}}
          result (gp-block/timestamps->scheduled-and-deadline ts)]
      (is (= 20240401 (:scheduled result)))
      (is (nil? (:repeated? result)))
      (is (nil? (:repeat-type result)))
      (is (nil? (:recur-unit result)))
      (is (nil? (:recur-frequency result)))))

  (testing "mldoc repetition kind maps to the matching repeat-type keyword"
    (are [kind expected]
         (let [ts {"Scheduled" {:date {:year 2024 :month 4 :day 1}
                                :repetition [[kind] ["Day"] 1]
                                :active true}}
               result (gp-block/timestamps->scheduled-and-deadline ts)]
           (and (true? (:repeated? result))
                (= expected (:repeat-type result))))
      "Dotted"     :dotted-plus
      "Plus"       :plus
      "DoublePlus" :double-plus))

  (testing "unknown repetition kinds fall back to :double-plus"
    (let [ts {"Scheduled" {:date {:year 2024 :month 4 :day 1}
                           :repetition [["UnknownKind"] ["Day"] 1]
                           :active true}}
          result (gp-block/timestamps->scheduled-and-deadline ts)]
      (is (= :double-plus (:repeat-type result)))))

  (testing "mldoc repetition unit maps to the matching recur-unit keyword"
    (are [unit expected]
         (let [ts {"Scheduled" {:date {:year 2024 :month 4 :day 1}
                                :repetition [["Dotted"] [unit] 2]
                                :active true}}
               result (gp-block/timestamps->scheduled-and-deadline ts)]
           (= expected (:recur-unit result)))
      "Minute" :minute
      "Hour"   :hour
      "Day"    :day
      "Week"   :week
      "Month"  :month
      "Year"   :year))

  (testing "recur-frequency is carried through verbatim"
    (let [ts {"Scheduled" {:date {:year 2024 :month 4 :day 1}
                           :repetition [["DoublePlus"] ["Week"] 3]
                           :active true}}
          result (gp-block/timestamps->scheduled-and-deadline ts)]
      (is (= 3 (:recur-frequency result))))))