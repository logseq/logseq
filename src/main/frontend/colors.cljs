(ns frontend.colors
  "Colors used")

(def color-list [:tomato :red :crimson :pink :plum :purple :violet :indigo :blue :cyan :teal :green :grass :orange])
;(def color-list [:tomato :red :blue])

(defn variable
  ; ([value])
  ([color value] (variable color value false))
  ([color value alpha?]
   (str "var(--rx-" (name color) "-" (cond-> value keyword? name) (if alpha? "-alpha" "") ")")))
