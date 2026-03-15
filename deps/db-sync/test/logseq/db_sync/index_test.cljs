(ns logseq.db-sync.index-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [promesa.core :as p]))

(def ^:private graph-e2ee-migration-sql
  "alter table graphs add column graph_e2ee integer default 1")
(def ^:private graph-ready-for-use-migration-sql
  "alter table graphs add column graph_ready_for_use integer default 1")
(def ^:private graph-members-graph-id-created-at-index-sql
  "create index if not exists idx_graph_members_graph_id_created_at on graph_members (graph_id, created_at)")
(def ^:private graphs-user-id-updated-at-index-sql
  "create index if not exists idx_graphs_user_id_updated_at on graphs (user_id, updated_at desc)")
(def ^:private users-email-index-sql
  "create index if not exists idx_users_email on users (email)")

(deftest index-list-includes-graph-e2ee-flag-test
  (async done
         (let [rows #js [#js {"graph_id" "graph-1"
                              "graph_name" "Graph 1"
                              "schema_version" "65"
                              "role" "manager"
                              "invited_by" nil
                              "created_at" 10
                              "updated_at" 20
                              "graph_e2ee" 0}
                         #js {"graph_id" "graph-2"
                              "graph_name" "Graph 2"
                              "schema_version" "65"
                              "role" "member"
                              "invited_by" "u1"
                              "created_at" 11
                              "updated_at" 21
                              "graph_e2ee" 1
                              "graph_ready_for_use" 0}]]
           (-> (p/with-redefs [common/<d1-all (fn [& _]
                                                (p/resolved #js {:results rows}))
                               common/get-sql-rows (fn [result]
                                                     (aget result "results"))]
                 (index/<index-list :db "user-1"))
               (p/then (fn [graphs]
                         (is (= 2 (count graphs)))
                         (is (= false (:graph-e2ee? (first graphs))))
                         (is (= true (:graph-e2ee? (second graphs))))
                         (is (= true (:graph-ready-for-use? (first graphs))))
                         (is (= false (:graph-ready-for-use? (second graphs))))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest index-upsert-persists-graph-e2ee-flag-test
  (async done
         (let [called (atom nil)]
           (-> (p/with-redefs [common/now-ms (fn [] 1234)
                               common/<d1-run (fn [_db sql & args]
                                                (reset! called {:sql sql
                                                                :args args})
                                                (p/resolved {:ok true}))]
                 (index/<index-upsert! :db "graph-1" "Graph 1" "user-1" "65" false))
               (p/then (fn [_]
                         (is (string/includes? (:sql @called) "graph_e2ee"))
                         (is (= ["graph-1" "Graph 1" "user-1" "65" 0 1 1234 1234]
                                (:args @called)))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest index-upsert-persists-graph-ready-for-use-flag-test
  (async done
         (let [called (atom nil)]
           (-> (p/with-redefs [common/now-ms (fn [] 1234)
                               common/<d1-run (fn [_db sql & args]
                                                (reset! called {:sql sql
                                                                :args args})
                                                (p/resolved {:ok true}))]
                 (index/<index-upsert! :db "graph-1" "Graph 1" "user-1" "65" false false))
               (p/then (fn [_]
                         (is (string/includes? (:sql @called) "graph_ready_for_use"))
                         (is (= ["graph-1" "Graph 1" "user-1" "65" 0 0 1234 1234]
                                (:args @called)))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest index-init-runs-graph-e2ee-migration-test
  (async done
         (let [sql-calls (atom [])]
           (-> (p/with-redefs [common/<d1-all (fn [& _]
                                                (p/resolved #js {:results #js []}))
                               common/get-sql-rows (fn [result]
                                                     (aget result "results"))
                               common/<d1-run (fn [_db sql & _args]
                                                (swap! sql-calls conj (string/lower-case sql))
                                                (p/resolved {:ok true}))]
                 (index/<index-init! :db))
               (p/then (fn [_]
                         (is (some #(string/includes? % graph-e2ee-migration-sql)
                                   @sql-calls))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest index-init-runs-graph-ready-for-use-migration-test
  (async done
         (let [sql-calls (atom [])]
           (-> (p/with-redefs [common/<d1-all (fn [& _]
                                                (p/resolved #js {:results #js []}))
                               common/get-sql-rows (fn [result]
                                                     (aget result "results"))
                               common/<d1-run (fn [_db sql & _args]
                                                (swap! sql-calls conj (string/lower-case sql))
                                                (p/resolved {:ok true}))]
                 (index/<index-init! :db))
               (p/then (fn [_]
                         (is (some #(string/includes? % graph-ready-for-use-migration-sql)
                                   @sql-calls))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest index-init-ignores-duplicate-graph-e2ee-column-error-test
  (async done
         (let [sql-calls (atom [])]
           (-> (p/with-redefs [common/<d1-all (fn [& _]
                                                (p/resolved #js {:results #js []}))
                               common/get-sql-rows (fn [result]
                                                     (aget result "results"))
                               common/<d1-run (fn [_db sql & _args]
                                                (let [sql' (string/lower-case sql)]
                                                  (swap! sql-calls conj sql')
                                                  (if (string/includes? sql' graph-e2ee-migration-sql)
                                                    (p/rejected (ex-info "duplicate column name: graph_e2ee" {}))
                                                    (p/resolved {:ok true}))))]
                 (index/<index-init! :db))
               (p/then (fn [_]
                         (is (some #(string/includes? % graph-e2ee-migration-sql)
                                   @sql-calls))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest index-init-creates-indexes-test
  (async done
         (let [sql-calls (atom [])]
           (-> (p/with-redefs [common/<d1-all (fn [& _]
                                                (p/resolved #js {:results #js []}))
                               common/get-sql-rows (fn [result]
                                                     (aget result "results"))
                               common/<d1-run (fn [_db sql & _args]
                                                (swap! sql-calls conj (string/lower-case sql))
                                                (p/resolved {:ok true}))]
                 (index/<index-init! :db))
               (p/then (fn [_]
                         (is (some #(string/includes? % graph-members-graph-id-created-at-index-sql)
                                   @sql-calls))
                         (is (some #(string/includes? % graphs-user-id-updated-at-index-sql)
                                   @sql-calls))
                         (is (some #(string/includes? % users-email-index-sql)
                                   @sql-calls))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
