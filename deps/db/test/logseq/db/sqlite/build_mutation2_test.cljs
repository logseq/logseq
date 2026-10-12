(ns logseq.db.sqlite.build-mutation2-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.test.helper :as db-test]))

(defn- all-tx [options]
  (let [{:keys [init-tx block-props-tx]} (sqlite-build/build-blocks-tx options)]
    (concat init-tx block-props-tx)))

(defn- tx-with-ident [txs ident]
  (first (filter #(= ident (:db/ident %)) txs)))

;; Fails if, in `block-property-value?`, the body becomes `nil` or `:build/property-value` becomes `:build/tags`.
(deftest block-property-value?-needs-map-with-property-value
  (is (sqlite-build/block-property-value? {:build/property-value :block :block/title "x"}))
  (is (not (sqlite-build/block-property-value? {:build/tags [:C1] :block/title "x"})))
  (is (not (sqlite-build/block-property-value? [:build/property-value :block]))))

;; Fails if, in `translate-property-value`, the `:name` key is dropped.
(deftest translate-property-value-missing-page-error-data
  (let [page {:block/title "no such page"}
        error (try (#'sqlite-build/translate-property-value [:build/page page] {})
                   nil
                   (catch :default e e))]
    (is (some? error))
    (is (= {:name page} (ex-data error)))))

;; Fails if, in `->block-properties`, the `(into {})` step is dropped.
(deftest ->block-properties-returns-map
  (let [result (#'sqlite-build/->block-properties {:user.property/p1 "v1"} {} {}
                                                  {:translate-property-values? false})]
    (is (map? result))
    (is (= {:user.property/p1 "v1"} result))))

;; Fails if, in `build-pvalue`, `:block/created-at` becomes `:block/journal-day`, `:block/updated-at` becomes `:block/uuid` or `:logseq.property/value` becomes `:logseq.property/classes`.
(deftest property-value-timestamps-and-value
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "with timestamps"
                           :build/properties {:p1 {:build/property-value :block
                                                   :block/title "pv1"
                                                   :block/created-at 1111
                                                   :block/updated-at 2222}}}
                          {:block/title "with explicit value"
                           :build/properties {:p1 {:build/property-value :block
                                                   :block/title "ignored title"
                                                   :logseq.property/value "explicit value"}}}]}]})
        pv1 (:user.property/p1 (db-test/find-block-by-content @conn "with timestamps"))
        pv2 (:user.property/p1 (db-test/find-block-by-content @conn "with explicit value"))]
    (is (= 1111 (:block/created-at pv1)))
    (is (= 2222 (:block/updated-at pv1)))
    (is (= "explicit value" (db-property/property-value-content pv2)))))

;; Fails if, in `pvalue-tx->txs`, `:block/page` becomes `:block/parent`.
(deftest property-value-children-get-the-value-page
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "has pvalue with children"
                           :build/properties {:p1 {:build/property-value :block
                                                   :block/title "pv1"
                                                   :build/children [{:block/title "pv child"}]}}}]}]})
        block (db-test/find-block-by-content @conn "has pvalue with children")
        pv (:user.property/p1 block)
        child-id (d/q '[:find ?c . :in $ ?title :where [?c :block/title ?title]] @conn "pv child")
        child (d/entity @conn child-id)]
    (is (some? child))
    (is (= (:db/id (:block/page block)) (:db/id (:block/page child))))
    (is (= (:db/id pv) (:db/id (:block/parent child))))))

;; Fails if, in `build-property-tx`, the `:property-attributes` key is dropped, the `:db/id` key is dropped, `:block/created-at` becomes `:block/journal-day`, `:block/updated-at` becomes `:block/uuid`, `:block/collapsed?` becomes `:block/created-at` or `:block/alias` becomes `:block/collapsed?`.
(deftest closed-value-property-keeps-attributes
  (let [txs (all-tx {:properties {:p1 {:build/closed-values [{:value "a"} {:value "b"}]
                                       :block/created-at 1000
                                       :block/updated-at 2000
                                       :block/collapsed? true
                                       :block/alias :some-alias
                                       :build/properties-ref-types {:entity :default}}
                                  :p2 {}}
                     :classes {:C1 {:build/class-properties [:p2 :p1]}}})
        p1 (tx-with-ident txs :user.property/p1)]
    (is (neg-int? (:db/id p1)))
    (is (= 1000 (:block/created-at p1)))
    (is (= 2000 (:block/updated-at p1)))
    (is (= true (:block/collapsed? p1)))
    (is (= :some-alias (:block/alias p1)))
    (is (string? (:block/order p1)) "class property order is kept")
    (is (not (contains? p1 :build/properties-ref-types)))))

