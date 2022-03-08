(ns frontend.db.query-dsl-test
  (:require [cljs.test :refer [are deftest testing use-fixtures is]]
            [clojure.string :as str]
            [frontend.db :as db]
            [frontend.db.config :refer [test-db] :as config]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.handler.repo :as repo-handler]))

;; TODO: quickcheck
;; 1. generate query filters
;; 2. find illegal queries which can't be executed by datascript
;; 3. find filters combinations which might break the current query implementation

;; Test helpers
;; ============
(defn- load-test-files [files]
  (repo-handler/parse-files-and-load-to-db! test-db files {:re-render? false}))

(defn- dsl-query
  [s]
  (db/clear-query-state!)
  (when-let [result (query-dsl/query test-db s)]
    (map first (deref result))))

(defn- custom-query
  [query]
  (db/clear-query-state!)
  (when-let [result (query-dsl/custom-query test-db query {})]
    (map first (deref result))))

(defn- q
  [s]
  (db/clear-query-state!)
  (let [parse-result (query-dsl/parse s)
        query (:query parse-result)]
    {:query (if (seq query) (vec query) query)
     :result (query-dsl/query test-db s)}))

;; Tests
;; =====

(deftest block-property-queries
  (load-test-files [{:file/path "journals/2022_02_28.md"
                     :file/content "a:: b
- b1
prop-a:: val-a
prop-num:: 2000
- b2
prop-a:: val-a
prop-b:: val-b
- b3
prop-c:: [[page a]], [[page b]], [[page c]]
prop-linked-num:: [[3000]]
prop-d:: [[no-space-link]]
- b4
prop-d:: nada"}])

  (testing "Blocks have given property value"
    (is (= #{"b1" "b2"}
           (set (map (comp first str/split-lines :block/content)
                 (dsl-query "(property prop-a val-a)")))))

    (is (= ["b2"]
           (map (comp first str/split-lines :block/content)
                (dsl-query "(property prop-b val-b)")))))

  (is (= ["b2"]
         (map (comp first str/split-lines :block/content)
              (dsl-query "(and (property prop-b val-b))")))
      "Blocks have property value with empty AND")

  (is (= ["b3"]
         (map (comp first str/split-lines :block/content)
              (dsl-query "(and (property prop-c \"page c\"))")))
      "Blocks have property value from a set of values")

  ;; TODO: optimize
  (is (= ["b3"]
         (map (comp first str/split-lines :block/content)
              (dsl-query "(and (property prop-c \"page c\") (property prop-c \"page b\"))")))
      "Blocks have ANDed property values")

  (is (= #{"b2" "b3"}
         (set
          (map (comp first str/split-lines :block/content)
               (dsl-query "(or (property prop-c \"page c\") (property prop-b val-b))"))))
      "Blocks have ORed property values")

  (is (= ["b1"]
         (map (comp first str/split-lines :block/content)
              (dsl-query "(property prop-num 2000)")))
      "Blocks have integer property value")

  (is (= ["b3"]
         (map (comp first str/split-lines :block/content)
              (dsl-query "(property prop-linked-num 3000)")))
      "Blocks have property with integer page value")

  (is (= ["b3"]
         (map (comp first str/split-lines :block/content)
              (dsl-query "(property prop-d no-space-link)")))
      "Blocks have property value with no space")

  (is (= ["b3" "b4"]
         (map (comp first str/split-lines :block/content)
              (dsl-query "(property prop-d)")))
      "Blocks that have a property"))

(deftest page-property-queries
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content "parent:: [[child page 1]], [[child-no-space]]"}
                    {:file/path "pages/page2.md"
                     :file/content "foo:: bar"}
                    {:file/path "pages/page3.md"
                     :file/content "parent:: [[child page 1]], child page 2\nfoo:: bar"}
                    {:file/path "pages/page4.md"
                     :file/content "parent:: child page 2\nfoo:: baz"}])

  (is (= ["page1" "page3" "page4"]
         (map :block/name (dsl-query "(page-property parent)")))
      "Pages have given property")

  (is (= ["page1" "page3"]
         (map :block/name (dsl-query "(page-property parent [[child page 1]])")))
      "Pages have property value that is a page and query is a page")

  (is (= ["page1" "page3"]
         (map :block/name (dsl-query "(page-property parent \"child page 1\")")))
      "Pages have property value that is a page and query is a string")

  (is (= ["page1"]
         (map :block/name (dsl-query "(page-property parent [[child-no-space]])")))
      "Pages have property value that is a page with no spaces")

  (is (= ["page3"]
         (map
          :block/name
          (dsl-query "(and (page-property parent [[child page 1]]) (page-property parent [[child page 2]]))")))
      "Page property queries ANDed")

  (is (= ["page1" "page3" "page4"]
         (map
          :block/name
          (dsl-query "(or (page-property parent [[child page 1]]) (page-property parent [[child page 2]]))")))
      "Page property queries ORed")

  (is (= ["page4"]
         (map
          :block/name
          (dsl-query "(and (page-property parent [[child page 2]]) (not (page-property foo bar)))")))
      "Page property queries NOTed"))

