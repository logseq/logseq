(ns frontend.components.avatar
  (:require [clojure.string :as string]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.ui :as shui]
            [logseq.shui.util :as shui-util]))

(defonce ^:private latin-or-number-re
  (js/RegExp. "^[\\p{Script=Latin}\\p{Number}]" "u"))

(defonce ^:private grapheme-segmenter
  (when (exists? js/Intl.Segmenter)
    (js/Intl.Segmenter. js/undefined #js {:granularity "grapheme"})))

(defn- graphemes
  [s]
  (if grapheme-segmenter
    (map #(.-segment %) (array-seq (js/Array.from (.segment grapheme-segmenter s))))
    (array-seq (js/Array.from s))))

(defn- latin-or-number?
  [s]
  (.test latin-or-number-re s))

(defn- fallback-grapheme-count
  [letters n]
  (if (some-> letters first latin-or-number?)
    n
    1))

(defn initials
  ([name]
   (initials name 2))
  ([name n]
   (when (some? name)
     (let [name (string/trim (str name))]
       (when-not (string/blank? name)
         (let [letters (graphemes name)]
           (-> (string/join (take (fallback-grapheme-count letters n)
                                  letters))
               string/upper-case)))))))

(hsx/defc user-avatar
  [{:keys [name title uuid avatar-src class style fallback fallback-length fallback-props image-props]
    :or {fallback-length 2}}]
  (let [color (when uuid (shui-util/uuid-color uuid))
        fallback-text (or fallback (initials name fallback-length))
        fallback-style (cond-> (:style fallback-props)
                         (and color (nil? (:background-color (:style fallback-props))))
                         (assoc :background-color (str color "50")))
        fallback-props' (cond-> fallback-props
                          (seq fallback-style)
                          (assoc :style fallback-style))]
    (shui/avatar
     (cond-> {}
       class (assoc :class class)
       style (assoc :style style)
       title (assoc :title title))
     (when (seq avatar-src)
       (shui/avatar-image (merge {:src avatar-src} image-props)))
     (if (seq fallback-props')
       (shui/avatar-fallback fallback-props' fallback-text)
       (shui/avatar-fallback fallback-text)))))
