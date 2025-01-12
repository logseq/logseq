(ns frontend.handler.profiler
  "Provides fns for profiling.
  TODO: support both main thread and worker thread."
  (:require [clojure.string :as string]
            [goog.object :as g]))

(def ^:private *fn-symbol->key->call-count (volatile! {}))
(def ^:private *fn-symbol->key->time-sum (volatile! {}))

(def *fn-symbol->origin-fn (atom {}))

(defn- get-profile-fn
  [fn-sym original-fn]
  (fn profile-fn-inner [& args]
    (let [start (system-time)
          r (apply original-fn args)
          elapsed-time (- (system-time) start)]
      (vswap! *fn-symbol->key->call-count update-in [fn-sym :total] inc)
      (vswap! *fn-symbol->key->time-sum update-in [fn-sym :total] #(+ % elapsed-time))
      r)))

(defn- replace-fn-helper!
  [ns munged-name fn-sym original-fn-obj]
  (let [ns-obj (find-ns-obj ns)
        obj-cljs-keys (filter #(string/starts-with? % "cljs$") (js-keys original-fn-obj))]
    (g/set ns-obj munged-name (get-profile-fn fn-sym original-fn-obj))
    (let [new-obj (find-ns-obj (str ns "." munged-name))]
      (doseq [k obj-cljs-keys]
        (g/set new-obj k (g/get original-fn-obj k))))))

(defn register-fn!
  [fn-sym & {:as _opts}]
  (assert (qualified-symbol? fn-sym))
  (let [ns (namespace fn-sym)
        s (munge (name fn-sym))]
    (if-let [original-fn (find-ns-obj (str ns "." s))]
      (do (replace-fn-helper! ns s fn-sym original-fn)
          (swap! *fn-symbol->origin-fn assoc fn-sym original-fn))
      (throw (ex-info (str "fn-sym not found: " fn-sym) {})))))

(defn unregister-fn!
  [fn-sym]
  (let [ns (namespace fn-sym)
        s (munge (name fn-sym))]
    (vswap! *fn-symbol->key->call-count dissoc fn-sym)
    (vswap! *fn-symbol->key->time-sum dissoc fn-sym)
    (when-let [origin-fn (get @*fn-symbol->origin-fn fn-sym)]
      (some-> (find-ns-obj ns) (g/set s origin-fn))
      (swap! *fn-symbol->origin-fn dissoc fn-sym))))

(defn reset-report!
  []
  (vreset! *fn-symbol->key->call-count {})
  (vreset! *fn-symbol->key->time-sum {}))

(defn profile-report
  []
  {:call-count @*fn-symbol->key->call-count
   :time-sum @*fn-symbol->key->time-sum})

(comment
  (register-fn! 'datascript.core/entity)
  (prn :profiling (keys @*fn-symbol->origin-fn))
  (prn :report)
  (pprint/pprint (profile-report))
  (reset-report!)
  (unregister-fn! 'datascript.core/entity))

(comment
  ;; test multi-arity, variadic fn
  (defn test-fn-to-profile
    ([] 1)
    ([_a] 2)
    ([_a & _args] 3)))