;; Fails if, in `build-property-tx`, `:build/properties-ref-types` becomes `:build/property-classes`.
(deftest closed-value-property-ref-types-apply-to-properties
  (let [txs (all-tx {:properties {:p1 {:build/closed-values [{:value "a"}]
                                       :build/properties-ref-types {:entity :default}
                                       :build/properties {:logseq.property/default-value "foo"}}}})
        pvalue (first (filter #(= "foo" (:block/title %)) txs))]
    (is (some? pvalue) "default-value built as :default text value")))

;; Fails if, in `build-property-tx`, `:block/created-at` becomes `:block/journal-day`, `:block/updated-at` becomes `:block/uuid` or `:block/collapsed?` becomes `:block/created-at`.
(deftest plain-property-keeps-attributes
  (let [txs (all-tx {:properties {:p1 {:logseq.property/type :default
                                       :block/created-at 1000
                                       :block/updated-at 2000
                                       :block/collapsed? true}}})
        p1 (tx-with-ident txs :user.property/p1)]
    (is (= 1000 (:block/created-at p1)))
    (is (= 2000 (:block/updated-at p1)))
    (is (= true (:block/collapsed? p1)))))

;; Fails if, in `build-property-tx`, `:build/properties-ref-types` becomes `:build/property-classes`.
(deftest property-ref-types-are-not-transacted
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default
                                 :build/properties-ref-types {:entity :default}}}})]
    (is (nil? (:build/properties-ref-types (d/entity @conn :user.property/p1))))))

;; Fails if, in `build-property-tx`, the `:property` key is dropped.
(deftest build-property-tx-missing-db-id-error-data
  (doseq [[label prop-m] {"plain property" {:logseq.property/type :default}
                          "closed values property" {:build/closed-values [{:value "a"}]}}]
    (testing label
      (let [error (try (#'sqlite-build/build-property-tx {} {} {:p1 :user.property/p1} {} {} {}
                                                         [:p1 prop-m])
                       nil
                       (catch :default e e))]
        (is (some? error))
        (is (= {:property :p1} (ex-data error)))))))

;; Fails if, in `build-property-tx`, the `:block/order` key is dropped.
(deftest closed-value-property-uses-class-property-order
  (let [txs (#'sqlite-build/build-property-tx {} {} {:p1 :user.property/p1} {:p1 -5} {:p1 "a0"} {}
                                              [:p1 {:build/closed-values [{:value "a"}]}])
        p1 (tx-with-ident txs :user.property/p1)]
    (is (= -5 (:db/id p1)))
    (is (= "a0" (:block/order p1)))))

;; Fails if, in `Build-schema-registry`, `:build/children` becomes `:build/class-extends`, `:build/properties` becomes `:build/properties-ref-types` or `:build/keep-uuid?` becomes `:build/keys`.
(deftest validate-options-checks-block-schema
  (let [page-with (fn [block]
                    {:auto-create-ontology? true
                     :pages-and-blocks [{:page {:block/title "p"} :blocks [block]}]})]
    (is (nil? (sqlite-build/validate-options (page-with {:block/title "b"}))))
    (testing "children are validated"
      (is (thrown-with-msg? js/Error #"Options validation failed"
                            (sqlite-build/validate-options
                             (page-with {:block/title "b" :build/children [{:build/tags []}]})))))
    (testing "properties are validated"
      (is (thrown-with-msg? js/Error #"Options validation failed"
                            (sqlite-build/validate-options
                             (page-with {:block/title "b" :build/properties {"not-a-keyword" 1}})))))
    (testing ":build/keep-uuid? must be boolean"
      (is (thrown-with-msg? js/Error #"Options validation failed"
                            (sqlite-build/validate-options
                             (page-with {:block/title "b" :build/keep-uuid? "yes"})))))))

;; Fails if, in `extract-from-blocks`, the body becomes `nil` or `:build/children` becomes `:build/class-extends`.
(deftest extract-from-blocks-includes-nested-children
  (is (= ["a" "a1" "a2" "b"]
         (vec (sqlite-build/extract-from-blocks
               [{:block/title "a"
                 :build/children [{:block/title "a1"
                                   :build/children [{:block/title "a2"}]}]}
                {:block/title "b"}]
               (comp vector :block/title))))))
