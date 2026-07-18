(ns frontend.components.journal-state)

(defn slot-load-now?
  [visible? focused?]
  (or visible? focused?))
