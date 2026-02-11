(ns frontend.components.repo-test
  (:require [cljs.test :refer [deftest is async]]
            [frontend.components.repo :as repo]
            [frontend.handler.repo :as repo-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(defn- ensure-rsa-key-fn
  []
  #'repo/ensure-e2ee-rsa-key-for-cloud!)

(deftest ensure-rsa-key-does-not-create-graph-test
  (async done
         (let [ensure-fn (ensure-rsa-key-fn)
               db-worker-ops (atom [])
               create-calls (atom 0)
               ensured-values (atom [])]
           (if-not ensure-fn
             (do
               (is false "missing ensure-e2ee-rsa-key-for-cloud!")
               (done))
             (-> (p/with-redefs [state/<invoke-db-worker
                                 (fn [op & _]
                                   (swap! db-worker-ops conj op)
                                   (if (= op :thread-api/db-sync-ensure-user-rsa-keys)
                                     (p/resolved {:public-key "pk"})
                                     (p/resolved nil)))
                                 repo-handler/new-db!
                                 (fn [& _]
                                   (swap! create-calls inc)
                                   (p/resolved "repo"))]
                   (ensure-fn {:cloud? true
                               :refresh-token "refresh"
                               :token "token"
                               :user-uuid "user-1"
                               :e2ee-rsa-key-ensured? false}
                              (fn [value]
                                (swap! ensured-values conj value))))
                 (p/then (fn [_]
                           (is (= [:thread-api/set-db-sync-config
                                   :thread-api/db-sync-ensure-user-rsa-keys]
                                  @db-worker-ops))
                           (is (= [true] @ensured-values))
                           (is (zero? @create-calls))
                           (done)))
                 (p/catch (fn [error]
                            (is false (str error))
                            (done))))))))

(deftest ensure-rsa-key-nil-result-does-not-create-graph-test
  (async done
         (let [ensure-fn (ensure-rsa-key-fn)
               db-worker-ops (atom [])
               create-calls (atom 0)
               ensured-values (atom [])]
           (if-not ensure-fn
             (do
               (is false "missing ensure-e2ee-rsa-key-for-cloud!")
               (done))
             (-> (p/with-redefs [state/<invoke-db-worker
                                 (fn [op & _]
                                   (swap! db-worker-ops conj op)
                                   (p/resolved nil))
                                 repo-handler/new-db!
                                 (fn [& _]
                                   (swap! create-calls inc)
                                   (p/resolved "repo"))]
                   (ensure-fn {:cloud? true
                               :refresh-token "refresh"
                               :token "token"
                               :user-uuid "user-1"
                               :e2ee-rsa-key-ensured? false}
                              (fn [value]
                                (swap! ensured-values conj value))))
                 (p/then (fn [_]
                           (is (= [:thread-api/set-db-sync-config
                                   :thread-api/db-sync-ensure-user-rsa-keys]
                                  @db-worker-ops))
                           (is (= [false] @ensured-values))
                           (is (zero? @create-calls))
                           (done)))
                 (p/catch (fn [error]
                            (is false (str error))
                            (done))))))))

(deftest ensure-rsa-key-skips-when-prerequisites-missing-test
  (async done
         (let [ensure-fn (ensure-rsa-key-fn)
               ensure-calls (atom 0)
               create-calls (atom 0)
               ensured-values (atom [])]
           (if-not ensure-fn
             (do
               (is false "missing ensure-e2ee-rsa-key-for-cloud!")
               (done))
             (-> (p/with-redefs [state/<invoke-db-worker
                                 (fn [& _]
                                   (swap! ensure-calls inc)
                                   (p/resolved {:public-key "pk"}))
                                 repo-handler/new-db!
                                 (fn [& _]
                                   (swap! create-calls inc)
                                   (p/resolved "repo"))]
                   (ensure-fn {:cloud? false
                               :refresh-token nil
                               :token nil
                               :user-uuid nil
                               :e2ee-rsa-key-ensured? false}
                              (fn [value]
                                (swap! ensured-values conj value))))
                 (p/then (fn [_]
                           (is (zero? @ensure-calls))
                           (is (empty? @ensured-values))
                           (is (zero? @create-calls))
                           (done)))
                 (p/catch (fn [error]
                            (is false (str error))
                            (done))))))))
