(ns frontend.colors
  "Colors used"
  (:require [clojure.string :as string]
            [frontend.util :as util]))

(def color-list [:tomato :red :crimson :pink :plum :purple :violet :indigo :blue :cyan :teal :green :grass :orange])
;(def color-list [:tomato :red :blue])

(defn variable
  ; ([value])
  ([color value] (variable color value false))
  ([color value alpha?]
   (str "var(--rx-" (name color) "-" (cond-> value keyword? name) (if alpha? "-alpha" "") ")")))

(defn get-accent-color
  []
  (when-let [color (some-> js/document.documentElement
                     (js/getComputedStyle)
                     (.getPropertyValue "--lx-accent-09"))]
    (when-not (string/blank? color)
      (if (string/starts-with? color "#")
        color
        (let [hsl-color (some-> color
                          (string/replace "hsl(" "")
                          (string/replace ")" "")
                          (string/split ","))]
          (when-let [hsl-color (and (not (string/blank? (first hsl-color)))
                                 (map js/parseFloat hsl-color))]
            (apply util/hsl2hex hsl-color)))))))
