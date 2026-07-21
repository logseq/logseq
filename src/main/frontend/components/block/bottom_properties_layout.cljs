(ns frontend.components.block.bottom-properties-layout
  "Pure layout calculations for bottom-positioned property pills.")

(defn first-overflow-index
  "Returns the index of the first pill that exceeds `available-width`.

  `pill-widths` contains natural widths in display order. `gap` is applied
  between adjacent pills. Returns `nil` when every pill fits."
  [pill-widths gap available-width]
  (loop [widths pill-widths
         accumulated-width 0
         idx 0]
    (when-let [width (first widths)]
      (let [next-width (+ accumulated-width width (if (zero? idx) 0 gap))]
        (if (> next-width available-width)
          idx
          (recur (rest widths) next-width (inc idx)))))))
