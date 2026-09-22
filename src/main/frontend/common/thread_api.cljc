(ns frontend.common.thread-api
  "Macro for defining thread apis, which is invokeable by other threads"
  #?(:cljs (:require-macros [frontend.common.thread-api]))
  #?(:cljs (:require [goog.object :as gobj]
                     [logseq.db :as ldb]
                     [promesa.core :as p]
                     [lambdaisland.glogi :as log])))

#?(:cljs
   (def *thread-apis (volatile! {})))

#?(:cljs (def *profile (volatile! {})))

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
   (defn- ocaml-db-worker
     "The OCaml db-worker API (deps/db-worker CommonJS bundle, loaded as
     `globalThis.LogseqDbWorker`) when it implements `qualified-kw-str`.
     Its `invoke` resolves to a transit string honoring the same wire
     contract as this ns: a plain result, or a handler error encoded as
     the tagged `error`/`js/Error` transit values that `read-transit-str`
     decodes back into ExceptionInfo/js/Error."
     [qualified-kw-str]
     (when-let [ocaml-worker (gobj/get js/globalThis "LogseqDbWorker")]
       (when (.registered ocaml-worker qualified-kw-str)
         ocaml-worker))))

#?(:cljs
   (defn ocaml-registered?
     "true when the optional OCaml db-worker claims `qualified-kw-str`."
     [qualified-kw-str]
     (some? (ocaml-db-worker qualified-kw-str))))

#?(:cljs
   (defn <ocaml-invoke
     "Invoke the OCaml db-worker `qualified-kw-str` with decoded `args`.
     Resolves to the decoded result; rejects with the decoded error when the
     reply is a tagged `error`/`js/Error` transit value — the same contract
     as calling a cljs thread-api fn directly. Throws synchronously when the
     OCaml worker does not claim the endpoint."
     [qualified-kw-str args]
     (let [ocaml-worker (or (ocaml-db-worker qualified-kw-str)
                            (throw (ex-info (str "not registered on OCaml db-worker: "
                                                 qualified-kw-str)
                                            {:thread-api qualified-kw-str})))]
       (-> (.invoke ocaml-worker qualified-kw-str (ldb/write-transit-str args))
           (p/then (fn [transit-str]
                     (let [result (ldb/read-transit-str transit-str)]
                       (when (or (instance? ExceptionInfo result)
                                 (instance? js/Error result))
                         (throw result))
                       result)))))))

#?(:cljs
   (defn remote-function
     "Return a promise whose value is a transit string."
     [qualified-kw-str args-transit-str]
     (let [qkw (keyword qualified-kw-str)
           call-id (swap! *worker-thread-api-call-id inc)
           started-at (.now js/performance)]
       (vswap! *profile update qkw inc)
       (if-let [ocaml-worker (ocaml-db-worker qualified-kw-str)]
         (.invoke ocaml-worker qualified-kw-str args-transit-str)
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
           (throw (ex-info (str "not found thread-api: " qualified-kw-str) {})))))))
