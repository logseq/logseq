(ns frontend.db.query-dsl-test
  (:require [cljs.test :refer [are deftest testing use-fixtures is]]
            [clojure.string :as str]
            [frontend.db :as db]
            [frontend.db.config :refer [test-db] :as config]
            [frontend.db.query-dsl :as dsl]
            [frontend.handler.repo :as repo-handler]))

;; TODO: quickcheck
;; 1. generate query filters
;; 2. find illegal queries which can't be executed by datascript
;; 3. find filters combinations which might break the current query implementation

(defn import-test-data!
  []
  (let [files [{:file/path "journals/2020_12_26.md"
                :file/content "---
title: Dec 26th, 2020
tags: [[page-tag-1]], page-tag-2
---
- DONE 26-b1 [[page 1]]
created-at:: 1608968448113
last-modified-at:: 1608968448113
- LATER 26-b2-modified-later [[page 2]] #tag1
created-at:: 1608968448114
last-modified-at:: 1608968448120
- DONE [#A] 26-b3 [[page 1]]
created-at:: 1608968448115
last-modified-at:: 1608968448115
"}
               {:file/path "journals/2020_12_27.md"
                :file/content "---
title: Dec 27th, 2020
tags: page-tag-2, [[page-tag-3]]
---
- NOW [#A] b1 [[page 1]]
created-at:: 1609052958714
last-modified-at:: 1609052958714
- LATER [#B] b2-modified-later [[page 2]]
created-at:: 1609052959376
last-modified-at:: 1609052974285
- b3 [[page 1]]
created-at:: 1609052959954
last-modified-at:: 1609052959954
- b4 [[page 2]]
created-at:: 1609052961569
last-modified-at:: 1609052961569
- b5
created-at:: 1609052963089
last-modified-at:: 1609052963089"}
               {:file/path "journals/2020_12_28.md"
                :file/content "---
title: Dec 28th, 2020
---
- 28-b1 [[page 1]]
created-at:: 1609084800000
last-modified-at:: 1609084800000
- 28-b2-modified-later [[page 2]]
created-at:: 1609084800001
last-modified-at:: 1609084800020
- 28-b3 [[page 1]]
created-at:: 1609084800002
last-modified-at:: 1609084800002"}]]
    (repo-handler/parse-files-and-load-to-db! test-db files {:re-render? false})))

;; Test helpers
;; ============
(defn- load-test-files [files]
  (repo-handler/parse-files-and-load-to-db! test-db files {:re-render? false}))

(defn- dsl-query
  [s]
  (db/clear-query-state!)
  (map first (deref (dsl/query test-db s))))

(def parse (partial dsl/parse test-db))

(defn- q
  [s]
  (db/clear-query-state!)
  (let [parse-result (parse s)
        query (:query parse-result)]
    {:query (if (seq query) (vec query) query)
     :result (dsl/query test-db s)}))

(defn q-count
  [s]
  (let [{:keys [query result]} (q s)]
    {:query query
     :count (if result
              (count @result)
              0)}))

(defn count-only
  [s]
  (:count (q-count s)))

(defonce empty-result {:query nil :result nil})

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
    (is (= ["b1" "b2"]
           (map (comp first str/split-lines :block/content)
                (dsl-query "(property prop-a val-a)"))))

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
      "Blocks have property value with no space"))

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

(deftest ^:large-vars/cleanup-todo test-parse
  []
  (import-test-data!)

  (testing "nil or blank strings should be ignored"
    (are [x y] (= (q x) y)
         nil empty-result
         "" empty-result
         " " empty-result))

  (testing "Non exists page should be ignored"
    (are [x y] (nil? (:result (q x)))
         "[[page-not-exist]]" empty-result
         "[[another-page-not-exist]]" empty-result))

  (testing "Single page query"
    (are [x y] (= (q-count x) y)
         "[[page 1]]"
         {:query '[[?b :block/path-refs [:block/name "page 1"]]]
          :count 6}

         "[[page 2]]"
         {:query '[[?b :block/path-refs [:block/name "page 2"]]]
          :count 4}))

  (testing "all-page-tags queries"
    (are [x y] (= (q-count x) y)
         "(all-page-tags)"
         {:query '[[?e :block/tags ?p]]
          :count 3}))

  (testing "page-tags queries"
    (are [x y] (= (q-count x) y)
         "(page-tags [[page-tag-1]])"
         {:query '[[?p :block/tags ?t]
                   [?t :block/name ?tag1]
                   [(contains? #{"page-tag-1"} ?tag1)]]
          :count 1}

         "(page-tags page-tag-2)"
         {:query '[[?p :block/tags ?t]
                   [?t :block/name ?tag1]
                   [(contains? #{"page-tag-2"} ?tag1)]]
          :count 2}

         "(page-tags page-tag-1 page-tag-2)"
         {:query '[[?p :block/tags ?t]
                   [?t :block/name ?tag1]
                   [(contains? #{"page-tag-1" "page-tag-2"} ?tag1)]]
          :count 2}

         "(page-tags page-TAG-1 page-tag-2)"
         {:query '[[?p :block/tags ?t]
                   [?t :block/name ?tag1]
                   [(contains? #{"page-tag-1" "page-tag-2"} ?tag1)]]
          :count 2}

         "(page-tags [page-tag-1 page-tag-2])"
         {:query '[[?p :block/tags ?t]
                   [?t :block/name ?tag1]
                   [(contains? #{"page-tag-1" "page-tag-2"} ?tag1)]]
          :count 2}))



  ;; boolean queries
  (testing "AND queries"
    (are [x y] (= (q-count x) y)
         "(and [[tag1]] [[page 2]])"
         {:query '([?b :block/path-refs [:block/name "tag1"]]
                   [?b :block/path-refs [:block/name "page 2"]])
          :count 1})

    (are [x y] (= (q-count x) y)
         "(and [[tag1]] [[page 2]])"
         {:query '([?b :block/path-refs [:block/name "tag1"]]
                   [?b :block/path-refs [:block/name "page 2"]])
          :count 1}))

  (testing "OR queries"
    (are [x y] (= (q-count x) y)
         "(or [[tag1]] [[page 2]])"
         {:query '(or
                   (and [?b :block/path-refs [:block/name "tag1"]])
                   (and [?b :block/path-refs [:block/name "page 2"]]))
          :count 4}))

  (testing "NOT queries"
    (are [x y] (= (q-count x) y)
         "(not [[page 1]])"
         {:query '([?b :block/uuid]
                   (not [?b :block/path-refs [:block/name "page 1"]]))
          :count 31}))

  (testing "Between query"
    (are [x y] (= (count-only x) y)
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
         ))
  )

#_(deftest sort-by-queries
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
  (import-test-data!)

  (dsl/query test-db "(all-page-tags)")

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
