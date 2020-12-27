(ns frontend.db.query-dsl-test
  (:require [frontend.db.query-dsl :as dsl]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.db.config :refer [test-db] :as config]
            [datascript.core :as d]
            [frontend.db-schema :as schema]
            [frontend.handler.repo :as repo-handler]
            [cljs.test :refer [deftest is are testing use-fixtures]]))

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
parent: [[child page 1]]
---
## DONE 26-b1 [[page 1]]
:PROPERTIES:
:created_at: 1608968448113
:last_modified_at: 1608968448113
:prop_a: val_a
:prop_c: [[page a]], [[page b]], [[page c]]
:END:
## LATER 26-b2-modified-later [[page 2]] #tag1
:PROPERTIES:
:created_at: 1608968448114
:last_modified_at: 1608968448120
:prop_b: val_b
:END:
## DONE [#A] 26-b3 [[page 1]]
:PROPERTIES:
:created_at: 1608968448115
:last_modified_at: 1608968448115
:END:
"}
               {:file/path "journals/2020_12_27.md"
                :file/content "---
title: Dec 27th, 2020
tags: page-tag-2, [[page-tag-3]]
parent: [[child page 1]], child page 2
---
## NOW [#A] b1 [[page 1]]
:PROPERTIES:
:created_at: 1609052958714
:last_modified_at: 1609052958714
:END:
## LATER [#B] b2-modified-later [[page 2]]
:PROPERTIES:
:created_at: 1609052959376
:last_modified_at: 1609052974285
:END:
## b3 [[page 1]]
:PROPERTIES:
:created_at: 1609052959954
:last_modified_at: 1609052959954
:prop_a: val_a
:END:
## b4 [[page 2]]
:PROPERTIES:
:created_at: 1609052961569
:last_modified_at: 1609052961569
:END:
## b5
:PROPERTIES:
:created_at: 1609052963089
:last_modified_at: 1609052963089
:END:"}
               {:file/path "journals/2020_12_28.md"
                :file/content "---
title: Dec 28th, 2020
parent: child page 2
---
## 28-b1 [[page 1]]
:PROPERTIES:
:created_at: 1609084800000
:last_modified_at: 1609084800000
:END:
## 28-b2-modified-later [[page 2]]
:PROPERTIES:
:created_at: 1609084800001
:last_modified_at: 1609084800020
:END:
## 28-b3 [[page 1]]
:PROPERTIES:
:created_at: 1609084800002
:last_modified_at: 1609084800002
:END:
"}]]
    (repo-handler/parse-files-and-load-to-db! test-db files {:re-render? false})))

(def parse (partial dsl/parse test-db))

