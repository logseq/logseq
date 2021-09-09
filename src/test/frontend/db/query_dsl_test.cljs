(ns frontend.db.query-dsl-test
  (:require [cljs.test :refer [are async deftest testing use-fixtures]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db.config :refer [test-db] :as config]
            [frontend.db.query-dsl :as dsl]
            [frontend.handler.repo :as repo-handler]
            [promesa.core :as p]))

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
- DONE 26-b1 [[page 1]]
created-at:: 1608968448113
last-modified-at:: 1608968448113
prop-a:: val-a
prop-c:: [[page a]], [[page b]], [[page c]]
- LATER 26-b2-modified-later [[page 2]] #tag1
created-at:: 1608968448114
last-modified-at:: 1608968448120
prop-b:: val-b
- DONE [#A] 26-b3 [[page 1]]
created-at:: 1608968448115
last-modified-at:: 1608968448115
"}
               {:file/path "journals/2020_12_27.md"
                :file/content "---
title: Dec 27th, 2020
tags: page-tag-2, [[page-tag-3]]
parent: [[child page 1]], child page 2
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
prop-a:: val-a
- b4 [[page 2]]
created-at:: 1609052961569
last-modified-at:: 1609052961569
- b5
created-at:: 1609052963089
last-modified-at:: 1609052963089"}
               {:file/path "journals/2020_12_28.md"
                :file/content "---
title: Dec 28th, 2020
parent: child page 2
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

(deftest test-parse
  []
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

  (testing "Block properties query"
    (are [x y] (= (q-count x) y)
      "(property prop-a val-a)"
      {:query '[[?b :block/properties ?prop] [(missing? $ ?b :block/name)] [(get ?prop :prop-a) ?v] (or [(= ?v "val-a")] [(contains? ?v "val-a")])]
       :count 2}

      "(property prop-b val-b)"
      {:query '[[?b :block/properties ?prop] [(missing? $ ?b :block/name)] [(get ?prop :prop-b) ?v] (or [(= ?v "val-b")] [(contains? ?v "val-b")])]
       :count 1}

      "(and (property prop-b val-b))"
      {:query '([?b :block/properties ?prop]
                [(missing? $ ?b :block/name)]
                [(get ?prop :prop-b) ?v]
                (or [(= ?v "val-b")] [(contains? ?v "val-b")]))
       :count 1}

      "(and (property prop-c \"page c\"))"
      {:query '[[?b :block/properties ?prop] [(missing? $ ?b :block/name)] [(get ?prop :prop-c) ?v] (or [(= ?v "page c")] [(contains? ?v "page c")])]
       :count 1}

      ;; TODO: optimize
      "(and (property prop-c \"page c\") (property prop-c \"page b\"))"
      {:query '[[?b :block/properties ?prop]
                [(missing? $ ?b :block/name)]
                [(get ?prop :prop-c) ?v]
                (or [(= ?v "page c")] [(contains? ?v "page c")])
                [(get ?prop :prop-c) ?v1]
                (or [(= ?v1 "page b")] [(contains? ?v1 "page b")])]
       :count 1}

      "(or (property prop-c \"page c\") (property prop-b val-b))"
      {:query '[or
                (and [?b :block/properties ?prop] [(missing? $ ?b :block/name)] [(get ?prop :prop-c) ?v] (or [(= ?v "page c")] [(contains? ?v "page c")]))
                (and [?b :block/properties ?prop] [(missing? $ ?b :block/name)] [(get ?prop :prop-b) ?v] (or [(= ?v "val-b")] [(contains? ?v "val-b")]))]
       :count 2}))

  (testing "task queries"
    (are [x y] (= (q-count x) y)
      "(task now)"
      {:query '[[?b :block/marker ?marker]
                [(contains? #{"NOW"} ?marker)]]
       :count 1}

      "(task NOW)"
      {:query '[[?b :block/marker ?marker]
                [(contains? #{"NOW"} ?marker)]]
       :count 1}

      "(task later)"
      {:query '[[?b :block/marker ?marker]
                [(contains? #{"LATER"} ?marker)]]
       :count 2}

      "(task now later)"
      {:query '[[?b :block/marker ?marker]
                [(contains? #{"NOW" "LATER"} ?marker)]]
       :count 3}

      "(task [now later])"
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

  (testing "page-property queries"
    (are [x y] (= (q-count x) y)
      "(page-property parent)"
      {:query '[[?p :block/name]
                [?p :block/properties ?prop]
                [(get ?prop :parent) ?prop-v]
                [true]], :count 3}

      "(page-property parent [[child page 1]])"
      {:query '[[?p :block/name]
                [?p :block/properties ?prop]
                [(get ?prop :parent) ?v]
                (or [(= ?v "child page 1")] [(contains? ?v "child page 1")])]
       :count 2}

      "(page-property parent \"child page 1\")"
      {:query '[[?p :block/name]
                [?p :block/properties ?prop]
                [(get ?prop :parent) ?v]
                (or
                 [(= ?v "child page 1")]
                 [(contains? ?v "child page 1")])]
       :count 2}

      "(and (page-property parent [[child page 1]]) (page-property parent [[child page 2]]))"
      {:query '([?p :block/name]
                [?p :block/properties ?prop]
                [(get ?prop :parent) ?v]
                (or [(= ?v "child page 1")] [(contains? ?v "child page 1")])
                (or [(= ?v "child page 2")] [(contains? ?v "child page 2")]))
       :count 1}

      "(or (page-property parent [[child page 1]]) (page-property parent [[child page 2]]))"
      {:query '(or (and
                    [?p :block/name]
                    [?p :block/properties ?prop]
                    [(get ?prop :parent) ?v]
                    (or [(= ?v "child page 1")] [(contains? ?v "child page 1")]))
                   (and
                    [?p :block/name]
                    [?p :block/properties ?prop]
                    [(get ?prop :parent) ?v]
                    (or [(= ?v "child page 2")] [(contains? ?v "child page 2")])))
       :count 3}))

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
       :count 34}))

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

  (testing "Nested boolean queries"
    (are [x y] (= (q-count x) y)
      "(and (todo done) (not [[page 1]]))"
      {:query '([?b :block/uuid]
                [?b :block/marker ?marker]
                [(contains? #{"DONE"} ?marker)]
                (not [?b :block/path-refs [:block/name "page 1"]]))
       :count 0})

    (are [x y] (= (q-count x) y)
      "(and (todo now later) (or [[page 1]] [[page 2]]))"
      {:query '([?b :block/marker ?marker]
                [(contains? #{"NOW" "LATER"} ?marker)]
                (or (and [?b :block/path-refs [:block/name "page 1"]])
                    (and [?b :block/path-refs [:block/name "page 2"]])
                    [?b]))
       :count 3})

    (are [x y] (= (q-count x) y)
      "(not (and (todo now later) (or [[page 1]] [[page 2]])))"
      {:query '([?b :block/uuid]
                (not
                 [?b :block/marker ?marker]
                 [(contains? #{"NOW" "LATER"} ?marker)]
                 (or
                  (and [?b :block/path-refs [:block/name "page 1"]])
                  (and [?b :block/path-refs [:block/name "page 2"]])
                  [?b])))
       :count 37})

    ;; FIXME: not working
    ;; (are [x y] (= (q-count x) y)
    ;;   "(or (priority a) (not (priority a)))"
    ;;   {:query '[(or-join [?b]
    ;;                      (and
    ;;                       [?b :block/priority ?priority]
    ;;                       [(contains? #{"A"} ?priority)])
    ;;                      (not-join [?b]
    ;;                                [?b :block/priority ?priority]
    ;;                                [(contains? #{"A"} ?priority)]))]
    ;;    :count 5})

    (are [x y] (= (q-count x) y)
      "(and (todo now later done) (or [[page 1]] (not [[page 1]])))"
      {:query '([?b :block/uuid]
                [?b :block/marker ?marker]
                [(contains? #{"NOW" "LATER" "DONE"} ?marker)]
                (or
                 (and [?b :block/path-refs [:block/name "page 1"]])
                 (and (not [?b :block/path-refs [:block/name "page 1"]]))
                 [?b]))
       :count 5}))

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

(use-fixtures :once
  {:before (fn []
             (async done
                    (config/start-test-db!)
                    (p/let [_ (import-test-data!)]
                      (done))))
   :after config/destroy-test-db!})

#_(run-tests)

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
