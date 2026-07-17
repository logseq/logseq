(ns logseq.cli.command.add-test
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.add :as add-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(deftest test-today-page-title-uses-default-time-zone
  (async done
    (let [default-zone-input* (atom nil)]
      (-> (p/with-redefs [transport/invoke (fn [_ method _args]
                                             (if (= method :thread-api/pull)
                                               (p/resolved {:logseq.property.journal/title-format "yyyy-MM-dd"})
                                               (p/rejected (ex-info "unexpected method" {:method method}))))
                          tc/from-date (fn [_] :utc-now)
                          t/to-default-time-zone (fn [date-time]
                                                   (reset! default-zone-input* date-time)
                                                   (t/date-time 2026 5 1 9 7 8))]
            (p/let [title (#'add-command/today-page-title {} "demo")]
              (is (= "2026-05-01" title))
              (is (= :utc-now @default-zone-input*))))
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

(deftest test-extract-inline-properties-from-blocks
  (testing "removes inline property attrs while preserving block uuids and children"
    (let [root-uuid (uuid "00000000-0000-0000-0000-000000000101")
          child-uuid (uuid "00000000-0000-0000-0000-000000000102")
          result (#'add-command/extract-inline-properties
                  [{:block/title "Root"
                    :block/uuid root-uuid
                    :block/page [:block/name "Home"]
                    :block/tags [1]
                    :user.property/root-answer "root"
                    "Correct Answer" "named value"
                    :logseq.property/status :logseq.property/status.todo
                    :block/children [{:block/title "Child"
                                      :block/uuid child-uuid
                                      :user.property/child-answer "child"}]}])]
      (is (= [{:block/title "Root"
               :block/uuid root-uuid
               :block/page [:block/name "Home"]
               :block/tags [1]
               :block/children [{:block/title "Child"
                                 :block/uuid child-uuid}]}]
             (:blocks result)))
      (is (= [{:block-uuid root-uuid
               :properties {:user.property/root-answer "root"
                            "Correct Answer" "named value"
                            :logseq.property/status :logseq.property/status.todo}}
              {:block-uuid child-uuid
               :properties {:user.property/child-answer "child"}}]
             (:property-assignments result))))))

(deftest test-extract-inline-properties-keeps-non-property-attrs
  (testing "property selectors are extracted without treating normal block attrs as properties"
    (let [block-uuid (uuid "00000000-0000-0000-0000-000000000103")
          property-uuid (uuid "00000000-0000-0000-0000-000000000104")
          result (#'add-command/extract-inline-properties
                  [{:block/title "Block"
                    :block/uuid block-uuid
                    :db/id 101
                    :build/keep-uuid? true
                    :plugin/option "kept"
                    :logseq.property.asset/type "png"
                    :plugin.property._test_plugin/rating "5"
                    801 "by id"
                    property-uuid "by uuid"
                    :plain-title "by keyword"}])]
      (is (= [{:block/title "Block"
               :block/uuid block-uuid
               :db/id 101
               :build/keep-uuid? true
               :plugin/option "kept"
               :logseq.property.asset/type "png"}]
             (:blocks result)))
      (is (= [{:block-uuid block-uuid
               :properties {:plugin.property._test_plugin/rating "5"
                            801 "by id"
                            property-uuid "by uuid"
                            :plain-title "by keyword"}}]
             (:property-assignments result))))))

(def ^:private mock-transport-invoke
  (fn [_ method args]
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
                 mock-invoke (fn [_ _ args]
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
         (let [mock-invoke (fn [_ _ args]
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
  (fn [_ method args]
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

(deftest test-execute-add-block-applies-inline-properties-per-block
  (async done
         (let [target-uuid (uuid "00000000-0000-0000-0000-000000000200")
               root-uuid (uuid "00000000-0000-0000-0000-000000000201")
               child-uuid (uuid "00000000-0000-0000-0000-000000000202")
               ops* (atom nil)
               resolve-properties-calls* (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               add-command/resolve-tags (fn [_ _ _] (p/resolved nil))
                               add-command/resolve-properties
                               (fn [_ _ properties & [opts]]
                                 (swap! resolve-properties-calls* conj {:properties properties
                                                                         :opts opts})
                                 (p/resolved properties))
                               add-command/resolve-property-identifiers (fn [_ _ _ & _] (p/resolved nil))
                               transport/invoke
                               (fn [_ method args]
                                 (case method
                                   :thread-api/pull
                                   (let [[_ _ lookup] args]
                                     (p/resolved
                                      (cond
                                        (= lookup 900)
                                        {:db/id 900 :block/uuid target-uuid}

                                        (= lookup [:block/uuid root-uuid])
                                        {:db/id 901 :block/uuid root-uuid}

                                        (= lookup [:block/uuid child-uuid])
                                        {:db/id 902 :block/uuid child-uuid}

                                        :else {})))

                                   :thread-api/apply-outliner-ops
                                   (let [[_ ops _] args]
                                     (reset! ops* ops)
                                     (p/resolved {:result :ok}))

                                   (p/rejected (ex-info "unexpected invoke" {:method method :args args}))))]
                 (p/let [result (add-command/execute-add-block
                                 {:type :add-block
                                  :repo "demo"
                                  :target-id 900
                                  :pos "last-child"
                                  :blocks [{:block/title "Root"
                                            :block/uuid root-uuid
                                            :user.property/root-answer "root"
                                            :block/children [{:block/title "Child"
                                                              :block/uuid child-uuid
                                                              :user.property/child-answer "child"}]}]}
                                 {})]
                   (is (= :ok (:status result)))
                   (is (= [901 902] (get-in result [:data :result])))
                   (let [ops @ops*
                         insert-op (first ops)
                         inserted-blocks (get-in insert-op [1 0])]
                     (is (= :insert-blocks (first insert-op)))
                     (is (= [{:block/title "Root"
                              :block/uuid root-uuid}
                             {:block/title "Child"
                              :block/uuid child-uuid
                              :block/parent [:block/uuid root-uuid]}]
                            inserted-blocks))
                     (is (some #(= [:batch-set-property [[root-uuid]
                                                          :user.property/root-answer
                                                          "root"
                                                          {}]]
                                    %)
                               ops))
                     (is (some #(= [:batch-set-property [[child-uuid]
                                                          :user.property/child-answer
                                                          "child"
                                                          {}]]
                                    %)
                               ops))
                     (is (some #(= {:properties {:user.property/root-answer "root"}
                                    :opts {:allow-non-built-in? true}}
                                  %)
                               @resolve-properties-calls*))
                     (is (some #(= {:properties {:user.property/child-answer "child"}
                                    :opts {:allow-non-built-in? true}}
                                  %)
                               @resolve-properties-calls*)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-add-block-does-not-create-target-page-when-inline-property-resolution-fails
  (async done
         (let [created-page-uuid (uuid "00000000-0000-0000-0000-000000000203")
               ops* (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               add-command/resolve-properties
                               (fn [_ _ properties & _]
                                 (if (= {"Missing Prop" "x"} properties)
                                   (p/rejected (ex-info "property not found: \"Missing Prop\""
                                                        {:code :property-not-found
                                                         :property "Missing Prop"}))
                                   (p/resolved properties)))
                               transport/invoke
                               (fn [_ method args]
                                 (case method
                                   :thread-api/q
                                   (p/resolved [])

                                   :thread-api/pull
                                   (let [[_ _ lookup] args]
                                     (p/resolved
                                      (if (= lookup [:block/name "newpage"])
                                        {:db/id 900
                                         :block/uuid created-page-uuid
                                         :block/name "newpage"
                                         :block/title "NewPage"}
                                        {})))

                                   :thread-api/apply-outliner-ops
                                   (let [[_ ops _] args]
                                     (swap! ops* conj ops)
                                     (p/resolved {:result :ok}))

                                   (p/rejected (ex-info "unexpected invoke" {:method method :args args}))))]
                 (-> (add-command/execute-add-block
                      {:type :add-block
                       :repo "demo"
                       :target-page-name "NewPage"
                       :pos "last-child"
                       :blocks [{:block/title "Q"
                                 :block/uuid (uuid "00000000-0000-0000-0000-000000000204")
                                 "Missing Prop" "x"}]}
                      {})
                     (p/then (fn [_]
                               (is false "expected inline property resolution error")))
                     (p/catch (fn [e]
                                (is (= :property-not-found (-> e ex-data :code)))
                                (is (empty? @ops*)
                                    "target page creation must not run before inline properties validate")))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))
