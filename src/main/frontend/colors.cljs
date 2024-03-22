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

(defn linear-gradient [color-name color-stop gradient-level]
  (let [color-index (.indexOf color-list color-name)
        step (fn [dist]
               (str "var(--rx-"
                 (name (nth color-list (mod (+ color-index dist) (count color-list))))
                 "-" (name color-stop) ")"))]
    (case gradient-level
      2 (str "linear-gradient(-45deg, " (step -1) " -50%, " (step 0) " 50%, " (step 1) " 150%)")
      3 (str "linear-gradient(-45deg, " (step -1) " 0%, " (step 0) " 50%, " (step 1) " 100%)")
      4 (str "linear-gradient(-45deg, " (step -2) " -16.66%, " (step -1) " 16.66%, " (step 0) " 50%, " (step 1) " 83.33%, " (step 2) " 116.66%)")
      5 (str "linear-gradient(-45deg, " (step -2) " 0%, " (step -1) " 25%, " (step 0) " 50%, " (step 1) " 75%, " (step 2) " 100%)")
      6 (str "linear-gradient(-45deg, " (step -3) " -10%, " (step -2) " 10%, " (step -1) " 30%, " (step 0) " 50%, " (step 1) " 70%, " (step 2) " 90%, " (step 3) " 110%)")
      7 (str "linear-gradient(-45deg, " (step -3) " 0%, " (step -2) " 16.66%, " (step -1) " 33.33%, " (step 0) " 50%, " (step 1) " 66.66%, " (step 2) " 83.33%, " (step 3) " 100%)")
      (str "linear-gradient(90deg, " (step 0) ", " (step 0) ")"))))

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
