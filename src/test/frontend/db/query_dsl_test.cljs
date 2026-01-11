(ns frontend.db.query-dsl-test
  (:require [cljs.test :refer [are deftest testing use-fixtures is]]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.db.react :as react]
            [frontend.test.helper :as test-helper :include-macros true :refer [load-test-files]]
            [frontend.util :as util]))

;; TODO: quickcheck
;; 1. generate query filters
;; 2. find illegal queries which can't be executed by datascript
;; 3. find filters combinations which might break the current query implementation

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

;; Test helpers
;; ============

(def db-block-attrs
  ;; '*' needed as we need to pull user properties and don't know their names in advance
  '[*
    {:block/page [:db/id :block/name :block/title :block/journal-day]}
    {:block/_parent ...}])

(def dsl-query*
  "Overrides dsl-query/query with ENV variables. When $EXAMPLE is set, prints query
  result of build query. This is useful for documenting examples and debugging.
   When $DB_QUERY_TYPE is set, runs query tests against other versions of simple query e.g.
   more basic property rules"
  (cond
    (some? js/process.env.EXAMPLE)
    (fn dsl-query-star [& args]
      (let [old-build-query query-dsl/build-query]
        (with-redefs [query-dsl/build-query
                      (fn [& args']
                        (let [res (apply old-build-query args')]
                          (println "EXAMPLE:" (pr-str (:query res)))
                          res))]
          (apply query-dsl/query args))))
    (some? js/process.env.DB_QUERY_TYPE)
    (fn dsl-query-star [& args]
      (let [old-build-property @#'query-dsl/build-property]
        (with-redefs [query-dsl/build-property
                      (fn [& args']
                        (let [m (apply old-build-property args')
                              m' (cond
                                   (= (:rules m) [:simple-query-property])
                                   {:rules [:property]
                                    :query (apply list 'property (rest (:query m)))}
                                   (= (:rules m) [:has-simple-query-property])
                                   {:rules [:has-property]
                                    :query (apply list 'has-property (rest (:query m)))}
                                   :else
                                   m)]
                          m'))
                      query-dsl/db-block-attrs db-block-attrs]
          (apply query-dsl/query args))))
    :else
    (fn dsl-query-star [& args]
      (with-redefs [query-dsl/db-block-attrs db-block-attrs]
        (apply query-dsl/query args)))))

(defn- dsl-query
  [s]
  (react/clear-query-state!)
  (when-let [result (dsl-query* test-helper/test-db s)]
    (map first (deref result))))

(defn- custom-query
  [query]
  (react/clear-query-state!)
  (when-let [result (with-redefs [query-dsl/db-block-attrs db-block-attrs]
                      (query-dsl/custom-query test-helper/test-db query {}))]
    (map first (deref result))))

;; Tests
;; =====

(deftest pre-transform-test
  (testing "page references should be quoted and tags should be handled"
    (are [x y] (= (query-dsl/pre-transform x) y)
      "#foo"
      "#tag foo"

      "(and #foo)"
      "(and #tag foo)"

      "[[test #foo]]"
      "\"[[test #foo]]\""

      "(and [[test #foo]] (or #foo))"
      "(and \"[[test #foo]]\" (or #tag foo))"

      "\"for #clojure\""
      "\"for #clojure\""

      "(and \"for #clojure\")"
      "(and \"for #clojure\")"

      "(and \"for #clojure\" #foo)"
      "(and \"for #clojure\" #tag foo)")))

(defn- testable-content
  "Only test :block/title up to page-ref as page-ref content varies between db and file graphs"
  [{:block/keys [title]}]
  (some->> title
           (re-find #"[^\[]+")
           string/trim))

(defn- block-property-queries-test
  []
  (load-test-files
   [{:page {:build/journal 20220228, :build/properties {:a "b"}}
     :blocks [{:block/title "b1", :build/properties {:prop-a "val-a", :prop-num 2000}}
              {:block/title "b2", :build/properties {:prop-a "val-a", :prop-b "val-b"}}
              {:block/title "b3"
               :build/properties {:prop-d #{[:build/page {:block/title "no-space-link"}]}
                                  :prop-c #{[:build/page {:block/title "page a"}] [:build/page {:block/title "page b"}] [:build/page {:block/title "page c"}]}
                                  :prop-linked-num #{[:build/page {:block/title "3000"}]}}}
              {:block/title "b4", :build/properties {:prop-d #{[:build/page {:block/title "nada"}]}}}]}])

  (testing "Blocks have given property value"
    (is (= #{"b1" "b2"}
           (set (map (comp first string/split-lines :block/title)
                     (dsl-query "(property prop-a val-a)")))))

    (is (= ["b2"]
           (map (comp first string/split-lines :block/title)
                (dsl-query "(property prop-b val-b)")))))

  (is (= ["b2"]
         (map (comp first string/split-lines :block/title)
              (dsl-query "(and (property prop-b val-b))")))
      "Blocks have property value with empty AND")

  (is (= ["b3"]
         (map (comp first string/split-lines :block/title)
              (dsl-query "(and (property prop-c \"page c\"))")))
      "Blocks have property value from a set of values")

  (is (= ["b3"]
         (map (comp first string/split-lines :block/title)
              (dsl-query "(and (property prop-c \"page c\") (property prop-c \"page b\"))")))
      "Blocks have ANDed property values")

  (is (= #{"b2" "b3"}
         (set
          (map (comp first string/split-lines :block/title)
               (dsl-query "(or (property prop-c \"page c\") (property prop-b val-b))"))))
      "Blocks have ORed property values")

  (is (= ["b1"]
         (map (comp first string/split-lines :block/title)
              (dsl-query "(property prop-num 2000)")))
      "Blocks have integer property value")

  (is (= ["b3"]
         (map (comp first string/split-lines :block/title)
              (dsl-query "(property prop-linked-num 3000)")))
      "Blocks have property with integer page value")

  (is (= ["b3"]
         (map (comp first string/split-lines :block/title)
              (dsl-query "(property prop-d no-space-link)")))
      "Blocks have property value with no space")

  (is (= #{"b3" "b4"}
         (set (map (comp first string/split-lines :block/title)
                   (dsl-query "(property prop-d)"))))
      "Blocks that have a property"))

(deftest block-property-queries
  (testing "block property tests with default config"
    (test-helper/with-config {}
      (block-property-queries-test))))

(deftest db-only-block-property-queries
  (load-test-files
   {:properties
    {:zzz {:logseq.property/type :default
           :block/title "zzz name!"}}
    :pages-and-blocks
    [{:page {:block/title "page1"}
      :blocks [{:block/title "b1"
                :build/properties {:Foo "bar"}}
               {:block/title "b2"
                :build/properties {:foo "bar"}}
               {:block/title "b3"
                :build/properties {:zzz "bar"}}]}]})

  (is (= ["b1"]
         (map :block/title (dsl-query "(property Foo)")))
      "filter is case sensitive")
  (is (= ["b2"]
         (map :block/title (dsl-query "(property :user.property/foo)")))
      "filter can handle qualified keyword properties")
  (is (= ["b3"]
         (map :block/title (dsl-query "(property \"zzz name!\")")))
      "filter can handle property name"))

(when (not js/process.env.DB_QUERY_TYPE)
  (deftest property-default-type-default-value-queries
    (load-test-files
     {:properties
      {:default {:logseq.property/type :default
                 :build/properties
                 {:logseq.property/default-value "foo"}
                 :build/properties-ref-types {:entity :number}}}
      :classes {:Class1 {:build/class-properties [:default]}}
      :pages-and-blocks
      [{:page {:block/title "page1"}
        :blocks [{:block/title "b1"
                  :build/properties {:default "foo"}}
                 {:block/title "b2"
                  :build/properties {:default "bar"}}
                 {:block/title "b3"
                  :build/tags [:Class1]}]}]})

    (is (= (set ["b3" "b2" "b1"])
           (set (map :block/title (dsl-query "(property :user.property/default)"))))
        "Blocks with any :default property or tagged with a tag that has that default-value property")
    (is (= ["b1" "b3"]
           (map :block/title (dsl-query "(property :user.property/default \"foo\")")))
        "Blocks with :default property value or tagged with a tag that has that default-value property value")
    (is (= ["b2"]
           (map :block/title (dsl-query "(property :user.property/default \"bar\")")))
        "Blocks with :default property value and not tagged with a tag that has that default-value property value"))

  (deftest property-checkbox-type-default-value-queries
    (load-test-files
     {:properties
      {:checkbox {:logseq.property/type :checkbox
                  :build/properties
                  {:logseq.property/scalar-default-value true}}}
      :classes {:Class1 {:build/class-properties [:checkbox]}}
      :pages-and-blocks
      [{:page {:block/title "page1"}
        :blocks [{:block/title "b1"
                  :build/properties {:checkbox true}}
                 {:block/title "b2"
                  :build/properties {:checkbox false}}
                 {:block/title "b3"
                  :build/tags [:Class1]}]}]})

    (is (= (set ["b3" "b2" "b1"])
           (set (map :block/title (dsl-query "(property :user.property/checkbox)"))))
        "Blocks with any :checkbox property or tagged with a tag that has that default-value property")
    (is (= ["b1" "b3"]
           (map :block/title (dsl-query "(property :user.property/checkbox true)")))
        "Blocks with :checkbox property value or tagged with a tag that has that default-value property value")
    (is (= ["b2"]
           (map :block/title (dsl-query "(property :user.property/checkbox false)")))
        "Blocks with :checkbox property value and not tagged with a tag that has that default-value property value"))

  (deftest closed-property-default-value-queries
    (load-test-files
     {:properties
      {:status {:logseq.property/type :default
                :build/closed-values
                [{:value "Todo" :uuid (random-uuid)}
                 {:value "Doing" :uuid (random-uuid)}]
                :build/properties
                {:logseq.property/default-value "Todo"}
                :build/properties-ref-types {:entity :number}}}
      :classes {:Mytask {:build/class-properties [:status]}
                :Bug {:build/class-extends [:Mytask]}}
      :pages-and-blocks
      [{:page {:block/title "page1"}
        :blocks [{:block/title "task1"
                  :build/properties {:status "Doing"}
                  :build/tags [:Mytask]}
                 {:block/title "task2"
                  :build/tags [:Mytask]}
                 {:block/title "bug1"
                  :build/properties {:status "Doing"}
                  :build/tags [:Bug]}
                 {:block/title "bug2"
                  :build/tags [:Bug]}]}]})

    (is (= #{"task2" "bug2"}
           (set (map :block/title (dsl-query "(property status \"Todo\")"))))
        "Blocks or tagged with or descended from a tag that has closed default-value property")
    (is (= #{"task1" "bug1"}
           (set (map :block/title (dsl-query "(property status \"Doing\")"))))
        "Blocks or tagged with or descended from a tag that don't have closed default-value property value")))

(deftest block-property-query-performance
  (let [pages (->> (repeat 10 {:tags ["tag1" "tag2"]})
                   (map-indexed (fn [idx {:keys [tags]}]
                                  {:page {:block/title (str "page" idx)
                                          :build/properties {:page-prop "b"}}
                                   :blocks [{:block/title (str "block for page" idx)
                                             :build/properties {:tagz (set (map #(vector :build/page {:block/title %}) tags))}}]}))
                   vec)
        _ (load-test-files pages)
        {:keys [result time]}
        (util/with-time (dsl-query "(and (property tagz tag1) (property tagz tag2))"))]
    ;; Specific number isn't as important as ensuring query doesn't take orders
    ;; of magnitude longer
    (is (> 40.0 time) "multi property query perf is reasonable")
    (is (= 10 (count result)))))

(defn- page-property-queries-test
  []
  (load-test-files
   [{:page {:block/title "page1"
            :build/properties {:parent #{[:build/page {:block/title "child page 1"}] [:build/page {:block/title "child-no-space"}]}, :interesting true, :foo "baz"}}}
    {:page {:block/title "page2", :build/properties {:foo "bar", :interesting false}}}
    {:page {:block/title "page3"
            :build/properties {:parent #{[:build/page {:block/title "child page 1"}] [:build/page {:block/title "child page 2"}]}, :foo "bar", :interesting false}}}
    {:page {:block/title "page4"
            :build/properties {:parent #{[:build/page {:block/title "child page 2"}]}, :foo "baz"}}}])
  (is (= ["page1" "page3" "page4"]
         (map :block/name (dsl-query "(property parent)")))
      "Pages have given property")

  (is (= #{"page1" "page3"}
         (set (map :block/name (dsl-query "(property parent [[child page 1]])"))))
      "Pages have property value that is a page and query is a page")

  (is (= #{"page1" "page3"}
         (set (map :block/name (dsl-query "(property parent \"child page 1\")"))))
      "Pages have property value that is a page and query is a string")

  (is (= ["page1"]
         (map :block/name (dsl-query "(property parent [[child-no-space]])")))
      "Pages have property value that is a page with no spaces")

  (is (= ["page3"]
         (map
          :block/name
          (dsl-query "(and (property parent [[child page 1]]) (property parent [[child page 2]]))")))
      "Page property queries ANDed")

  (is (= #{"page1" "page3" "page4"}
         (set
          (map
           :block/name
           (dsl-query "(or (property parent [[child page 1]]) (property parent [[child page 2]]))"))))
      "Page property queries ORed")

  (is (= ["page1" "page3"]
         (map :block/name
              (dsl-query "(and (property parent [[child page 1]]) (or (property foo baz) (property parent [[child page 2]])))"))))

  (is (= ["page4"]
         (map
          :block/name
          (dsl-query "(and (property parent [[child page 2]]) (not (property foo bar)))")))
      "Page property queries nested NOT in second clause")

  (is (= ["page4"]
         (map
          :block/name
          (dsl-query "(and (not (property foo bar)) (property parent [[child page 2]]))")))
      "Page property queries nested NOT in first clause")

  (testing "boolean values"
    (is (= ["page1"]
           (map :block/name (dsl-query "(property interesting true)")))
        "Boolean true")

    (is (= #{"page2" "page3"}
           (set (map :block/name (dsl-query "(property interesting false)"))))
        "Boolean false")))

(deftest page-property-queries
  (testing "page property tests with default config"
    (test-helper/with-config {}
      (page-property-queries-test))))

(deftest task-queries
  (load-test-files
   [{:page {:block/title "page1"}
     :blocks [{:build.test/title "DONE b1"}
              {:build.test/title "TODO b2"}
              {:build.test/title "DOING b3"}
              {:build.test/title "DOING b4 [[A]]"}
              {:build.test/title "DOING b5 [[B]]"}]}])

  (testing "Lowercase query"
    (is (= ["b1"]
           (map testable-content (dsl-query "(task done)"))))

    (is (= #{"b3" "b4" "b5"}
           (set (map testable-content (dsl-query "(task doing)"))))))

  (is (= #{"b3" "b4" "b5"}
         (set (map testable-content (dsl-query "(task DOING)"))))
      "Uppercase query")

  (testing "Multiple specified tasks results in ORed results"
    (is (= #{"b1" "b3" "b4" "b5"}
           (set (map testable-content (dsl-query "(task done doing)")))))

    (is (= #{"b1" "b3" "b4" "b5"}
           (set (map testable-content (dsl-query "(task [done doing])"))))
        "Multiple arguments specified with vector notation"))

  (is (= ["b1" "b4"]
         (map testable-content
              (dsl-query "(or (task done) (and (task doing) [[A]]))")))
      "Multiple boolean operators with todo and priority operators")

  (is (= ["b4" "b5"]
         (map testable-content
              (dsl-query "(and (task doing) (or [[A]] [[B]]))")))))

;; Ensure some filters work when no data with relevant properties exist
(deftest queries-with-no-data
  (load-test-files {:pages-and-blocks []})
  (is (= [] (dsl-query "(task todo)")))
  (is (= [] (dsl-query "(priority high)"))))

(deftest sample-queries
  (load-test-files
   [{:page {:block/title "page1", :build/properties {:foo "bar"}}
     :blocks [{:build.test/title "TODO b1"}
              {:build.test/title "TODO b2"}]}])
  (is (= 1
         (count (dsl-query "(and (task todo) (sample 1))")))
      "Correctly limits block results")
  (is (= 1
         (count (dsl-query "(and (property foo) (sample 1))")))
      "Correctly limits page results"))

(deftest priority-queries
  (load-test-files [{:page {:block/title "page1"}
                     :blocks [{:block/title "[#A] b1"
                               :build/properties {:logseq.property/priority :logseq.property/priority.high}}
                              {:block/title "[#B] b2"
                               :build/properties {:logseq.property/priority :logseq.property/priority.medium}}
                              {:block/title "[#A] b3"
                               :build/properties {:logseq.property/priority :logseq.property/priority.high}}]}])

  (testing "one arg queries"
    (is (= #{"[#A] b1" "[#A] b3"}
           (set (map :block/title
                     (dsl-query "(priority high)")))))
    (is (= #{"[#A] b1" "[#A] b3"}
           (set (map :block/title
                     (dsl-query "(priority high)"))))))

  (testing "two arg queries"
    (is (= #{"[#A] b1" "[#B] b2" "[#A] b3"}
           (set (map :block/title
                     (dsl-query "(priority high medium)")))))
    (is (= #{"[#A] b1" "[#B] b2" "[#A] b3"}
           (set (map :block/title
                     (dsl-query "(priority [high medium])"))))
        "Arguments with vector notation"))

  (is (= #{"[#A] b1" "[#B] b2" "[#A] b3"}
         (set (map :block/title
                   (dsl-query "(priority high medium low)"))))
      "Three arg queries and args that have no match"))

(deftest nested-boolean-queries
  (load-test-files
   [{:page {:block/title "page1", :build/properties {:foo "bar"}}
     :blocks [{:build.test/title "DONE b1 [[page 1]] [[page 3]]"}
              {:build.test/title "DONE b2Z [[page 1]]"}]}
    {:page {:block/title "page2", :build/properties {:foo "bar"}}
     :blocks [{:build.test/title "DOING b3 [[page 1]]"}
              {:build.test/title "TODO b4Z [[page 2]]"}]}])

  (let [task-filter "(task doing todo)"]
    (is (= []
           (dsl-query "(and (task done) (not [[page 1]]))")))

    (is (= ["b1"]
           (map testable-content
                (dsl-query "(and [[page 1]] (and [[page 3]] (not (task todo))))")))
        "Nested not")

    (is (= ["b3" "b4Z"]
           (map testable-content
                (dsl-query (str "(and " task-filter " (or [[page 1]] [[page 2]]))")))))

    (is (= #{"b3"
             "b4Z"
             "b1"
             "b2Z"}
           (set (map testable-content
                     (dsl-query (str "(and "
                                     "(task doing todo done)"
                                     " (or [[page 1]] (not [[page 1]])))"))))))

    (is (= #{"bar" "b1" "b2Z"}
           (->> (dsl-query (str "(not (and " task-filter " (or [[page 1]] [[page 2]])))"))
                (keep testable-content)
                (remove (fn [s] (db/page? (db/get-page s))))
                set)))

    (is (= #{"b2Z" "b4Z"}
           (->> (dsl-query "(and \"Z\" (or \"b2\" \"b4\"))")
                (keep testable-content)
                set))
        "AND-OR with full text search"))

  ;; FIXME: not working
  ;; Requires or-join and not-join which aren't supported yet
  ; (is (= []
  ;        (dsl-query "(or (priority a) (not (priority c)))")))
  )

(deftest tags-queries
  (load-test-files
   [{:page {:block/title "page1" :build/tags [:page-tag-1 :page-tag-2]}}
    {:page {:block/title "page2" :build/tags [:page-tag-2 :page-tag-3]}}
    {:page {:block/title "page3" :build/tags [:other]}}])

  (are [x y] (= (set y) (set (map :block/name (dsl-query x))))

    "(tags [[page-tag-1]])"
    ["page1"]

    "(tags page-tag-2)"
    ["page1" "page2"]

    "(tags page-tag-1 page-tag-2)"
    ["page1" "page2"]

    "(tags page-TAG-1 page-tag-2)"
    ["page1" "page2"]

    "(tags [page-tag-1 page-tag-2])"
    ["page1" "page2"]))

(deftest block-content-query
  (load-test-files [{:page {:block/title "page1"}
                     :blocks [{:block/title "b1 Hit"}
                              {:block/title "b2 Another"}]}])

  (is (= ["b1 Hit"]
         (map :block/title (dsl-query "\"Hit\""))))

  (is (= []
         (map :block/title (dsl-query "\"miss\"")))
      "Correctly returns no results"))

(deftest page-queries
  (load-test-files [{:page {:block/title "page1"}
                     :blocks [{:block/title "foo"}]}
                    {:page {:block/title "page2"}
                     :blocks [{:block/title "bar"}]}])

  (is (= ["page1"]
         (map (fn [result]
                (:block/title (db/entity (:db/id (:block/page result)))))
              (dsl-query "(page page1)"))))

  (is (= []
         (map (fn [result]
                (:block/title (db/entity (:db/id (:block/page result)))))
              (dsl-query "(page nope)")))
      "Correctly returns no results"))

(deftest empty-queries
  (testing "nil or blank strings should be ignored"
    (are [x] (nil? (dsl-query x))
      nil
      ""
      " "
      "\"\"")))

(deftest page-ref-and-boolean-queries
  (load-test-files
   [{:page {:block/title "page1", :build/properties {:foo "bar"}}
     :blocks [{:block/title "b1 [[page 1]] [[tag2]]"}
              {:block/title "b2 [[page 2]] [[tag1]]"}
              {:block/title "b3"}]}])

  (testing "page-ref queries"

    (is (= ["b2"]
           (map testable-content (dsl-query "[[page 2]]")))
        "Page ref arg")

    (is (= ["b2"]
           (map testable-content (dsl-query "#tag1")))
        "Tag arg")

    (is (empty? (dsl-query "[[blarg]]"))
        "Nonexistent page returns no results"))

  (testing "basic boolean queries"
    (is (= ["b2"]
           (map testable-content
                (dsl-query "(and [[tag1]] [[page 2]])")))
        "AND query")

    (is (= ["b1" "b2"]
           (map testable-content
                (dsl-query "(or [[tag2]] [[page 2]])")))
        "OR query")

    (comment
      ;; FIXME: load-test-files doesn't save `b4`
      (is (= ["b1" "b4"]
             (map testable-content
                  (dsl-query "(or [[tag2]] [[page 4]])")))
          "OR query"))

    (is (= ["b1"]
           (map testable-content
                (dsl-query "(or [[tag2]] [[page not exists]])")))
        "OR query with nonexistent page should return meaningful results")

    (is (= #{"b1" "bar" "b3"}
           (->> (dsl-query "(not [[page 2]])")
                ;; Only filter to page1 to get meaningful results
                (filter #(= "page1" (get-in % [:block/page :block/name])))
                (map testable-content)
                (set)))
        "NOT query")))

(deftest nested-page-ref-queries
  (load-test-files [{:page {:block/title "page1"}
                     :blocks [{:block/title "p1 [[Parent page]]"
                               :build/children [{:block/title "[[Child page]]"}]}
                              {:block/title "p2 [[Parent page]]"
                               :build/children [{:block/title "Non linked content"}]}]}])
  (is (= (set
          ["Non linked content"
           "p2"
           "p1"])
         (set
          (map testable-content
               (dsl-query "(and [[Parent page]] (not [[Child page]]))"))))))

(deftest between-queries
  (load-test-files
   [{:page {:build/journal 20201226}
     :blocks [{:build.test/title "DONE 26-b1", :block/created-at 1608968448113}
              {:build.test/title "TODO 26-b2-modified-later", :block/created-at 1608968448114}
              {:build.test/title "DONE 26-b3", :block/created-at 1608968448115}
              {:block/title "26-b4", :block/created-at 1608968448116}]}])

  (let [task-filter "(task todo done)"]
    (are [x y] (= (count (dsl-query x)) y)
      (str "(and " task-filter " (between [[Dec 26th, 2020]] tomorrow))")
      3

       ;; between with journal pages
      (str "(and " task-filter " (between [[Dec 26th, 2020]] [[Dec 27th, 2020]]))")
      3)

    (is (= 3 (count (dsl-query "(and (task todo done) (between created-at [[Dec 26th, 2020]]))"))))
    (is (= 3 (count (dsl-query "(and (task todo done) (between created-at [[Dec 26th, 2020]] +1d))"))))))

(deftest custom-query-test
  (load-test-files
   [{:page {:block/title "page1", :build/properties {:foo "bar"}}
     :blocks [{:build.test/title "DOING b1"}
              {:build.test/title "TODO b2"}
              {:build.test/title "TODO b3"}
              {:block/title "b3"}]}])

  (let [task-query '(task doing)]
    (is (= ["b1"]
           (map :block/title (custom-query {:query task-query}))))

    (is (= ["b1"]
           (map :block/title (custom-query {:query (list 'and task-query "b")})))
        "Query with rule that can't be derived from the form itself")))

(deftest simplify-query
  (are [x y] (= (query-dsl/simplify-query x) y)
    '(and [[foo]])
    '[[foo]]

    '(and (and [[foo]]))
    '[[foo]]

    '(and (or [[foo]]))
    '[[foo]]

    '(and (not [[foo]]))
    '(not [[foo]])

    '(and (or (and [[foo]])))
    '[[foo]]

    '(not (or [[foo]]))
    '(not [[foo]])))

(comment
  (require '[clojure.pprint :as pprint])
  (test-helper/start-test-db!)

  (query-dsl/query test-helper/test-db "(task done)")

 ;; Useful for debugging
  (prn
   (datascript.core/q
    '[:find (pull ?b [*])
      :where
      [?b :block/name]]
    (frontend.db/get-db test-helper/test-db)))
  )