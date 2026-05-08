(ns logseq.cli.command.show-test
  (:require ["fs" :as fs]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.style :as style]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(deftest test-build-action-stdin-id
  (testing "reads id from stdin when id flag is present without a value"
    (let [result (show-command/build-action {:id ""
                                             :id-from-stdin? true
                                             :stdin "42"}
                                            "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= 42 (get-in result [:action :id])))
      (is (= [42] (get-in result [:action :ids])))
      (is (false? (get-in result [:action :multi-id?])))))

  (testing "reads multi-id vector from stdin"
    (let [result (show-command/build-action {:id ""
                                             :id-from-stdin? true
                                             :stdin "[1 2 3]"}
                                            "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= [1 2 3] (get-in result [:action :ids])))
      (is (true? (get-in result [:action :multi-id?])))))

  (testing "explicit stdin still overrides id when provided in options"
    (let [result (show-command/build-action {:id "99"
                                             :stdin "[1 2]"}
                                            "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= [1 2] (get-in result [:action :ids])))
      (is (true? (get-in result [:action :multi-id?])))))

  (testing "pipe stdin does not override explicit id unless stdin mode is requested"
    (let [orig-fstat-sync (.-fstatSync fs)
          orig-read-file-sync (.-readFileSync fs)
          read-count* (atom 0)]
      (set! (.-fstatSync fs)
            (fn [_]
              #js {:isFIFO (fn [] true)
                   :isFile (fn [] false)}))
      (set! (.-readFileSync fs)
            (fn [fd]
              (when (= fd 0)
                (swap! read-count* inc)
                "[1 2]")))
      (try
        (let [result (show-command/build-action {:id "99"}
                                                "logseq_db_demo")]
          (is (true? (:ok? result)))
          (is (= 99 (get-in result [:action :id])))
          (is (= [99] (get-in result [:action :ids])))
          (is (zero? @read-count*)))
        (finally
          (set! (.-fstatSync fs) orig-fstat-sync)
          (set! (.-readFileSync fs) orig-read-file-sync)))))

  (testing "blank stdin falls back to explicit id"
    (let [result (show-command/build-action {:id "99"
                                             :stdin "   "}
                                            "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= 99 (get-in result [:action :id])))
      (is (= [99] (get-in result [:action :ids])))))

  (testing "blank stdin returns invalid options when id is missing"
    (let [result (show-command/build-action {:id ""
                                             :id-from-stdin? true
                                             :stdin "   "}
                                            "logseq_db_demo")]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))
      (is (string/includes? (get-in result [:error :message]) "id"))))

  (testing "extracts id from upsert blocks output"
    (let [result (show-command/build-action {:id ""
                                             :id-from-stdin? true
                                             :stdin "Upserted blocks:\n[10 20 30]"}
                                            "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= [10 20 30] (get-in result [:action :ids])))
      (is (true? (get-in result [:action :multi-id?]))))))

(deftest test-merge-fetched-property-value
  (let [merge-value #'show-command/merge-fetched-property-value]
    (testing "first value is kept as scalar"
      (is (= "Step 1" (merge-value nil "Step 1"))))

    (testing "second distinct value upgrades scalar to vector"
      (is (= ["Step 1" "Step 2"]
             (merge-value "Step 1" "Step 2"))))

    (testing "additional values are appended"
      (is (= ["Step 1" "Step 2" "Step 3"]
             (merge-value ["Step 1" "Step 2"] "Step 3"))))

    (testing "duplicate values are deduplicated"
      (is (= ["Step 1" "Step 2"]
             (merge-value ["Step 1" "Step 2"] "Step 2"))))))

(deftest test-fetch-user-properties-formats-datetime
  (let [fetch #'show-command/fetch-user-properties
        call-count (atom 0)
        mock-invoke (fn [_ _method _args]
                      (let [call-idx (swap! call-count inc)]
                        (p/resolved
                         (case call-idx
                           ;; First call: user idents-query returns property idents with types
                           1 [[:user.property/title :default]
                              [:user.property/due :datetime]
                              [:user.property/count :number]]
                           ;; Second call: built-in idents-query returns built-in property types
                           2 []
                           ;; Third call: props-query returns raw values
                           3 [[10 :user.property/title "hello"]
                              [10 :user.property/due 1774267200000]
                              [10 :user.property/count 42]]
                           []))))]
    (async done
           (-> (p/with-redefs [transport/invoke mock-invoke]
                 (p/let [result (fetch {} "demo" [10])]
                   (testing "datetime value is converted to ISO string"
                     (is (string? (get-in result [10 :user.property/due])))
                     (is (string/includes? (get-in result [10 :user.property/due]) "2026-03-23")))
                   (testing "non-datetime number is left as-is"
                     (is (= 42 (get-in result [10 :user.property/count]))))
                   (testing "string value is left as-is"
                     (is (= "hello" (get-in result [10 :user.property/title]))))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-fetch-user-properties-includes-built-in-datetime
  (let [fetch #'show-command/fetch-user-properties
        call-count (atom 0)
        mock-invoke (fn [_ _method _args]
                      (let [call-idx (swap! call-count inc)]
                        (p/resolved
                         (case call-idx
                           ;; First call: user idents-query
                           1 [[:user.property/status :default]]
                           ;; Second call: built-in idents-query returns deadline and scheduled
                           2 [[:logseq.property/deadline :datetime]
                              [:logseq.property/scheduled :datetime]]
                           ;; Third call: props-query returns raw values
                           3 [[10 :user.property/status "todo"]
                              [10 :logseq.property/deadline 1774267200000]
                              [10 :logseq.property/scheduled 1774180800000]]
                           []))))]
    (async done
           (-> (p/with-redefs [transport/invoke mock-invoke]
                 (p/let [result (fetch {} "demo" [10])]
                   (testing "built-in deadline is converted to ISO string"
                     (is (string? (get-in result [10 :logseq.property/deadline])))
                     (is (string/includes? (get-in result [10 :logseq.property/deadline]) "2026")))
                   (testing "built-in scheduled is converted to ISO string"
                     (is (string? (get-in result [10 :logseq.property/scheduled])))
                     (is (string/includes? (get-in result [10 :logseq.property/scheduled]) "2026")))
                   (testing "user property is unaffected"
                     (is (= "todo" (get-in result [10 :user.property/status]))))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(defn- call-private
  [sym & args]
  (when-let [v (get (ns-interns 'logseq.cli.command.show) sym)]
    (apply @v args)))

(defn- query-uses-attr?
  [query attr]
  (let [query* (vec query)
        where-idx (.indexOf query* :where)
        clauses (if (neg? where-idx)
                  query*
                  (subvec query* (inc where-idx)))]
    (boolean (some #(= attr %) (tree-seq coll? seq clauses)))))

(defn- make-show-invoke-mock
  [{:keys [entities-by-id
           entities-by-page-name
           children-by-page-id
           children-by-parent-id
           uuid-entities
           linked-refs-by-root-id
           parents-by-block-id]}]
  (fn [_ method args]
    (case method
      :thread-api/pull
      (let [[_repo _selector target] args]
        (cond
          (number? target)
          (p/resolved (get entities-by-id target))

          (and (vector? target) (= :block/uuid (first target)))
          (let [uuid-str (some-> (second target) str string/lower-case)]
            (p/resolved (get uuid-entities uuid-str)))

          (and (vector? target) (= :block/name (first target)))
          (p/resolved (get entities-by-page-name (second target)))

          :else
          (p/resolved nil)))

      :thread-api/q
      (let [[_repo query-args] args
            [query & inputs] query-args]
        (if (= 1 (count inputs))
          (let [parent-id (first inputs)
                rows (if (query-uses-attr? query :block/parent)
                       (get children-by-parent-id parent-id [])
                       (get children-by-page-id parent-id []))]
            (p/resolved (mapv vector rows)))
          (p/resolved [])))

      :thread-api/get-block-refs
      (let [[_repo root-id] args]
        (p/resolved (get linked-refs-by-root-id root-id [])))

      :thread-api/get-block-parents
      (let [[_repo block-id] args]
        (p/resolved (get parents-by-block-id block-id [])))

      (p/resolved nil))))

(def ^:private page-tag {:db/id 1000 :db/ident :logseq.class/Page})
(def ^:private class-tag {:db/id 1001 :db/ident :logseq.class/Tag})
(def ^:private property-tag {:db/id 1002 :db/ident :logseq.class/Property})

(defn- page-entity
  [id title]
  {:db/id id
   :block/title title
   :block/name (string/lower-case title)
   :block/order 0
   :block/tags [page-tag]})

(defn- library-entity
  []
  (assoc (page-entity 100 "Library")
         :block/uuid (uuid "11111111-1111-1111-1111-111111111111")
         :logseq.property/built-in? true))

(declare contains-block-uuid?
         contains-show-internal-key?)

(defn- library-show-mock
  []
  (make-show-invoke-mock
   {:entities-by-page-name {"Library" (library-entity)
                            "Home" (page-entity 200 "Home")}
    :entities-by-id {100 (library-entity)
                     200 (page-entity 200 "Home")}
    :uuid-entities {"11111111-1111-1111-1111-111111111111" (library-entity)}
    :children-by-parent-id {100 [(assoc (page-entity 101 "Projects")
                                        :block/order 1
                                        :block/parent {:db/id 100})
                                 {:db/id 102
                                  :block/title "Hidden Class"
                                  :block/order 2
                                  :block/parent {:db/id 100}
                                  :block/tags [page-tag class-tag]}
                                 {:db/id 103
                                  :block/title "Hidden Property"
                                  :block/order 3
                                  :block/parent {:db/id 100}
                                  :block/tags [page-tag property-tag]}
                                 {:db/id 104
                                  :block/title "Loose block"
                                  :block/order 4
                                  :block/parent {:db/id 100}}]
                            101 [(assoc (page-entity 105 "Alpha")
                                        :block/order 1
                                        :block/parent {:db/id 101})]}
    :children-by-page-id {100 []
                          101 [{:db/id 106
                                :block/title "Project page content"
                                :block/order 0
                                :block/parent {:db/id 101}
                                :block/page {:db/id 101}}]
                          200 [{:db/id 201
                                :block/title "Welcome home"
                                :block/order 0
                                :block/parent {:db/id 200}
                                :block/page {:db/id 200}}]}}))

(deftest test-execute-show-library-page-renders-page-hierarchy
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                             transport/invoke (library-show-mock)]
               (p/let [result (show-command/execute-show {:type :show
                                                         :repo "demo"
                                                         :page "Library"
                                                         :level 3
                                                         :linked-references? false
                                                         :ref-id-footer? false}
                                                        {:output-format nil})
                       plain (-> result :data :message style/strip-ansi)]
                 (is (= :ok (:status result)))
                 (is (string/includes? plain "Library"))
                 (is (re-find #"(?m)^101\s+└── Projects$" plain))
                 (is (re-find #"(?m)^105\s+    └── Alpha$" plain))
                 (is (not (string/includes? plain "Hidden Class")))
                 (is (not (string/includes? plain "Hidden Property")))
                 (is (not (string/includes? plain "Loose block")))
                 (is (not (string/includes? plain "Project page content")))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-show-library-page-respects-level
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                             transport/invoke (library-show-mock)]
               (p/let [result (show-command/execute-show {:type :show
                                                         :repo "demo"
                                                         :page "Library"
                                                         :level 2
                                                         :linked-references? false
                                                         :ref-id-footer? false}
                                                        {:output-format nil})
                       plain (-> result :data :message style/strip-ansi)]
                 (is (= :ok (:status result)))
                 (is (string/includes? plain "Projects"))
                 (is (not (string/includes? plain "Alpha")))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-show-library-id-and-uuid-use-library-display
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                             transport/invoke (library-show-mock)]
               (p/let [by-id (show-command/execute-show {:type :show
                                                        :repo "demo"
                                                        :id 100
                                                        :linked-references? false
                                                        :ref-id-footer? false}
                                                       {:output-format nil})
                       by-uuid (show-command/execute-show {:type :show
                                                          :repo "demo"
                                                          :uuid "11111111-1111-1111-1111-111111111111"
                                                          :linked-references? false
                                                          :ref-id-footer? false}
                                                         {:output-format nil})]
                 (doseq [result [by-id by-uuid]]
                   (let [plain (-> result :data :message style/strip-ansi)]
                     (is (= :ok (:status result)))
                     (is (string/includes? plain "Projects"))
                     (is (not (string/includes? plain "Project page content")))))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-show-library-structured-output-filters-children
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                             transport/invoke (library-show-mock)]
               (p/let [result (show-command/execute-show {:type :show
                                                         :repo "demo"
                                                         :page "Library"
                                                         :level 3
                                                         :linked-references? false}
                                                        {:output-format :json})]
                 (is (= :ok (:status result)))
                 (is (= "Library" (get-in result [:data :root :block/title])))
                 (is (= ["Projects"]
                        (mapv :block/title (get-in result [:data :root :block/children]))))
                 (is (= ["Alpha"]
                        (mapv :block/title (get-in result [:data :root :block/children 0 :block/children]))))
                 (is (not (contains-block-uuid? (:data result))))
                 (is (not (contains-show-internal-key? (:data result))))))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest test-execute-show-normal-page-keeps-page-content-path
  (async done
         (let [queries (atom [])
               base-invoke (library-show-mock)
               invoke-mock (fn [config method args]
                             (when (= method :thread-api/q)
                               (let [[_repo [query & inputs]] args]
                                 (swap! queries conj {:query query :inputs inputs})))
                             (base-invoke config method args))]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (p/let [result (show-command/execute-show {:type :show
                                                           :repo "demo"
                                                           :page "Home"
                                                           :linked-references? false
                                                           :ref-id-footer? false}
                                                          {:output-format nil})
                         plain (-> result :data :message style/strip-ansi)]
                   (is (= :ok (:status result)))
                   (is (string/includes? plain "Welcome home"))
                   (is (some #(and (= [200] (:inputs %))
                                   (query-uses-attr? (:query %) :block/page))
                             @queries))
                   (is (not (some #(and (= [200] (:inputs %))
                                        (query-uses-attr? (:query %) :block/parent))
                                  @queries)))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-library-uses-existing-thread-apis
  (async done
         (let [called-methods (atom [])
               base-invoke (library-show-mock)
               invoke-mock (fn [config method args]
                             (swap! called-methods conj method)
                             (base-invoke config method args))]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (p/let [result (show-command/execute-show {:type :show
                                                           :repo "demo"
                                                           :page "Library"
                                                           :linked-references? false
                                                           :ref-id-footer? false}
                                                          {:output-format nil})]
                   (is (= :ok (:status result)))
                   (is (every? #{:thread-api/pull :thread-api/q} @called-methods))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-library-parent-cycle-fails-fast
  (async done
         (let [library (library-entity)
               invoke-mock (make-show-invoke-mock
                            {:entities-by-page-name {"Library" library}
                             :children-by-parent-id {100 [(assoc (page-entity 101 "A")
                                                                 :block/parent {:db/id 100})]
                                                    101 [(assoc (page-entity 102 "B")
                                                                 :block/parent {:db/id 101})]
                                                    102 [(assoc (page-entity 101 "A")
                                                                 :block/parent {:db/id 102})]}})]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (show-command/execute-show {:type :show
                                            :repo "demo"
                                            :page "Library"
                                            :level 10
                                            :linked-references? false}
                                           {:output-format :json}))
               (p/then (fn [_]
                         (is false "expected execute-show to reject for a Library parent cycle")))
               (p/catch (fn [error]
                          (is (= :library-parent-cycle (-> error ex-data :code)))))
               (p/finally done)))))

(deftest test-tree->text-renders-block-refs-inside-string-property-values
  (let [ref-uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        output (-> (show-command/tree->text
                    {:root {:db/id 1
                            :block/title "Root"
                            :user.property/summary (str "Depends on [[" ref-uuid "]]" )}
                     :uuid->label {(string/lower-case ref-uuid) "Resolved ref"}
                     :property-titles {:user.property/summary "Summary"}
                     :property-value-labels {}})
                   style/strip-ansi)]
    (is (string/includes? output "Summary: Depends on [[Resolved ref]]"))))

(deftest test-tree->text-renders-block-refs-inside-map-backed-property-values
  (let [title-ref-uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
        value-ref-uuid "cccccccc-cccc-cccc-cccc-cccccccccccc"
        output (-> (show-command/tree->text
                    {:root {:db/id 1
                            :block/title "Root"
                            :user.property/title-ref {:block/title (str "Mapped [[" title-ref-uuid "]]" )}
                            :user.property/value-ref {:logseq.property/value (str "Value [[" value-ref-uuid "]]" )}}
                     :uuid->label {(string/lower-case title-ref-uuid) "Title ref"
                                   (string/lower-case value-ref-uuid) "Value ref"}
                     :property-titles {:user.property/title-ref "Title ref"
                                       :user.property/value-ref "Value ref"}
                     :property-value-labels {}})
                   style/strip-ansi)]
    (is (string/includes? output "Title ref: Mapped [[Title ref]]"))
    (is (string/includes? output "Value ref: Value [[Value ref]]"))))

(deftest test-tree->text-renders-block-refs-inside-many-ref-default-property-values
  ;; Simulates a normal block with a user property:
  ;; - property name: "Reproducible steps"
  ;; - :logseq.property/type :default
  ;; - :db/valueType :db.type/ref
  ;; - :db/cardinality :db.cardinality/many
  ;; where the property values are referenced blocks and one referenced
  ;; block title contains a serialized block ref.
  (let [nested-ref-uuid "dddddddd-dddd-dddd-dddd-dddddddddddd"
        output (-> (show-command/tree->text
                    {:root {:db/id 1
                            :block/title "Root"
                            :user.property/reproducible-steps [42 43]}
                     :uuid->label {(string/lower-case nested-ref-uuid) "Resolved nested step"}
                     :property-titles {:user.property/reproducible-steps "Reproducible steps"}
                     :property-value-labels {42 (str "Step [[" nested-ref-uuid "]]" )
                                             43 "Verify output"}})
                   style/strip-ansi)]
    (is (string/includes? output "Reproducible steps:"))
    (is (string/includes? output "- Step [[Resolved nested step]]"))
    (is (string/includes? output "- Verify output"))))

(defn- contains-block-uuid?
  [value]
  (cond
    (map? value) (or (contains? value :block/uuid)
                     (some contains-block-uuid? (vals value)))
    (sequential? value) (some contains-block-uuid? value)
    :else false))

(defn- contains-show-internal-key?
  [value]
  (cond
    (map? value) (or (some (fn [k]
                             (and (qualified-keyword? k)
                                  (= "show" (namespace k))))
                           (keys value))
                     (some contains-show-internal-key? (vals value)))
    (sequential? value) (some contains-show-internal-key? value)
    :else false))

(defn- contains-string?
  [value needle]
  (cond
    (string? value) (string/includes? value needle)
    (map? value) (some #(contains-string? % needle) (vals value))
    (sequential? value) (some #(contains-string? % needle) value)
    :else false))

(deftest test-truncate-breadcrumb-segment
  (let [truncate (fn [value]
                   (call-private 'truncate-breadcrumb-segment value))
        exact-cjk (apply str (repeat 12 "界"))
        one-over-cjk (str exact-cjk "界")]
    (testing "keeps short ASCII segments unchanged"
      (is (= "Project Alpha"
             (truncate "Project Alpha"))))

    (testing "keeps exact-width segment unchanged"
      (is (= "123456789012345678901234"
             (truncate "123456789012345678901234"))))

    (testing "truncates one-over-width ASCII segment with ellipsis"
      (is (= "12345678901234567890123…"
             (truncate "1234567890123456789012345"))))

    (testing "truncates CJK by display width"
      (is (= exact-cjk
             (truncate exact-cjk)))
      (is (= (str (apply str (repeat 11 "界")) "…")
             (truncate one-over-cjk))))))

(deftest test-ordinary-block-root-classification
  (let [ordinary-root? (fn [root]
                         (call-private 'ordinary-block-root? root))]
    (testing "ordinary block root returns true"
      (is (true? (ordinary-root? {:db/id 1
                                  :block/title "Task"
                                  :block/page {:db/id 10}
                                  :block/tags [{:db/ident :user.class/Task}]}))))

    (testing "page root returns false"
      (is (false? (ordinary-root? {:db/id 10
                                   :db/ident :block/name
                                   :block/title "Home"}))))

    (testing "property-value pseudo block returns false"
      (is (false? (ordinary-root? {:db/id 2
                                   :block/title "Property value"
                                   :block/page {:db/id 10}
                                   :logseq.property/created-from-property {:db/id 999}}))))

    (testing "tag/property schema roots return false"
      (is (false? (ordinary-root? {:db/id 3
                                   :block/title "Tag schema"
                                   :block/page {:db/id 10}
                                   :block/tags [{:db/ident :logseq.class/Tag}]})))
      (is (false? (ordinary-root? {:db/id 4
                                   :block/title "Property schema"
                                   :block/page {:db/id 10}
                                   :block/tags [{:db/ident :logseq.class/Property}]}))))))

(deftest test-render-breadcrumb-line
  (let [render-line (fn [parents]
                      (call-private 'render-breadcrumb-line parents))]
    (testing "renders parent chain as multi-line tree rows"
      (is (= (str "100 > Project Alpha\n"
                  "101   > Milestone 2026\n"
                  "102     > API rollout")
             (style/strip-ansi
              (render-line [{:db/id 100 :block/title "Project Alpha"}
                            {:db/id 101 :block/title "Milestone 2026"}
                            {:db/id 102 :block/title "API rollout"}])))))

    (testing "dims breadcrumb id column like normal block ids"
      (let [output (binding [style/*color-enabled?* true]
                     (render-line [{:db/id 100 :block/title "Project Alpha"}
                                   {:db/id 101 :block/title "Milestone 2026"}]))
            plain-lines (-> output style/strip-ansi string/split-lines)
            first-column-id (fn [line]
                              (some-> line
                                      string/trim
                                      (string/split #"\s+" 2)
                                      first))]
        (is (re-find style/ansi-pattern output))
        (is (= ["100" "101"]
               (mapv first-column-id plain-lines)))
        (is (= (str "100 > Project Alpha\n"
                    "101   > Milestone 2026")
               (string/join "\n" plain-lines)))))

    (testing "falls back to db/id when title and name are absent"
      (is (= "42 > 42"
             (style/strip-ansi (render-line [{:db/id 42}])))))))

(deftest test-execute-show-human-adds-breadcrumb-for-ordinary-block
  (async done
         (let [invoke-mock (make-show-invoke-mock
                            {:entities-by-id {1 {:db/id 1
                                                 :block/title "Implement retry policy"
                                                 :block/page {:db/id 100}}}
                             :children-by-page-id {100 [{:db/id 2
                                                         :block/title "Add deterministic retry test"
                                                         :block/order 0
                                                         :block/parent {:db/id 1}}]}
                             :parents-by-block-id {1 [{:db/id 100 :block/title "Project Alpha"}
                                                      {:db/id 101 :block/title "Milestone 2026"}
                                                      {:db/id 102 :block/title "API rollout"}]}})]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (p/let [result (show-command/execute-show {:type :show
                                                           :repo "demo"
                                                           :id 1
                                                           :linked-references? false
                                                           :ref-id-footer? false}
                                                          {:output-format nil})
                         plain (-> result :data :message style/strip-ansi)
                         lines (string/split-lines plain)]
                   (is (= :ok (:status result)))
                   (is (= "100 > Project Alpha"
                          (first lines)))
                   (is (= "101   > Milestone 2026"
                          (second lines)))
                   (is (= "102     > API rollout"
                          (nth lines 2)))
                   (is (string/includes? (nth lines 3) "Implement retry policy"))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-human-skips-breadcrumb-for-page-target
  (async done
         (let [method-calls (atom [])
               base-invoke (make-show-invoke-mock
                            {:entities-by-page-name {"Home" {:db/id 100
                                                              :db/ident :block/name
                                                              :block/title "Home"}}
                             :children-by-page-id {100 [{:db/id 101
                                                         :block/title "Welcome"
                                                         :block/order 0
                                                         :block/parent {:db/id 100}}]}
                             :parents-by-block-id {100 [{:block/title "Should not be used"}]}})
               invoke-mock (fn [config method silent? args]
                             (swap! method-calls conj method)
                             (base-invoke config method silent? args))
               task (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                                    transport/invoke invoke-mock]
                      (p/let [result (show-command/execute-show {:type :show
                                                                :repo "demo"
                                                                :page "Home"
                                                                :linked-references? false
                                                                :ref-id-footer? false}
                                                               {:output-format nil})
                              plain (-> result :data :message style/strip-ansi)
                              lines (string/split-lines plain)]
                        (is (= :ok (:status result)))
                        (is (not (string/includes? (first lines) " > ")))
                        (is (string/includes? (first lines) "Home"))
                        (is (not (some #{:thread-api/get-block-parents} @method-calls)))))]
           (-> task
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-human-skips-breadcrumb-for-non-ordinary-block-targets
  (async done
         (let [method-calls (atom [])
               base-invoke (make-show-invoke-mock
                            {:entities-by-id {2 {:db/id 2
                                                 :block/title "Tag schema"
                                                 :block/page {:db/id 100}
                                                 :block/tags [{:db/ident :logseq.class/Tag}]}
                                              3 {:db/id 3
                                                 :block/title "Property value"
                                                 :block/page {:db/id 100}
                                                 :logseq.property/created-from-property {:db/id 999}}}
                             :children-by-page-id {100 []}
                             :parents-by-block-id {2 [{:block/title "Should not be used"}]
                                                   3 [{:block/title "Should not be used"}]}})
               invoke-mock (fn [config method silent? args]
                             (swap! method-calls conj method)
                             (base-invoke config method silent? args))
               task (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                                    transport/invoke invoke-mock]
                      (p/let [tag-result (show-command/execute-show {:type :show
                                                                    :repo "demo"
                                                                    :id 2
                                                                    :linked-references? false
                                                                    :ref-id-footer? false}
                                                                   {:output-format nil})
                              property-result (show-command/execute-show {:type :show
                                                                         :repo "demo"
                                                                         :id 3
                                                                         :linked-references? false
                                                                         :ref-id-footer? false}
                                                                        {:output-format nil})
                              tag-plain (-> tag-result :data :message style/strip-ansi)
                              property-plain (-> property-result :data :message style/strip-ansi)]
                        (is (= :ok (:status tag-result)))
                        (is (= :ok (:status property-result)))
                        (is (not (string/includes? (first (string/split-lines tag-plain)) " > ")))
                        (is (not (string/includes? (first (string/split-lines property-plain)) " > ")))
                        (is (not (some #{:thread-api/get-block-parents} @method-calls)))))]
           (-> task
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-human-multi-id-renders-breadcrumb-per-ordinary-block
  (async done
         (let [invoke-mock (make-show-invoke-mock
                            {:entities-by-id {1 {:db/id 1
                                                 :block/title "Root A"
                                                 :block/page {:db/id 100}}
                                              2 {:db/id 2
                                                 :block/title "Root B"
                                                 :block/page {:db/id 200}}}
                             :children-by-page-id {100 []
                                                   200 []}
                             :parents-by-block-id {1 [{:db/id 100 :block/title "Project Alpha"}
                                                      {:db/id 101 :block/title "Milestone 2026"}]
                                                   2 [{:db/id 200 :block/title "Project Beta"}
                                                      {:db/id 201 :block/title "Initiative Z"}]}})
               task (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                                    transport/invoke invoke-mock]
                      (p/let [result (show-command/execute-show {:type :show
                                                                :repo "demo"
                                                                :ids [1 2]
                                                                :multi-id? true
                                                                :linked-references? false
                                                                :ref-id-footer? false}
                                                               {:output-format nil})
                              plain (-> result :data :message style/strip-ansi)]
                        (is (= :ok (:status result)))
                        (is (string/includes? plain (str "100 > Project Alpha\n"
                                                         "101   > Milestone 2026")))
                        (is (string/includes? plain (str "200 > Project Beta\n"
                                                         "201   > Initiative Z")))
                        (is (< (.indexOf plain "100 > Project Alpha")
                               (.indexOf plain "Root A")))
                        (is (< (.indexOf plain "200 > Project Beta")
                               (.indexOf plain "Root B")))))]
           (-> task
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-fails-when-breadcrumb-fetch-fails
  (async done
         (let [invoke-mock (fn [_ method args]
                             (case method
                               :thread-api/pull
                               (let [[_repo _selector target] args]
                                 (cond
                                   (= target 1)
                                   (p/resolved {:db/id 1
                                                :block/title "Root A"
                                                :block/page {:db/id 100}})

                                   (= target 100)
                                   (p/resolved {:db/id 100
                                                :db/ident :block/name
                                                :block/title "Home"})

                                   :else
                                   (p/resolved nil)))

                               :thread-api/q
                               (p/resolved [])

                               :thread-api/get-block-refs
                               (p/resolved [])

                               :thread-api/get-block-parents
                               (p/rejected (ex-info "parents query failed"
                                                    {:code :breadcrumb-fetch-failed}))

                               (p/resolved nil)))]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (-> (show-command/execute-show {:type :show
                                                :repo "demo"
                                                :id 1
                                                :linked-references? false
                                                :ref-id-footer? false}
                                               {:output-format nil})
                     (p/then (fn [_]
                               (is false "expected execute-show to reject on breadcrumb fetch failure")))
                     (p/catch (fn [error]
                                (is (= :breadcrumb-fetch-failed (-> error ex-data :code)))
                                (is (string/includes? (or (ex-message error) (str error))
                                                      "parents query failed"))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-render-referenced-entities-footer
  (let [render-footer (fn [ordered-uuids uuid->entity]
                        (call-private 'render-referenced-entities-footer ordered-uuids uuid->entity))
        u1 "11111111-1111-1111-1111-111111111111"
        u2 "22222222-2222-2222-2222-222222222222"
        u3 "33333333-3333-3333-3333-333333333333"]
    (testing "returns nil when no refs"
      (is (nil? (render-footer [] {}))))

    (testing "renders ordered refs with id and label"
      (is (= (str "Referenced Entities (2)\n"
                  "181 -> First child\n"
                  "179 -> Root task")
             (render-footer [u1 u2]
                            {(string/lower-case u1) {:id 181 :label "First child"}
                             (string/lower-case u2) {:id 179 :label "Root task"}}))))

    (testing "renders fallback rows for missing id/label and unresolved refs"
      (is (= (str "Referenced Entities (3)\n"
                  "- -> Broken ref\n"
                  "88 -> " u2 "\n"
                  "- -> " u3)
             (render-footer [u1 u2 u3]
                            {(string/lower-case u1) {:label "Broken ref"}
                             (string/lower-case u2) {:id 88}}))))))

(deftest test-render-referenced-entities-footer-formats-large-count
  (let [render-footer (fn [ordered-uuids uuid->entity]
                        (call-private 'render-referenced-entities-footer ordered-uuids uuid->entity))
        ordered-uuids (mapv (fn [idx]
                              (str "uuid-" idx))
                            (range 1234))
        uuid->entity {}
        output (render-footer ordered-uuids uuid->entity)]
    (is (string/includes? output "Referenced Entities (1,234)"))))

(deftest test-build-action-ref-id-footer
  (testing "ref-id-footer defaults to true"
    (let [result (show-command/build-action {:id "42"}
                                            "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (true? (get-in result [:action :ref-id-footer?])))))

  (testing "ref-id-footer false is threaded into action"
    (let [result (show-command/build-action {:id "42"
                                             :ref-id-footer false}
                                            "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (false? (get-in result [:action :ref-id-footer?]))))))

(deftest test-execute-show-human-ref-id-footer-default-enabled
  (async done
         (let [resolved-uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
               missing-uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
               invoke-mock (make-show-invoke-mock
                            {:entities-by-id {1 {:db/id 1
                                                 :block/title (str "Root [[" resolved-uuid "]] [[" missing-uuid "]]")
                                                 :block/page {:db/id 100}}}
                             :children-by-page-id {100 [{:db/id 2
                                                         :block/title "Child"
                                                         :block/order 0
                                                         :block/parent {:db/id 1}}]}
                             :uuid-entities {(string/lower-case resolved-uuid)
                                             {:db/id 179
                                              :block/uuid (uuid resolved-uuid)
                                              :block/title "Root task"}}})]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (p/let [result (show-command/execute-show {:type :show
                                                           :repo "demo"
                                                           :id 1
                                                           :linked-references? false}
                                                          {:output-format nil})
                         plain (-> result :data :message style/strip-ansi)]
                   (is (= :ok (:status result)))
                   (is (string/includes? plain "Referenced Entities (2)"))
                   (is (string/includes? plain "179 -> Root task"))
                   (is (string/includes? plain (str "- -> " missing-uuid)))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-human-ref-id-footer-multi-id
  (async done
         (let [uuid-a "cccccccc-cccc-cccc-cccc-cccccccccccc"
               uuid-b "dddddddd-dddd-dddd-dddd-dddddddddddd"
               invoke-mock (make-show-invoke-mock
                            {:entities-by-id {1 {:db/id 1
                                                 :block/title "Root A"
                                                 :block/page {:db/id 101}}
                                              2 {:db/id 2
                                                 :block/title "Root B"
                                                 :block/page {:db/id 102}}}
                             :children-by-page-id {101 [{:db/id 11
                                                         :block/title (str "Child A [[" uuid-a "]]")
                                                         :block/order 0
                                                         :block/parent {:db/id 1}}]
                                                   102 [{:db/id 22
                                                         :block/title (str "Child B [[" uuid-b "]]")
                                                         :block/order 0
                                                         :block/parent {:db/id 2}}]}
                             :uuid-entities {(string/lower-case uuid-a)
                                             {:db/id 501
                                              :block/uuid (uuid uuid-a)
                                              :block/title "Ref A"}
                                             (string/lower-case uuid-b)
                                             {:db/id 502
                                              :block/uuid (uuid uuid-b)
                                              :block/title "Ref B"}}})]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (p/let [result (show-command/execute-show {:type :show
                                                           :repo "demo"
                                                           :ids [1 2]
                                                           :multi-id? true
                                                           :linked-references? false}
                                                          {:output-format nil})
                         plain (-> result :data :message style/strip-ansi)
                         footer-count (count (re-seq #"Referenced Entities \(1\)" plain))]
                   (is (= :ok (:status result)))
                   (is (= 2 footer-count))
                   (is (string/includes? plain "501 -> Ref A"))
                   (is (string/includes? plain "502 -> Ref B"))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-human-ref-id-footer-disabled
  (async done
         (let [uuid-a "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"
               invoke-mock (make-show-invoke-mock
                            {:entities-by-id {1 {:db/id 1
                                                 :block/title "Root"
                                                 :block/page {:db/id 201}}}
                             :children-by-page-id {201 [{:db/id 12
                                                         :block/title (str "Child [[" uuid-a "]]" )
                                                         :block/order 0
                                                         :block/parent {:db/id 1}}]}
                             :uuid-entities {(string/lower-case uuid-a)
                                             {:db/id 601
                                              :block/uuid (uuid uuid-a)
                                              :block/title "Ref A"}}})]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (p/let [result (show-command/execute-show {:type :show
                                                           :repo "demo"
                                                           :id 1
                                                           :linked-references? false
                                                           :ref-id-footer? false}
                                                          {:output-format nil})
                         plain (-> result :data :message style/strip-ansi)]
                   (is (= :ok (:status result)))
                   (is (not (string/includes? plain "Referenced Entities (")))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-structured-output-single-and-multi-id
  (async done
         (let [invoke-mock (make-show-invoke-mock
                            {:entities-by-id {1 {:db/id 1
                                                 :block/uuid (uuid "11111111-1111-1111-1111-111111111111")
                                                 :block/title "Root A"
                                                 :block/page {:db/id 101}}
                                              2 {:db/id 2
                                                 :block/uuid (uuid "22222222-2222-2222-2222-222222222222")
                                                 :block/title "Root B"
                                                 :block/page {:db/id 102}}}
                             :children-by-page-id {101 [{:db/id 11
                                                         :block/uuid (uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
                                                         :block/title "Child A"
                                                         :block/order 0
                                                         :block/parent {:db/id 1}}]
                                                   102 [{:db/id 22
                                                         :block/uuid (uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
                                                         :block/title "Child B"
                                                         :block/order 0
                                                         :block/parent {:db/id 2}}]}})]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (p/let [single-json (show-command/execute-show {:type :show
                                                                :repo "demo"
                                                                :id 1
                                                                :linked-references? false}
                                                               {:output-format :json})
                         single-edn (show-command/execute-show {:type :show
                                                               :repo "demo"
                                                               :id 1
                                                               :linked-references? false}
                                                              {:output-format :edn})
                         multi-json (show-command/execute-show {:type :show
                                                               :repo "demo"
                                                               :ids [1 2]
                                                               :multi-id? true
                                                               :linked-references? false}
                                                              {:output-format :json})
                         multi-edn (show-command/execute-show {:type :show
                                                              :repo "demo"
                                                              :ids [1 2]
                                                              :multi-id? true
                                                              :linked-references? false}
                                                             {:output-format :edn})]
                   (doseq [result [single-json single-edn multi-json multi-edn]]
                     (is (= :ok (:status result)))
                     (is (not (contains-block-uuid? (:data result)))))

                   (is (= :json (:output-format single-json)))
                   (is (= :edn (:output-format single-edn)))
                   (is (= 1 (get-in single-json [:data :root :db/id])))
                   (is (= 1 (get-in single-edn [:data :root :db/id])))

                   (is (= :json (:output-format multi-json)))
                   (is (= :edn (:output-format multi-edn)))
                   (is (= [1 2]
                          (mapv #(get-in % [:root :db/id]) (:data multi-json))))
                   (is (= [1 2]
                          (mapv #(get-in % [:root :db/id]) (:data multi-edn))))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-linked-root-renders-target-tree
  (async done
         (let [invoke-mock (make-show-invoke-mock
                            {:entities-by-id {10 {:db/id 10
                                                  :block/title "Source A"
                                                  :block/page {:db/id 100}
                                                  :block/link {:db/id 20
                                                               :block/title "Target B"
                                                               :block/page {:db/id 200}}}
                                              20 {:db/id 20
                                                  :block/title "Target B"
                                                  :block/page {:db/id 200}}}
                             :children-by-page-id {100 [{:db/id 11
                                                         :block/title "Source-only child"
                                                         :block/order 0
                                                         :block/parent {:db/id 10}}]
                                                   200 [{:db/id 21
                                                         :block/title "Target child"
                                                         :block/order 0
                                                         :block/parent {:db/id 20}}]}})]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (p/let [result (show-command/execute-show {:type :show
                                                           :repo "demo"
                                                           :id 10
                                                           :linked-references? false
                                                           :ref-id-footer? false}
                                                          {:output-format nil})
                         plain (-> result :data :message style/strip-ansi)]
                   (is (= :ok (:status result)))
                   (is (string/includes? plain "Target B"))
                   (is (string/includes? plain "Target child"))
                   (is (not (string/includes? plain "Source A")))
                   (is (not (string/includes? plain "Source-only child")))
                   (is (re-find #"(?m)^20\s+→ Target B$" plain))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-linked-child-renders-target-at-source-position-and-depth
  (async done
         (let [invoke-mock (make-show-invoke-mock
                            {:entities-by-page-name {"Home" {:db/id 100
                                                              :db/ident :block/name
                                                              :block/title "Home"}}
                             :entities-by-id {20 {:db/id 20
                                                  :block/title "Target B"
                                                  :block/page {:db/id 200}}}
                             :children-by-page-id {100 [{:db/id 10
                                                         :block/title "Source child A"
                                                         :block/order 0
                                                         :block/parent {:db/id 100}
                                                         :block/link {:db/id 20
                                                                      :block/title "Target B"
                                                                      :block/page {:db/id 200}}}]
                                                   200 [{:db/id 21
                                                         :block/title "Target grandchild"
                                                         :block/order 0
                                                         :block/parent {:db/id 20}}]}})]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (p/let [level-3 (show-command/execute-show {:type :show
                                                            :repo "demo"
                                                            :page "Home"
                                                            :level 3
                                                            :linked-references? false
                                                            :ref-id-footer? false}
                                                           {:output-format nil})
                         level-2 (show-command/execute-show {:type :show
                                                            :repo "demo"
                                                            :page "Home"
                                                            :level 2
                                                            :linked-references? false
                                                            :ref-id-footer? false}
                                                           {:output-format nil})
                         plain-3 (-> level-3 :data :message style/strip-ansi)
                         plain-2 (-> level-2 :data :message style/strip-ansi)]
                   (is (= :ok (:status level-3)))
                   (is (string/includes? plain-3 "100 Home"))
                   (is (re-find #"(?m)^20\s+└── → Target B$" plain-3))
                   (is (re-find #"(?m)^21\s+    └── Target grandchild$" plain-3))
                   (is (not (string/includes? plain-3 "Source child A")))
                   (is (= :ok (:status level-2)))
                   (is (re-find #"(?m)^20\s+└── → Target B$" plain-2))
                   (is (not (string/includes? plain-2 "Target grandchild")))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-linked-root-fetches-target-linked-references
  (async done
         (let [get-block-refs-calls (atom [])
               base-invoke (make-show-invoke-mock
                            {:entities-by-id {10 {:db/id 10
                                                  :block/title "Source A"
                                                  :block/page {:db/id 100}
                                                  :block/link {:db/id 20
                                                               :block/title "Target B"
                                                               :block/page {:db/id 200}}}
                                              20 {:db/id 20
                                                  :block/title "Target B"
                                                  :block/page {:db/id 200}}
                                              30 {:db/id 30
                                                  :block/title "Ref to target"
                                                  :block/page {:db/id 300}}}
                             :children-by-page-id {100 []
                                                   200 []}
                             :linked-refs-by-root-id {20 [{:db/id 30}]}})
               invoke-mock (fn [config method args]
                             (when (= method :thread-api/get-block-refs)
                               (swap! get-block-refs-calls conj args))
                             (base-invoke config method args))]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (p/let [result (show-command/execute-show {:type :show
                                                           :repo "demo"
                                                           :id 10
                                                           :linked-references? true
                                                           :ref-id-footer? false}
                                                          {:output-format nil})]
                   (is (= :ok (:status result)))
                   (is (= [["demo" 20]] @get-block-refs-calls))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-linked-reference-wrapper-renders-target
  (async done
         (let [invoke-mock (make-show-invoke-mock
                            {:entities-by-id {1 {:db/id 1
                                                 :block/title "Root"
                                                 :block/page {:db/id 100}}
                                              10 {:db/id 10
                                                  :block/title "Reference wrapper"
                                                  :block/page {:db/id 300
                                                               :block/title "Refs"}
                                                  :block/link {:db/id 20
                                                               :block/title "Reference target"
                                                               :block/page {:db/id 400}}}
                                              20 {:db/id 20
                                                  :block/title "Reference target"
                                                  :block/page {:db/id 400
                                                               :block/title "Target Page"}}}
                             :children-by-page-id {100 []
                                                   400 []}
                             :linked-refs-by-root-id {1 [{:db/id 10}]}})]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (p/let [result (show-command/execute-show {:type :show
                                                           :repo "demo"
                                                           :id 1
                                                           :linked-references? true
                                                           :ref-id-footer? false}
                                                          {:output-format nil})
                         plain (-> result :data :message style/strip-ansi)]
                   (is (= :ok (:status result)))
                   (is (string/includes? plain "Linked References (1)"))
                   (is (string/includes? plain "Reference target"))
                   (is (not (string/includes? plain "Reference wrapper")))
                   (is (re-find #"(?m)^20\s+└── → Reference target$" plain))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-structured-output-linked-root-uses-target-without-internal-marker
  (async done
         (let [invoke-mock (make-show-invoke-mock
                            {:entities-by-id {10 {:db/id 10
                                                  :block/uuid (uuid "11111111-1111-1111-1111-111111111111")
                                                  :block/title "Source A"
                                                  :block/page {:db/id 100}
                                                  :block/link {:db/id 20
                                                               :block/title "Target B"
                                                               :block/page {:db/id 200}}}
                                              20 {:db/id 20
                                                  :block/uuid (uuid "22222222-2222-2222-2222-222222222222")
                                                  :block/title "Target B"
                                                  :block/page {:db/id 200}}}
                             :children-by-page-id {100 []
                                                   200 [{:db/id 21
                                                         :block/uuid (uuid "33333333-3333-3333-3333-333333333333")
                                                         :block/title "Target child"
                                                         :block/order 0
                                                         :block/parent {:db/id 20}}]}})]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (p/let [json-result (show-command/execute-show {:type :show
                                                                :repo "demo"
                                                                :id 10
                                                                :linked-references? false}
                                                               {:output-format :json})
                         edn-result (show-command/execute-show {:type :show
                                                               :repo "demo"
                                                               :id 10
                                                               :linked-references? false}
                                                              {:output-format :edn})]
                   (doseq [result [json-result edn-result]]
                     (is (= :ok (:status result)))
                     (is (= 20 (get-in result [:data :root :db/id])))
                     (is (= "Target B" (get-in result [:data :root :block/title])))
                     (is (= "Target child" (get-in result [:data :root :block/children 0 :block/title])))
                     (is (not (contains-string? (:data result) "Source A")))
                     (is (not (contains-string? (:data result) "→")))
                     (is (not (contains-block-uuid? (:data result))))
                     (is (not (contains-show-internal-key? (:data result)))))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-show-linked-root-cycle-fails-fast
  (async done
         (let [invoke-mock (make-show-invoke-mock
                            {:entities-by-id {10 {:db/id 10
                                                  :block/title "Source A"
                                                  :block/page {:db/id 100}
                                                  :block/link {:db/id 20
                                                               :block/title "Source B"
                                                               :block/page {:db/id 200}}}
                                              20 {:db/id 20
                                                  :block/title "Source B"
                                                  :block/page {:db/id 200}
                                                  :block/link {:db/id 10
                                                               :block/title "Source A"
                                                               :block/page {:db/id 100}}}}
                             :children-by-page-id {100 []
                                                   200 []}})]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (show-command/execute-show {:type :show
                                            :repo "demo"
                                            :id 10
                                            :linked-references? false}
                                           {:output-format :json}))
               (p/then (fn [_]
                         (is false "expected execute-show to reject for a block link cycle")))
               (p/catch (fn [error]
                          (is (= :block-link-cycle (-> error ex-data :code)))))
               (p/finally done)))))

(deftest test-execute-show-linked-root-missing-target-fails-fast
  (async done
         (let [invoke-mock (make-show-invoke-mock
                            {:entities-by-id {10 {:db/id 10
                                                  :block/title "Source A"
                                                  :block/page {:db/id 100}
                                                  :block/link {:db/id 404}}
                                              404 {:db/id 404}}
                             :children-by-page-id {100 []}})]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _] config)
                               transport/invoke invoke-mock]
                 (show-command/execute-show {:type :show
                                            :repo "demo"
                                            :id 10
                                            :linked-references? false}
                                           {:output-format :json}))
               (p/then (fn [_]
                         (is false "expected execute-show to reject for a missing block link target")))
               (p/catch (fn [error]
                          (is (= :block-link-target-not-found (-> error ex-data :code)))))
               (p/finally done)))))
