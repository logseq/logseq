(ns logseq.db-sync.snapshot-import-test
  (:require [cljs.test :refer [deftest is async]]
            [clojure.string :as string]
            [logseq.db-sync.snapshot :as snapshot]
            [logseq.db-sync.worker :as worker]
            [promesa.core :as p]))

(defn- make-sql [state]
  #js {:exec (fn [sql & _args]
               (swap! state update :executed conj sql)
               nil)})

(defn- make-stream [chunk]
  (js/ReadableStream.
   #js {:start (fn [controller]
                 (.enqueue controller chunk)
                 (.close controller))}))

(deftest snapshot-import-failure-does-not-touch-kvs-test
  (async done
         (let [state (atom {:executed []})
               sql (make-sql state)
               self (doto (js-obj)
                      (aset "sql" sql))]
           (-> (with-redefs [snapshot/parse-framed-chunk (fn [_ _]
                                                           (throw (ex-info "boom" {})))]
                 (-> (p/then (#'worker/import-snapshot-stream!
                              self
                              (make-stream (js/Uint8Array. #js [1 2 3]))
                              true)
                             (fn [_]
                               (is false "expected import to fail")
                               nil))
                     (p/catch (fn [_]
                                (let [sqls (:executed @state)]
                                  (is (some #(string/includes? % "drop table if exists kvs_import") sqls))
                                  (is (not-any? #(string/includes? % "insert into kvs ") sqls))
                                  (is (not-any? #(string/includes? % "delete from kvs") sqls)))
                                nil))))
               (p/finally (fn [] (done)))))))
