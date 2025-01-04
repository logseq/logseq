(ns logseq.common.profile
  "Utils for profiling")

(defmacro profile-fn!
  [f & {:keys [print-on-call? gen-k-fn]
        :or {print-on-call? true}}]
  `(let [origin-f# ~f
         gen-k-fn# (or ~gen-k-fn (constantly (keyword ~f)))]
     (set! ~f (fn [& args#]
                (let [start# (cljs.core/system-time)
                      r# (apply origin-f# args#)
                      end# (cljs.core/system-time)
                      k# (gen-k-fn# r#)]
                  (vswap! *key->call-count update k# inc)
                  (vswap! *key->time-sum update k# #(+ % (- end# start#)))
                  (when ~print-on-call?
                    (println "call-count:" (get @*key->call-count k#) "time-sum(ms):" (get @*key->time-sum k#)))
                  r#)))))
