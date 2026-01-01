(ns hooks.path-invalid-construct
  "This hook try to find out those error-prone path construction expressions:
  - (string/join \"/\" [...])"
  (:require [clj-kondo.hooks-api :as api]))


(defn string-join
  [{:keys [node]}]
  (let [[_ sep-v & _args] (:children node)]
    (when (and (api/string-node? sep-v)
               (= ["/"] (:lines sep-v)))
      (api/reg-finding! (assoc (meta node)
                               :message "don't use clojure.string/join to build a path, (use #_{:clj-kondo/ignore [:path-invalid-construct/string-join]} to ignore)"
                               :type :path-invalid-construct/string-join)))))
