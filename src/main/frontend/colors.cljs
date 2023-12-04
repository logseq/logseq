(ns frontend.colors
  "Colors used"
  (:require [clojure.string :as str]
            [frontend.util :as util]))

(def color-list [:tomato :red :crimson :pink :plum :purple :violet :indigo :blue :cyan :teal :green :grass :orange :brown])

(def gray-pairing-map {:tomato :mauve :red :mauve :crimson :mauve :pink :mauve :plum :mauve :purple :mauve :violet :mauve
                       :indigo :slate :blue :slate :sky :slate :cyan :slate
                       :teal :sage :mint :sage :green :sage
                       :grass :olive :lime :olive
                       :yellow :sand :amber :sand :orange :sand :brown :sand})

(defn variable
  ; ([value])
  ([color value] (variable color value false))
  ([color value alpha?]
   (str "var(--rx-" (name color) "-" (cond-> value keyword? name) (if alpha? "-alpha" "") ")")))

(defn set-radix [color]
  (let [style-tag (or (js/document.querySelector "style#color-variables")
                      (js/document.createElement "style"))
        steps ["01" "02" "03" "04" "05" "06" "07" "08" "09" "10" "11" "12" "01-alpha" "02-alpha" "03-alpha" "04-alpha" "05-alpha" "06-alpha" "07-alpha" "08-alpha" "09-alpha" "10-alpha" "11-alpha" "12-alpha"]
        gray (get gray-pairing-map color)
        accents (map #(str "--lx-accent-" % ": var(--rx-" (name color) "-" % "); ") steps)
        grays   (map #(str "--lx-gray-" % ": var(--rx-" (name gray) "-" % "); ") steps)
        translations (str "--ls-primary-background-color: var(--rx-" (name gray) "-01); "
                          "--ls-secondary-background-color: var(--rx-" (name gray) "-02); "
                          "--ls-tertiary-background-color: var(--rx-" (name gray) "-03); "
                          "--ls-quaternary-background-color: var(--rx-" (name gray) "-04); "
                          "--ls-link-text-color: var(--rx-" (name color) "-11); "
                          "--ls-link-text-hover-color: var(--rx-" (name color) "-12); "
                          "--ls-secondary-text-color: var(--rx-" (name gray) "-12); "
                          "--ls-primary-text-color: var(--rx-" (name gray) "-11); "
                          "--ls-border-color: var(--rx-" (name gray) "-05); "
                          "--ls-secondary-border-color: var(--rx-" (name color) "-05); "
                          "--ls-page-checkbox-color: var(--rx-" (name gray) "-07); "
                          "--ls-selection-background-color: var(--rx-" (name gray) "-04-alpha); "
                          "--ls-block-highlight-color: var(--rx-" (name gray) "-04); "
                          "--ls-focus-ring-color: var(--rx-" (name color) "-09); "
                          "--ls-table-tr-even-background-color: var(--rx-" (name gray) "-04); "
                          "--ls-page-properties-background-color: var(--rx-" (name gray) "-04); "
                          "--ls-block-properties-background-color: var(--rx-" (name gray) "-03); "
                          "--ls-page-inline-code-bg-color: var(--rx-" (name gray) "-03); "
                          "--ls-cloze-text-color: var(--rx-" (name color) "-08); "
                          "--ls-wb-stroke-color-default: var(--rx-" (name color) "-07); "
                          "--ls-wb-background-color-default: var(--rx-" (name color) "-04); "
                          "--ls-wb-text-color-default: var(--rx-" (name gray) "-12); "
                          "--ls-a-chosen-bg: var(--rx-" (name gray) "-01); ")
                          ; "--tl-selectStroke: var(--rx-" (name color) "-08); ")
        tl-translations (str "[class^=\"tl-\"] { --tl-selectStroke: var(--rx-" (name color) "-09); }")]
    (set! (.-id style-tag) "color-variables")
    ; (set! (.-innerHTML style-tag) (str/join "\n" (flatten [":root {" accent gray "}"])))
    (->> [":root { " accents grays translations " } body, .dark-theme, .light-theme {" accents grays translations "} " tl-translations]
         (flatten)
         (str/join "\n")
         (set! (.-innerHTML style-tag)))
    (js/document.head.appendChild style-tag)))

(defn unset-radix []
  (when-let [style-tag (js/document.querySelector "style#color-variables")]
    (js/document.head.removeChild style-tag)))


(defn linear-gradient [color-name color-stop gradient-level]
  (let [color-index (.indexOf color-list (keyword color-name))
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
  (when-let [hsl-color (some-> js/document.documentElement
                       (js/getComputedStyle)
                       (.getPropertyValue "--lx-accent-09")
                       (str/replace "hsl(" "")
                       (str/replace ")" "")
                       (str/split ","))]
    (when-let [hsl-color (and (not (str/blank? (first hsl-color)))
                           (map js/parseFloat hsl-color))]
      (apply util/hsl2hex hsl-color))))
