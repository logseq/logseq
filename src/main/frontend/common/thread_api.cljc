(ns frontend.common.thread-api
  "Macro for defining thread apis, which is invokeable by other threads"
  #?(:cljs (:require-macros [frontend.common.thread-api]))
  #?(:cljs (:require [logseq.db :as ldb]
                     [promesa.core :as p]
                     [lambdaisland.glogi :as log])))

#?(:cljs
   (def *thread-apis (volatile! {})))

#_{:clojure-lsp/ignore [:clojure-lsp/unused-public-var]}
(defmacro defkeyword [& _args])

(defmacro def-thread-api
  "Define a api invokeable by other threads.
  e.g. (def-thread-api :thread-api/a-api [arg1 arg2] body)"
  [qualified-keyword-name params & body]
  (assert (= "thread-api" (namespace qualified-keyword-name)) qualified-keyword-name)
  (assert (vector? params) params)
  `(vswap! *thread-apis assoc
           ~qualified-keyword-name
           (fn ~(symbol (str "thread-api--" (name qualified-keyword-name))) ~params ~@body)))

#?(:cljs (def *profile (volatile! {})))

#?(:cljs (defonce ^:private *worker-thread-api-call-id (atom 0)))

#?(:cljs
   (defn- log-worker-thread-api-call!
     [data]
     (when (and goog.DEBUG (> (:total-ms data) 10))
       (log/info :db-worker/thread-api-handler data))))

#?(:cljs
   (defn- write-transit-str-with-catch
     [v qualified-kw-str]
     (try
       (ldb/write-transit-str v)
       (catch :default e
         (log/error :thread-api-write-transit-failed qualified-kw-str)
         (throw e)))))

#?(:cljs
   (defn remote-function
     "Return a promise whose value is transit-str."
     [qualified-kw-str args-transit-str]
     (let [qkw (keyword qualified-kw-str)
           call-id (swap! *worker-thread-api-call-id inc)
           started-at (.now js/performance)]
       (vswap! *profile update qkw inc)
       (if-let [f (@*thread-apis qkw)]
         (let [args (ldb/read-transit-str args-transit-str)
               handler-started-at (.now js/performance)]
           (try
             (let [result-promise (apply f args)]
               (->
                (p/let [result result-promise
                        handler-completed-at (.now js/performance)
                        result-transit-str (write-transit-str-with-catch result qualified-kw-str)
                        completed-at (.now js/performance)]
                  (log-worker-thread-api-call!
                   {:worker-call-id call-id
                    :api qkw
                    :status :ok
                    :deserialize-ms (- handler-started-at started-at)
                    :handler-ms (- handler-completed-at handler-started-at)
                    :serialize-ms (- completed-at handler-completed-at)
                    :total-ms (- completed-at started-at)})
                  result-transit-str)
                (p/catch
                 (fn [error]
                   (let [handler-completed-at (.now js/performance)
                         error-transit-str (write-transit-str-with-catch error qualified-kw-str)
                         completed-at (.now js/performance)]
                     (log-worker-thread-api-call!
                      {:worker-call-id call-id
                       :api qkw
                       :status :error
                       :deserialize-ms (- handler-started-at started-at)
                       :handler-ms (- handler-completed-at handler-started-at)
                       :serialize-ms (- completed-at handler-completed-at)
                       :total-ms (- completed-at started-at)})
                     error-transit-str)))))
             (catch :default error
               (log-worker-thread-api-call!
                {:worker-call-id call-id
                 :api qkw
                 :status :error
                 :deserialize-ms (- handler-started-at started-at)
                 :handler-ms (- (.now js/performance) handler-started-at)
                 :serialize-ms 0
                 :total-ms (- (.now js/performance) started-at)})
               (throw error))))
         (throw (ex-info (str "not found thread-api: " qualified-kw-str) {}))))))
