(ns frontend.components.journal-state)

(defn slot-mounted?
  [intersecting? focused? mounted?]
  (or focused?
      (and intersecting? mounted?)))
