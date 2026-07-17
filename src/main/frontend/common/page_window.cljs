(ns frontend.common.page-window)

(def limit 60)

(defn refresh-opts
  [{:keys [offset rows total-count]}]
  (if (and (number? total-count)
           (>= (+ (or offset 0) (count rows)) total-count))
    {:anchor :bottom}
    {:offset (or offset 0)}))
