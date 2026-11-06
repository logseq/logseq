(ns frontend.common.thread-api
  "Macro for defining thread apis, which is invokeable by other threads"
  #?(:cljs (:require-macros [frontend.common.thread-api]))
  #?(:cljs (:require [logseq.db :as ldb]
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
   (defonce ^:private *opening-graphs
     ;; repo -> promise that settles when its :thread-api/create-or-open-db call does
     (atom {})))

#?(:cljs
   (def ^:private graph-open-wait-ms
     "How long a call for a graph that is being opened waits for the open before it runs anyway."
     30000))

#?(:cljs
   (defn- call-with-graph-open-gate
     "Applies a thread api. After a reload the renderer sends calls for the current graph (reads for the page it
     renders, search, the graph view) right behind the call that opens it; the worker would run them on a graph that
     has no conn yet. So :thread-api/create-or-open-db marks its repo as opening until it settles, and a call whose
     first argument is a repo being opened waits for that first (at most graph-open-wait-ms)."
     [qkw f args]
     (let [repo (first args)]
       (cond
         (and (= qkw :thread-api/create-or-open-db) (string? repo))
         (let [result (apply f args)
               settled (-> (p/promise result)
                           (p/then (constantly nil))
                           (p/catch (constantly nil)))
               ;; what waiting calls wait for: the open settling, or graph-open-wait-ms, whichever comes first;
               ;; one timer per open, cleared when the open settles
               released (p/create
                         (fn [resolve _reject]
                           (let [timer (js/setTimeout #(resolve nil) graph-open-wait-ms)]
                             (p/finally settled (fn [] (js/clearTimeout timer) (resolve nil))))))]
           (swap! *opening-graphs assoc repo released)
           (p/finally released
                      (fn [] (swap! *opening-graphs (fn [m] (cond-> m (identical? (get m repo) released) (dissoc repo))))))
           result)

         (and (string? repo) (get @*opening-graphs repo))
         (p/let [_ (get @*opening-graphs repo)]
           (apply f args))

         :else
         (apply f args)))))

#?(:cljs
   (defn remote-function
     "Return a promise whose value is a transit string."
     [qualified-kw-str args-transit-str]
     (let [qkw (keyword qualified-kw-str)
           call-id (swap! *worker-thread-api-call-id inc)
           started-at (.now js/performance)]
       (vswap! *profile update qkw inc)
       (if-let [f (@*thread-apis qkw)]
         (let [args (ldb/read-transit-str args-transit-str)
               handler-started-at (.now js/performance)]
           (try
             (let [result-promise (call-with-graph-open-gate qkw f args)]
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
