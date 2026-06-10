(ns frontend.components.icon.utils
  "Leaf helpers shared by the icon-picker namespaces: the emoji-mart
   dataset, tabler icon-name humanization, and icon-shape guessing for
   legacy stored values. Keep this namespace dependency-free inside
   `frontend.components.icon.*` so every sibling can require it."
  (:require ["@emoji-mart/data" :as emoji-data]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [goog.object :as gobj]))

(defonce emojis (vals (bean/->clj (gobj/get emoji-data "emojis"))))

(def ^:private icon-name-acronyms
  "All-caps tokens that should stay uppercase when humanizing tabler icon
   names — without this allowlist `TvOff` would render as `Tv off` instead
   of `TV off`. Keep this small; only well-known global acronyms qualify."
  #{"3D" "2D" "TV" "AI" "URL" "PDF" "USB" "AM" "PM" "GPS" "ID"
    "HTML" "CSS" "JS" "API" "QR" "AC" "DC" "PC" "CPU" "GPU" "RSS"
    "SQL" "XML" "JSON" "SVG" "PNG" "JPG" "GIF" "MP3" "MP4" "WIFI"})

(defn humanize-icon-name
  "Turn a tabler component name into user-facing copy.
     '3dCubeSphere' -> '3D cube sphere'
     'BrandSlack'   -> 'Slack'
     'TvOff'        -> 'TV off'
     'briefcase'    -> 'Briefcase'
   `Brand` is dropped because the brand-name suffix is the meaningful
   token (`BrandSlack` -> `Slack`). Returns an empty string for blank
   input so the caller can string/concat without a nil guard."
  [s]
  (if (string/blank? s)
    ""
    (let [spaced (-> s
                     (string/replace #"([a-z])([A-Z])" "$1 $2")
                     (string/replace #"([A-Z])([A-Z][a-z])" "$1 $2")
                     (string/replace #"([a-zA-Z])(\d)" "$1 $2")
                     (string/replace #"-" " "))
          stripped (string/replace spaced #"(?i)^brand\s+" "")
          tokens (string/split stripped #"\s+")
          normalized (map (fn [t]
                            (let [up (string/upper-case t)]
                              (cond
                                (contains? icon-name-acronyms up) up
                                (re-matches #"\d+[a-zA-Z]+" t) (string/upper-case t)
                                :else (string/lower-case t))))
                          tokens)
          joined (string/join " " normalized)]
      (if (seq joined)
        (str (string/upper-case (subs joined 0 1)) (subs joined 1))
        ""))))

(defn emoji-char?
  "Check if a string is a single emoji character by checking against known emojis"
  [s]
  (and (string? s)
       (not (string/blank? s))
       (<= (count s) 2) ; emojis are typically 1-2 code units
       (some #(= (:id %) s) emojis)))

(defn guess-from-value
  "Attempt to guess icon type from map value when type is unknown"
  [m]
  (let [value (or (:value m) (:id m))]
    (when (string? value)
      (if (emoji-char? value)
        {:type :emoji
         :id (str "emoji-" value)
         :label value
         :data {:value value}}
        {:type :icon
         :id (str "icon-" value)
         :label value
         :data {:value value}}))))
