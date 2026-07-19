(ns frontend.db.async-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(deftest journal-display-helpers-use-one-journal-summary-api-test
  (async done
    (let [calls (atom [])]
      (p/with-redefs [date/today-journal-day (constantly 20260718)
                      date/today (constantly "Jul 18th, 2026")
                      date/journal-title->int (constantly 20260717)
                      db-async/<invoke-db-worker
                      (fn [api & args]
                        (swap! calls conj (into [api] args))
                        (p/resolved
                         (case api
                           :thread-api/get-journal-page-by-day
                           (case (last args)
                             20260718 {:block/title "Today from DB"}
                             20260717 nil)
                           :thread-api/get-today-journal-title "Today from DB"
                           :thread-api/get-journal-page-title "Jul 17th, 2026")))]
        (-> (p/let [today (db-async/<get-today-journal-title "graph")
                    missing (db-async/<get-journal-page-title "graph" "Jul 17th, 2026")]
              (is (= "Today from DB" today))
              (is (= "Jul 17th, 2026" missing))
              (is (= [[:thread-api/get-journal-page-by-day "graph" 20260718]
                      [:thread-api/get-journal-page-by-day "graph" 20260717]]
                     @calls)))
            (p/catch #(is false (str %)))
            (p/finally done))))))

(deftest latest-journals-can-request-the-complete-index-test
  (async done
    (let [calls (atom [])]
      (p/with-redefs [db-async/<invoke-db-worker
                      (fn [& args]
                        (swap! calls conj (vec args))
                        (p/resolved []))]
        (-> (p/let [_ (db-async/<get-latest-journals "graph")]
              (is (= [[:thread-api/get-latest-journals
                       "graph"
                       js/Number.MAX_SAFE_INTEGER]]
                     @calls)))
            (p/catch #(is false (str %)))
            (p/finally done))))))

(deftest date-formatter-uses-worker-pull-with-ui-fallback-test
  (async done
    (let [calls (atom [])]
      (p/with-redefs [db-async/<invoke-db-worker
                      (fn [& args]
                        (swap! calls conj (vec args))
                        (p/resolved nil))]
        (-> (p/let [formatter (db-async/<get-date-formatter "graph")]
              (is (= "MMM do, yyyy" formatter))
              (is (= [[:thread-api/pull
                       "graph"
                       [:logseq.property.journal/title-format]
                       :logseq.class/Journal]]
                     @calls)))
            (p/catch #(is false (str %)))
            (p/finally done))))))

(defn- source-for
  [relative-file]
  (.toString (fs/readFileSync (node-path/join (.cwd js/process) relative-file) "utf8")))

(deftest block-batching-has-one-worker-call-path-test
  (let [source (source-for "src/main/frontend/db/async.cljs")]
    (is (not (string/includes? source "*get-blocks-batch-enabled?"))
        "A worker error must not switch the runtime to a second fetch path.")
    (is (not (string/includes? source "Safety fallback: retry once"))
        "A failed batch must not repeat the same large request.")))

(deftest block-batching-preserves-complete-tree-options-test
  (let [id (random-uuid)
        requests [{:id id
                   :opts {:all? true
                          :children? true
                          :render-data? true
                          :root-render-data? true
                          :include-collapsed-children? true
                          :skip-refresh? true}}]]
    (is (= [{:id id
             :opts {:all? true
                    :children? true
                    :render-data? true
                    :root-render-data? true
                    :include-collapsed-children? true}}]
           (#'db-async/worker-get-blocks-requests requests)))))

(deftest complete-trees-return-independently-while-ordinary-blocks-stay-batched-test
  (async done
         (let [complete-tree-repo "logseq_db_async_complete_trees"
               ordinary-block-repo "logseq_db_async_ordinary_blocks"
               worker-request-counts (atom [])]
           (p/with-redefs [state/<invoke-db-worker
                           (fn [_api repo requests-transit]
                             (let [requests (ldb/read-transit-str requests-transit)]
                               (swap! worker-request-counts conj [repo (count requests)])
                               (p/resolved
                                (ldb/write-transit-str
                                 (mapv (fn [{:keys [id]}]
                                         {:id id
                                          :block {:db/id id}})
                                       requests)))))]
             (-> (p/let [_ (p/all (mapv #(db-async/<get-block-with-children
                                          complete-tree-repo
                                          %
                                          {:all? true
                                           :children? true
                                           :include-collapsed-children? true})
                                        [1 2 3]))
                         _ (is (= [[complete-tree-repo 1]
                                   [complete-tree-repo 1]
                                   [complete-tree-repo 1]]
                                  @worker-request-counts)
                               "Each complete tree should unblock the renderer as soon as it is ready.")
                         _ (reset! worker-request-counts [])
                         _ (p/all (mapv #(db-async/<get-block ordinary-block-repo % {:children? false})
                                        [4 5 6]))]
                   (is (= [[ordinary-block-repo 3]] @worker-request-counts)
                       "Small block reads should keep sharing one worker roundtrip."))
                 (p/catch
                  (fn [error]
                    (is false (str error))))
                 (p/finally done))))))

(deftest block-refs-counts-reuse-get-block-test
  (async done
         (let [repo "logseq_db_async_refs_counts"
               block-ids [1 2 3]
               calls (atom [])]
           (p/with-redefs [db-async/<get-block
                           (fn [repo' id opts]
                             (swap! calls conj [repo' id opts])
                             (p/resolved {:block.temp/refs-count (* 2 id)}))]
             (-> (p/let [counts (p/all (mapv #(db-async/<get-block-refs-count repo %)
                                              block-ids))]
                   (is (= [2 4 6] counts))
                   (is (= [[repo 1 {:children? false
                                    :properties [:block.temp/refs-count]}]
                           [repo 2 {:children? false
                                    :properties [:block.temp/refs-count]}]
                           [repo 3 {:children? false
                                    :properties [:block.temp/refs-count]}]]
                          @calls)
                       "Refs counts should use the existing bounded get-blocks path."))
                 (p/catch
                  (fn [error]
                    (is false (str error))))
                 (p/finally done))))))

(deftest complete-tree-loader-preserves-explicit-render-data-option-test
  (async done
         (let [requests (atom [])]
           (p/with-redefs [db-async/<fetch-blocks-from-worker-batched
                           (fn [_repo requests']
                             (reset! requests requests')
                             (p/resolved [{:block {:db/id 42}
                                           :children []}]))]
             (-> (p/let [result (db-async/<get-block-with-children
                                         "logseq_db_async_base_tree"
                                         42
                                         {:all? true
                                          :children? true
                                          :render-data? false
                                          :include-collapsed-children? true})]
                   (is (= {:block {:db/id 42}
                           :children []}
                          result))
                   (is (= [{:id 42
                            :opts {:all? true
                                   :children? true
                                   :render-data? false
                                   :include-collapsed-children? true}}]
                          @requests)
                       "A caller must be able to request a complete base tree without eager render derivation."))
                 (p/catch
                  (fn [error]
                    (is false (str error))))
                 (p/finally done))))))

(deftest block-loaders-preserve-worker-error-cause-test
  (async done
         (let [cause (js/Error. "worker failed")
               block-id (random-uuid)
               capture-error (fn [promise]
                               (p/create
                                (fn [resolve _reject]
                                  (-> promise
                                      (p/then resolve)
                                      (p/catch resolve)))))]
           (p/with-redefs [db-async/<fetch-blocks-from-worker-batched
                           (fn [& _]
                             (p/rejected cause))]
             (-> (p/let [block-error (capture-error
                                      (db-async/<get-block "test-repo" block-id))
                         tree-error (capture-error
                                     (db-async/<get-block-with-children "test-repo" block-id))]
                   (is (= cause (ex-cause block-error)))
                   (is (= cause (ex-cause tree-error)))
                   (is (= {:block block-id} (ex-data block-error)))
                   (is (= {:block block-id} (ex-data tree-error))))
                 (p/catch (fn [error]
                            (is false (str error))))
                 (p/finally done))))))

(deftest block-batching-bounds-worker-request-size-test
  (async done
         (let [repo "logseq_db_async_bounded_batch"
               worker-request-counts (atom [])]
           (p/with-redefs [state/<invoke-db-worker
                           (fn [_api _repo requests-transit]
                             (let [requests (ldb/read-transit-str requests-transit)]
                               (swap! worker-request-counts conj (count requests))
                               (p/resolved
                                (ldb/write-transit-str
                                 (mapv (fn [{:keys [id]}]
                                         {:id id
                                          :block {:db/id id}})
                                       requests)))))]
             (-> (p/let [_ (p/all (mapv #(db-async/<get-block repo % {:children? true})
                                        (range 151)))]
                   (is (= 151 (reduce + @worker-request-counts)))
                   (is (every? #(<= % 50) @worker-request-counts)
                       (str "Unbounded get-blocks batches: " @worker-request-counts)))
                 (p/catch
                  (fn [error]
                    (is false (str error))))
                 (p/finally done))))))

(deftest block-batching-coalesces-identical-requests-test
  (async done
         (let [repo "logseq_db_async_duplicate_batch"
               worker-requests (atom [])]
           (p/with-redefs [state/<invoke-db-worker
                           (fn [_api _repo requests-transit]
                             (let [requests (ldb/read-transit-str requests-transit)]
                               (swap! worker-requests into requests)
                               (p/resolved
                                (ldb/write-transit-str
                                 (mapv (fn [{:keys [id]}]
                                         {:id id
                                          :block {:db/id id}})
                                       requests)))))]
             (-> (p/let [results (p/all (repeatedly 17
                                                    #(db-async/<get-block repo 42 {:children? false
                                                                                 :skip-refresh? true})))]
                   (is (= 1 (count @worker-requests)))
                   (is (= (repeat 17 {:db/id 42}) results)))
                 (p/catch
                  (fn [error]
                    (is false (str error))))
                 (p/finally done))))))

(deftest block-batching-shares-identical-in-flight-requests-across-flushes-test
  (async done
         (let [repo "logseq_db_async_in_flight"
               worker-calls (atom 0)
               response (ldb/write-transit-str [{:id 42
                                                  :block {:db/id 42}}])]
           (-> (p/with-redefs [state/<invoke-db-worker
                               (fn [& _]
                                 (swap! worker-calls inc)
                                 (p/let [_ (p/delay 20)]
                                   response))]
                 (let [first-result (db-async/<get-block repo 42 {:children? false})
                       second-result* (atom nil)]
                   (-> (p/let [_ (p/delay 0)
                               _ (is (= 1 @worker-calls))
                               _ (do
                                   (reset! second-result*
                                           (db-async/<get-block repo 42 {:children? false}))
                                   nil)
                               _ (p/delay 0)
                               _ (is (= 1 @worker-calls)
                                     "An identical request must join the pending worker call after its batch has flushed.")
                               results (p/all [first-result @second-result*])]
                         (is (= [{:db/id 42} {:db/id 42}] results)))
                       (p/catch
                        (fn [error]
                          (is false (str error)))))))
               (p/finally done)))))

(deftest failed-in-flight-block-request-is-cleared-for-retry-test
  (async done
         (let [repo "logseq_db_async_in_flight_retry"
               worker-calls (atom 0)
               cause (js/Error. "worker failed")
               response (ldb/write-transit-str [{:id 42
                                                  :block {:db/id 42}}])
               capture-error (fn [promise]
                               (p/create
                                (fn [resolve _reject]
                                  (-> promise
                                      (p/then resolve)
                                      (p/catch resolve)))))]
           (-> (p/with-redefs [state/<invoke-db-worker
                               (fn [& _]
                                 (if (= 1 (swap! worker-calls inc))
                                   (p/let [_ (p/delay 20)]
                                     (throw cause))
                                   (p/resolved response)))]
                 (let [first-result (db-async/<get-block repo 42 {:children? false})
                       second-result* (atom nil)]
                   (-> (p/let [_ (p/delay 0)
                               _ (do
                                   (reset! second-result*
                                           (db-async/<get-block repo 42 {:children? false}))
                                   nil)
                               _ (p/delay 0)
                               _ (is (= 1 @worker-calls))
                               errors (p/all [(capture-error first-result)
                                              (capture-error @second-result*)])
                               _ (is (every? #(= cause (ex-cause %)) errors))
                               retry-result (db-async/<get-block repo 42 {:children? false})]
                         (is (= {:db/id 42} retry-result))
                         (is (= 2 @worker-calls)
                             "A failed shared request must not poison the next retry."))
                       (p/catch
                        (fn [error]
                          (is false (str error)))))))
               (p/finally done)))))

(deftest block-batching-flush-is-not-frame-coupled-test
  (let [source (source-for "src/main/frontend/db/async.cljs")]
    (is (string/includes? source "(js/queueMicrotask flush-get-blocks-batch!)")
        "Block fetches must flush before the next animation frame.")
    (is (not (string/includes? source "(util/schedule flush-get-blocks-batch!)"))
        "Worker requests must not be coupled to requestAnimationFrame.")))

(deftest block-loaders-return-worker-data-without-renderer-db-test
  (async done
         (let [repo "logseq_db_async_block_worker"
               block {:db/id 42
                      :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
                      :block/title "worker block"}
               child {:db/id 43
                      :block/title "worker child"}
               block-a {:db/id 10 :block/title "a"}
               block-b {:db/id 11 :block/title "b"}
               parents [{:db/id 1 :block/title "parent"}]
               worker-requests (atom [])
               worker-calls (atom [])]
           (p/with-redefs [db-async/<fetch-blocks-from-worker-batched
                           (fn [repo' requests]
                             (swap! worker-requests conj [repo' requests])
                             (p/resolved
                              (if (= 1 (count requests))
                                [{:block block :children [child]}]
                                [{:block block-a}
                                 {:block block-b}])))]
             (-> (p/let [block-result (db-async/<get-block repo (:block/uuid block) {:children? true})
                         blocks-result (db-async/<get-blocks repo [10 11] {:children? false})
                         parents-result (with-redefs [db-async/<invoke-db-worker
                                                      (fn [api repo' id depth]
                                                        (swap! worker-calls conj [api repo' id depth])
                                                        parents)]
                                          (db-async/<get-block-parents repo 42 1000))]
                   (is (= block block-result))
                   (is (= [{:block block-a}
                           {:block block-b}]
                          blocks-result))
                   (is (= parents parents-result))
                   (is (= [[repo [{:id (str (:block/uuid block))
                                   :opts {:children? true}}]]
                           [repo [{:id 10 :opts {:children? false}}
                                  {:id 11 :opts {:children? false}}]]]
                          @worker-requests))
                   (is (= [[:thread-api/get-block-parents repo 42 1000]]
                          @worker-calls))
                   (let [source (source-for "src/main/frontend/db/async.cljs")]
                     (is (not (string/includes? source "d/transact!"))
                         "Async block loaders should not hydrate a renderer DB.")
                     (is (not (string/includes? source (str "db/" "get-db graph false")))
                         "Async block loaders should not read the renderer DB conn.")
                     (is (not (string/includes? source (str "db/" "get-page name'")))
                         "Async block loading should not resolve page names through the renderer DB.")
                     (is (not (string/includes? source (str "db/" "entity [:block/uuid")))
                         "Async block loading should not resolve UUIDs through the renderer DB.")
                     (is (not (string/includes? source (str "(:block.temp/load-status (db/" "entity")))
                         "Async block loading should not depend on renderer load-status cache state.")))
                 (p/catch
                  (fn [error]
                    (is false (str error))))
                (p/finally done))))))

(deftest query-derived-helpers-return-worker-results-without-renderer-db-test
  (async done
         (let [repo "logseq_db_async_query_helpers_worker"
               asset {:db/id 100
                      :logseq.property.asset/checksum "checksum-a"
                      :block/title "asset"}
               older-history {:db/id 201
                              :block/created-at 10
                              :logseq.property.history/property {:db/ident :logseq.property/status}
                              :logseq.property.history/ref-value {:db/ident :logseq.property/status.doing}}
               newer-history {:db/id 202
                              :block/created-at 20
                              :logseq.property.history/property {:db/ident :logseq.property/status}
                              :logseq.property.history/ref-value {:db/ident :logseq.property/status.done}}
               query-calls (atom [])]
           (p/with-redefs [db-async/<q
                           (fn [repo' opts query & inputs]
                             (swap! query-calls conj [repo' opts query inputs])
                             (p/resolved
                              (case (first inputs)
                                "checksum-a" [asset]
                                42 [newer-history older-history])))]
             (-> (p/let [asset-result (db-async/<get-asset-with-checksum repo "checksum-a")
                         history-result (db-async/<get-block-properties-history repo 42)]
                   (is (= asset asset-result))
                   (is (= [older-history newer-history] history-result))
                   (is (= 2 (count @query-calls)))
                   (let [source (source-for "src/main/frontend/db/async.cljs")]
                     (is (not (string/includes? source (str "(some-> (first result)\n            :db/id\n            db/" "entity)")))
                         "Asset lookup should return the worker query result directly.")
                     (is (not (string/includes? source (str "(map (fn [b] (db/" "entity (:db/id b))))")))
                         "Property history lookup should not hydrate worker results from the renderer DB.")))
                 (p/catch
                  (fn [error]
                    (is false (str error))))
                (p/finally done))))))

(deftest get-block-summaries-preserves-request-order-test
  (let [block-a (random-uuid)
        block-b (random-uuid)
        parent-a 10
        parent-b 20
        rows [[2 block-b "b" parent-b]
              [1 block-a "a" parent-a]]]
    (is (= [{:db/id 1
             :block/uuid block-a
             :block/title "a"
             :block/parent {:db/id parent-a}}
            {:db/id 2
             :block/uuid block-b
             :block/title "b"
             :block/parent {:db/id parent-b}}]
           (#'db-async/order-block-summaries [block-a block-b] rows)))))

(deftest get-all-properties-uses-worker-without-renderer-db-model-test
  (async done
         (let [repo "logseq_db_async_properties_worker"
               worker-properties [{:db/id 1
                                   :db/ident :user.property/worker
                                   :block/title "worker property"}]
               worker-calls (atom [])]
           (p/with-redefs [state/get-current-repo (fn [] repo)
                           db-async/<get-all-properties-from-worker
                           (fn [repo' opts]
                             (swap! worker-calls conj [:thread-api/get-all-properties repo' opts])
                             (p/resolved worker-properties))]
             (-> (p/let [result (db-async/<get-all-properties {:remove-built-in-property? false})]
                   (is (= worker-properties result))
                   (is (= [[:thread-api/get-all-properties
                            repo
                            {:remove-built-in-property? false}]]
                          @worker-calls))
                   (let [source (source-for "src/main/frontend/db/async.cljs")]
                     (is (not (string/includes? source "db-model/get-all-properties"))
                         "Async property loading should not call the renderer DB model.")))
                 (p/catch
                  (fn [error]
                    (is false (str error))))
                 (p/finally done))))))

(deftest get-tag-objects-uses-worker-class-objects-without-renderer-db-model-test
  (async done
         (let [repo "logseq_db_async_tag_objects_worker"
               class-id 42
               worker-objects [{:db/id 100
                                :block/title "worker object"}]
               worker-calls (atom [])
               query-calls (atom [])]
           (p/with-redefs [db-async/<get-class-objects-from-worker
                           (fn [repo' class-id']
                             (swap! worker-calls conj [:thread-api/get-class-objects repo' class-id'])
                             (p/resolved worker-objects))
                           db-async/<q
                           (fn [repo' opts query & inputs]
                             (swap! query-calls conj [repo' opts query inputs])
                             (p/resolved ::renderer-query))]
             (-> (p/let [result (db-async/<get-tag-objects repo class-id)]
                   (is (= worker-objects result))
                   (is (= [[:thread-api/get-class-objects repo class-id]]
                          @worker-calls))
                   (is (empty? @query-calls)
                       "Tag object loading should use the worker class object API directly.")
                   (let [source (source-for "src/main/frontend/db/async.cljs")]
                     (is (not (string/includes? source "db-model/get-structured-children"))
                         "Tag object loading should not use the renderer DB model.")
                     (is (not (string/includes? source "class-ids (distinct (conj class-children class-id))"))
                         "Tag object loading should not assemble class ids in the renderer.")))
                 (p/catch
                  (fn [error]
                    (is false (str error))))
                 (p/finally done))))))

(deftest get-date-scheduled-or-deadlines-uses-worker-without-renderer-db-model-test
  (async done
         (let [repo "logseq_db_async_scheduled_deadline_worker"
               grouped-result {{:db/id 1} [{:db/id 10
                                            :block/title "task"}]}
               worker-calls (atom [])]
           (p/with-redefs [state/get-current-repo (fn [] repo)
                           state/get-scheduled-future-days (fn [] 3)
                           db-async/<get-date-scheduled-or-deadlines-from-worker
                           (fn [repo' start-time future-time]
                             (swap! worker-calls conj [repo' start-time future-time])
                             (p/resolved grouped-result))
                           db-model/sort-by-order-recursive
                           (fn [& _]
                             ::renderer-sort)]
             (-> (p/let [result (db-async/<get-date-scheduled-or-deadlines "2026-07-07")]
                   (is (= grouped-result result))
                   (is (= repo (ffirst @worker-calls)))
                   (is (every? number? (rest (first @worker-calls))))
                   (let [source (source-for "src/main/frontend/db/async.cljs")]
                     (is (not (string/includes? source "db-model/sort-by-order-recursive"))
                         "Scheduled/deadline loading should not sort through the renderer DB model.")
                     (is (not (string/includes? source "db-utils/group-by-page"))
                         "Scheduled/deadline loading should not group through renderer DB utils.")))
                 (p/catch
                  (fn [error]
                    (is false (str error))))
                 (p/finally done))))))
