(ns frontend.handler.profiler
  "Provides fns for profiling.
  TODO: support both main thread and worker thread."
  (:require-macros [frontend.handler.profiler :refer [arity-n-fn]])
  (:require [frontend.context.i18n :refer [t]]
            [frontend.handler.notification :as notification]
            [goog.object :as g]))

(def ^:private *fn-symbol->key->call-count (volatile! {}))
(def ^:private *fn-symbol->key->time-sum (volatile! {}))

(def *fn-symbol->origin-fn (atom {}))

(def ^:private arity-pattern #"cljs\$core\$IFn\$_invoke\$arity\$([0-9]+)")

(defn- get-profile-fn
  [fn-sym original-fn custom-key-fn]
  (let [arity-ns (keep #(some-> (re-find arity-pattern %) second parse-long) (g/getKeys original-fn))
        f (fn profile-fn-inner [& args]
            (let [start (system-time)
                  r (apply original-fn args)
                  elapsed-time (- (system-time) start)
                  k (when custom-key-fn (custom-key-fn args r))]
              (vswap! *fn-symbol->key->call-count update-in [fn-sym :total] inc)
              (vswap! *fn-symbol->key->time-sum update-in [fn-sym :total] #(+ % elapsed-time))
              (when k
                (vswap! *fn-symbol->key->call-count update-in [fn-sym k] inc)
                (vswap! *fn-symbol->key->time-sum update-in [fn-sym k] #(+ % elapsed-time)))
              r))
        arity-n-fns (arity-n-fn 20 f)]
    (doseq [n arity-ns]
      (g/set f (str "cljs$core$IFn$_invoke$arity$" n) (nth arity-n-fns n)))
    f))

(defn- replace-fn-helper!
  [ns munged-name fn-sym original-fn-obj custom-key-fn]
  (let [ns-obj (find-ns-obj ns)
        profile-fn (get-profile-fn fn-sym original-fn-obj custom-key-fn)]
    (g/set ns-obj munged-name profile-fn)))

(defn register-fn!
  "(custom-key-fn args-seq result) return non-nil key"
  [fn-sym & {:keys [custom-key-fn] :as _opts}]
  (when-not (qualified-symbol? fn-sym)
    (throw (ex-info (str "fn-sym must be a qualified symbol: " fn-sym)
                    {:fn-sym fn-sym :reason :unqualified})))
  (let [ns (namespace fn-sym)
        s (munge (name fn-sym))]
    (if-let [original-fn (find-ns-obj (str ns "." s))]
      (do (replace-fn-helper! ns s fn-sym original-fn custom-key-fn)
          (swap! *fn-symbol->origin-fn assoc fn-sym original-fn))
      (throw (ex-info (str "fn-sym not found: " fn-sym)
                      {:fn-sym fn-sym :reason :not-found})))))

(defn register-fn-from-ui!
  "Register fn-sym from the Profiler UI. Invalid names notify and do not throw."
  [fn-sym]
  (try
    (register-fn! fn-sym)
    (catch :default e
      (notification/show!
       (case (:reason (ex-data e))
         :unqualified (t :profiler/fn-unqualified-error)
         :not-found (t :profiler/fn-not-found-error (str fn-sym))
         (or (ex-message e) (.-message e) (str e)))
       :error)
      nil)))

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

(def ^:private *ref-hash->coll-size (volatile! {}))
(def ^:private *ref-hash->watches-count (volatile! {}))
(def ^:private *ref-hash->ref (volatile! {}))

(defn mem-leak-detect
  "Add monitor on Atom/Volatile.
  Show atoms/volatiles contains huge collections.
  Show atoms have a huge number of watchers"
  [& {:keys [data-count-threshold watches-count-threshold]
      :or {data-count-threshold 5000 watches-count-threshold 1000}}]
  (register-fn! 'cljs.core/reset!
                :custom-key-fn (fn [[ref _] newval]
                                 (let [coll-size (and (coll? newval) (count newval))
                                       *ref-hash (delay (hash ref))]
                                   (when (> coll-size data-count-threshold)
                                     (vswap! *ref-hash->coll-size assoc @*ref-hash coll-size)
                                     (vswap! *ref-hash->ref assoc @*ref-hash ref))
                                   (let [watches-count (count (.-watches ^js ref))]
                                     (when (> watches-count watches-count-threshold)
                                       (vswap! *ref-hash->watches-count assoc @*ref-hash watches-count)
                                       (vswap! *ref-hash->ref assoc @*ref-hash ref))))))
  (register-fn! 'cljs.core/vreset!
                :custom-key-fn (fn [[ref _] newval]
                                 (let [coll-size (and (coll? newval) (count newval))
                                       *ref-hash (delay (hash ref))]
                                   (when (> coll-size data-count-threshold)
                                     (vswap! *ref-hash->coll-size assoc @*ref-hash coll-size)
                                     (vswap! *ref-hash->ref assoc @*ref-hash ref))))))

(defn mem-leak-report
  []
  {:ref-hash->coll-size @*ref-hash->coll-size
   :ref-hash->watches-count @*ref-hash->watches-count
   :ref-hash->ref @*ref-hash->ref})

(comment
  (register-fn! 'frontend.handler.profiler/test-fn-to-profile)
  (prn :profiling (keys @*fn-symbol->origin-fn))
  (prn :report)
  (pprint/pprint (profile-report))
  (reset-report!)
  (unregister-fn! 'frontend.handler.profiler/test-fn-to-profile))

(comment
  ;; test multi-arity, variadic fn
  (defn test-fn-to-profile
    ([a b] 1)
    ([b c d] 2))

  (register-fn! 'frontend.handler.profiler/test-fn-to-profile
                :custom-key-fn (fn [args result] {:a args :r result}))

  (mem-leak-detect)
  [@*ref-hash->coll-size @*ref-hash->watches-count])
