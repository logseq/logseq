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
  [{:keys [entities-by-id children-by-page-id uuid-entities linked-refs-by-root-id]}]
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

      (p/resolved nil))))

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
                                                         :block/title (str "Child [[" uuid-a "]]")
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
