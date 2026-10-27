(ns frontend.common.thread-api-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.common.thread-api :as thread-api]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def ^:private repo "logseq_db_thread-api-gate-test")

(defn- call [api & args]
  (p/let [result (thread-api/remote-function (subs (str api) 1) (ldb/write-transit-str (vec args)))]
    (ldb/read-transit-str result)))

(defn- with-thread-apis
  "Runs (f) with these thread apis registered, restoring the previous ones afterwards."
  [apis f]
  (let [previous (select-keys @thread-api/*thread-apis (keys apis))]
    (vswap! thread-api/*thread-apis merge apis)
    (p/finally (f)
               (fn []
                 (vswap! thread-api/*thread-apis #(merge (apply dissoc % (keys apis)) previous))))))

(deftest a-call-sent-behind-the-graph-open-runs-after-it-test
  (async done
         (let [opened? (atom false)]
           (-> (with-thread-apis
                 {:thread-api/create-or-open-db (fn [_repo _opts]
                                                  (p/let [_ (p/delay 50)]
                                                    (reset! opened? true)
                                                    {:schema {}}))
                  :thread-api/gate-test-read (fn [_repo] @opened?)}
                 (fn []
                   ;; sent in this order, as the renderer does right after a reload
                   (let [open (call :thread-api/create-or-open-db repo {})
                         read (call :thread-api/gate-test-read repo)]
                     (p/let [read-result read
                             _ open]
                       (is (true? read-result) "the read ran on the opened graph, not before it")))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest calls-for-other-graphs-and-after-the-open-do-not-wait-test
  (async done
         (let [opened? (atom false)]
           (-> (with-thread-apis
                 {:thread-api/create-or-open-db (fn [_repo _opts]
                                                  (p/let [_ (p/delay 200)]
                                                    (reset! opened? true)
                                                    {:schema {}}))
                  :thread-api/gate-test-read (fn [_repo] @opened?)}
                 (fn []
                   (let [open (call :thread-api/create-or-open-db repo {})]
                     (p/let [other (call :thread-api/gate-test-read "logseq_db_another-graph")
                             _ open
                             after (call :thread-api/gate-test-read repo)]
                       (is (false? other) "a call for another graph runs at once")
                       (is (true? after) "a call after the open runs normally")))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest a-failed-open-releases-its-waiters-test
  (async done
         (let [read-ran? (atom false)]
           (-> (with-thread-apis
                 {:thread-api/create-or-open-db (fn [_repo _opts]
                                                  (p/let [_ (p/delay 50)]
                                                    (throw (ex-info "open failed" {}))))
                  :thread-api/gate-test-read (fn [_repo] (reset! read-ran? true) :ran)}
                 (fn []
                   (let [open (-> (call :thread-api/create-or-open-db repo {}) (p/catch (fn [_] :open-failed)))]
                     (p/let [read-result (call :thread-api/gate-test-read repo)
                             _ open]
                       (is (true? @read-ran?) "the read still runs after a failed open")
                       (is (= :ran read-result))))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))