(defn- q
  [s]
  (db/clear-query-state!)
  (let [parse-result (parse s)]
    {:query (:query parse-result)
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

(deftest test-parse
  []
  (testing "nil or blank strings should be ignored"
    (are [x y] (= (q x) y)
      nil empty-result
      "" empty-result
      " " empty-result))

  (testing "Non exists page should be ignored"
    (are [x y] (= (q x) y)
      "[[page-not-exist]]" empty-result
      "[[another-page-not-exist]]" empty-result))

  (testing "Single page query"
    (are [x y] (= (q-count x) y)
      "[[page 1]]"
      {:query '[[?b :block/ref-pages [:page/name "page 1"]]]
       :count 6}

      "[[page 2]]"
      {:query '[[?b :block/ref-pages [:page/name "page 2"]]]
       :count 4}))

  (testing "Block properties query"
    (are [x y] (= (q-count x) y)
      "(property prop_a val_a)"
      {:query '[[?b :block/properties ?p]
                [(get ?p "prop_a") ?v]
                (or
                 [(= ?v "val_a")]
                 [(contains? ?v "val_a")])]
       :count 2}

      "(property prop_b val_b)"
      {:query '[[?b :block/properties ?p]
                [(get ?p "prop_b") ?v]
                (or
                 [(= ?v "val_b")]
                 [(contains? ?v "val_b")])]
       :count 1}

      "(and (property prop_b val_b))"
      {:query '[[?b :block/properties ?p]
                [(get ?p "prop_b") ?v]
                (or
                 [(= ?v "val_b")]
                 [(contains? ?v "val_b")])]
       :count 1}

      "(and (property prop_c \"page c\"))"
      {:query '[[?b :block/properties ?p]
                [(get ?p "prop_c") ?v]
                (or
                 [(= ?v "page c")]
                 [(contains? ?v "page c")])]
       :count 1}

      ;; TODO: optimize
      "(and (property prop_c \"page c\") (property prop_c \"page b\"))"
      {:query '([?b :block/properties ?p]
                [(get ?p "prop_c") ?v]
                (or [(= ?v "page c")] [(contains? ?v "page c")])
                (or [(= ?v "page b")] [(contains? ?v "page b")]))
       :count 1}

      "(or (property prop_c \"page c\") (property prop_b val_b))"
      {:query '(or
                (and [?b :block/properties ?p]
                     [(get ?p "prop_c") ?v]
                     (or [(= ?v "page c")] [(contains? ?v "page c")]))
                (and [?b :block/properties ?p]
                     [(get ?p "prop_b") ?v]
                     (or [(= ?v "val_b")] [(contains? ?v "val_b")])))
       :count 2}))

  (testing "TODO queries"
    (are [x y] (= (q-count x) y)
      "(todo now)"
      {:query '[[?b :block/marker ?marker]
                [(contains? #{"NOW"} ?marker)]]
       :count 1}

      "(todo NOW)"
      {:query '[[?b :block/marker ?marker]
                [(contains? #{"NOW"} ?marker)]]
       :count 1}

      "(todo later)"
      {:query '[[?b :block/marker ?marker]
                [(contains? #{"LATER"} ?marker)]]
       :count 2}

      "(todo now later)"
      {:query '[[?b :block/marker ?marker]
                [(contains? #{"NOW" "LATER"} ?marker)]]
       :count 3}

      "(todo [now later])"
      {:query '[[?b :block/marker ?marker]
                [(contains? #{"NOW" "LATER"} ?marker)]]
       :count 3}))

  (testing "Priority queries"
    (are [x y] (= (q-count x) y)
      "(priority A)"
      {:query '[[?b :block/priority ?priority]
                [(contains? #{"A"} ?priority)]]
       :count 2}

      "(priority a)"
      {:query '[[?b :block/priority ?priority]
                [(contains? #{"A"} ?priority)]]
       :count 2}

      "(priority a b)"
      {:query '[[?b :block/priority ?priority]
                [(contains? #{"A" "B"} ?priority)]]
       :count 3}

      "(priority [a b])"
      {:query '[[?b :block/priority ?priority]
                [(contains? #{"A" "B"} ?priority)]]
       :count 3}

      "(priority a b c)"
      {:query '[[?b :block/priority ?priority]
                [(contains? #{"A" "B" "C"} ?priority)]]
       :count 3}))

  (testing "all-page-tags queries"
    (are [x y] (= (q-count x) y)
      "(all-page-tags)"
      {:query '[[?t :tag/name ?tag]
                [?p :page/name ?tag]]
       :count 3}))

  (testing "page-tags queries"
    (are [x y] (= (q-count x) y)
      "(page-tags [[page-tag-1]])"
      {:query '[[?p :page/tags ?t]
                [?t :tag/name ?tag]
                [(contains? #{"page-tag-1"} ?tag)]]
       :count 1}

      "(page-tags page-tag-2)"
      {:query '[[?p :page/tags ?t]
                [?t :tag/name ?tag]
                [(contains? #{"page-tag-2"} ?tag)]]
       :count 2}

      "(page-tags page-tag-1 page-tag-2)"
      {:query '[[?p :page/tags ?t]
                [?t :tag/name ?tag]
                [(contains? #{"page-tag-1" "page-tag-2"} ?tag)]]
       :count 2}

      "(page-tags page-TAG-1 page-tag-2)"
      {:query '[[?p :page/tags ?t]
                [?t :tag/name ?tag]
                [(contains? #{"page-tag-1" "page-tag-2"} ?tag)]]
       :count 2}

      "(page-tags [page-tag-1 page-tag-2])"
      {:query '[[?p :page/tags ?t]
                [?t :tag/name ?tag]
                [(contains? #{"page-tag-1" "page-tag-2"} ?tag)]]
       :count 2}))

  (testing "page-property queries"
    (are [x y] (= (q-count x) y)
      "(page-property parent [[child page 1]])"
      {:query '[[?p :page/properties ?prop]
                [(get ?prop :parent) ?v]
                (or
                 [(= ?v "child page 1")]
                 [(contains? ?v "child page 1")])]
       :count 2}

      "(page-property parent \"child page 1\")"
      {:query '[[?p :page/properties ?prop]
                [(get ?prop :parent) ?v]
                (or
                 [(= ?v "child page 1")]
                 [(contains? ?v "child page 1")])]
       :count 2}

      "(and (page-property parent [[child page 1]]) (page-property parent [[child page 2]]))"
      {:query '([?p :page/properties ?prop]
                [(get ?prop :parent) ?v]
                (or [(= ?v "child page 1")] [(contains? ?v "child page 1")])
                (or [(= ?v "child page 2")] [(contains? ?v "child page 2")]))
       :count 1}

      "(or (page-property parent [[child page 1]]) (page-property parent [[child page 2]]))"
      {:query '(or (and
                    [?p :page/properties ?prop]
                    [(get ?prop :parent) ?v]
                    (or [(= ?v "child page 1")] [(contains? ?v "child page 1")]))
                   (and
                    [?p :page/properties ?prop]
                    [(get ?prop :parent) ?v]
                    (or [(= ?v "child page 2")] [(contains? ?v "child page 2")])))
       :count 3}))

  ;; boolean queries
  (testing "AND queries"
    (are [x y] (= (q-count x) y)
      "(and [[tag1]] [[page 2]])"
      {:query '([?b :block/ref-pages [:page/name "tag1"]]
                [?b :block/ref-pages [:page/name "page 2"]])
       :count 1})

    (are [x y] (= (q-count x) y)
      "(and [[tag1]] [[page 2]])"
      {:query '([?b :block/ref-pages [:page/name "tag1"]]
                [?b :block/ref-pages [:page/name "page 2"]])
       :count 1}))

  (testing "OR queries"
    (are [x y] (= (q-count x) y)
      "(or [[tag1]] [[page 2]])"
      {:query '(or
                (and [?b :block/ref-pages [:page/name "tag1"]])
                (and [?b :block/ref-pages [:page/name "page 2"]]))
       :count 4}))

  (testing "NOT queries"
    (are [x y] (= (q-count x) y)
      "(not [[page 1]])"
      {:query '([?b :block/uuid]
                (not
                 [?b :block/ref-pages [:page/name "page 1"]]))
       :count 8}))

  (testing "Between query"
    (are [x y] (= (count-only x) y)
      "(and (todo now later done) (between [[Dec 26th, 2020]] tomorrow))"
      5

      ;; between with journal pages
      "(and (todo now later done) (between [[Dec 27th, 2020]] [[Dec 28th, 2020]]))"
      2

      ;; between with created_at
      "(and (todo now later done) (between created_at [[Dec 26th, 2020]] tomorrow))"
      5

      ;; between with last_modified_at
      "(and (todo now later done) (between last_modified_at [[Dec 26th, 2020]] tomorrow))"
      5))

  (testing "Nested boolean queries"
    (are [x y] (= (q-count x) y)
      "(and (todo done) (not [[page 1]]))"
      {:query '([?b :block/marker ?marker]
                [(contains? #{"DONE"} ?marker)]
                (not [?b :block/ref-pages [:page/name "page 1"]]))
       :count 0})

    (are [x y] (= (q-count x) y)
      "(and (todo now later) (or [[page 1]] [[page 2]]))"
      {:query '([?b :block/marker ?marker]
                [(contains? #{"NOW" "LATER"} ?marker)]
                (or (and [?b :block/ref-pages [:page/name "page 1"]])
                    (and [?b :block/ref-pages [:page/name "page 2"]])))
       :count 3})

    (are [x y] (= (q-count x) y)
      "(not (and (todo now later) (or [[page 1]] [[page 2]])))"
      {:query '([?b :block/uuid]
                (not
                 [?b :block/marker ?marker]
                 [(contains? #{"NOW" "LATER"} ?marker)]
                 (or
                  (and [?b :block/ref-pages [:page/name "page 1"]])
                  (and [?b :block/ref-pages [:page/name "page 2"]]))))
       :count 11})

    ;; FIXME: not working
    ;; (are [x y] (= (q-count x) y)
    ;;   "(or (priority a) (not (priority a)))"
    ;;   {:query '(or
    ;;             (and [?b :block/priority ?priority] [(contains? #{"A"} ?priority)])
    ;;             (and (not [?b :block/priority ?priority]
    ;;                       [(contains? #{"A"} ?priority)])))
    ;;    :count 5})

    (are [x y] (= (q-count x) y)
      "(and (todo now later done) (or [[page 1]] (not [[page 1]])))"
      {:query '([?b :block/marker ?marker]
                [(contains? #{"NOW" "LATER" "DONE"} ?marker)]
                (or
                 (and [?b :block/ref-pages [:page/name "page 1"]])
                 (and (not [?b :block/ref-pages [:page/name "page 1"]]))))
       :count 5}))

  (testing "sort-by (created_at defaults to desc)"
    (db/clear-query-state!)
    (let [result (->> (q "(and (todo now later done)
                               (sort-by created_at))")
                      :result
                      deref
                      (map #(get-in % [:block/properties "created_at"])))]
      (is (= result
             '(1609052959376 1609052958714 1608968448115 1608968448114 1608968448113)))))

  (testing "sort-by (created_at desc)"
    (db/clear-query-state!)
    (let [result (->> (q "(and (todo now later done)
                               (sort-by created_at desc))")
                      :result
                      deref
                      (map #(get-in % [:block/properties "created_at"])))]
      (is (= result
             '(1609052959376 1609052958714 1608968448115 1608968448114 1608968448113)))))

  (testing "sort-by (created_at asc)"
    (db/clear-query-state!)
    (let [result (->> (q "(and (todo now later done)
                               (sort-by created_at asc))")
                      :result
                      deref
                      (map #(get-in % [:block/properties "created_at"])))]
      (is (= result
             '(1608968448113 1608968448114 1608968448115 1609052958714 1609052959376)))))

  (testing "sort-by (last_modified_at defaults to desc)"
    (db/clear-query-state!)
    (let [result (->> (q "(and (todo now later done)
                               (sort-by last_modified_at))")
                      :result
                      deref
                      (map #(get-in % [:block/properties "last_modified_at"])))]
      (is (= result
             '(1609052974285 1609052958714 1608968448120 1608968448115 1608968448113)))))

  (testing "sort-by (last_modified_at desc)"
    (db/clear-query-state!)
    (let [result (->> (q "(and (todo now later done)
                               (sort-by last_modified_at desc))")
                      :result
                      deref
                      (map #(get-in % [:block/properties "last_modified_at"])))]
      (is (= result
             '(1609052974285 1609052958714 1608968448120 1608968448115 1608968448113)))))

  (testing "sort-by (last_modified_at desc)"
    (db/clear-query-state!)
    (let [result (->> (q "(and (todo now later done)
                               (sort-by last_modified_at asc))")
                      :result
                      deref
                      (map #(get-in % [:block/properties "last_modified_at"])))]
      (is (= result
             '(1608968448113 1608968448115 1608968448120 1609052958714 1609052974285))))))

(use-fixtures :once
  {:before (fn []
             (config/start-test-db!)
             (import-test-data!))
   :after config/destroy-test-db!})

#_(cljs.test/test-ns 'frontend.db.query-dsl-test)

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
