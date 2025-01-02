(ns frontend.handler.profiler
  "Provides fns for profiling.
  TODO: support both main thread and worker thread."
  (:require [clojure.pprint :as pprint]
            [goog.object :as g]))

(def ^:private *fn-symbol->key->call-count (volatile! {}))
(def ^:private *fn-symbol->key->time-sum (volatile! {}))
(def ^:private *fn-symbol->origin-fn (volatile! {}))

(defn- get-profile-fn
  [fn-sym original-fn custom-key-fn]
  (fn profile-fn-inner [& args]
    (let [start (cljs.core/system-time)
          r (apply original-fn args)
          elapsed-time (- (cljs.core/system-time) start)
          k (when custom-key-fn (custom-key-fn r))]
      (vswap! *fn-symbol->key->call-count update-in [fn-sym :total] inc)
      (vswap! *fn-symbol->key->time-sum update-in [fn-sym :total] #(+ % elapsed-time))
      (when k
        (vswap! *fn-symbol->key->call-count update-in [fn-sym k] inc)
        (vswap! *fn-symbol->key->time-sum update-in [fn-sym k] #(+ % elapsed-time)))
      r)))

(defn register-fn!
  [fn-sym & {:keys [custom-key-fn] :as _opts}]
  (assert (qualified-symbol? fn-sym))
  (let [ns (namespace fn-sym)
        s (munge (name fn-sym))]
    (if-let [original-fn (find-ns-obj (str ns "." s))]
      (let [profiled-fn (get-profile-fn fn-sym original-fn custom-key-fn)]
        (vswap! *fn-symbol->origin-fn assoc fn-sym original-fn)
        (g/set (find-ns-obj ns) s profiled-fn))
      (throw (ex-info (str "fn-sym not found: " fn-sym) {})))))

(defn unregister-fn!
  [fn-sym]
  (let [ns (namespace fn-sym)
        s (munge (name fn-sym))]
    (vswap! *fn-symbol->key->call-count dissoc fn-sym)
    (vswap! *fn-symbol->key->time-sum dissoc fn-sym)
    (when-let [origin-fn (get @*fn-symbol->origin-fn fn-sym)]
      (some-> (find-ns-obj ns) (g/set s origin-fn)))
    (vswap! *fn-symbol->origin-fn dissoc fn-sym)))

;;;

(defn reset-report!
  []
  (vreset! *fn-symbol->key->call-count {})
  (vreset! *fn-symbol->key->time-sum {}))

(defn get-profiling-fns
  []
  (keys @*fn-symbol->origin-fn))

(defn profile-report
  []
  {:call-count @*fn-symbol->key->call-count
   :time-sum @*fn-symbol->key->time-sum})


(comment
  (register-fn! 'datascript.core/entity)
  (prn :profiling (get-profiling-fns))
  (prn :report)
  (pprint/pprint (profile-report))
  (reset-report!)
  (unregister-fn! 'datascript.core/entity))
