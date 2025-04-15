(ns frontend.common.cache
  "Utils about cache"
  (:require [cljs.cache :as cache]))

#_{:clj-kondo/ignore [:clojure-lsp/unused-public-var]}
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