(deftest task-queries
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content "foo:: bar
- NOW b1
- TODO b2
- LATER b3
- LATER [#A] b4"}])

  (testing "Lowercase query"
    (is (= ["NOW b1"]
           (map :block/content (dsl-query "(task now)"))))

    (is (= ["LATER b3" "LATER [#A] b4"]
           (map :block/content (dsl-query "(task later)")))))

  (is (= ["LATER b3" "LATER [#A] b4"]
         (map :block/content (dsl-query "(task LATER)")))
      "Uppercase query")

  (testing "Multiple specified tasks results in ORed results"
    (is (= ["NOW b1" "LATER b3" "LATER [#A] b4"]
           (map :block/content (dsl-query "(task now later)"))))

    (is (= ["NOW b1" "LATER b3" "LATER [#A] b4"]
           (map :block/content (dsl-query "(task [now later])")))
        "Multiple arguments specified with vector notation"))

  (is (= ["NOW b1" "LATER [#A] b4"]
         (map :block/content
              (dsl-query "(or (todo now) (and (todo later) (priority a)))")))
      "Multiple boolean operators with todo and priority operators"))

(deftest sample-queries
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content "foo:: bar
- TODO b1
- TODO b2"}])

  (is (= 1
         (count (dsl-query "(and (task todo) (sample 1))")))
      "Correctly limits results")
  (is (= 2
         (count (dsl-query "(and (task todo) (sample blarg))")))
      "Non-integer arg is ignored"))

(deftest priority-queries
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content "foo:: bar
- [#A] b1
- [#B] b2
- [#A] b3"}])

  (testing "one arg queries"
    (is (= ["[#A] b1" "[#A] b3"]
           (map :block/content (dsl-query "(priority A)"))))
    (is (= ["[#A] b1" "[#A] b3"]
           (map :block/content (dsl-query "(priority a)")))))

  (testing "two arg queries"
    (is (= ["[#A] b1" "[#B] b2" "[#A] b3"]
           (map :block/content (dsl-query "(priority a b)"))))
    (is (= ["[#A] b1" "[#B] b2" "[#A] b3"]
           (map :block/content (dsl-query "(priority [a b])")))
        "Arguments with vector notation"))

  (is (= ["[#A] b1" "[#B] b2" "[#A] b3"]
         (map :block/content (dsl-query "(priority a b c)")))
      "Three arg queries and args that have no match"))

(deftest nested-boolean-queries
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content "foo:: bar
- DONE b1 [[page 1]]
- DONE b2 [[page 1]]"}
                    {:file/path "pages/page2.md"
                     :file/content "foo::bar
- NOW b3 [[page 1]]
- LATER b4 [[page 2]]
"}])

  (is (= 0
         (count (dsl-query "(and (todo done) (not [[page 1]]))"))))
  (is (= 2
         (count (dsl-query "(and (todo now later) (or [[page 1]] [[page 2]]))"))))

  (is (= 4
         (count (dsl-query "(and (todo now later done) (or [[page 1]] (not [[page 1]])))"))))

  ;; TODO
  #_(is (= 34
           (count (dsl-query "(not (and (todo now later) (or [[page 1]] [[page 2]])))"))))

  ;; FIXME: not working
  ;; Requires or-join and not-join which aren't supported yet
  ; (is (= []
  ;        (dsl-query "(or (priority a) (not (priority c)))")))
  )

(deftest page-tags-and-all-page-tags-queries
  (load-test-files
   [{:file/path "pages/page1.md"
     :file/content "---
tags: [[page-tag-1]], page-tag-2
---"}
    {:file/path "pages/page2.md"
     :file/content "---
tags: page-tag-2, [[page-tag-3]]
---"}
    {:file/path "pages/page3.md"
     :file/content "---
tags: other
---"}])

  (are [x y] (= (set y) (set (map :block/name (dsl-query x))))

       "(page-tags [[page-tag-1]])"
       ["page1"]

       "(page-tags page-tag-2)"
       ["page1" "page2"]

       "(page-tags page-tag-1 page-tag-2)"
       ["page1" "page2"]

       "(page-tags page-TAG-1 page-tag-2)"
       ["page1" "page2"]

       "(page-tags [page-tag-1 page-tag-2])"
       ["page1" "page2"]

       "(all-page-tags)"
       ["page-tag-1" "page-tag-2" "page-tag-3" "other"]))

(deftest block-content-query
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content "- b1 Hit\n- b2 Another"}])

  (is (= ["b1 Hit"]
         (map :block/content (dsl-query "\"Hit\""))))

  (is (= []
         (map :block/content (dsl-query "\"miss\"")))
      "Correctly returns no results"))

(deftest page-queries
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content "foo"}
                    {:file/path "pages/page2.md"
                     :file/content "bar"}])

  (is (= ["page1"]
         (map #(get-in % [:block/page :block/name])
              (dsl-query "(page page1)"))))

  (is (= []
         (map #(get-in % [:block/page :block/name])
              (dsl-query "(page nope)")))
      "Correctly returns no results"))

(deftest namespace-queries
  (load-test-files [{:file/path "pages/ns1.page1.md"
                     :file/content "foo"}
                    {:file/path "pages/ns1.page2.md"
                     :file/content "bar"}
                    {:file/path "pages/ns2.page1.md"
                     :file/content "baz"}])

  (is (= #{"ns1/page1" "ns1/page2"}
         (set (map :block/name (dsl-query "(namespace ns1)")))))

  (is (= #{}
         (set (map :block/name (dsl-query "(namespace blarg)"))))
      "Correctly returns no results"))

(deftest empty-queries
  (let [empty-result {:query nil :result nil}]
    (testing "nil or blank strings should be ignored"
      (are [x y] (= (q x) y)
           nil empty-result
           "" empty-result
           " " empty-result))

    (testing "Non exists page should be ignored"
      (are [x y] (nil? (:result (q x)))
           "[[page-not-exist]]" empty-result
           "[[another-page-not-exist]]" empty-result))))

(deftest page-ref-and-boolean-queries
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content "foo:: bar
- b1 [[page 1]] #tag2
- b2 [[page 2]] #tag1
- b3"}])

  (testing "page-ref queries"

    (is (= ["b2 [[page 2]] #tag1"]
           (map :block/content (dsl-query "[[page 2]]"))))

    (is (= []
           (map :block/content (dsl-query "[[blarg]]")))
        "Correctly returns no results"))

  (testing "basic boolean queries"
    (is (= ["b2 [[page 2]] #tag1"]
           (map :block/content
                (dsl-query "(and [[tag1]] [[page 2]])")))
        "AND query")

    (is (= ["b1 [[page 1]] #tag2" "b2 [[page 2]] #tag1"]
           (map :block/content
                (dsl-query "(or [[tag2]] [[page 2]])")))
        "OR query")

    (is (= ["foo:: bar\n" "b1 [[page 1]] #tag2" "b3"]
           (map :block/content
                ;; ANDed page1 to not clutter results with blocks in default db
                (dsl-query "(and (page page1) (not [[page 2]]))")))
        "NOT query")))

(defn- load-test-files-with-timestamps
  []
  (let [files [{:file/path "journals/2020_12_26.md"
                :file/content "---
title: Dec 26th, 2020
---
- DONE 26-b1
created-at:: 1608968448113
last-modified-at:: 1608968448113
- LATER 26-b2-modified-later
created-at:: 1608968448114
last-modified-at:: 1608968448120
- DONE 26-b3
created-at:: 1608968448115
last-modified-at:: 1608968448115
"}
               {:file/path "journals/2020_12_27.md"
                :file/content "---
title: Dec 27th, 2020
---
- NOW b1
created-at:: 1609052958714
last-modified-at:: 1609052958714
- LATER b2-modified-later
created-at:: 1609052959376
last-modified-at:: 1609052974285
- b3
created-at:: 1609052959954
last-modified-at:: 1609052959954
- b4
created-at:: 1609052961569
last-modified-at:: 1609052961569
- b5
created-at:: 1609052963089
last-modified-at:: 1609052963089"}
               {:file/path "journals/2020_12_28.md"
                :file/content "---
title: Dec 28th, 2020
---
- 28-b1
created-at:: 1609084800000
last-modified-at:: 1609084800000
- 28-b2-modified-later
created-at:: 1609084800001
last-modified-at:: 1609084800020
- 28-b3
created-at:: 1609084800002
last-modified-at:: 1609084800002"}]]
    (load-test-files files)))

(deftest between-queries
  (load-test-files-with-timestamps)

  (are [x y] (= (count (dsl-query x)) y)
       "(and (task now later done) (between [[Dec 26th, 2020]] tomorrow))"
       5

       ;; between with journal pages
       "(and (task now later done) (between [[Dec 27th, 2020]] [[Dec 28th, 2020]]))"
       2

       ;; ;; between with created-at
       ;; "(and (task now later done) (between created-at [[Dec 26th, 2020]] tomorrow))"
       ;; 5

       ;; ;; between with last-modified-at
       ;; "(and (task now later done) (between last-modified-at [[Dec 26th, 2020]] tomorrow))"
       ;; 5
       )
  )

(deftest custom-query-test
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content "foo:: bar
- NOW b1
- TODO b2
- LATER b3
- b3"}])

  (is (= ["LATER b3"]
         (map :block/content (custom-query {:query '(task later)}))))

  (is (= ["LATER b3"]
         (map :block/content (custom-query {:query (list 'and '(task later) "b")})))
      "Try"))

#_(deftest sort-by-queries
    (load-test-files-with-timestamps)
    ;; (testing "sort-by (created-at defaults to desc)"
    ;;   (db/clear-query-state!)
    ;;   (let [result (->> (q "(and (task now later done)
    ;;                              (sort-by created-at))")
    ;;                     :result
    ;;                     deref
    ;;                     (map #(get-in % [:block/properties "created-at"])))]
    ;;     (is (= result
    ;;            '(1609052959376 1609052958714 1608968448115 1608968448114 1608968448113)))))

    ;; (testing "sort-by (created-at desc)"
    ;;   (db/clear-query-state!)
    ;;   (let [result (->> (q "(and (todo now later done)
    ;;                              (sort-by created-at desc))")
    ;;                     :result
    ;;                     deref
    ;;                     (map #(get-in % [:block/properties "created-at"])))]
    ;;     (is (= result
    ;;            '(1609052959376 1609052958714 1608968448115 1608968448114 1608968448113)))))

    ;; (testing "sort-by (created-at asc)"
    ;;   (db/clear-query-state!)
    ;;   (let [result (->> (q "(and (todo now later done)
    ;;                              (sort-by created-at asc))")
    ;;                     :result
    ;;                     deref
    ;;                     (map #(get-in % [:block/properties "created-at"])))]
    ;;     (is (= result
    ;;            '(1608968448113 1608968448114 1608968448115 1609052958714 1609052959376)))))

    ;; (testing "sort-by (last-modified-at defaults to desc)"
    ;;   (db/clear-query-state!)
    ;;   (let [result (->> (q "(and (todo now later done)
    ;;                              (sort-by last-modified-at))")
    ;;                     :result
    ;;                     deref
    ;;                     (map #(get-in % [:block/properties "last-modified-at"])))]
    ;;     (is (= result
    ;;            '(1609052974285 1609052958714 1608968448120 1608968448115 1608968448113)))))

    ;; (testing "sort-by (last-modified-at desc)"
    ;;   (db/clear-query-state!)
    ;;   (let [result (->> (q "(and (todo now later done)
    ;;                              (sort-by last-modified-at desc))")
    ;;                     :result
    ;;                     deref
    ;;                     (map #(get-in % [:block/properties "last-modified-at"])))]
    ;;     (is (= result
    ;;            '(1609052974285 1609052958714 1608968448120 1608968448115 1608968448113)))))

    ;; (testing "sort-by (last-modified-at desc)"
    ;;   (db/clear-query-state!)
    ;;   (let [result (->> (q "(and (todo now later done)
    ;;                              (sort-by last-modified-at asc))")
    ;;                     :result
    ;;                     deref
    ;;                     (map #(get-in % [:block/properties "last-modified-at"])))]
    ;;     (is (= result
    ;;            '(1608968448113 1608968448115 1608968448120 1609052958714 1609052974285)))))
    )

(use-fixtures :each
              {:before config/start-test-db!
               :after config/destroy-test-db!})

#_(cljs.test/run-tests)

(comment
 (require '[clojure.pprint :as pprint])
 (config/start-test-db!)
 (load-test-files-with-timestamps)

 (query-dsl/query test-db "(task done)")

 ;; Useful for debugging
 (prn
  (datascript.core/q
   '[:find (pull ?b [*])
     :where
     [?b :block/name]]
   (frontend.db/get-conn test-db)))

 ;; (or (priority a) (not (priority a)))
 ;; FIXME: Error: Insufficient bindings: #{?priority} not bound in [(contains? #{"A"} ?priority)]
 (pprint/pprint
  (d/q
   '[:find (pull ?b [*])
     :where
     [?b :block/uuid]
     (or (and [?b :block/priority ?priority] [(contains? #{"A"} ?priority)])
         (not [?b :block/priority #{"A"}]
              [(contains? #{"A"} ?priority)]))]
   (frontend.db/get-conn test-db))))
