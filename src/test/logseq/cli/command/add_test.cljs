(ns logseq.cli.command.add-test
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.add :as add-command]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(deftest test-today-page-title-uses-default-time-zone
  (async done
    (let [formatted-args* (atom nil)]
      (-> (p/with-redefs [transport/invoke (fn [_ method _ _args]
                                             (if (= method :thread-api/pull)
                                               (p/resolved {:logseq.property.journal/title-format "yyyy-MM-dd"})
                                               (p/rejected (ex-info "unexpected method" {:method method}))))
                          tc/from-date (fn [_] :utc-now)
                          t/to-default-time-zone (fn [date-time]
                                                   (if (= date-time :utc-now)
                                                     :local-now
                                                     :unexpected-time))
                          date-time-util/format (fn [date-time formatter]
                                                  (reset! formatted-args* [date-time formatter])
                                                  "2026-05-01")]
            (p/let [title (#'add-command/today-page-title {} "demo")]
              (is (= "2026-05-01" title))
              (is (= [:local-now "yyyy-MM-dd"] @formatted-args*))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-collect-created-block-uuids
  (testing "collects uuids depth-first and removes duplicates"
    (let [root-uuid (random-uuid)
          child-uuid (random-uuid)
          grandchild-uuid (random-uuid)
          sibling-uuid (random-uuid)
          blocks [{:block/uuid root-uuid
                   :block/children [{:block/uuid child-uuid}
                                    {:block/title "without uuid"
                                     :block/children [{:block/uuid grandchild-uuid}]}]}
                  {:block/uuid sibling-uuid}
                  {:block/uuid child-uuid}]]
      (is (= [root-uuid child-uuid grandchild-uuid sibling-uuid]
             (#'add-command/collect-created-block-uuids blocks))))))

(deftest test-created-ids-in-order
  (testing "normalizes created ids in deterministic uuid order"
    (let [uuid-a (random-uuid)
          uuid-b (random-uuid)
          uuid-c (random-uuid)
          ordered-uuids [uuid-c uuid-a uuid-b]
          entities [{:block/uuid uuid-a :db/id 101}
                    {:block/uuid uuid-b :db/id 202}
                    {:block/uuid uuid-c :db/id 303}]]
      (is (= [303 101 202]
             (#'add-command/created-ids-in-order ordered-uuids entities :block))))))

(deftest test-created-ids-in-order-errors-on-missing-entity
  (testing "throws when any created uuid cannot be resolved to db/id"
    (let [uuid-a (random-uuid)
          uuid-b (random-uuid)
          error (try
                  (#'add-command/created-ids-in-order
                   [uuid-a uuid-b]
                   [{:block/uuid uuid-a :db/id 11}]
                   :block)
                  nil
                  (catch :default e e))]
      (is (some? error))
      (is (= :add-id-resolution-failed (-> error ex-data :code)))
      (is (= [uuid-b] (-> error ex-data :missing-uuids))))))

(deftest test-partition-ref-values
  (testing "partitions uuid, integer id, and page-name refs"
    (let [result (#'add-command/partition-ref-values
                  ["some page"
                   "550e8400-e29b-41d4-a716-446655440000"
                   "101"
                   " 42 "
                   "another page"
                   ""
                   "  "])]
      (is (= ["550e8400-e29b-41d4-a716-446655440000"] (:uuid-refs result)))
      (is (= ["101" "42"] (:id-refs result)))
      (is (= ["some page" "another page"] (:page-refs result)))))

  (testing "negative integers are recognized as id refs"
    (let [result (#'add-command/partition-ref-values ["-5"])]
      (is (= ["-5"] (:id-refs result)))
      (is (empty? (:page-refs result)))))

  (testing "non-integer numbers stay as page refs"
    (let [result (#'add-command/partition-ref-values ["3.14" "1e5"])]
      (is (empty? (:id-refs result)))
      (is (= ["3.14" "1e5"] (:page-refs result))))))

(def ^:private mock-transport-invoke
  (fn [_ method _ args]
    (case method
      ;; pull-tag-by-name uses :thread-api/q
      :thread-api/q
      (let [[_ [_ name-arg]] args]
        (p/resolved
         (cond
           (= name-arg "realtag")
           [{:db/id 99 :block/name "realtag" :block/title "RealTag"
             :block/tags [{:db/ident :logseq.class/Tag}]}]
           :else [])))

      ;; pull-entity uses :thread-api/pull
      :thread-api/pull
      (let [[_ _ lookup] args]
        (p/resolved
         (cond
           (= lookup [:block/name "plainpage"])
           {:db/id 42 :block/name "plainpage" :block/title "PlainPage"
            :block/tags [{:db/ident :logseq.class/Page}]}

           (= lookup [:block/name "realtag"])
           {:db/id 99 :block/name "realtag" :block/title "RealTag"
            :block/tags [{:db/ident :logseq.class/Tag}]}

           :else {})))

      (p/rejected (ex-info "unexpected method" {:method method :args args})))))

(deftest test-resolve-id-ref-entities
  (testing "resolves integer id refs to uuid+title maps"
    (async done
           (let [page-uuid (random-uuid)
                 mock-invoke (fn [_ _ _ args]
                               (let [[_ _ lookup] args]
                                 (p/resolved
                                  (cond
                                    (= lookup 101)
                                    {:db/id 101 :block/uuid page-uuid :block/title "My Page"}
                                    :else {}))))]
             (-> (p/with-redefs [transport/invoke mock-invoke]
                   (p/let [result (#'add-command/resolve-id-ref-entities {} "demo" ["101"])]
                     (is (= 1 (count result)))
                     (is (= page-uuid (:block/uuid (first result))))
                     (is (= "101" (:block/title (first result)))
                         "title is the original id string for title-ref->id-ref replacement")))
                 (p/catch (fn [e] (is false (str "unexpected error: " e))))
                 (p/finally done))))))

(deftest test-resolve-tags-accepts-valid-tag
  (async done
         (-> (p/with-redefs [transport/invoke mock-transport-invoke]
               (p/let [result (add-command/resolve-tags {} "demo" ["RealTag"])]
                 (is (= [99] (mapv :db/id result)))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-resolve-tags-rejects-non-tag-page
  (async done
         (-> (p/with-redefs [transport/invoke mock-transport-invoke]
               (-> (add-command/resolve-tags {} "demo" ["PlainPage"])
                   (p/then (fn [_] (is false "expected error for non-tag page")))
                   (p/catch (fn [e]
                              ;; String lookup uses pull-tag-by-name which only finds tags,
                              ;; so a non-tag page results in :tag-not-found
                              (is (= :tag-not-found (-> e ex-data :code)))
                              (is (string/includes? (ex-message e) "PlainPage"))))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-resolve-tags-rejects-missing-tag
  (async done
         (-> (p/with-redefs [transport/invoke mock-transport-invoke]
               (-> (add-command/resolve-tags {} "demo" ["NoSuchTag"])
                   (p/then (fn [_] (is false "expected error for missing tag")))
                   (p/catch (fn [e]
                              (is (= :tag-not-found (-> e ex-data :code)))
                              (is (string/includes? (ex-message e) "NoSuchTag"))))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-coerce-default-property-rejects-non-string
  (testing "default property type rejects number value"
    (let [property {:schema {:type :default :cardinality :one}}
          result (#'add-command/coerce-property-value-basic property 4)]
      (is (not (:ok? result)))
      (is (= "default property expects a string value or keyword" (:message result)))))

  (testing "default property type accepts string value"
    (let [property {:schema {:type :default :cardinality :one}}
          result (#'add-command/coerce-property-value-basic property "hello")]
      (is (:ok? result))
      (is (= "hello" (:value result)))))

  (testing "default property type rejects boolean value"
    (let [property {:schema {:type :default :cardinality :one}}
          result (#'add-command/coerce-property-value-basic property true)]
      (is (not (:ok? result))))))

(deftest test-resolve-date-page-id-rejects-invalid-date
  (async done
         (let [mock-invoke (fn [_ _ _ args]
                             (let [[_ _ lookup] args]
                               (p/resolved
                                (if (= lookup :logseq.class/Journal)
                                  {}
                                  {}))))]
           (-> (p/with-redefs [transport/invoke mock-invoke]
                 (-> (#'add-command/resolve-date-page-id {} "demo" "not a date")
                     (p/then (fn [_] (is false "expected error for invalid date")))
                     (p/catch (fn [e]
                                (is (= :invalid-date (-> e ex-data :code)))
                                (is (string/includes? (ex-message e) "not a date"))))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(def ^:private selector-tag-uuid (uuid "11111111-1111-1111-1111-111111111111"))
(def ^:private selector-property-uuid (uuid "22222222-2222-2222-2222-222222222222"))

(def ^:private selector-tag-entity
  {:db/id 701
   :block/name "projecttag"
   :block/title "ProjectTag"
   :block/uuid selector-tag-uuid
   :block/tags [{:db/ident :logseq.class/Tag}]
   :logseq.property/public? true
   :logseq.property/built-in? false})

(def ^:private selector-property-entity
  {:db/id 801
   :db/ident :demo/custom-priority
   :block/name "custompriority"
   :block/title "CustomPriority"
   :block/uuid selector-property-uuid
   :logseq.property/type :default
   :db/cardinality :db.cardinality/one
   :logseq.property/public? true})

(def ^:private selector-mock-transport-invoke
  (fn [_ method _ args]
    (case method
      :thread-api/q
      (let [[_ [_ name-arg]] args]
        (p/resolved
         (cond
           (= name-arg "projecttag") [selector-tag-entity]
           (= name-arg "custompriority") [selector-property-entity]
           :else [])))

      :thread-api/pull
      (let [[_ _ lookup] args]
        (p/resolved
         (cond
           (or (= lookup 701)
               (= lookup [:db/ident :demo/project-tag])
               (= lookup [:block/uuid selector-tag-uuid]))
           selector-tag-entity

           (or (= lookup 801)
               (= lookup [:db/ident :demo/custom-priority])
               (= lookup [:block/uuid selector-property-uuid]))
           selector-property-entity

           :else {})))

      (p/rejected (ex-info "unexpected method" {:method method :args args})))))

(deftest test-resolve-tags-supports-id-uuid-ident-and-name-selectors
  (async done
         (-> (p/with-redefs [transport/invoke selector-mock-transport-invoke]
               (p/let [result (add-command/resolve-tags
                               {}
                               "demo"
                               [701
                                selector-tag-uuid
                                (str selector-tag-uuid)
                                :demo/project-tag
                                "ProjectTag"])]
                 (is (= [701 701 701 701 701]
                        (mapv :db/id result)))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-resolve-property-identifiers-supports-id-uuid-ident-and-name-selectors
  (async done
         (-> (p/with-redefs [transport/invoke selector-mock-transport-invoke]
               (p/let [result (add-command/resolve-property-identifiers
                               {}
                               "demo"
                               [801
                                selector-property-uuid
                                (str selector-property-uuid)
                                :demo/custom-priority
                                "CustomPriority"]
                               {:allow-non-built-in? true})]
                 (is (= [:demo/custom-priority
                         :demo/custom-priority
                         :demo/custom-priority
                         :demo/custom-priority
                         :demo/custom-priority]
                        result))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))
