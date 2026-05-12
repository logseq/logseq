(ns frontend.components.block.selection)

(defn select-on-hover?
  [{:keys [last-client-y client-y dragging? editing-same-block? active-selection?]}]
  (and (or (not= last-client-y client-y)
           active-selection?)
       (not dragging?)
       (not editing-same-block?)))
