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
        mock-invoke (fn [_ _method _ _args]
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
        mock-invoke (fn [_ _method _ _args]
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

(defn- make-show-invoke-mock
  [{:keys [entities-by-id
           entities-by-page-name
           children-by-page-id
           uuid-entities
           linked-refs-by-root-id
           parents-by-block-id]}]
  (fn [_ method _ args]
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
            [_query & inputs] query-args]
        (if (= 1 (count inputs))
          (let [page-id (first inputs)
                blocks (get children-by-page-id page-id [])]
            (p/resolved (mapv vector blocks)))
          (p/resolved [])))

      :thread-api/get-block-refs
      (let [[_repo root-id] args]
        (p/resolved (get linked-refs-by-root-id root-id [])))

      :thread-api/get-block-parents
      (let [[_repo block-id] args]
        (p/resolved (get parents-by-block-id block-id [])))

      (p/resolved nil))))

(defn- contains-block-uuid?
  [value]
  (cond
    (map? value) (or (contains? value :block/uuid)
                     (some contains-block-uuid? (vals value)))
    (sequential? value) (some contains-block-uuid? value)
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
             (render-line [{:db/id 100 :block/title "Project Alpha"}
                           {:db/id 101 :block/title "Milestone 2026"}
                           {:db/id 102 :block/title "API rollout"}]))))

    (testing "dims breadcrumb id column like normal block ids"
      (let [output (binding [style/*color-enabled?* true]
                     (render-line [{:db/id 100 :block/title "Project Alpha"}
                                   {:db/id 101 :block/title "Milestone 2026"}]))]
        (is (string/includes? output (style/dim "100")))
        (is (string/includes? output (style/dim "101")))
        (is (= (str "100 > Project Alpha\n"
                    "101   > Milestone 2026")
               (style/strip-ansi output)))))

    (testing "falls back to db/id when title and name are absent"
      (is (= "42 > 42"
             (render-line [{:db/id 42}]))))))

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
