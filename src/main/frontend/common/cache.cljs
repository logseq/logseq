(ns frontend.common.cache
  "Utils about cache"
  (:require [cljs.cache :as cache]
            [tailrecursion.priority-map :as priority-map]))

(defn empty-lru
  "An empty LRU cache of `limit` entries. cache/lru-cache-factory seeds its
  eviction queue with `limit` placeholder entries (a priority map built at
  load: 20000 of them took about 120 ms of an app open); the cache evicts by
  the queue's real size (`miss` evicts once it holds `limit` entries), so an
  empty queue holds, hits and evicts the same entries."
  [limit]
  (cache/->LRUCache {} (priority-map/priority-map) 0 limit))

;; (def *profile (volatile! {}))

(defn cache-fn
  "Return a cached version of `f`.
  cache-key&f-args-fn: return [<cache-key> <args-list-to-f>]"
  [*cache cache-key&f-args-fn f]
  (fn [& args]
    (let [[cache-k f-args] (apply cache-key&f-args-fn args)
          through-value-fn #(apply f f-args)
          ;; hit? (cache/has? @*cache cache-k)
          ;; _ (vswap! *profile update-in [[*cache (.-limit ^js @*cache)] (if hit? :hit :miss)] inc)
          ;; _ (prn (if hit? :hit :miss) cache-k)
          cache (vreset! *cache (cache/through through-value-fn @*cache cache-k))]
      (cache/lookup cache cache-k))))
