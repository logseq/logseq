(ns frontend.common.missionary
  "Utils based on missionary. Used by frontend and worker namespaces"
  (:require-macros [frontend.common.missionary])
  (:require [cljs.core.async.impl.channels]
            [clojure.core.async :as a]
            [lambdaisland.glogi :as log]
            [missionary.core :as m]
            [promesa.protocols :as pt])
  (:import [missionary Cancelled]))

(extend-type Cancelled
  IPrintWithWriter
  (-pr-writer [o w _opts]
    (write-all w "#missionary.Cancelled \"" (.-message o) "\"")))

(defn continue-flow
  "ensure f is a continuous flow"
  ([f] (continue-flow nil f))
  ([init-value f]
   (->> f
        (m/reductions {} init-value)
        (m/latest identity))))

(def delays (reductions * 1000 (repeat 2)))

(def ^:private retry-sentinel (js-obj))
(defn backoff
  "Retry task when it throw exception `(get ex-data :missionary/retry)`"
  [delays-seq task]
  (m/sp
    (loop [[delay & rest-delays] (seq delays-seq)]
      (let [r (try
                (m/? task)
                (catch :default e
                  (if (and (some-> e ex-data :missionary/retry)
                           (pos-int? delay))
                    (do (m/? (m/sleep delay))
                        (println :missionary/retry "after" delay "ms (" (ex-message e) ")")
                        retry-sentinel)
                    (throw e))))]
        (if (identical? r retry-sentinel)
          (recur rest-delays)
          r)))))

(defn mix
  "Return a flow which is mixed by `flows`"
  [& flows]
  (m/ap (m/?> (m/?> (count flows) (m/seed flows)))))

(defn clock
  "Return a flow that emits `value` every `interval-ms`."
  ([interval-ms]
   (clock interval-ms nil))
  ([interval-ms value]
   (->>
    (m/ap
      (loop []
        (m/amb
         (m/? (m/sleep interval-ms value))
         (recur))))
    (continue-flow value))))

(defn concurrent-exec-flow
  "Return a flow.
  Concurrent exec `f` on `flow` with max concurrent count `par`.
  - `(f v)` return a task.
  - `v` is value from `flow`"
  [par flow f]
  (assert (pos-int? par))
  (m/ap
    (let [v (m/?> par flow)]
      (m/? (f v)))))

(defn debounce
  [duration-ms flow]
  (m/ap
    (let [x (m/?< flow)]
      (try (m/? (m/sleep duration-ms x))
           (catch Cancelled _
             (m/amb))))))

(defn throttle
  [dur-ms >in]
  (m/ap
    (let [x (m/?> (m/relieve {} >in))]
      (m/amb x (do (m/? (m/sleep dur-ms)) (m/amb))))))

(defn run-task
  "Return the canceler"
  [task key & {:keys [succ fail]}]
  (task (or succ #(log/info :key key :succ %)) (or fail #(log/info :key key :stopped %))))

(defn run-task-throw
  [task key & {:keys [succ]}]
  (task (or succ #(log/info :key key :succ %)) #(throw (ex-info "task stopped" {:key key :e %}))))

(defonce ^:private *background-task-cancelers ; key -> canceler
  (volatile! {}))

(defn run-background-task
  "Run task.
  Cancel last same key background-task if exists(to avoid: reload cljs then run multiple same tasks)"
  [key' task]
  (when-let [canceler (get @*background-task-cancelers key')]
    (canceler)
    (vswap! *background-task-cancelers assoc key' nil))
  (prn :run-background-task key')
  (let [canceler (run-task task key')]
    (vswap! *background-task-cancelers assoc key' canceler)
    nil))

(defn background-task-running?
  [key']
  (contains? @*background-task-cancelers key'))

(comment
  (defn >!
    "Return a task that
  puts given value on given channel,
  completing with true when put is accepted, or false if port was closed."
    [c x] (doto (m/dfv) (->> (a/put! c x)))))

(comment
  (defn await-promise
    "Returns a task completing with the result of given promise"
    [p]
    (let [v (m/dfv)]
      (.then p #(v (fn [] %)) #(v (fn [] (throw %))))
      (m/absolve v))))

(defn <!
  "Return a task.
  if arg is a channel, takes from given channel, completing with value when take is accepted, or nil if port was closed.
  if arg is a promise, completing with the result of given promise.
  if arg is a missionary task, just return it"
  [chan-or-promise-or-task]
  (cond
    ;; async
    (instance? cljs.core.async.impl.channels/ManyToManyChannel chan-or-promise-or-task)
    (doto (m/dfv) (->> (a/take! chan-or-promise-or-task)))

    ;; promise
    (or (instance? js/Promise chan-or-promise-or-task)
        (satisfies? pt/IPromise chan-or-promise-or-task))
    (let [v (m/dfv)]
      (.then chan-or-promise-or-task #(v (fn [] %)) #(v (fn [] (throw %))))
      (m/absolve v))

    ;; missionary task
    (fn? chan-or-promise-or-task)
    chan-or-promise-or-task

    (nil? chan-or-promise-or-task)
    (m/sp)

    :else
    (throw (ex-info "Unsupported arg" {:type (type chan-or-promise-or-task)}))))
