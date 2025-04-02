(ns frontend.common.cache
  "Utils about cache"
  (:require [cljs.cache :as cache]))

(defn cache-fn
  "Return a cached verison of `f`.
  cache-key&f-args-fn: return [<cache-key> <args-list-to-f>]"
  [*cache cache-key&f-args-fn f]
  (fn [& args]
    (let [[cache-k f-args] (apply cache-key&f-args-fn args)
          through-value-fn #(apply f f-args)
          cache (vreset! *cache (cache/through through-value-fn @*cache cache-k))]
      (cache/lookup cache cache-k))))
